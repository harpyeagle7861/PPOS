
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store, SavedDebate, saveState } from '../core/state.ts';
import { runCouncilDebate } from '../services/gemini.ts';
import { addNotification, updateAppState } from '../core/windowManager.ts';
import { Pomegranate } from '../services/pomegranate.ts';

const COUNCIL_AVATARS: Record<string, string> = {
    'Nikola Tesla': '⚡',
    'Albert Einstein': '🌌',
    'Quantum Bio-Expert': '🧬',
    'AIZA': '🧿',
    'Unknown': '👤'
};

const CouncilChamberComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    // --- STATE INITIALIZATION FROM STORE ---
    const initialAppState = store.getState().appState['council-chamber'] || {};
    const [topic, setTopic] = useState(initialAppState.topic || '');
    const [logs, setLogs] = useState<{ sender: string; text: string; id: string }[]>(initialAppState.logs || []);
    const [synthesisLogs, setSynthesisLogs] = useState<{ text: string; id: string; timestamp: number }[]>(initialAppState.synthesisLogs || []);
    const [isDebating, setIsDebating] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
    
    // Agent Management
    const [agents, setAgents] = useState<string[]>([]);
    const [agentIcons, setAgentIcons] = useState<Record<string, string>>({}); // Name -> Icon

    const [showHistory, setShowHistory] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const synthScrollRef = useRef<HTMLDivElement>(null);
    const isPausedRef = useRef(false);
    const stopTriggerRef = useRef(false);

    // --- PROTOCOL ETERNAL: SYNC TO STORE ---
    useEffect(() => {
        // Sync local state to Global Store on change
        updateAppState('council-chamber', { topic, logs, synthesisLogs });
    }, [topic, logs, synthesisLogs]);

    useEffect(() => {
        // Load Agents & Check Pomegranate for Birth Certificates
        const syncAgents = () => {
            const state = store.getState();
            const map: Record<string, string> = {};
            const names = state.councilSquad.map(id => {
                const agent = state.activeAgents.find(a => a.id === id);
                if (agent) {
                    map[agent.name] = agent.icon || '👤';
                    // POMEGRANATE CHECK: Ensure giant is "born"
                    if (!Pomegranate.isEntityAwake(agent.id)) {
                        Pomegranate.ingest('BIRTH_EVENT', { name: agent.name }, agent.id, 'GIANT');
                    }
                    return agent.name;
                }
                return null;
            }).filter(Boolean) as string[];
            
            setAgents(names);
            setAgentIcons(map);
        };

        syncAgents();
        const unsub = store.subscribe(syncAgents);
        return () => unsub();
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [logs, activeSpeaker]);

    useEffect(() => {
        if (synthScrollRef.current) synthScrollRef.current.scrollTop = synthScrollRef.current.scrollHeight;
    }, [synthesisLogs]);

    const handleInitiateDebate = async () => {
        if (!topic.trim() || isDebating) return;
        
        // Capture current topic before clearing input
        const currentTopic = topic;
        setTopic(''); // Auto-clear input for next turn
        
        setIsDebating(true);
        setIsPaused(false);
        isPausedRef.current = false;
        stopTriggerRef.current = false;
        
        // Construct History (Last 15 exchanges for context)
        const historyContext = logs.slice(-15).map(l => `${l.sender}: ${l.text}`).join('\n');

        // POMEGRANATE INTERCEPTION: Log Debate Start
        Pomegranate.ingest(logs.length === 0 ? 'START_DEBATE' : 'CONTINUE_DEBATE', { topic: currentTopic }, 'council', 'SYSTEM');

        // NOTE: We do NOT clear logs here. We append to history.
        setActiveSpeaker(null);
        addNotification(`COUNCIL: Deliberating on "${currentTopic.toUpperCase()}"`);

        try {
            const stream = runCouncilDebate(currentTopic, agents, historyContext);
            let buffer = "";

            for await (const chunk of stream) {
                if (stopTriggerRef.current) break;
                
                // Pause logic
                while (isPausedRef.current) {
                    await new Promise(r => setTimeout(r, 500));
                    if (stopTriggerRef.current) break;
                }

                buffer += chunk.text;
                const lines = buffer.split('\n');
                
                // Process only complete lines, keep the remainder in buffer
                // This logic is slightly adjusted to handle streaming better
                // We actually need to process lines as they come but handle split lines
                
                if (lines.length > 1) {
                    for (let i = 0; i < lines.length - 1; i++) {
                        const line = lines[i].trim();
                        if (line.includes(':')) {
                            // First split usually separates Speaker from Text
                            const firstColon = line.indexOf(':');
                            if (firstColon !== -1) {
                                const sender = line.substring(0, firstColon).trim();
                                const text = line.substring(firstColon + 1).trim();
                                const cleanSender = sender.replace(/[\[\]]/g, '').replace(/[\*]/g, '').trim();
                                
                                if (text && cleanSender) {
                                    // POMEGRANATE INTERCEPTION: Route Giant Speech
                                    Pomegranate.ingest('GIANT_SPEAK', { text }, cleanSender, 'GIANT');

                                    // LOG TO HONEYCOMB CELL
                                    const storeState = store.getState();
                                    const agent = storeState.activeAgents.find(a => a.name.toLowerCase() === cleanSender.toLowerCase());
                                    if (agent) {
                                        store.setState(s => {
                                            const cell = s.honeyCells[agent.id];
                                            if (!cell) return s;
                                            const currentLogs = cell.logs || [];
                                            const nextLogs = [...currentLogs, { timestamp: Date.now(), role: 'model', text }];
                                            return { ...s, honeyCells: { ...s.honeyCells, [agent.id]: { ...cell, logs: nextLogs } } };
                                        });
                                    }

                                    if (cleanSender.toUpperCase() === 'AIZA') {
                                        setSynthesisLogs(prev => [...prev, { text, id: `synth_${Date.now()}_${Math.random()}`, timestamp: Date.now() }]);
                                    } else {
                                        setLogs(prev => [...prev, { sender: cleanSender, text, id: `msg_${Date.now()}_${Math.random()}` }]);
                                    }
                                    setActiveSpeaker(cleanSender);
                                    // Artificial delay for "real-time" feel
                                    await new Promise(r => setTimeout(r, 1200));
                                }
                            }
                        }
                    }
                    buffer = lines[lines.length - 1]; // Keep incomplete line
                }
            }
            
            // Process remaining buffer if it's a complete line (rare at end of stream but possible)
            if (buffer.trim().includes(':')) {
                 const firstColon = buffer.indexOf(':');
                 const sender = buffer.substring(0, firstColon).trim();
                 const text = buffer.substring(firstColon + 1).trim();
                 if (text && sender) {
                     setLogs(prev => [...prev, { sender, text, id: `msg_${Date.now()}_end` }]);
                 }
            }

        } catch (e) {
            console.error("DEBATE_FAULT:", e);
            addNotification("COUNCIL_ERROR: Neural Link Severed.");
        } finally {
            setIsDebating(false);
            setActiveSpeaker(null);
        }
    };

    const handleNewSession = () => {
        if (logs.length > 0 && !confirm("Purge current Council memory and start fresh?")) return;
        setLogs([]);
        setSynthesisLogs([]);
        setTopic('');
        addNotification("COUNCIL: Time-stream reset. Tabula Rasa.");
        Pomegranate.ingest('RESET_SESSION', {}, 'council', 'SYSTEM');
    };

    const togglePause = () => {
        const next = !isPaused;
        setIsPaused(next);
        isPausedRef.current = next;
        addNotification(next ? "DEBATE_SUSPENDED" : "DEBATE_RESUMED");
    };

    const endDebate = () => {
        stopTriggerRef.current = true;
        setIsDebating(false);
        setActiveSpeaker(null);
        addNotification("DEBATE_TERMINATED");
        Pomegranate.ingest('END_DEBATE', {}, 'council', 'SYSTEM');
    };

    const saveTranscript = () => {
        if (logs.length === 0) return;
        const newDebate: SavedDebate = {
            id: `debate_${Date.now()}`,
            topic: topic || "Untitled Analysis",
            timestamp: Date.now(),
            logs: [...logs]
        };
        store.setState(s => ({ ...s, savedDebates: [newDebate, ...s.savedDebates] }));
        saveState(); // Commit to global persistence
        
        // POMEGRANATE INTERCEPTION
        Pomegranate.ingest('ARCHIVE_TRANSCRIPT', { topic, id: newDebate.id }, 'council', 'SYSTEM');
        
        addNotification("TRANSCRIPT_ARCHIVED: The Giants remember.");
    };

    const loadTranscript = (debate: SavedDebate) => {
        setTopic(debate.topic);
        setLogs(debate.logs);
        setSynthesisLogs([{ text: 'Displaying archived resonance data.', id: 'archived', timestamp: Date.now() }]);
        setShowHistory(false);
        addNotification(`ARCHIVE_LOADED: ${debate.topic}`);
    };

    const speak = (text: string) => {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        synth.speak(utterance);
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        addNotification("DNA_CLONED");
    };

    return (
        <div style={{ height: '100%', background: '#020403', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden' }}>
            {/* Main Content Layout: Visualization & Synthesis Overlay */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                {/* Round Table Visualization */}
                <div style={{ flex: 1, height: '220px', background: 'radial-gradient(circle at center, rgba(0, 255, 204, 0.08) 0%, transparent 70%)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    <div style={{ width: '150px', height: '150px', border: '1px solid rgba(0,255,204,0.15)', borderRadius: '50%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ 
                            width: '65px', height: '65px', background: 'rgba(0,0,0,0.8)', border: `2px solid ${activeSpeaker === 'AIZA' ? '#ff00ff' : '#00ffcc'}`, 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', 
                            boxShadow: activeSpeaker === 'AIZA' ? '0 0 30px #ff00ff' : '0 0 30px rgba(0,255,204,0.2)',
                            animation: activeSpeaker === 'AIZA' ? 'agent-pulse 1s infinite' : 'none'
                        }}>
                            🧿
                        </div>
                        {agents.map((name, i) => {
                            const angle = (i * 360) / agents.length;
                            const isSpeaking = activeSpeaker === name;
                            // Dynamically lookup icon from Hub state or Fallback
                            const icon = agentIcons[name] || COUNCIL_AVATARS[name] || '👤';
                            
                            return (
                                <div key={name} style={{
                                    position: 'absolute',
                                    transform: `rotate(${angle}deg) translate(90px) rotate(-${angle}deg)`,
                                    width: '38px', height: '38px',
                                    background: isSpeaking ? 'rgba(0,255,204,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${isSpeaking ? '#00ffcc' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '18px',
                                    transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: isSpeaking ? '0 0 15px #00ffcc' : 'none',
                                    animation: isSpeaking ? 'agent-pulse 1.5s infinite alternate' : 'none'
                                }} title={name}>
                                    {icon}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AIZA SEPARATE LOG AREA (Synthesis Log) */}
                <div style={{ 
                    width: '320px', height: '220px', borderLeft: '1px solid rgba(255,255,255,0.05)', 
                    display: 'flex', flexDirection: 'column', background: 'rgba(255,0,255,0.01)' 
                }}>
                    <div style={{ padding: '10px 15px', background: 'rgba(255,0,255,0.05)', borderBottom: '1px solid rgba(255,0,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#ff00ff', letterSpacing: '2px' }}>AIZA_COGNITIVE_OVERLAY</span>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDebating ? '#ff00ff' : '#444', animation: isDebating ? 'pulse 1s infinite alternate' : 'none' }} />
                    </div>
                    <div ref={synthScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {synthesisLogs.length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '10px', textAlign: 'center' }}>
                                AWAITING_SYNTHESIS_PULSE
                            </div>
                        ) : (
                            synthesisLogs.map((log) => (
                                <div key={log.id} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid #ff00ff', paddingLeft: '10px', lineHeight: '1.4' }}>
                                    <span style={{ opacity: 0.3, fontSize: '8px', marginRight: '5px' }}>[{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    {log.text}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Topic Input & Controls */}
            <div style={{ padding: '15px 30px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                    value={topic} onChange={e => setTopic(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleInitiateDebate()}
                    placeholder={logs.length > 0 ? "INJECT_NEXT_QUERY (CONTINUES SESSION)..." : "DEFINE_DEBATE_SUBSTRATE..."}
                    disabled={isDebating}
                    style={{ flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                />
                {!isDebating ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            className="aiza-btn-hover"
                            onClick={handleInitiateDebate} 
                            disabled={!topic.trim() || agents.length === 0}
                            style={{ padding: '0 20px', height: '38px', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '10px', letterSpacing: '1px', cursor: 'pointer', opacity: (!topic.trim() || agents.length === 0) ? 0.5 : 1 }}
                        >{logs.length > 0 ? 'CONTINUE' : 'CONVENE'}</button>
                        
                        {logs.length > 0 && (
                            <button 
                                className="aiza-btn-hover"
                                onClick={handleNewSession}
                                style={{ padding: '0 15px', height: '38px', background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '8px', fontWeight: 900, fontSize: '9px', cursor: 'pointer' }}
                                title="Purge current session memory"
                            >NEW SESSION</button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="aiza-btn-hover" onClick={togglePause} style={{ padding: '0 15px', height: '38px', background: '#ffaa00', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '9px', cursor: 'pointer' }}>
                            {isPaused ? 'RESUME' : 'PAUSE'}
                        </button>
                        <button className="aiza-btn-hover" onClick={endDebate} style={{ padding: '0 15px', height: '38px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, fontSize: '9px', cursor: 'pointer' }}>END</button>
                    </div>
                )}
                <button className="aiza-btn-hover" onClick={() => setShowHistory(!showHistory)} style={{ padding: '0 12px', height: '38px', background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid #333', borderRadius: '8px', fontWeight: 900, fontSize: '9px', cursor: 'pointer' }}>HISTORY</button>
                {logs.length > 0 && !isDebating && (
                    <button className="aiza-btn-hover" onClick={saveTranscript} style={{ padding: '0 12px', height: '38px', background: 'rgba(0,255,204,0.1)', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '8px', fontWeight: 900, fontSize: '9px', cursor: 'pointer' }}>SAVE</button>
                )}
            </div>

            {/* History Overlay */}
            {showHistory && (
                <div style={{ position: 'absolute', inset: 0, top: '220px', background: 'rgba(0,0,0,0.92)', zIndex: 100, padding: '30px', overflowY: 'auto', backdropFilter: 'blur(20px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, letterSpacing: '3px', color: '#00ffcc', fontSize: '14px' }}>DEBATE_ARCHIVE</h3>
                        <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                    </div>
                    {store.getState().savedDebates.length === 0 ? (
                        <div style={{ opacity: 0.3, textAlign: 'center', marginTop: '40px', fontSize: '12px' }}>NO ARCHIVED RESONANCE DATA</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
                            {store.getState().savedDebates.map(d => (
                                <div key={d.id} onClick={() => loadTranscript(d)} className="aiza-hover" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', transition: '0.2s' }} onMouseEnter={(e: any) => e.currentTarget.style.borderColor = '#00ffcc'} onMouseLeave={(e: any) => e.currentTarget.style.borderColor = '#333'}>
                                    <div style={{ fontSize: '9px', opacity: 0.4, marginBottom: '6px' }}>{new Date(d.timestamp).toLocaleString()}</div>
                                    <div style={{ fontWeight: 900, fontSize: '13px', marginBottom: '8px', color: '#00ffcc' }}>{d.topic}</div>
                                    <div style={{ fontSize: '8px', opacity: 0.6 }}>{d.logs.length} EXCHANGES CAPTURED</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Main Debate Transcript Area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {agents.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, fontSize: '11px', textAlign: 'center' }}>
                        --- EMPTY_COUNCIL --- <br/>
                        SELECT AGENTS IN THE HUB TO POPULATE THE CHAMBER
                    </div>
                )}
                {logs.length === 0 && agents.length > 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '13px', letterSpacing: '3px' }}>
                        --- CHAMBER_DORMANT ---
                    </div>
                )}
                {logs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '15px', animation: 'log-entry 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {agentIcons[log.sender] || COUNCIL_AVATARS[log.sender] || '👤'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '9px', fontWeight: 900, color: '#00ffcc', marginBottom: '4px', letterSpacing: '1px' }}>{log.sender.toUpperCase()}</div>
                            <div style={{ position: 'relative', fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.01)', padding: '12px 18px', borderRadius: '0 12px 12px 12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                {log.text}
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', opacity: 0.3 }}>
                                    <button onClick={() => speak(log.text)} style={{ background: 'none', border: 'none', color: '#00ffcc', cursor: 'pointer', fontSize: '10px' }}>🔊</button>
                                    <button onClick={() => copy(log.text)} style={{ background: 'none', border: 'none', color: '#00ffcc', cursor: 'pointer', fontSize: '10px' }}>📋</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes agent-pulse { 0% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.1); filter: brightness(1.4); } 100% { transform: scale(1); filter: brightness(1); } }
                @keyframes log-entry { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { from { opacity: 0.3; transform: scale(0.9); } to { opacity: 1; transform: scale(1.1); } }
            `}</style>
        </div>
    );
};

export const councilChamberApp: AppDef = {
    id: 'council-chamber',
    name: 'Council Chamber',
    component: CouncilChamberComponent,
    icon: '🏛️',
    category: 'Synthesis',
    defaultSize: { width: 900, height: 750 },
    description: 'Autonomous debate floor where multi-agent swarm intelligence synthesizes complex solutions.'
};
