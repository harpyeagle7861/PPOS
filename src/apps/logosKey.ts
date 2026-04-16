
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { updateAppState, addNotification } from '../core/windowManager.ts';

declare var QRious: any;

export interface LogosSnapshot {
    id: string;
    label: string;
    timestamp: number;
    type: 'VISUAL' | 'MEMORY' | 'CORE' | 'MAP' | 'E369_PACKET';
    payload: any;
    preview?: string;
}

const LogosKeyComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [snapshots, setSnapshots] = useState<LogosSnapshot[]>([]);
    const [search, setSearch] = useState('');
    const [importString, setImportString] = useState('');
    
    // QR Ref kept for potential future use, though primary interaction is now Prompt
    const qrRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Function to hydrate state from persistent storage
        const loadFromVault = () => {
            try {
                const saved = localStorage.getItem('AIZA_LOGOS_REGISTRY');
                if (saved) {
                    const registry = JSON.parse(saved);
                    setSnapshots(registry);
                    updateAppState('logos-key', { registry });
                }
            } catch (e) {
                console.error("LOGOS_VAULT_ERROR:", e);
            }
        };

        loadFromVault();

        const unsubscribeStore = store.subscribe(s => {
            const registry = s.appState['logos-key']?.registry;
            if (registry) setSnapshots(registry);
        });

        const handleLogosUpdate = () => {
            loadFromVault();
            addNotification("LOGOS_KEY: Vault synchronized with Ingestion Engine.");
        };
        window.addEventListener('logos-update', handleLogosUpdate);

        return () => { 
            unsubscribeStore();
            window.removeEventListener('logos-update', handleLogosUpdate);
        };
    }, []);

    // Auto-save logic
    useEffect(() => {
        if (snapshots.length > 0) {
            localStorage.setItem('AIZA_LOGOS_REGISTRY', JSON.stringify(snapshots));
        }
    }, [snapshots]);

    const purgeSnapshot = (id: string) => {
        if (!confirm("Dissolve this neural key?")) return;
        const next = snapshots.filter(s => s.id !== id);
        setSnapshots(next);
        updateAppState('logos-key', { registry: next });
        localStorage.setItem('AIZA_LOGOS_REGISTRY', JSON.stringify(next));
        addNotification("LOGOS_KEY: Fragment Purged.");
    };

    const restoreSnapshot = (snap: LogosSnapshot) => {
        if (snap.type === 'VISUAL') {
            updateAppState('paint', { restoreData: snap.payload });
            addNotification(`E360_SYNC: Visual Resonance Restored.`);
        } else if (snap.type === 'MAP') {
            updateAppState('os-map', { restoreLayout: snap.payload });
            addNotification(`E360_SYNC: Neural Fabric Re-aligned.`);
        } else if (snap.type === 'MEMORY') {
            addNotification(`E360_SYNC: Loading Memory Chain...`);
        } else if (snap.type === 'E369_PACKET') {
            addNotification(`EAGLE_369: Decrypting Packet ${snap.id}... Content Ready.`);
        }
    };

    // --- TRANSMIT LOGIC (SENDER) ---
    const handleTransmit = (snap: LogosSnapshot) => {
        try {
            // Serialize to Base64 "Eagle String"
            const json = JSON.stringify(snap);
            const eagleString = btoa(json);
            
            // Execute Prompt for Immediate Access
            window.prompt("COPY THIS EAGLE KEY:", eagleString);
            addNotification("EAGLE_KEY: Generated.");
        } catch (e) {
            addNotification("TRANSMISSION_ERROR: Serialization Failed.");
        }
    };

    // --- RECEIVE LOGIC (RECEIVER) ---
    const handleImport = () => {
        if (!importString.trim()) return;
        
        try {
            const decoded = atob(importString.trim());
            const snap: LogosSnapshot = JSON.parse(decoded);
            
            // Validation
            if (!snap.id || !snap.type || !snap.payload) throw new Error("Invalid DNA");

            // Prevent duplicates (or overwrite/update logic)
            const exists = snapshots.some(s => s.id === snap.id);
            let nextSnapshots;
            if (exists) {
                if (!confirm("Key already exists. Overwrite?")) return;
                nextSnapshots = snapshots.map(s => s.id === snap.id ? snap : s);
            } else {
                nextSnapshots = [snap, ...snapshots];
            }

            setSnapshots(nextSnapshots);
            updateAppState('logos-key', { registry: nextSnapshots });
            localStorage.setItem('AIZA_LOGOS_REGISTRY', JSON.stringify(nextSnapshots));
            
            setImportString('');
            addNotification("TOKEN_IMPORTED: Successfully anchored.");
        } catch (e) {
            addNotification("IMPORT_FAILURE: Invalid Key.");
        }
    };

    return React.createElement('div', { style: { height: '100%', background: '#020202', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace", display: 'flex', flexDirection: 'column', position: 'relative' } },
        
        // --- HEADER / IMPORT ZONE ---
        React.createElement('div', { style: { padding: '20px', borderBottom: '1px solid #1a1a1a', background: 'rgba(0, 255, 204, 0.05)' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' } },
                React.createElement('div', { style: { fontSize: '10px', opacity: 0.7, letterSpacing: '2px', fontWeight: 900 } }, 'LOGOS_KEY_WALLET // V2.1'),
                React.createElement('div', { style: { fontSize: '10px', color: '#ff00ff' } }, `KEYS: ${snapshots.length}`)
            ),
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                React.createElement('input', { 
                    value: importString, 
                    onChange: e => setImportString(e.target.value),
                    placeholder: "PASTE EAGLE KEY (BASE64)...",
                    style: { flex: 1, background: '#000', border: '1px solid #333', color: '#fff', padding: '10px 15px', borderRadius: '4px', outline: 'none', fontSize: '11px', fontFamily: 'monospace' }
                } as any),
                React.createElement('button', { 
                    onClick: handleImport,
                    style: { background: '#00ffcc', color: '#000', border: 'none', padding: '0 20px', borderRadius: '4px', fontWeight: 900, cursor: 'pointer', fontSize: '11px', letterSpacing: '1px' }
                }, 'IMPORT')
            )
        ),

        // --- SEARCH & FILTER ---
        React.createElement('div', { style: { padding: '10px 20px', borderBottom: '1px solid #1a1a1a' } },
            React.createElement('input', { 
                value: search, onChange: e => setSearch(e.target.value),
                placeholder: "SEARCH_VAULT...",
                style: { width: '100%', background: 'transparent', border: 'none', color: '#00ffcc', fontSize: '12px', outline: 'none' }
            } as any)
        ),

        // --- KEY GRID ---
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' } },
            snapshots.length === 0 ? React.createElement('div', { style: { gridColumn: '1/-1', textAlign: 'center', opacity: 0.2, marginTop: '80px', letterSpacing: '2px' } }, 'VAULT_EMPTY // AWAITING_DNA') :
            snapshots.filter(s => s.label.toLowerCase().includes(search.toLowerCase())).map(snap => React.createElement('div', { 
                key: snap.id, 
                style: { 
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', 
                    transition: '0.2s', position: 'relative'
                },
                className: 'key-card'
            } as any,
                snap.preview ? 
                    React.createElement('img', { src: snap.preview, style: { width: '100%', height: '120px', objectFit: 'cover', opacity: 0.8, borderBottom: '1px solid #222' } }) :
                    React.createElement('div', { style: { width: '100%', height: '120px', background: 'radial-gradient(circle, rgba(0,255,204,0.1) 0%, rgba(0,0,0,0) 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', borderBottom: '1px solid #222' } }, '🪙'),
                
                React.createElement('div', { style: { padding: '15px' } },
                    React.createElement('div', { style: { fontSize: '12px', fontWeight: 900, color: '#fff', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, snap.label),
                    React.createElement('div', { style: { fontSize: '9px', opacity: 0.5, marginBottom: '15px' } }, `${snap.type} // ${new Date(snap.timestamp).toLocaleDateString()}`),
                    
                    React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                        React.createElement('button', { onClick: () => restoreSnapshot(snap), title: "Restore to System", style: { flex: 1, background: 'rgba(0, 255, 204, 0.1)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' } }, 'LOAD'),
                        React.createElement('button', { onClick: () => handleTransmit(snap), title: "Transmit via Eagle 369", style: { flex: 1, background: 'rgba(255, 0, 255, 0.1)', border: '1px solid #ff00ff', color: '#ff00ff', padding: '8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' } }, '📡 SEND'),
                        React.createElement('button', { onClick: () => purgeSnapshot(snap.id), title: "Purge", style: { background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', padding: '8px', borderRadius: '4px', cursor: 'pointer' } }, '✕')
                    )
                )
            ))
        ),

        React.createElement('style', null, `
            .key-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.2) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        `)
    );
};

export const logosKeyApp: AppDef = {
    id: 'logos-key',
    name: 'Logos Key',
    component: LogosKeyComponent,
    icon: '🔑',
    category: 'Utility',
    defaultSize: { width: 700, height: 600 },
    description: 'Neural Memory Registry. Stores and restores system fragments using the E360_SYNC protocol. Features P2P transmission.'
};
