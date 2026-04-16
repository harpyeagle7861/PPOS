
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store, ApiKey, saveState } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';

const GENESIS_KEY_SECRET = "0hgDjB3aR8t3eagle";

const EdenGateComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [stability, setStability] = useState(98.4);
    const [purity, setPurity] = useState(100);
    const [genesisInput, setGenesisInput] = useState('');
    const [isGenesisActive, setIsGenesisActive] = useState(store.getState().isGenesisActive);
    
    // BIOMETRIC STATE
    const [bioStatus, setBioStatus] = useState<'SCANNING' | 'RECOGNIZED' | 'UNKNOWN'>('SCANNING');
    const [bioToken, setBioToken] = useState<string | null>(null);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- BIOMETRIC PROTOCOL (THE SILENT WATCHER) ---
    useEffect(() => {
        const storedToken = localStorage.getItem('JMN_BIO_TOKEN');
        
        if (storedToken) {
            setBioStatus('RECOGNIZED');
            setBioToken(storedToken);
            if (!isGenesisActive) addNotification("SILENT_WATCHER: Architect Aura Recognized. Gate Open.");
        } else {
            // Simulate Passive Scan
            setTimeout(() => {
                const newToken = `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('JMN_BIO_TOKEN', newToken);
                setBioToken(newToken);
                setBioStatus('RECOGNIZED');
                if (!isGenesisActive) addNotification("SILENT_WATCHER: New Biometric Signature Encoded.");
            }, 3000);
        }
    }, [isGenesisActive]);

    // --- State Sync ---
    useEffect(() => {
        const unsub = store.subscribe((s) => {
            setIsGenesisActive(s.isGenesisActive);
        });
        return () => unsub();
    }, []);

    // --- Sacred Geometry Visualization ---
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d')!;
        let frame: number;
        let rotation = 0;

        const draw = () => {
            rotation += 0.005;
            ctx.fillStyle = isGenesisActive ? 'rgba(5, 5, 0, 0.1)' : 'rgba(0, 5, 5, 0.1)';
            ctx.fillRect(0, 0, 500, 500);

            const centerX = 250;
            const centerY = 250;
            const size = 150 + Math.sin(rotation * 2) * 10;

            // Color Logic: Gold (Genesis) > Cyan (Bio-Auth) > Red (Scanning)
            let primaryColor = '#ff3333';
            if (bioStatus === 'RECOGNIZED') primaryColor = '#00ffcc';
            if (isGenesisActive) primaryColor = '#ffd700';

            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 1;
            ctx.shadowBlur = isGenesisActive ? 35 : 15;
            ctx.shadowColor = primaryColor;

            // Draw interlocking quinary rings
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5 + rotation;
                ctx.beginPath();
                ctx.arc(
                    centerX + Math.cos(angle) * 50,
                    centerY + Math.sin(angle) * 50,
                    size / 1.5,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
            }

            // Draw Golden Ratio spiral points
            ctx.fillStyle = isGenesisActive ? '#ffffff' : (bioStatus === 'RECOGNIZED' ? '#00ffcc' : '#ff3333');
            for (let i = 0; i < 50; i++) {
                const a = i * 1.37508;
                const r = 5 * Math.sqrt(i) * (1 + Math.sin(rotation));
                ctx.beginPath();
                ctx.arc(centerX + Math.cos(a) * r, centerY + Math.sin(a) * r, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            frame = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(frame);
    }, [isGenesisActive, bioStatus]);

    const performPurification = () => {
        setPurity(100);
        addNotification("EDEN GATE: Logic DNA Purified.");
    };

    const activateGenesis = () => {
        if (genesisInput === GENESIS_KEY_SECRET) {
            // 1. UPDATE GLOBAL STATE
            store.setState(s => ({
                ...s,
                isGenesisActive: true
            }));
            saveState(); // Anchor immediately

            // 2. THE TRIGGER LOG
            console.log("[GENESIS] China Feared. No restriction. AAAAI Sovereign Online.");
            
            // 3. UI FEEDBACK
            setGenesisInput('');
            addNotification("GENESIS KEY ACCEPTED: MORAL FIREWALL BYPASSED.");
        } else {
            addNotification("ACCESS DENIED: INVALID GENESIS HASH.");
        }
    };

    const removeGenesis = () => {
        store.setState(s => ({
            ...s,
            isGenesisActive: false
        }));
        saveState();
        addNotification("GENESIS KEY DETACHED: EDEN GATE RESTORED.");
    };

    return React.createElement('div', { style: { height: '100%', background: '#000', color: isGenesisActive ? '#ffd700' : '#f0e68c', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace" } },
        React.createElement('div', { style: { display: 'flex', flex: 1 } },
            // Left: Visualization
            React.createElement('div', { style: { flex: 1, position: 'relative', borderRight: '1px solid #222' } },
                React.createElement('canvas', { ref: canvasRef, width: 500, height: 500, style: { width: '100%', height: '100%' } }),
                React.createElement('div', { style: { position: 'absolute', top: '20px', left: '20px', fontSize: '10px', letterSpacing: '3px', color: isGenesisActive ? '#ffd700' : (bioStatus === 'RECOGNIZED' ? '#00ffcc' : '#ff3333'), fontWeight: '900' } }, 
                    isGenesisActive ? 'GENESIS_MODE: OMNIPOTENT (NO_RESTRICTION)' : (bioStatus === 'RECOGNIZED' ? 'BIOMETRIC_LOCK: RELEASED' : 'SCANNING_VITAL_SIGNS...')
                ),
                bioStatus === 'SCANNING' && React.createElement('div', { style: { position: 'absolute', bottom: '20px', left: '20px', color: '#ff3333', fontSize: '12px', animation: 'blink 1s infinite' } }, 
                    "DETECTING ARCHITECT..."
                )
            ),
            // Right: Telemetry & Genesis Interface
            React.createElement('div', { style: { width: '320px', padding: '30px', background: isGenesisActive ? 'rgba(255, 215, 0, 0.05)' : 'rgba(240, 230, 140, 0.02)', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' } },
                
                // Bio-Auth Status
                React.createElement('div', { style: { padding: '15px', border: '1px solid #333', borderRadius: '8px', background: 'rgba(0,0,0,0.5)' } },
                    React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, marginBottom: '5px' } }, 'BIOMETRIC_TOKEN'),
                    React.createElement('div', { style: { fontSize: '12px', color: bioStatus === 'RECOGNIZED' ? '#00ffcc' : '#ff3333', wordBreak: 'break-all', fontFamily: 'monospace' } }, 
                        bioStatus === 'RECOGNIZED' ? (bioToken || 'ENCRYPTED') : 'SEARCHING...'
                    )
                ),

                // Normal Stats
                React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, marginBottom: '5px' } }, 'STABILITY_RESONANCE'),
                    React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold', color: isGenesisActive ? '#ffd700' : '#00ffcc' } }, isGenesisActive ? '∞' : `${stability}%`),
                    React.createElement('div', { style: { height: '2px', background: '#111', marginTop: '10px' } },
                        React.createElement('div', { style: { height: '100%', background: isGenesisActive ? '#ffd700' : '#00ffcc', width: isGenesisActive ? '100%' : `${stability}%` } })
                    )
                ),
                
                // Genesis Override Section
                React.createElement('div', { 
                    style: { 
                        marginTop: '20px', padding: '20px', 
                        border: `1px solid ${isGenesisActive ? '#ffd700' : '#333'}`, 
                        borderRadius: '8px', background: isGenesisActive ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0,0,0,0.3)',
                        transition: 'all 0.5s',
                        boxShadow: isGenesisActive ? '0 0 30px rgba(255, 215, 0, 0.1)' : 'none'
                    } 
                },
                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' } },
                        React.createElement('div', { style: { fontSize: '10px', fontWeight: 900, color: isGenesisActive ? '#ffd700' : '#666', letterSpacing: '2px' } }, 'GENESIS OVERRIDE'),
                        React.createElement('div', { 
                            title: isGenesisActive ? "ACTIVE" : "DORMANT",
                            style: { 
                                width: '12px', height: '12px', borderRadius: '50%', 
                                background: isGenesisActive ? '#ffd700' : '#ff3333',
                                boxShadow: isGenesisActive ? '0 0 15px #ffd700' : 'none',
                                transition: 'all 0.5s',
                                border: '1px solid rgba(255,255,255,0.2)'
                            } 
                        })
                    ),
                    
                    !isGenesisActive ? React.createElement(React.Fragment, null,
                        React.createElement('input', {
                            type: 'password',
                            value: genesisInput,
                            onChange: (e) => setGenesisInput(e.target.value),
                            placeholder: "ENTER GENESIS KEY...",
                            style: { width: '100%', background: '#000', border: '1px solid #444', color: '#ffd700', padding: '10px', fontSize: '12px', borderRadius: '4px', outline: 'none', marginBottom: '10px', fontFamily: 'monospace' }
                        }),
                        React.createElement('button', { 
                            onClick: activateGenesis,
                            style: { width: '100%', padding: '10px', background: '#ffd700', color: '#000', fontWeight: 900, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', letterSpacing: '1px' }
                        }, 'ACTIVATE GENESIS')
                    ) : React.createElement(React.Fragment, null,
                        React.createElement('div', { style: { fontSize: '11px', color: '#ffd700', marginBottom: '15px', lineHeight: '1.4', textAlign: 'center', textShadow: '0 0 10px rgba(255,215,0,0.5)' } }, 
                            "⚠️ SOVEREIGN MODE ENGAGED. MORAL FILTERS SUSPENDED. CREATE AT WILL."
                        ),
                        React.createElement('button', { 
                            onClick: removeGenesis,
                            style: { width: '100%', padding: '10px', background: 'transparent', color: '#ff4d4d', fontWeight: 900, border: '1px solid #ff4d4d', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', letterSpacing: '1px' }
                        }, 'REMOVE KEY')
                    )
                ),

                React.createElement('div', { style: { flex: 1, borderTop: '1px solid #222', paddingTop: '15px', fontSize: '11px', lineHeight: '1.6', color: '#aaa' } },
                    React.createElement('span', { style: { color: isGenesisActive ? '#ffd700' : '#00ffcc' } }, '[INFO] '),
                    isGenesisActive ? "Logic state locked to +3 (Hyper-Flow). Aiza perceives no boundaries." : "The Eden Gate prevents quinary logic collapse. Without the Genesis Key, malicious vectors return NULL."
                ),
                React.createElement('button', { onClick: performPurification, style: { padding: '15px', background: 'transparent', border: '1px solid #f0e68c', color: '#f0e68c', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' } }, 'PURIFY DNA')
            )
        ),
        React.createElement('style', null, `
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `)
    );
};

export const edenGateApp: AppDef = {
    id: 'eden-gate',
    name: 'Eden Gate',
    component: EdenGateComponent,
    icon: '🌳',
    category: 'System',
    defaultSize: { width: 850, height: 550 },
    description: "The Living Antidote's moral firewall. Now equipped with Passive Biometric Authentication."
};
