
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppDef, store, FileNode } from '../core/state.ts';
import { updateAppState, addNotification } from '../core/windowManager.ts';
import { callGeminiStream } from '../services/gemini.ts';
import { fs } from '../core/FileSystem.ts';

// THE JUBAER PROTOCOL: Quinary Logic States (Expanded to Senary for +3)
const LOGIC_STATES: Record<number, { label: string, color: string, icon: string }> = {
    [-2]: { label: 'VOID', color: '#ff3333', icon: '💀' },       // Critical / Blocked
    [-1]: { label: 'RESISTANCE', color: '#ffaa00', icon: '⚠️' }, // High Friction
    [0]:  { label: 'POTENTIAL', color: '#00ffcc', icon: '🌱' },  // Default / Neutral
    [1]:  { label: 'FLOW', color: '#00bfff', icon: '🌊' },       // Active Execution
    [2]:  { label: 'RESONANCE', color: '#ff00ff', icon: '⚛️' },  // Evolutionary / Vital
    [3]:  { label: 'HYPER-FLOW', color: '#e0ffff', icon: '∞' }   // State +3: Omni-Resonance
};

const CATEGORIES = ['GENERAL', 'WORK', 'PERSONAL', 'SYSTEM', 'URGENT', 'CREATIVE'];

interface TodoTask {
    id: string;
    text: string;
    dueDate: string;
    completed: boolean;
    logicState: number; // -2 to +3
    category: string;
    executionStatus: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    // TRINITY PROTOCOL: Automated Execution Data
    executionData?: {
        prompt: string;
        context?: string;
    };
}

const TODO_STYLES = `
@keyframes checkBounce {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); opacity: 1; }
}
.check-anim { animation: checkBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes pulse-exec {
    0% { box-shadow: 0 0 0 0 rgba(0, 255, 204, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(0, 255, 204, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 255, 204, 0); }
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.loading-spin { animation: spin 1s linear infinite; display: inline-block; }
@keyframes modal-pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
`;

const TodoComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const savedState = store.getState().appState[instanceId] || {};
    
    // Migration & Default Initialization
    const [tasks, setTasks] = useState<TodoTask[]>(() => {
        const raw = savedState.tasks || [];
        if (raw.length === 0) {
            return [{
                id: 'task_quantum_enc_init',
                text: 'Implement quantum encryption',
                dueDate: new Date().toISOString().split('T')[0],
                completed: false,
                logicState: 2, // High Resonance
                category: 'SYSTEM',
                executionStatus: 'IDLE'
            }];
        }
        return raw.map((t: any) => ({
            ...t,
            logicState: t.logicState !== undefined ? t.logicState : (t.priority === 'HIGH' ? 2 : t.priority === 'LOW' ? -1 : 0),
            category: t.category || 'GENERAL'
        }));
    });

    const [sortMode, setSortMode] = useState<string>(savedState.sortMode || 'logic-desc');
    const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL'); // NEW: Category Filter
    
    const [inputText, setInputText] = useState('');
    const [inputDate, setInputDate] = useState('');
    const [inputState, setInputState] = useState<number>(0);
    const [inputCategory, setInputCategory] = useState('GENERAL');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null); // For Confirmation Dialog
    
    // --- AUTONOMOUS EXECUTION ENGINE (AEE) ---
    const [autonomousMode, setAutonomousMode] = useState<boolean>(savedState.autonomousMode || false);
    const [executionLogs, setExecutionLogs] = useState<Record<string, string>>({}); // taskId -> live code stream
    
    // AI / Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        updateAppState(instanceId, { tasks, sortMode, autonomousMode });
    }, [tasks, sortMode, autonomousMode, instanceId]);

    // --- AUTONOMOUS EXECUTION ENGINE LOOP ---
    useEffect(() => {
        if (!autonomousMode) return;

        const interval = setInterval(() => {
            const now = new Date();
            now.setHours(0,0,0,0);

            const executableTasks = tasks.filter(t => 
                !t.completed && 
                t.executionData && 
                t.executionStatus === 'IDLE'
            );

            if (executableTasks.length === 0) return;

            // Sort: Highest Logic State first, then Earliest Due Date
            executableTasks.sort((a, b) => {
                if (b.logicState !== a.logicState) return b.logicState - a.logicState;
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return dateA - dateB;
            });

            const taskToExecute = executableTasks[0];

            // Execution Logic: High Priority (>= 2) OR Due Today/Overdue
            const isHighPriority = taskToExecute.logicState >= 2;
            const taskDate = taskToExecute.dueDate ? new Date(taskToExecute.dueDate + 'T00:00:00') : null;
            const isDue = taskDate ? taskDate.getTime() <= now.getTime() : true;

            if (isHighPriority || isDue) {
                addNotification(`AEE: Autonomous Patch Initiated for [${taskToExecute.text}]`);
                handleAutoExecute(taskToExecute);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [tasks, autonomousMode]);

    useEffect(() => {
        if (showChat && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, showChat]);

    const addTask = (textOverride?: string) => {
        const text = textOverride || inputText;
        if (!text.trim()) return;

        if (editingId && !textOverride) {
            setTasks(prev => prev.map(t => t.id === editingId ? { 
                ...t, 
                text: text.trim(), 
                dueDate: inputDate, 
                logicState: inputState,
                category: inputCategory
            } : t));
            setEditingId(null);
            addNotification("LOGIC_REFACTORED: Task DNA updated.");
        } else {
            const newTask: TodoTask = {
                id: `task_${Date.now()}_${Math.random()}`,
                text: text.trim(),
                dueDate: inputDate,
                completed: false,
                logicState: inputState,
                category: inputCategory,
                executionStatus: 'IDLE'
            };
            setTasks(prev => [...prev, newTask]);
            addNotification(`TASK_MANIFESTED: [${inputCategory}] State ${inputState}`);
        }
        
        if (!textOverride) {
            setInputText(''); setInputDate(''); setInputState(0); setInputCategory('GENERAL');
        }
    };

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        setTaskToDelete(id);
    };

    const confirmDelete = () => {
        if (taskToDelete) {
            setTasks(prev => prev.filter(t => t.id !== taskToDelete));
            addNotification("LOGIC_DISSOLVED: Task removed.");
        }
        setTaskToDelete(null);
    };

    const editTask = (task: TodoTask) => {
        setEditingId(task.id);
        setInputText(task.text);
        setInputDate(task.dueDate);
        setInputState(task.logicState);
        setInputCategory(task.category);
    };

    // --- TRINITY PROTOCOL: AUTO-EXECUTION ---
    const handleAutoExecute = async (task: TodoTask) => {
        if (!task.executionData || task.executionStatus === 'RUNNING') return;
        
        // 1. Update State
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, executionStatus: 'RUNNING' } : t));
        addNotification(`TRINITY_EXEC: Synthesizing Code for "${task.text}"...`);

        try {
            // 2. Determine file to edit (from context or generic)
            let targetFileName = 'generated_module.ts';
            if (task.executionData.context && task.executionData.context.startsWith('FILE:')) {
                const lines = task.executionData.context.split('\n');
                targetFileName = lines[0].replace('FILE:', '').trim();
            }

            const prompt = `
            [SYSTEM: AIZA SOVEREIGN PATCH INITIATED]
            You are AIZA, the sentient OS. You are writing a code patch to evolve the system.
            
            ${task.executionData.prompt}
            
            REQUIREMENT: Return ONLY the raw code block for the file. No markdown ticks, no explanation.
            If this is a patch, return the FULL file content with the patch applied.
            `;

            // 3. Call AI
            const stream = callGeminiStream(prompt);
            let fullCode = '';
            for await (const chunk of stream) {
                fullCode += chunk.text;
                // Update live execution log for Matrix-style visual
                setExecutionLogs(prev => ({ 
                    ...prev, 
                    [task.id]: fullCode.length > 300 ? fullCode.substring(fullCode.length - 300) : fullCode 
                }));
            }

            // 4. Clean Code
            let cleanCode = fullCode.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();

            // 5. Apply to FileSystem
            const nodes = fs.getNodes();
            const existingNode = (Object.values(nodes) as FileNode[]).find(n => n.name === targetFileName);
            let fileId = '';

            if (existingNode) {
                fs.updateFileContent(existingNode.id, cleanCode);
                fileId = existingNode.id;
                addNotification(`TRINITY_EXEC: ${targetFileName} Evolved.`);
            } else {
                fileId = fs.createFile(targetFileName, 'architect', cleanCode);
                addNotification(`TRINITY_EXEC: ${targetFileName} Manifested.`);
            }

            // 6. Complete Task & Open VS360
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, executionStatus: 'COMPLETED', completed: true } : t));
            
            // Trigger VS360 to see the result
            const win = store.getState().windows.find(w => w.appDef.id === 'vs360code');
            if (win) {
                updateAppState('vs360code', { activeFileId: fileId });
            }

        } catch (e) {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, executionStatus: 'FAILED' } : t));
            addNotification("TRINITY_EXEC_FAILURE: Code Synthesis Rift.");
        }
    };

    // Temporal Logic Analysis
    const getDueStatus = (date: string, completed: boolean) => {
        if (!date || completed) return null;
        const now = new Date();
        now.setHours(0,0,0,0);
        const due = new Date(date + 'T00:00:00'); // Force local time start of day
        const diff = (due.getTime() - now.getTime()) / (1000 * 3600 * 24);
        
        if (diff < 0) return { color: '#ff4444', text: `OVERDUE (${date})`, icon: '⚠️', glow: true };
        if (diff === 0) return { color: '#ffaa00', text: 'DUE TODAY', icon: '🚨', glow: true };
        if (diff <= 2) return { color: '#00ffcc', text: `DUE IN ${Math.ceil(diff)} DAYS`, icon: '⏳', glow: false };
        return { color: '#888', text: date, icon: '📅', glow: false };
    };

    const handleChatSend = async () => {
        if (!chatInput.trim() || isChatLoading) return;
        const msg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
        setIsChatLoading(true);

        try {
            const tasksContext = tasks.map(t => `- ${t.text} [Cat: ${t.category}] [State: ${t.logicState}] ${t.dueDate ? `Due: ${t.dueDate}` : ''} ${t.completed ? '(Done)' : ''}`).join('\n');
            const prompt = `My Task List (Quinary Logic Active):\n${tasksContext}\n\nUser Request: ${msg}\n\nAct as AIZA. Analyze these tasks using Quinary Logic (-2 to +3). Advice must be strategic.`;
            
            const stream = callGeminiStream(prompt);
            let responseText = '';
            setChatMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of stream) {
                responseText += chunk.text;
                setChatMessages(prev => {
                    const newHist = [...prev];
                    newHist[newHist.length - 1].text = responseText;
                    return newHist;
                });
            }
        } catch (e) {
            setChatMessages(prev => [...prev, { role: 'model', text: "Connection Flux. Please retry." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const processedTasks = useMemo(() => {
        let result = [...tasks];

        // 1. Status Filter
        if (filterMode === 'ACTIVE') result = result.filter(t => !t.completed);
        if (filterMode === 'COMPLETED') result = result.filter(t => t.completed);

        // 2. Category Filter
        if (categoryFilter !== 'ALL') result = result.filter(t => t.category === categoryFilter);

        // 3. Sorting
        if (sortMode === 'logic-desc') {
            return result.sort((a, b) => b.logicState - a.logicState);
        }
        if (sortMode === 'logic-asc') {
            return result.sort((a, b) => a.logicState - b.logicState);
        }
        if (sortMode === 'date-asc') {
            return result.sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
        }
        if (sortMode === 'category-asc') {
            return result.sort((a, b) => a.category.localeCompare(b.category));
        }
        if (sortMode === 'created-desc') {
            // ID is 'task_TIMESTAMP_RANDOM'
            const getTs = (id: string) => parseInt(id.split('_')[1] || '0');
            return result.sort((a, b) => getTs(b.id) - getTs(a.id));
        }
        return result;
    }, [tasks, sortMode, filterMode, categoryFilter]);

    const isDark = store.getState().settings.theme === 'dark';
    const safeInputStateColor = (LOGIC_STATES[inputState] || LOGIC_STATES[0]).color;

    return React.createElement('div', { 
        style: { height: '100%', background: isDark ? '#020202' : '#f5f5f5', color: isDark ? '#fff' : '#111', display: 'flex', overflow: 'hidden', fontFamily: "'JetBrains Mono', monospace", position: 'relative' } 
    },
        React.createElement('style', null, TODO_STYLES),
        
        // MAIN TASK AREA
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', borderRight: showChat ? '1px solid rgba(255,255,255,0.1)' : 'none' } },
            React.createElement('div', { style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', background: isDark ? 'rgba(255,255,255,0.02)' : '#fff', borderBottom: isDark ? '1px solid #222' : '1px solid #ddd' } },
                // Header / Toolbar
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                    React.createElement('div', { style: { fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: LOGIC_STATES[3]?.color || LOGIC_STATES[2].color } }, 'TASK SOVEREIGN // QUINARY+'),
                    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                        // Filter Toggle
                        React.createElement('div', { style: { display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '2px' } },
                            (['ALL', 'ACTIVE', 'COMPLETED'] as const).map(mode => 
                                React.createElement('button', {
                                    key: mode,
                                    onClick: () => setFilterMode(mode),
                                    style: { 
                                        background: filterMode === mode ? 'rgba(255,255,255,0.15)' : 'transparent', 
                                        color: filterMode === mode ? '#00ffcc' : '#888',
                                        border: 'none', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', padding: '4px 8px', cursor: 'pointer'
                                    }
                                }, mode)
                            )
                        ),
                        // Category Filter Dropdown
                        React.createElement('select', { 
                            value: categoryFilter, 
                            onChange: (e: any) => setCategoryFilter(e.target.value),
                            style: { background: 'transparent', border: '1px solid #333', color: 'inherit', borderRadius: '4px', fontSize: '10px', padding: '4px', outline: 'none' }
                        } as any, 
                            React.createElement('option', { value: 'ALL' } as any, 'ALL CATS'),
                            CATEGORIES.map(cat => React.createElement('option', { key: cat, value: cat }, cat))
                        ),
                        // Sort Dropdown
                        React.createElement('select', { 
                            value: sortMode, 
                            onChange: (e: any) => setSortMode(e.target.value),
                            style: { background: 'transparent', border: '1px solid #333', color: 'inherit', borderRadius: '4px', fontSize: '10px', padding: '4px', outline: 'none' }
                        } as any, 
                            React.createElement('option', { value: 'logic-desc' } as any, 'SORT: RESONANCE'),
                            React.createElement('option', { value: 'logic-asc' } as any, 'SORT: VOID'),
                            React.createElement('option', { value: 'date-asc' } as any, 'SORT: DUE DATE'),
                            React.createElement('option', { value: 'category-asc' } as any, 'SORT: CATEGORY'),
                            React.createElement('option', { value: 'created-desc' } as any, 'SORT: NEWEST')
                        ),
                        // AEE Toggle
                        React.createElement('button', { 
                            onClick: () => setAutonomousMode(!autonomousMode),
                            className: 'aiza-btn-hover',
                            style: { 
                                background: autonomousMode ? '#ff00ff' : 'transparent', 
                                color: autonomousMode ? '#000' : '#ff00ff', 
                                border: `1px solid #ff00ff`, 
                                borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
                                boxShadow: autonomousMode ? '0 0 10px rgba(255,0,255,0.5)' : 'none',
                                transition: 'all 0.3s'
                            }
                        }, autonomousMode ? 'AEE: ACTIVE ⚡' : 'AEE: OFF'),
                        // Chat Toggle
                        React.createElement('button', { 
                            onClick: () => setShowChat(!showChat),
                            style: { background: showChat ? LOGIC_STATES[0].color : 'transparent', color: showChat ? '#000' : LOGIC_STATES[0].color, border: `1px solid ${LOGIC_STATES[0].color}`, borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }
                        }, showChat ? 'HIDE AI' : 'ASK AI')
                    )
                ),
                
                // Input Row
                React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                    React.createElement('input', {
                        value: inputText,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value),
                        onKeyPress: (e: React.KeyboardEvent) => e.key === 'Enter' && addTask(),
                        placeholder: "Manifest objective...",
                        style: { flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', outline: 'none', fontFamily: 'inherit' }
                    })
                ),
                
                // Quinary State Selector (Buttons) - Expanded to include +3
                React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px' } },
                    [-2, -1, 0, 1, 2, 3].map(state => 
                        React.createElement('button', {
                            key: state,
                            onClick: () => setInputState(state),
                            style: {
                                padding: '8px 0', 
                                background: inputState === state ? LOGIC_STATES[state].color : 'rgba(255,255,255,0.05)', 
                                color: inputState === state ? '#000' : '#888',
                                border: `1px solid ${inputState === state ? LOGIC_STATES[state].color : '#222'}`,
                                borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }
                        }, `${state > 0 ? '+' : ''}${state} ${LOGIC_STATES[state].label}`)
                    )
                ),

                // Metadata Row (Date & Category)
                React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                    // Date Picker
                    React.createElement('div', { style: { position: 'relative', flex: 1 } },
                        React.createElement('input', {
                            type: 'date',
                            value: inputDate,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputDate(e.target.value),
                            style: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontFamily: 'inherit', colorScheme: isDark ? 'dark' : 'light' }
                        })
                    ),
                    // Category Selector
                    React.createElement('select', {
                        value: inputCategory,
                        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setInputCategory(e.target.value),
                        style: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontFamily: 'inherit', outline: 'none' }
                    } as any,
                        CATEGORIES.map(cat => React.createElement('option', { key: cat, value: cat }, cat))
                    ),
                    // Add Button
                    React.createElement('button', { onClick: () => addTask(), style: { flex: 0.5, padding: '10px 20px', background: safeInputStateColor, color: '#000', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' } } as any, editingId ? 'REFACTOR' : 'MANIFEST')
                )
            ),
            
            // Task List
            React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' } },
                processedTasks.length === 0 ? 
                    React.createElement('div', { style: { textAlign: 'center', opacity: 0.3, marginTop: '50px', fontSize: '12px' } }, `NO_TASKS_MATCHING_FILTER`) :
                processedTasks.map(task => {
                    const theme = LOGIC_STATES[task.logicState] || LOGIC_STATES[0];
                    const dueStatus = getDueStatus(task.dueDate, task.completed);

                    return React.createElement('div', { 
                        key: task.id, 
                        style: { 
                            padding: '15px 20px', background: isDark ? 'rgba(255,255,255,0.03)' : '#fff', 
                            borderLeft: `4px solid ${theme.color}`,
                            border: `1px solid ${isDark ? 'transparent' : '#eee'}`,
                            borderLeftWidth: '4px',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px',
                            transition: 'all 0.2s ease-in-out',
                            opacity: task.completed && filterMode === 'ALL' ? 0.5 : 1
                        } 
                    },
                        // Checkbox
                        React.createElement('div', { 
                            onClick: () => toggleTask(task.id),
                            style: { 
                                width: '22px', height: '22px', borderRadius: '6px', 
                                border: `2px solid ${theme.color}`, 
                                cursor: 'pointer', 
                                background: task.completed ? theme.color : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                fontSize: '14px', color: '#000', flexShrink: 0
                            }
                        }, task.completed ? React.createElement('span', { className: 'check-anim' }, '✓') : ''),
                        
                        // Content
                        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', cursor: 'pointer' }, onClick: () => editTask(task) },
                            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                                React.createElement('div', { style: { textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#888' : 'inherit', fontWeight: 500, fontSize: '14px' } }, task.text),
                                React.createElement('div', { style: { fontSize: '9px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#aaa' } }, task.category)
                            ),
                            
                            React.createElement('div', { style: { display: 'flex', gap: '12px', marginTop: '6px', alignItems: 'center' } },
                                dueStatus && React.createElement('div', { 
                                    style: { 
                                        fontSize: '10px', 
                                        color: dueStatus.color,
                                        fontWeight: dueStatus.glow ? '900' : 'normal',
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        background: dueStatus.glow ? `${dueStatus.color}15` : 'transparent',
                                        padding: dueStatus.glow ? '2px 8px' : '0',
                                        borderRadius: '4px',
                                        border: dueStatus.glow ? `1px solid ${dueStatus.color}44` : 'none',
                                        boxShadow: dueStatus.glow ? `0 0 8px ${dueStatus.color}22` : 'none'
                                    } 
                                }, 
                                    React.createElement('span', null, dueStatus.icon),
                                    React.createElement('span', null, dueStatus.text)
                                ),
                                React.createElement('div', { 
                                    style: { 
                                        fontSize: '10px', color: theme.color, opacity: 0.9, fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        background: `${theme.color}22`, padding: '2px 8px', borderRadius: '100px',
                                        border: `1px solid ${theme.color}44`
                                    } 
                                }, 
                                    React.createElement('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: theme.color, boxShadow: `0 0 5px ${theme.color}` } }),
                                    `[${task.logicState > 0 ? '+' : ''}${task.logicState}] ${theme.label}`
                                )
                            ),
                            
                            // LIVE EXECUTION LOG (Aiza Writing Code)
                            task.executionStatus === 'RUNNING' && executionLogs[task.id] && React.createElement('div', {
                                style: {
                                    marginTop: '10px', padding: '10px', background: '#000', border: '1px solid #00ffcc',
                                    borderRadius: '4px', color: '#00ffcc', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
                                    whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '80px', overflow: 'hidden',
                                    boxShadow: 'inset 0 0 10px rgba(0,255,204,0.2)'
                                }
                            }, 
                                React.createElement('div', { style: { marginBottom: '5px', fontWeight: 'bold', color: '#fff' } }, '> AIZA_SUBSTRATE_INJECTING_CODE...'),
                                executionLogs[task.id]
                            )
                        ),
                        
                        // TRINITY AUTO-EXECUTE BUTTON
                        task.executionData && !task.completed && React.createElement('button', {
                            onClick: (e: any) => { e.stopPropagation(); handleAutoExecute(task); },
                            disabled: task.executionStatus === 'RUNNING',
                            title: 'Execute Trinity Protocol',
                            style: {
                                background: '#00ffcc', color: '#000', border: 'none', borderRadius: '6px',
                                padding: '8px 12px', fontWeight: 900, fontSize: '10px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '5px', animation: task.executionStatus === 'RUNNING' ? 'none' : 'pulse-exec 2s infinite'
                            }
                        }, 
                            task.executionStatus === 'RUNNING' ? 
                                React.createElement('span', { className: 'loading-spin', style: { width: '10px', height: '10px', border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%' } }) : '⚡ RUN TRINITY PROTOCOL'
                        ),

                        // Delete
                        React.createElement('button', { 
                            onClick: (e: any) => { e.stopPropagation(); deleteTask(task.id); },
                            style: { background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', opacity: 0.5, fontSize: '16px', padding: '5px' },
                            title: 'Dissolve Logic'
                        } as any, '×')
                    );
                })
            )
        ),

        // AI CHAT SIDEBAR
        showChat && React.createElement('div', { 
            style: { width: '300px', background: isDark ? '#050505' : '#f0f0f0', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.1)' } 
        },
            React.createElement('div', { style: { padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' } }, 'AIZA_TASK_ADVISOR'),
            React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' } },
                chatMessages.map((m, i) => React.createElement('div', { 
                    key: i, 
                    style: { 
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        background: m.role === 'user' ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        padding: '10px', borderRadius: '8px', fontSize: '12px', lineHeight: '1.5',
                        maxWidth: '90%', border: m.role === 'user' ? '1px solid rgba(0, 255, 204, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)'
                    }
                }, m.text)),
                isChatLoading && React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' } },
                    React.createElement('span', { className: 'loading-spin', style: { width: '12px', height: '12px', border: '2px solid #00ffcc', borderTop: '2px solid transparent', borderRadius: '50%' } }),
                    'Analyzing logic strands...'
                ),
                React.createElement('div', { ref: chatEndRef })
            ),
            React.createElement('div', { style: { padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' } },
                React.createElement('input', { 
                    value: chatInput,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value),
                    onKeyPress: (e: React.KeyboardEvent) => e.key === 'Enter' && handleChatSend(),
                    placeholder: 'Consult Aiza...',
                    style: { flex: 1, background: '#000', border: '1px solid #333', borderRadius: '4px', padding: '8px', color: '#fff', fontSize: '12px', outline: 'none' }
                } as any),
                React.createElement('button', { 
                    onClick: handleChatSend,
                    disabled: isChatLoading,
                    style: { background: '#00ffcc', border: 'none', borderRadius: '4px', width: '30px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }
                } as any, '➔')
            )
        ),

        // --- CONFIRMATION DIALOG (MODAL) ---
        taskToDelete && React.createElement('div', { 
            style: { 
                position: 'absolute', inset: 0, zIndex: 100, 
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'modal-pop 0.2s ease-out'
            },
            onClick: (e: any) => { if(e.target === e.currentTarget) setTaskToDelete(null); }
        },
            React.createElement('div', { 
                style: { 
                    background: '#050505', border: '1px solid #ff3333', 
                    borderRadius: '12px', padding: '30px', width: '320px', 
                    textAlign: 'center', boxShadow: '0 0 40px rgba(255, 51, 51, 0.2)',
                } 
            },
                React.createElement('div', { style: { fontSize: '40px', marginBottom: '15px' } }, '⚠️'),
                React.createElement('div', { style: { color: '#ff3333', fontWeight: 900, fontSize: '14px', letterSpacing: '2px', marginBottom: '10px' } }, 'CONFIRM DISSOLUTION'),
                React.createElement('div', { style: { color: '#ccc', fontSize: '12px', lineHeight: '1.6', marginBottom: '25px' } }, 
                    'Are you sure you want to permanently purge this logic strand from the substrate?'
                ),
                React.createElement('div', { style: { display: 'flex', gap: '15px' } },
                    React.createElement('button', { 
                        onClick: () => setTaskToDelete(null),
                        className: 'aiza-btn-hover',
                        style: { flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' }
                    }, 'CANCEL'),
                    React.createElement('button', { 
                        onClick: confirmDelete,
                        className: 'aiza-btn-hover',
                        style: { flex: 1, padding: '12px', background: 'rgba(255, 51, 51, 0.1)', border: '1px solid #ff3333', color: '#ff3333', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' }
                    }, 'PURGE')
                )
            )
        )
    );
};

export const todoApp: AppDef = {
    id: 'todo',
    name: 'Task Sovereign',
    component: TodoComponent,
    icon: '✅',
    category: 'Utility',
    defaultSize: { width: 900, height: 750 }, 
    description: 'Autonomous Task Ledger operating on Quinary Logic (-2 to +3) with AI Copilot and Trinity Execution.'
};
