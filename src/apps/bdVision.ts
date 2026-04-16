
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { addNotification, updateAppState } from '../core/windowManager.ts';
import { PermissionHandler } from '../core/PermissionHandler.ts';

// Safeguard against missing global lib
declare const Html5Qrcode: any;

const SCANNER_ID = "aiza-vision-viewfinder";

const BDVisionComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const scannerRef = useRef<any>(null);

    const startCamera = async () => {
        try {
            await PermissionHandler.requestMediaAccess({ video: true });

            if (typeof Html5Qrcode !== 'undefined') {
                const scanner = new Html5Qrcode(SCANNER_ID);
                scannerRef.current = scanner;
                await scanner.start(
                    { facingMode: "user" }, 
                    { fps: 15, qrbox: { width: 280, height: 280 } },
                    (decodedText: string) => {
                        setScanResult(decodedText);
                        addNotification("SCAN_SUCCESS: DNA sequence captured.");
                        // Sync to Aiza
                        const currentAizaState = store.getState().appState['aiza'] || {};
                        const currentMessages = currentAizaState.messages || [];
                        updateAppState('aiza', { 
                            messages: [...currentMessages, { role: 'user', text: `[VISUAL_SCAN_DATA]: ${decodedText}`, id: `scan_${Date.now()}`, timestamp: Date.now() }] 
                        });
                    },
                    () => {}
                );
            } else {
                // SIMULATION MODE if library is blocked
                addNotification("VISION_LIB_MISSING: Engaging Simulation Protocol...");
                setTimeout(() => {
                    const mockData = `JMN_MOCK_DATA_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                    setScanResult(mockData);
                    addNotification(`SIMULATION: Captured ${mockData}`);
                }, 2000);
            }
            setIsScanning(true);
        } catch (err) {
            console.error("Camera access failed", err);
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
            } catch (e) {}
        }
        setIsScanning(false);
    };

    useEffect(() => {
        startCamera();
        return () => { stopCamera(); };
    }, []);

    return React.createElement('div', { 
        style: { position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' } 
    },
        React.createElement('div', { id: SCANNER_ID, style: { flex: 1, width: '100%', height: '100%', background: '#050505' } }),
        React.createElement('div', { 
            className: 'vision-overlay',
            style: { position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }
        },
            React.createElement('div', { className: 'scan-corners' }),
            React.createElement('div', { className: 'scan-grid' }),
            React.createElement('div', { className: 'scan-line' })
        ),
        React.createElement('div', { 
            style: { position: 'absolute', bottom: '30px', left: '30px', right: '30px', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } 
        },
            React.createElement('div', null,
                React.createElement('div', { style: { color: '#00ffcc', fontSize: '10px', fontWeight: 900, letterSpacing: '4px', marginBottom: '8px' } }, 'OPTIC_LINK_V4.1'),
                React.createElement('div', { style: { color: '#fff', fontSize: '16px', fontWeight: 700 } }, isScanning ? 'RESONATING...' : 'INITIALIZING_LENS'),
                scanResult && React.createElement('div', { style: { marginTop: '10px', background: 'rgba(0,255,204,0.15)', border: '1px solid #00ffcc', padding: '10px', borderRadius: '4px', color: '#00ffcc', fontSize: '11px', maxWidth: '300px', wordBreak: 'break-all' } }, `LATEST_FRAGMENT: ${scanResult}`)
            ),
            React.createElement('button', { 
                onClick: isScanning ? stopCamera : startCamera,
                style: { padding: '12px 24px', background: isScanning ? 'rgba(255,50,50,0.2)' : 'rgba(0,255,204,0.2)', border: `1px solid ${isScanning ? '#ff3232' : '#00ffcc'}`, color: isScanning ? '#ff3232' : '#00ffcc', fontWeight: 900, fontSize: '11px', borderRadius: '8px', cursor: 'pointer', letterSpacing: '2px' }
            }, isScanning ? 'TERMINATE' : 'ACTIVATE')
        ),
        React.createElement('style', null, `
            .scan-corners { width: 280px; height: 280px; position: relative; border: 2px solid rgba(0, 255, 204, 0.1); }
            .scan-corners::before, .scan-corners::after { content: ''; position: absolute; width: 20px; height: 20px; border-color: #00ffcc; border-style: solid; }
            .scan-corners::before { top: -2px; left: -2px; border-width: 3px 0 0 3px; }
            .scan-corners::after { top: -2px; right: -2px; border-width: 3px 3px 0 0; }
            .scan-grid { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(rgba(0, 255, 204, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 204, 0.05) 1px, transparent 1px); background-size: 30px 30px; animation: grid-drift 20s linear infinite; }
            .scan-line { position: absolute; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #00ffcc, transparent); top: 50%; box-shadow: 0 0 15px #00ffcc; animation: scan-move 4s ease-in-out infinite; opacity: 0.5; }
            @keyframes scan-move { 0% { top: 20%; } 50% { top: 80%; } 100% { top: 20%; } }
            @keyframes grid-drift { from { background-position: 0 0; } to { background-position: 0 300px; } }
            #aiza-vision-viewfinder video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        `)
    );
};

export const bdVisionApp: AppDef = {
    id: 'bd-vision', name: 'Optic Lens', component: BDVisionComponent, icon: '👁️', category: 'Utility', defaultSize: { width: 800, height: 600 },
    description: 'Autonomous Vision Interface. Real-time scanning and neural DNA ingestion for Aiza.'
};
