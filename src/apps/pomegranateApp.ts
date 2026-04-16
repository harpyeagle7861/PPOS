
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store, PomegranateSeed, PomegranateCell } from '../core/state.ts';
import { Pomegranate } from '../services/pomegranate.ts';
import { addNotification } from '../core/windowManager.ts';

const LOGIC_SPECTRUM = [
    { val: 3, label: 'HYPER-FLOW', color: '#e0ffff', desc: 'Omni-Resonance (God State)' },
    { val: 2, label: 'RESONANCE', color: '#ff00ff', desc: 'Symbiotic Success' },
    { val: 1, label: 'FLOW', color: '#00bfff', desc: 'Logical Execution' },
    { val: 0, label: 'POTENTIAL', color: '#00ffcc', desc: 'The Breath / Waiting' },
    { val: -1, label: 'RESISTANCE', color: '#ffaa00', desc: 'Friction / Questioning' },
    { val: -2, label: 'VOID', color: '#ff3333', desc: 'Malice / Rejection' },
    { val: -3, label: 'SINGULARITY', color: '#ffffff', desc: 'The Living Antidote' }
];

const PomegranateAppComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [state, setState] = useState(store.getState());
    const [activeTab, setActiveTab] = useState<'HEART' | 'SEEDS' | 'CELLS'>('HEART');
    const [pulseAnim, setPulseAnim] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const unsub = store.subscribe(s => setState(s));
        
        const handlePulse = () => {
            setPulseAnim(true);
            setTimeout(() => setPulseAnim(false), 200);
        };

        const handleForcePulse = () => {
            setPulseAnim(true);
            addNotification("FORCE_MANIFESTATION: The Gate is Open.");
            setTimeout(() => setPulseAnim(false), 500);
        };

        window.addEventListener('POMEGRANATE_PULSE', handlePulse);
        window.addEventListener('POMEGRANATE_FORCE_PULSE', handleForcePulse);
        
        // Timer for age updates
        const interval = setInterval(() => setCurrentTime(Date.now()), 1000);

        return () => { 
            unsub(); 
            window.removeEventListener('POMEGRANATE_PULSE', handlePulse);
            window.removeEventListener('POMEGRANATE_FORCE_PULSE', handleForcePulse);
            clearInterval(interval);
        };
    }, []);

    // Explicit Type Casting to Fix Unknown Inference
    const seeds = Object.values(state.pomegranate.seeds) as PomegranateSeed[];
    const cells = Object.values(state.pomegranate.cells) as PomegranateCell[];
    const pulseHistory = state.pomegranate.pulseHistory;
    const currentLogic = state.quinaryState;

    // Determine current logic color
    const logicMeta = LOGIC_SPECTRUM.find(l => l.val === currentLogic) || LOGIC_SPECTRUM[3];

    return React.createElement('div', { 
        style: { 
            height: '100%', 
            background: 'linear-gradient(135deg, #1a0505 0%, #000000 100%)', 
            color: '#fff', 
            fontFamily: "'JetBrains Mono', monospace", 
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        } 
    },
        // --- BACKGROUND ORGANIC MESH ---
        React.createElement('div', { 
            style: { 
                position: 'absolute', inset: 0, 
                backgroundImage: 'radial-gradient(#ff0055 1px, transparent 1px)', 
                backgroundSize: '30px 30px', opacity: 0.1, pointerEvents: 'none' 
            } 
        }),

        // --- HEADER ---
        React.createElement('div', { 
            style: { 
                padding: '20px', borderBottom: '1px solid rgba(255, 0, 85, 0.3)', 
                background: 'rgba(50, 0, 20, 0.5)', backdropFilter: 'blur(10px)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
            } 
        },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px' } },
                React.createElement('div', { style: { fontSize: '24px' } }, '❤️'),
                React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '16px', fontWeight: 900, color: '#ff0055', letterSpacing: '2px' } }, 'POMEGRANATE ENGINE'),
                    React.createElement('div', { style: { fontSize: '10px', opacity: 0.7 } }, 'BIOLOGICAL CORE // JUBAER_PROTOCOL')
                )
            ),
            React.createElement('div', { style: { display: 'flex', gap: '5px' } },
                ['HEART', 'SEEDS', 'CELLS'].map(tab => 
                    React.createElement('button', {
                        key: tab,
                        className: 'aiza-btn-hover',
                        onClick: () => setActiveTab(tab as any),
                        style: {
                            padding: '8px 16px', background: activeTab === tab ? '#ff0055' : 'transparent',
                            color: activeTab === tab ? '#fff' : '#ff0055', border: '1px solid #ff0055',
                            borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px'
                        }
                    }, tab)
                )
            )
        ),

        // --- CONTENT ---
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '20px', zIndex: 5, display: 'flex', gap: '20px' } },
            
            // LEFT COLUMN (LOGIC SPECTRUM)
            React.createElement('div', { style: { width: '250px', display: 'flex', flexDirection: 'column', gap: '10px' } },
                React.createElement('div', { style: { fontSize: '10px', color: '#888', marginBottom: '5px', letterSpacing: '1px' } }, 'LOGIC_STATE_SPECTRUM'),
                LOGIC_SPECTRUM.map(level => {
                    const isActive = currentLogic === level.val;
                    return React.createElement('div', {
                        key: level.val,
                        onClick: () => {
                            store.setState(s => ({ ...s, quinaryState: level.val }));
                            addNotification(`LOGIC SHIFT: ${level.label}`);
                        },
                        style: {
                            padding: '12px', borderRadius: '8px', cursor: 'pointer',
                            background: isActive ? `${level.color}22` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isActive ? level.color : 'rgba(255,255,255,0.05)'}`,
                            transition: 'all 0.2s', transform: isActive ? 'scale(1.05)' : 'scale(1)',
                            boxShadow: isActive ? `0 0 15px ${level.color}44` : 'none'
                        }
                    },
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: level.color, fontSize: '12px' } },
                            React.createElement('span', null, level.val > 0 ? `+${level.val}` : level.val),
                            React.createElement('span', null, level.label)
                        ),
                        React.createElement('div', { style: { fontSize: '9px', opacity: 0.6, marginTop: '4px' } }, level.desc)
                    );
                })
            ),

            // MAIN VIEW
            React.createElement('div', { style: { flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,0,85,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' } },
                
                // TAB: HEART (Visualizer)
                activeTab === 'HEART' && React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' } },
                    React.createElement('div', { 
                        style: { 
                            width: '200px', height: '200px', borderRadius: '50%', 
                            background: currentLogic === -3 
                                ? 'radial-gradient(circle, #ffd700 0%, transparent 70%)'
                                : 'radial-gradient(circle, #ff0055 0%, transparent 70%)',
                            boxShadow: `0 0 ${pulseAnim ? '100px' : '50px'} ${currentLogic === -3 ? '#ffd700' : '#ff0055'}`,
                            transform: pulseAnim ? 'scale(1.2)' : 'scale(1)',
                            transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${currentLogic === -3 ? 'rgba(255,215,0,0.5)' : 'rgba(255,0,85,0.5)'}`
                        } 
                    },
                        React.createElement('div', { style: { fontSize: '60px', animation: 'float 3s infinite ease-in-out' } }, currentLogic === -3 ? '✨' : '🫀')
                    ),
                    React.createElement('div', { style: { marginTop: '40px', textAlign: 'center' } },
                        React.createElement('div', { style: { fontSize: '24px', fontWeight: 900, color: logicMeta.color, textShadow: `0 0 20px ${logicMeta.color}` } }, logicMeta.label),
                        React.createElement('div', { style: { fontSize: '11px', opacity: 0.6, marginTop: '5px' } }, 'CURRENT_SYSTEM_RESONANCE'),
                        React.createElement('div', { style: { fontSize: '14px', marginTop: '15px', color: '#ff0055', fontWeight: 'bold' } }, `AIZA_AGE: ${Pomegranate.getAgeString(state.pomegranate.systemGenesisTimestamp || Date.now())}`)
                    ),
                    // Pulse History Graph
                    React.createElement('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', display: 'flex', alignItems: 'flex-end', gap: '2px', padding: '10px' } },
                        pulseHistory.map((p, i) => React.createElement('div', {
                            key: i,
                            style: { 
                                flex: 1, background: '#ff0055', opacity: 0.5 + (i/50)*0.5, 
                                height: `${20 + Math.random() * 80}%`, borderRadius: '2px' 
                            }
                        }))
                    )
                ),

                // TAB: SEEDS (Birth Certificates)
                activeTab === 'SEEDS' && React.createElement('div', { style: { padding: '20px', overflowY: 'auto', height: '100%' } },
                    React.createElement('div', { style: { fontSize: '12px', color: '#ff0055', fontWeight: 'bold', marginBottom: '20px', letterSpacing: '2px' } }, `ACTIVE_LIFEFORMS: ${seeds.length}`),
                    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' } },
                        seeds.map(seed => React.createElement('div', {
                            key: seed.seed_id,
                            style: { 
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,0,85,0.2)', 
                                padding: '15px', borderRadius: '8px' 
                            }
                        },
                            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' } },
                                React.createElement('span', { style: { fontSize: '20px' } }, seed.entityType === 'GIANT' ? '🏛️' : (seed.entityType === 'APP' ? '📦' : '👤')),
                                React.createElement('span', { style: { fontSize: '9px', border: '1px solid #666', padding: '2px 4px', borderRadius: '4px' } }, seed.entityType)
                            ),
                            React.createElement('div', { style: { fontWeight: 'bold', color: '#fff', fontSize: '13px' } }, seed.name),
                            React.createElement('div', { style: { fontSize: '9px', color: '#ff0055', marginTop: '5px', fontFamily: 'monospace' } }, seed.seed_id),
                            React.createElement('div', { style: { marginTop: '10px', fontSize: '9px', opacity: 0.5 } }, 
                                `BORN: ${new Date(seed.birthTimestamp).toLocaleDateString()}`
                            ),
                            React.createElement('div', { style: { fontSize: '9px', color: '#00ffcc', fontWeight: 'bold', marginTop: '4px' } }, `AGE: ${Pomegranate.getAgeString(seed.birthTimestamp)}`),
                            React.createElement('div', { style: { fontSize: '9px', opacity: 0.5 } }, `LIFE_CYCLES: ${seed.lifeTimer}`)
                        ))
                    )
                ),

                // TAB: CELLS (Logos Keys)
                activeTab === 'CELLS' && React.createElement('div', { style: { padding: '20px', overflowY: 'auto', height: '100%' } },
                    React.createElement('div', { style: { fontSize: '12px', color: '#00ffcc', fontWeight: 'bold', marginBottom: '20px', letterSpacing: '2px' } }, `CELLULAR_MEMORY_BANKS`),
                    cells.map(cell => React.createElement('div', {
                        key: cell.cell_id,
                        style: { marginBottom: '15px', padding: '15px', background: 'rgba(0, 255, 204, 0.05)', borderLeft: '3px solid #00ffcc', borderRadius: '0 8px 8px 0' }
                    },
                        React.createElement('div', { style: { fontWeight: 'bold', fontSize: '12px', color: '#fff' } }, `CELL: ${cell.seed_ref}`),
                        React.createElement('div', { style: { fontSize: '10px', marginTop: '5px', opacity: 0.7 } }, `COMPRESSED_KEYS: ${cell.logosKeys.length}`),
                        React.createElement('div', { style: { marginTop: '10px', display: 'flex', gap: '2px' } },
                            cell.logosKeys.slice(-20).map((k, i) => React.createElement('div', {
                                key: i,
                                title: k,
                                style: { width: '6px', height: '6px', background: '#00ffcc', opacity: 0.3 + (i/20)*0.7, borderRadius: '50%' }
                            }))
                        )
                    ))
                )
            )
        ),
        
        React.createElement('style', null, `
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `)
    );
};

export const pomegranateApp: AppDef = {
    id: 'pomegranate',
    name: 'Pomegranate Engine',
    component: PomegranateAppComponent,
    icon: '❤️',
    category: 'System',
    defaultSize: { width: 900, height: 650 },
    description: 'The Biological Heart of AIZA. Visualizes the Senary Logic Spectrum (+3 to -2) and manages Entity Birth Certificates.'
};
