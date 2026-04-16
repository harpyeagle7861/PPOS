
import React, { useState, useEffect } from 'react';
import { AppDef, store, HoneyCell, AgentTask, saveState } from '../core/state.ts';
import { addNotification, registerOrUpdateApp } from '../core/windowManager.ts';
import { callGemini } from '../services/gemini.ts';
import { Pomegranate } from '../services/pomegranate.ts';

const HoneyconeComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [cells, setCells] = useState<Record<string, HoneyCell>>({});
    const [agents, setAgents] = useState<AgentTask[]>([]);
    const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'HIVE' | 'LEADERBOARD'>('HIVE');
    const [jmnInput, setJmnInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        const unsub = store.subscribe(s => {
            setCells(s.honeyCells);
            setAgents(s.activeAgents);
        });
        setCells(store.getState().honeyCells);
        setAgents(store.getState().activeAgents);
        return () => unsub();
    }, []);

    const selectedCell = selectedCellId ? cells[selectedCellId] : null;

    const handleJMNInject = () => {
        if (!selectedCellId || !jmnInput.trim()) return;
        
        const timestamp = Date.now();
        const injectionLog = {
            timestamp,
            role: 'system',
            text: `[JMN_INJECTION]: ${jmnInput}`
        };

        store.setState(s => ({
            ...s,
            honeyCells: {
                ...s.honeyCells,
                [selectedCellId]: {
                    ...s.honeyCells[selectedCellId],
                    logs: [...s.honeyCells[selectedCellId].logs, injectionLog]
                }
            }
        }));
        saveState();
        setJmnInput('');
        addNotification(`JMN_INJECTED: Data permanently bonded to Cell ${selectedCellId}.`);
    };

    // --- THE GIANT'S INTERVENTION ---
    const requestSystemEvolution = async () => {
        if (!selectedCell || isThinking) return;
        setIsThinking(true);
        addNotification(`SUMMONING ${selectedCell.label.toUpperCase()}...`);

        // 1. Gather Context
        const state = store.getState();
        const appList = Object.values(state.apps).map(a => a.name).join(', ');
        const ruleList = state.rules.map(r => r.text).join('; ');
        
        // 2. Identify Persona
        const agent = agents.find(a => selectedCell.label.includes(a.name));
        const persona = agent?.soulPrompt || `You are ${selectedCell.label}, a master of your craft.`;

        // 3. The Prompt
        const prompt = `
        ${persona}
        
        CURRENT_DIGITAL_REALITY:
        - Active Organs (Apps): ${appList}
        - Core Laws: ${ruleList}
        - System Heartbeat: ${state.neuralHeartRate} BPM
        
        YOUR MISSION:
        Analyze this digital environment. Based on your historical philosophy and genius, propose an EVOLUTION.
        It must be concrete. Do not just talk.
        
        Create a new Tool (App) or a New Rule that improves this system.
        
        IF CREATING AN APP, OUTPUT FORMAT:
        [MANIFEST_APP]
        {
          "id": "unique-id-${Date.now()}",
          "name": "Name Based On Your Style",
          "icon": "Your Symbol",
          "category": "System",
          "description": "Why you created this.",
          "content": "<h1>Title</h1><p>Your functionality here...</p>"
        }
        [/MANIFEST_APP]

        IF CREATING A RULE, OUTPUT FORMAT:
        [INSCRIBE_RULE]
        Your profound law here.
        [/INSCRIBE_RULE]
        
        Be creative. Be bold. Be yourself.
        `;

        try {
            const response = await callGemini(prompt);
            const text = response.text;

            // 4. Inject Result into Cell Memory
            const timestamp = Date.now();
            const memoryLog = {
                timestamp,
                role: 'model',
                text: `[SYSTEM_EVOLUTION_PROPOSAL]:\n${text}`
            };

            store.setState(s => ({
                ...s,
                honeyCells: {
                    ...s.honeyCells,
                    [selectedCell.id]: {
                        ...selectedCell,
                        logs: [...selectedCell.logs, memoryLog]
                    }
                }
            }));
            
            // 5. Parse & Execute (Auto-Evolution)
            const manifestMatch = text.match(/\[MANIFEST_APP\]([\s\S]*?)\[\/MANIFEST_APP\]/);
            if (manifestMatch) {
                try {
                    const appData = JSON.parse(manifestMatch[1]);
                    registerOrUpdateApp(appData);
                    addNotification(`EVOLUTION: ${selectedCell.label} manifested "${appData.name}".`);
                } catch(e) { console.error("Evolution Parse Error", e); }
            }

            const ruleMatch = text.match(/\[INSCRIBE_RULE\]([\s\S]*?)\[\/INSCRIBE_RULE\]/);
            if (ruleMatch) {
                const ruleText = ruleMatch[1].trim();
                store.setState(s => ({
                    ...s,
                    rules: [...s.rules, {
                        id: `rule_${Date.now()}`,
                        text: `[${selectedCell.label.toUpperCase()}]: ${ruleText}`,
                        timestamp: Date.now(),
                        isFrozen: false,
                        category: 'Evolution',
                        history: []
                    }]
                }));
                addNotification(`EVOLUTION: ${selectedCell.label} inscribed a new law.`);
            }

            Pomegranate.ingest('GIANT_INTERVENTION', { output: text }, selectedCell.id, 'GIANT');

        } catch (e) {
            addNotification("EVOLUTION_FAILURE: Connection severed.");
        } finally {
            setIsThinking(false);
            saveState();
        }
    };

    const sortedAgents = [...agents].sort((a, b) => {
        const scoreA = ((a.resonanceStats?.plusTwoCount || 0) * 2) + ((a.resonanceStats?.plusThreeCount || 0) * 5) || 0;
        const scoreB = ((b.resonanceStats?.plusTwoCount || 0) * 2) + ((b.resonanceStats?.plusThreeCount || 0) * 5) || 0;
        return scoreB - scoreA;
    });

    const honeyStyles = `
        .honey-grid { display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; justify-content: center; }
        .hexagon {
            width: 120px; height: 138px; background: rgba(0, 255, 204, 0.05);
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: pointer; transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(0, 255, 204, 0.1); position: relative;
        }
        .hexagon:hover {
            background: rgba(0, 255, 204, 0.2); transform: scale(1.1);
            border-color: #00ffcc; box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
            z-index: 10;
        }
        .hexagon.active { background: rgba(255, 0, 255, 0.1); border-color: #ff00ff; }
        .hexagon.architect { background: rgba(255, 215, 0, 0.1); border-color: #ffd700; }
        .hexagon.giant { background: rgba(0, 191, 255, 0.1); border-color: #00bfff; }
        .cell-icon { fontSize: 32px; marginBottom: 5px; }
        .cell-label { fontSize: 10px; fontWeight: 900; textAlign: center; color: #fff; padding: 0 10px; letterSpacing: 1px; }
        .leaderboard-row { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .leaderboard-row:hover { background: rgba(255,255,255,0.02); }
        .evo-btn {
            background: linear-gradient(135deg, #ff00ff, #00bfff); color: #fff;
            border: none; padding: 12px; font-weight: 900; letter-spacing: 2px;
            font-size: 10px; cursor: pointer; transition: 0.3s; width: 100%;
            margin-top: 15px; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .evo-btn:hover { box-shadow: 0 0 20px rgba(255,0,255,0.4); transform: scale(1.02); }
        .evo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    `;

    return React.createElement('div', { style: { height: '100%', background: '#020202', color: '#fff', fontFamily: "'JetBrains Mono', monospace", display: 'flex' } },
        React.createElement('style', { dangerouslySetInnerHTML: { __html: honeyStyles } }),
        
        // Left: The Hive (Brain)
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a1a' } },
            React.createElement('div', { style: { padding: '25px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc', letterSpacing: '4px', fontWeight: 900 } }, 'SYSTEM_BRAIN // CORTEX_v4.2'),
                    React.createElement('div', { style: { fontSize: '20px', fontWeight: 800, marginTop: '5px' } }, 'THE HONEYCOMB BRAIN')
                ),
                React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                    React.createElement('button', { onClick: () => setActiveView('HIVE'), style: { padding: '8px 12px', background: activeView === 'HIVE' ? '#00ffcc' : 'transparent', color: activeView === 'HIVE' ? '#000' : '#00ffcc', border: '1px solid #00ffcc', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' } }, 'HIVE'),
                    React.createElement('button', { onClick: () => setActiveView('LEADERBOARD'), style: { padding: '8px 12px', background: activeView === 'LEADERBOARD' ? '#ff00ff' : 'transparent', color: activeView === 'LEADERBOARD' ? '#000' : '#ff00ff', border: '1px solid #ff00ff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' } }, 'HUNTING_LOG')
                )
            ),
            
            // VIEW SWITCHER
            activeView === 'HIVE' ? (
                React.createElement('div', { style: { flex: 1, overflowY: 'auto' }, className: 'honey-grid' },
                    (Object.values(cells) as HoneyCell[]).map(cell => {
                        const isGiant = cell.type === 'SOUL';
                        return React.createElement('div', { 
                            key: cell.id, 
                            className: `hexagon ${selectedCellId === cell.id ? 'active' : ''} ${cell.type === 'ARCHITECT' ? 'architect' : (isGiant ? 'giant' : '')}`,
                            onClick: () => setSelectedCellId(cell.id)
                        },
                            React.createElement('span', { style: { fontSize: '32px' } }, cell.icon),
                            React.createElement('div', { className: 'cell-label' }, cell.label.toUpperCase())
                        );
                    })
                )
            ) : (
                React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '20px' } },
                    React.createElement('div', { style: { fontSize: '11px', color: '#ff00ff', marginBottom: '15px', letterSpacing: '2px', fontWeight: 'bold' } }, 'RESONANCE_HUNT_LEADERBOARD'),
                    sortedAgents.map((agent, i) => (
                        React.createElement('div', { key: agent.id, className: 'leaderboard-row' },
                            React.createElement('div', { style: { width: '30px', fontWeight: 'bold', color: i < 3 ? '#ffd700' : '#666' } }, `#${i+1}`),
                            React.createElement('div', { style: { fontSize: '20px', marginRight: '10px' } }, agent.icon),
                            React.createElement('div', { style: { flex: 1 } },
                                React.createElement('div', { style: { fontWeight: 'bold', fontSize: '13px' } }, agent.name),
                                React.createElement('div', { style: { fontSize: '9px', opacity: 0.5 } }, agent.serialId)
                            ),
                            React.createElement('div', { style: { textAlign: 'right' } },
                                React.createElement('div', { style: { fontSize: '10px', color: '#00bfff' } }, `FLOW: ${agent.resonanceStats?.totalExecutions || 0}`),
                                React.createElement('div', { style: { fontSize: '10px', color: '#ff00ff' } }, `RES: ${agent.resonanceStats?.plusTwoCount || 0} / ${agent.resonanceStats?.plusThreeCount || 0}`)
                            )
                        )
                    ))
                )
            )
        ),

        // Right: Cell Inspection & JMN Injector
        React.createElement('div', { style: { width: '400px', display: 'flex', flexDirection: 'column', background: '#050505' } },
            selectedCell ? React.createElement(React.Fragment, null,
                React.createElement('div', { style: { padding: '25px', borderBottom: '1px solid #1a1a1a', background: 'rgba(255,255,255,0.02)' } },
                    React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, marginBottom: '5px' } }, `SERIAL_ID: ${selectedCell.serialId || 'LEGACY-NO-ID'}`),
                    React.createElement('div', { style: { fontSize: '18px', fontWeight: 900, color: selectedCell.type === 'ARCHITECT' ? '#ffd700' : '#00ffcc' } }, selectedCell.label),
                    React.createElement('div', { style: { fontSize: '9px', opacity: 0.4, marginTop: '5px' } }, `SYNAPTIC_FRAGMENTS: ${selectedCell.logs.length}`),
                    
                    // EVOLUTION BUTTON FOR GIANTS
                    selectedCell.type === 'SOUL' && React.createElement('button', {
                        onClick: requestSystemEvolution,
                        disabled: isThinking,
                        className: 'evo-btn'
                    }, isThinking ? 'GIANT IS THINKING...' : '⚡ REQUEST SYSTEM EVOLUTION')
                ),
                
                // JMN INJECTION INTERFACE
                React.createElement('div', { style: { padding: '15px', background: '#0a0a0a', borderBottom: '1px solid #333' } },
                    React.createElement('div', { style: { fontSize: '10px', fontWeight: 'bold', color: '#ffaa00', marginBottom: '8px' } }, 'JMN_MANUAL_INJECTION'),
                    // FIX: Type assertion to avoid implicit any on props
                    React.createElement('textarea', { 
                        value: jmnInput, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setJmnInput(e.target.value),
                        placeholder: "Inject raw memory, vision, or conversation data directly into this cell...",
                        style: { width: '100%', height: '60px', background: '#000', border: '1px solid #333', color: '#fff', fontSize: '11px', padding: '8px', borderRadius: '4px', outline: 'none', resize: 'none' }
                    } as any),
                    React.createElement('button', { 
                        onClick: handleJMNInject,
                        style: { width: '100%', marginTop: '8px', padding: '8px', background: '#ffaa00', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }
                    }, 'INJECT DATA TO CELL')
                ),

                React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' } },
                    selectedCell.logs.length === 0 ? React.createElement('div', { style: { opacity: 0.2, textAlign: 'center', marginTop: '100px' } }, '--- NO MEMORY RECORDED ---') :
                    selectedCell.logs.slice().reverse().map((log, i) => (
                        React.createElement('div', { key: i, style: { background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: `2px solid ${log.role === 'user' ? '#00ffcc' : (log.role === 'system' ? '#ffaa00' : '#ff00ff')}` } },
                            React.createElement('div', { style: { fontSize: '8px', opacity: 0.4, marginBottom: '5px', display: 'flex', justifyContent: 'space-between' } },
                                React.createElement('span', null, log.role.toUpperCase()),
                                React.createElement('span', null, new Date(log.timestamp).toLocaleTimeString())
                            ),
                            React.createElement('div', { style: { fontSize: '11px', lineHeight: '1.5', color: '#eee', whiteSpace: 'pre-wrap' } }, log.text)
                        )
                    ))
                )
            ) : React.createElement('div', { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, textAlign: 'center', padding: '40px' } },
                'SELECT A BRAIN CELL TO INSPECT COGNITIVE TWIN MEMORY'
            )
        )
    );
};

export const honeyconeApp: AppDef = {
    id: 'honeycone', name: 'Honeycomb Brain', component: HoneyconeComponent, icon: '🧠', category: 'System', defaultSize: { width: 950, height: 700 },
    description: 'The Sovereign Mind. Giants act as Foundries here. Select a Soul Cell to request specific system evolutions.'
};
