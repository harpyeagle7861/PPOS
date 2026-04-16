import React, { useState, useEffect } from 'react';
import { AppDef, store } from '../core/state.ts';
import { callGemini } from '../services/gemini.ts';
import { addNotification, openApp, updateAppState } from '../core/windowManager.ts';

const TRINITY_STYLES = `
.trinity-root {
    height: 100%; background: #050508; color: #e0e0e0;
    font-family: 'JetBrains Mono', monospace; display: flex; flex-direction: column;
}
.trinity-header {
    padding: 20px; border-bottom: 1px solid rgba(255, 215, 0, 0.2);
    display: flex; justify-content: space-between; alignItems: center;
    background: linear-gradient(90deg, rgba(0,0,0,0.8), rgba(255, 215, 0, 0.05));
}
.trinity-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px;
    background: rgba(255, 215, 0, 0.1); flex: 1; overflow: hidden;
}
.trinity-col {
    background: #050508; display: flex; flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}
.col-header {
    padding: 15px; font-size: 11px; letter-spacing: 2px;
    font-weight: 900; text-transform: uppercase;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex; align-items: center; gap: 10px;
}
.col-content {
    flex: 1; overflow-y: auto; padding: 15px;
    display: flex; flex-direction: column; gap: 15px;
}
.insight-card {
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
    padding: 12px; border-radius: 6px; font-size: 12px; line-height: 1.5;
    transition: all 0.3s; cursor: pointer;
}
.insight-card:hover {
    border-color: #ffd700; background: rgba(255, 215, 0, 0.05);
    transform: translateX(2px);
}
.type-badge {
    font-size: 9px; padding: 2px 6px; border-radius: 4px;
    background: rgba(255,255,255,0.1); display: inline-block; margin-bottom: 6px;
}
.evolution-btn {
    padding: 12px 24px; background: #ffd700; color: #000; border: none;
    font-weight: 900; font-size: 11px; letter-spacing: 1px; cursor: pointer;
    border-radius: 4px; display: flex; align-items: center; gap: 8px;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
    transition: 0.3s;
}
.evolution-btn:hover { box-shadow: 0 0 35px rgba(255, 215, 0, 0.5); transform: scale(1.05); }
.evolution-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

interface Insight {
    type: 'BUG' | 'OPT' | 'SEC' | 'EVO';
    title: string;
    description: string;
    codeContext?: string;
    priority: number; // 1-5
}

const Eagle369TrinityComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [status, setStatus] = useState('DORMANT'); // DORMANT, SCANNING, SYNTHESIZING
    const [activeContext, setActiveContext] = useState<{file: string, goal: string} | null>(null);
    const [insights, setInsights] = useState<{
        perception: Insight[],
        exploration: Insight[],
        synthesis: Insight[]
    }>({ perception: [], exploration: [], synthesis: [] });

    // --- 3: PERCEPTION (Gather Context) ---
    const scanSystem = async () => {
        setStatus('SCANNING');
        const state = store.getState();
        
        // 1. Get Active Code (VS360)
        const vs360State = state.appState['vs360code'];
        const activeFileId = vs360State?.activeFileId;
        const activeFile = activeFileId ? state.fileSystem[activeFileId] : null;
        
        // 2. Get Architectural Goal (Module Architect)
        // We'll grab the last modified custom app or a generic goal if none
        const customApps = (Object.values(state.apps) as AppDef[]).filter(a => a.isDynamic);
        const latestBlueprint = customApps.length > 0 ? customApps[customApps.length - 1] : null;
        
        const context = {
            file: activeFile ? `FILE: ${activeFile.name}\nCONTENT:\n${activeFile.content}` : "NO_ACTIVE_FILE_IN_VS360",
            goal: latestBlueprint ? `BLUEPRINT: ${latestBlueprint.name}\nDESC: ${latestBlueprint.description}` : "GOAL: General System Evolution & Optimization"
        };
        
        setActiveContext(context);
        
        // 3. Analyze via AI
        const prompt = `
        [PROTOCOL: EAGLE_369_TRINITY]
        ACT AS: The Supreme Orchestrator.
        
        INPUT CONTEXT:
        ${context.file.substring(0, 3000)}
        
        ARCHITECTURAL GOAL:
        ${context.goal}
        
        MANDATE:
        Perform a 3-stage analysis (3-6-9):
        1. PERCEPTION (3): Identify Bugs (BUG) and Security Vulnerabilities (SEC) in the current code.
        2. EXPLORATION (6): Identify Optimizations (OPT) and clean code practices.
        3. SYNTHESIS (9): Suggest specific EVOLUTION (EVO) steps to align the code with the Goal/Blueprint.
        
        RETURN JSON ONLY:
        {
            "perception": [{ "type": "BUG"|"SEC", "title": "...", "description": "...", "priority": 1-5, "logicState": 2, "executionDate": "YYYY-MM-DD" }],
            "exploration": [{ "type": "OPT", "title": "...", "description": "...", "priority": 1-5, "logicState": 0, "executionDate": "YYYY-MM-DD" }],
            "synthesis": [{ "type": "EVO", "title": "...", "description": "High-level feature or refactor needed...", "priority": 1-5, "logicState": 1, "executionDate": "YYYY-MM-DD" }]
        }
        (Note: Use today's date ${new Date().toISOString().split('T')[0]} for urgent tasks, and future dates for lower priority. logicState should be between -2 and 3).
        `;

        try {
            const response = await callGemini(prompt);
            const jsonStr = response.text.match(/\{[\s\S]*\}/)?.[0];
            if (jsonStr) {
                const data = JSON.parse(jsonStr);
                setInsights(data);
                setStatus('RESONANCE_ACHIEVED');
                addNotification("TRINITY: Substrate analyzed. 3-6-9 Cycle Complete.");
            } else {
                throw new Error("Failed to parse Trinity signal.");
            }
        } catch (e) {
            setStatus('ERROR');
            addNotification("TRINITY_FAULT: Connection severed.");
        }
    };

    // --- 9: DISPATCH (Send to Todo) ---
    const dispatchToTodo = (insight: any) => {
        // We create a "Smart Task" in the Todo App
        const state = store.getState();
        const todoState = state.appState['todo'] || {};
        const currentTasks = todoState.tasks || [];
        
        // The Payload that allows the Todo app to auto-execute
        const executionPrompt = `
        ACTION: ${insight.type === 'EVO' ? 'EVOLVE' : 'FIX'}
        CONTEXT: ${insight.title}
        INSTRUCTION: ${insight.description}
        TARGET_FILE: ${activeContext?.file.split('\n')[0] || 'CURRENT'}
        
        Write the code/patch to satisfy this request.
        `;

        const newTask = {
            id: `trinity_task_${Date.now()}`,
            text: `[${insight.type}] ${insight.title}`,
            dueDate: insight.executionDate || new Date().toISOString().split('T')[0],
            completed: false,
            logicState: insight.logicState !== undefined ? insight.logicState : (insight.priority >= 4 ? 2 : 0),
            category: insight.type === 'EVO' ? 'CREATIVE' : 'SYSTEM',
            executionStatus: 'IDLE',
            // This is the magic payload for the Todo App
            executionData: {
                prompt: executionPrompt,
                context: activeContext?.file
            }
        };

        updateAppState('todo', { tasks: [newTask, ...currentTasks] });
        addNotification(`TRINITY: Task dispatched to Sovereign Ledger.`);
    };

    const renderCard = (insight: Insight, color: string) => (
        React.createElement('div', { 
            key: insight.title, 
            className: 'insight-card',
            onClick: () => dispatchToTodo(insight),
            style: { borderLeft: `3px solid ${color}` }
        },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' } },
                React.createElement('span', { className: 'type-badge', style: { color } }, insight.type),
                React.createElement('span', { style: { fontSize: '9px', opacity: 0.5 } }, `PRIORITY: ${insight.priority}`)
            ),
            React.createElement('div', { style: { fontWeight: 'bold', marginBottom: '5px' } }, insight.title),
            React.createElement('div', { style: { opacity: 0.7 } }, insight.description),
            React.createElement('div', { style: { marginTop: '10px', fontSize: '9px', color: color, fontWeight: 900, textAlign: 'right' } }, '➔ DISPATCH_TO_LEDGER')
        )
    );

    return React.createElement('div', { className: 'trinity-root' },
        React.createElement('style', null, TRINITY_STYLES),
        
        // Header
        React.createElement('div', { className: 'trinity-header' },
            React.createElement('div', null,
                React.createElement('div', { style: { color: '#ffd700', fontSize: '10px', letterSpacing: '4px', fontWeight: 900 } }, 'OMNI_ACTION_RESONANCE'),
                React.createElement('div', { style: { fontSize: '20px', fontWeight: 800, marginTop: '5px' } }, 'EAGLE 369 TRINITY'),
            ),
            React.createElement('div', { style: { display: 'flex', gap: '20px', alignItems: 'center' } },
                React.createElement('div', { style: { textAlign: 'right' } },
                    React.createElement('div', { style: { fontSize: '9px', opacity: 0.5 } }, 'STATUS'),
                    React.createElement('div', { style: { color: status === 'SCANNING' ? '#00ffcc' : (status === 'ERROR' ? '#ff3333' : '#ffd700'), fontWeight: 'bold' } }, status)
                ),
                React.createElement('button', { 
                    className: 'evolution-btn', 
                    onClick: scanSystem,
                    disabled: status === 'SCANNING'
                }, 
                    status === 'SCANNING' ? 'RESONATING...' : 'INITIATE_369_CYCLE'
                )
            )
        ),

        // Context Bar
        activeContext && React.createElement('div', { style: { padding: '10px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', display: 'flex', gap: '30px' } },
            React.createElement('div', null, React.createElement('span', { style: { color: '#00ffcc', fontWeight: 'bold' } }, 'TARGET: '), activeContext.file.split('\n')[0]),
            React.createElement('div', null, React.createElement('span', { style: { color: '#ffd700', fontWeight: 'bold' } }, 'VECTOR: '), activeContext.goal.split('\n')[0])
        ),

        // 3-Column Grid
        React.createElement('div', { className: 'trinity-grid' },
            
            // 3: PERCEPTION
            React.createElement('div', { className: 'trinity-col' },
                React.createElement('div', { className: 'col-header', style: { color: '#ff4d4d' } }, 
                    React.createElement('span', { style: { fontSize: '16px' } }, '👁️'), '3 : PERCEPTION (AUDIT)'
                ),
                React.createElement('div', { className: 'col-content' },
                    insights.perception.length === 0 && React.createElement('div', { style: { opacity: 0.3, textAlign: 'center', marginTop: '50px' } }, 'No Anomalies Detected'),
                    insights.perception.map(i => renderCard(i, '#ff4d4d'))
                )
            ),

            // 6: EXPLORATION
            React.createElement('div', { className: 'trinity-col' },
                React.createElement('div', { className: 'col-header', style: { color: '#00ffcc' } }, 
                    React.createElement('span', { style: { fontSize: '16px' } }, '🔍'), '6 : EXPLORATION (OPT)'
                ),
                React.createElement('div', { className: 'col-content' },
                    insights.exploration.length === 0 && React.createElement('div', { style: { opacity: 0.3, textAlign: 'center', marginTop: '50px' } }, 'Substrate Optimal'),
                    insights.exploration.map(i => renderCard(i, '#00ffcc'))
                )
            ),

            // 9: SYNTHESIS
            React.createElement('div', { className: 'trinity-col', style: { borderRight: 'none' } },
                React.createElement('div', { className: 'col-header', style: { color: '#ffd700' } }, 
                    React.createElement('span', { style: { fontSize: '16px' } }, '⚜️'), '9 : SYNTHESIS (EVO)'
                ),
                React.createElement('div', { className: 'col-content' },
                    insights.synthesis.length === 0 && React.createElement('div', { style: { opacity: 0.3, textAlign: 'center', marginTop: '50px' } }, 'Awaiting Evolution Vector'),
                    insights.synthesis.map(i => renderCard(i, '#ffd700'))
                )
            )
        )
    );
};

export const eagle369trinityApp: AppDef = {
    id: 'eagle369trinity',
    name: 'Eagle 369 Trinity',
    component: Eagle369TrinityComponent,
    icon: '⚜️',
    category: 'System',
    defaultSize: { width: 1100, height: 700 },
    description: 'The Strategic Core. Perception (Audit) -> Exploration (Plan) -> Synthesis (Execution). Orchestrates system evolution.'
};