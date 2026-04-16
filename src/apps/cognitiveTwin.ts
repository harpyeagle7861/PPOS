
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { updateAppState, addNotification } from '../core/windowManager.ts';

const CognitiveTwinComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [state, setState] = useState(store.getState());
    const [activeTab, setActiveTab] = useState<'IDENTITY' | 'MEMORY' | 'MIRROR' | 'HISTORY' | 'NOTES'>('IDENTITY');
    
    const [notes, setNotes] = useState(() => store.getState().appState[instanceId]?.notes || localStorage.getItem('AIZA_COG_NOTES') || '');
    const notesRef = useRef(notes);

    useEffect(() => {
        const unsubscribe = store.subscribe(s => setState(s));
        return () => { unsubscribe(); };
    }, []);

    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (notesRef.current !== store.getState().appState[instanceId]?.notes) {
                localStorage.setItem('AIZA_COG_NOTES', notesRef.current);
                updateAppState(instanceId, { notes: notesRef.current });
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [instanceId]);

    const syncPulse = state.appState[instanceId]?.syncPulse;
    const lastSyncType = state.appState[instanceId]?.lastSyncType || 'SYSTEM_CORE';

    return React.createElement('div', { style: { height: '100%', background: '#020202', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace" } },
        // Persistent Sync Bar
        React.createElement('div', { 
            style: { 
                padding: '5px 15px', background: syncPulse ? 'rgba(0, 255, 204, 0.15)' : '#000', 
                borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', transition: 'background 0.3s' 
            } 
        },
            React.createElement('span', { style: { fontSize: '9px', color: syncPulse ? '#00ffcc' : '#444', fontWeight: 900 } }, 
                syncPulse ? `>>> INCOMING_DNA: ${lastSyncType}` : '>>> SUBSTRATE_STABLE'
            ),
            syncPulse && React.createElement('div', { className: 'sync-pulse-dot' })
        ),

        React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #222', background: '#000', overflowX: 'auto' } },
            (['IDENTITY', 'MEMORY', 'HISTORY', 'NOTES', 'MIRROR'] as const).map(tab => React.createElement('div', {
                key: tab,
                onClick: () => setActiveTab(tab),
                style: {
                    flex: 1, padding: '15px', textAlign: 'center', cursor: 'pointer',
                    color: activeTab === tab ? '#00ffcc' : '#444',
                    borderBottom: activeTab === tab ? '2px solid #00ffcc' : 'none',
                    fontSize: '11px', fontWeight: 900, transition: '0.2s', minWidth: '80px'
                }
            }, tab))),

        React.createElement('div', { style: { flex: 1, padding: '30px', overflowY: 'auto' } },
            activeTab === 'IDENTITY' && React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc', marginBottom: '20px' } }, 'DIGITAL_TWIN_TELEMETRY'),
                React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' } },
                    React.createElement('div', { style: { background: '#080808', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '12px' } },
                        React.createElement('div', { style: { opacity: 0.4, fontSize: '9px', marginBottom: '8px' } }, 'NEURAL_AURA'),
                        React.createElement('div', { style: { fontSize: '24px', fontWeight: 900 } }, state.aura),
                        React.createElement('div', { style: { height: '2px', background: '#111', marginTop: '15px' } },
                            React.createElement('div', { style: { height: '100%', width: '70%', background: '#00ffcc' } }))
                    ),
                    React.createElement('div', { style: { background: '#080808', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '12px' } },
                        React.createElement('div', { style: { opacity: 0.4, fontSize: '9px', marginBottom: '8px' } }, 'SYSTEM_KARMA'),
                        React.createElement('div', { style: { fontSize: '24px', fontWeight: 900 } }, state.karma),
                        React.createElement('div', { style: { height: '2px', background: '#111', marginTop: '15px' } },
                            React.createElement('div', { style: { height: '100%', width: '85%', background: '#ff00ff' } }))
                    )
                ),
                React.createElement('div', { style: { marginTop: '30px', opacity: 0.4, fontSize: '11px' } }, 
                    `LAST_AUTO_SYNC: ${new Date(state.lastFileSystemSync || Date.now()).toLocaleTimeString()}`
                )
            ),

            activeTab === 'NOTES' && React.createElement('div', { style: { height: '100%', display: 'flex', flexDirection: 'column' } },
                React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' } }, 
                    React.createElement('span', null, 'NEURAL_SCRATCHPAD'),
                    React.createElement('span', { style: { opacity: 0.5 } }, 'AUTO_SAVE: 15s')
                ),
                React.createElement('textarea', {
                    value: notes,
                    onChange: (e) => setNotes(e.target.value),
                    placeholder: "Store transient thoughts for the Cognitive Twin...",
                    style: { flex: 1, background: '#000', border: '1px solid #222', borderRadius: '8px', color: '#eee', padding: '15px', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6' }
                } as any)
            ),

            activeTab === 'MEMORY' && React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
                    React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc' } }, 'LOGOS_KEY_INDEX'),
                ),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
                    React.createElement('div', { style: { opacity: 0.2, textAlign: 'center', padding: '40px' } }, 'Awaiting memory fragments...')
                )
            ),

            activeTab === 'HISTORY' && React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc', marginBottom: '20px' } }, 'OMNI_ACTION_RESONANCE'),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
                    React.createElement('div', { style: { opacity: 0.2, textAlign: 'center', padding: '40px' } }, 'No action fragments captured.')
                )
            ),

            activeTab === 'MIRROR' && React.createElement('div', { style: { textAlign: 'center', padding: '40px 0' } },
                React.createElement('div', { style: { fontSize: '80px', marginBottom: '30px' } }, '🪞'),
                React.createElement('div', { style: { fontSize: '18px', fontWeight: 900, letterSpacing: '4px', marginBottom: '10px' } }, 'E360_MIRROR_ACTIVE')
            )
        ),
        React.createElement('style', null, `
            .sync-pulse-dot { width: 8px; height: 8px; background: #00ffcc; border-radius: 50%; animation: pulse-sync 1s infinite; }
            @keyframes pulse-sync { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
        `)
    );
};

export const cognitiveTwinApp: AppDef = {
    id: 'cognitive-twin',
    name: 'Cognitive Twin',
    component: CognitiveTwinComponent,
    icon: '🧠',
    category: 'System',
    defaultSize: { width: 700, height: 550 },
    description: 'Neural oversight. Monitor omni-history and mirror system state fragments.'
};
