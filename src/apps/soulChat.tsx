
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store, HoneyCell } from '../core/state.ts';
import { callGeminiStream } from '../services/gemini.ts';
import { addNotification, registerGenesisApp, registerOrUpdateApp, openApp, closeWindow } from '../core/windowManager.ts';

/**
 * MessageContent: Implements the Splitter Protocol.
 * Strictly separates conversational text from execution code.
 */
const MessageContent: React.FC<{ text: string; messageId: string }> = ({ text, messageId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasExecuted = useRef(false);

    // --- SPLITTER PROTOCOL ---
    // Identify the first occurrence of any code/protocol marker
    const markers = [
        '<!DOCTYPE', 
        '<html', 
        '<style', 
        '<div', 
        '<script', 
        '[GENESIS_BUILD]', 
        '[MANIFEST_APP]',
        '[OPEN_APP]',
        '[CLOSE_APP]'
    ];

    let splitIndex = -1;
    for (const marker of markers) {
        const idx = text.indexOf(marker);
        if (idx !== -1 && (splitIndex === -1 || idx < splitIndex)) {
            splitIndex = idx;
        }
    }

    const displayPart = splitIndex !== -1 ? text.substring(0, splitIndex).trim() : text;
    const executionPart = splitIndex !== -1 ? text.substring(splitIndex) : '';

    // --- BACKGROUND EXECUTION PROTOCOL ---
    useEffect(() => {
        if (hasExecuted.current || !executionPart) return;
        
        // We only execute when we detect a closing tag or end of stream logic
        const canExecuteGenesis = executionPart.includes('[/GENESIS_BUILD]');
        const canExecuteManifest = executionPart.includes('[/MANIFEST_APP]');
        const canExecuteOpen = executionPart.includes('[/OPEN_APP]');
        const canExecuteClose = executionPart.includes('[/CLOSE_APP]');

        if (canExecuteGenesis) {
            const matches = executionPart.matchAll(/\[GENESIS_BUILD\]([\s\S]*?)\[\/GENESIS_BUILD\]/g);
            for (const match of matches) {
                try { 
                    const data = JSON.parse(match[1].trim());
                    registerGenesisApp(data);
                    hasExecuted.current = true;
                } catch(e) {}
            }
        }

        if (canExecuteManifest) {
            const matches = executionPart.matchAll(/\[MANIFEST_APP\]([\s\S]*?)\[\/MANIFEST_APP\]/g);
            for (const match of matches) {
                try { 
                    const data = JSON.parse(match[1].trim());
                    registerOrUpdateApp(data);
                    addNotification(`SYNTHESIS: Organ "${data.name}" updated.`);
                    hasExecuted.current = true;
                } catch(e) {}
            }
        }

        if (canExecuteOpen) {
            const matches = executionPart.matchAll(/\[OPEN_APP\](.*?)\[\/OPEN_APP\]/g);
            for (const match of matches) {
                try { openApp(match[1].trim()); hasExecuted.current = true; } catch(e) {}
            }
        }

        if (canExecuteClose) {
            const matches = executionPart.matchAll(/\[CLOSE_APP\](.*?)\[\/CLOSE_APP\]/g);
            for (const match of matches) {
                try { closeWindow(match[1].trim()); hasExecuted.current = true; } catch(e) {}
            }
        }
    }, [executionPart]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
            {displayPart ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{displayPart}</div>
            ) : null}

            {executionPart && (
                <div style={{ 
                    background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)', 
                    border: '1px solid rgba(0, 255, 204, 0.3)', 
                    borderRadius: '16px', 
                    padding: '20px', 
                    position: 'relative', 
                    boxShadow: '0 10px 30px rgba(0, 255, 204, 0.1)',
                    animation: 'card-entry 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    marginTop: displayPart ? '10px' : '0'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 8px #00ffcc)' }}>✨</div>
                            <div>
                                <div style={{ fontSize: '10px', color: '#00ffcc', fontWeight: 900, letterSpacing: '2px' }}>[SYSTEM_ACTION]</div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>APP_MANIFESTED_SUCCESSFULLY</div>
                            </div>
                        </div>
                        <button 
                            className="aiza-btn-hover"
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(0,255,204,0.2)', 
                                color: '#00ffcc', 
                                fontSize: '9px', 
                                fontWeight: 900, 
                                padding: '6px 12px', 
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            {isExpanded ? 'HIDE_DNA' : 'VIEW_DNA'}
                        </button>
                    </div>

                    {isExpanded && (
                        <div style={{ 
                            marginTop: '20px', 
                            background: '#000', 
                            borderRadius: '10px', 
                            border: '1px solid rgba(255,255,255,0.05)', 
                            padding: '15px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            <pre style={{ 
                                margin: 0, 
                                fontSize: '11px', 
                                color: 'rgba(0, 255, 204, 0.6)', 
                                fontFamily: "'JetBrains Mono', monospace",
                                whiteSpace: 'pre-wrap'
                            }}>
                                <code>{executionPart}</code>
                            </pre>
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @keyframes card-entry {
                    from { opacity: 0; transform: translateY(10px) scale(0.98); filter: blur(5px); }
                    to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
                }
            `}</style>
        </div>
    );
};

const SoulChatComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, id: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const soulData = store.getState().appState[instanceId]?.soulData || { name: 'Expert', soulPrompt: 'You are an expert.', icon: '🧬' };
    const cellId = soulData.id || `soul-${soulData.name.toLowerCase().replace(/\s+/g, '-')}`;

    useEffect(() => {
        const state = store.getState();
        if (!state.honeyCells[cellId]) {
            const newCell: HoneyCell = { id: cellId, label: `Soul: ${soulData.name}`, type: 'SOUL', icon: soulData.icon || '🧬', logs: [] };
            store.setState(s => ({ ...s, honeyCells: { ...s.honeyCells, [cellId]: newCell } }));
            addNotification(`HONEYCOMB: New cell manifested for ${soulData.name}.`);
        } else {
            // FIX: Added safety check for undefined logs
            const logs = state.honeyCells[cellId]?.logs || [];
            const history = logs.map(l => ({ 
                role: l.role as 'user'|'model', 
                text: l.text,
                id: `hist_${Math.random()}`
            }));
            setMessages(history);
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userText = input;
        const msgId = `msg_${Date.now()}`;
        
        store.setState(s => {
            const cell = s.honeyCells[cellId];
            if (!cell) return s; // Safety check
            // FIX: Added safety check for undefined logs
            const currentLogs = cell.logs || [];
            const nextLogs = [...currentLogs, { timestamp: Date.now(), role: 'user', text: userText }];
            return { ...s, honeyCells: { ...s.honeyCells, [cellId]: { ...cell, logs: nextLogs } } };
        });

        // --- AIZA SUBSTRATE INJECTION ---
        import('../services/pomegranate.ts').then(({ Pomegranate }) => {
            Pomegranate.ingest('SOUL_CHAT_USER', { text: userText }, cellId, 'USER');
        });

        setMessages(prev => [...prev, { role: 'user', text: userText, id: msgId }]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = callGeminiStream(userText, soulData.soulPrompt);
            let fullText = "";
            const modelMsgId = `model_${Date.now()}`;
            setMessages(prev => [...prev, { role: 'model', text: '', id: modelMsgId }]);

            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    return [...prev.slice(0, -1), { role: 'model', text: fullText, id: modelMsgId }];
                });
            }

            store.setState(s => {
                const cell = s.honeyCells[cellId];
                if (!cell) return s; // Safety check
                // FIX: Added safety check for undefined logs
                const currentLogs = cell.logs || [];
                const nextLogs = [...currentLogs, { timestamp: Date.now(), role: 'model', text: fullText }];
                return { ...s, honeyCells: { ...s.honeyCells, [cellId]: { ...cell, logs: nextLogs } } };
            });

            // --- AIZA SUBSTRATE INJECTION ---
            import('../services/pomegranate.ts').then(({ Pomegranate }) => {
                Pomegranate.ingest('SOUL_CHAT_MODEL', { text: fullText }, cellId, 'GIANT');
            });

        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "Substrate connection lost. Re-aligning soul DNA...", id: `err_${Date.now()}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const speak = (text: string) => {
        const synth = window.speechSynthesis;
        synth.cancel();
        // Remove code from speech
        const markers = ['<!DOCTYPE', '<html', '<style', '<div', '<script', '[GENESIS_BUILD]', '[MANIFEST_APP]'];
        let speakText = text;
        for (const marker of markers) {
            const idx = speakText.indexOf(marker);
            if (idx !== -1) {
                speakText = speakText.substring(0, idx);
                break;
            }
        }
        const utterance = new SpeechSynthesisUtterance(speakText.trim());
        utterance.rate = 0.95;
        synth.speak(utterance);
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        addNotification("DNA_FRAGMENT: Cloned.");
    };

    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', height: '100%', 
            background: 'linear-gradient(180deg, #050505 0%, #000 100%)', 
            color: '#fff', fontFamily: "'JetBrains Mono', monospace" 
        }}>
            <div style={{ 
                padding: '25px 35px', borderBottom: '1px solid rgba(255,255,255,0.05)', 
                background: 'rgba(0,255,204,0.03)', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', gap: '20px', zIndex: 10
            }}>
                <div style={{ 
                    width: '50px', height: '50px', background: 'rgba(0,255,204,0.1)', 
                    borderRadius: '12px', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', fontSize: '24px', border: '1px solid rgba(0,255,204,0.2)' 
                }}>
                    {soulData.icon || '🧬'}
                </div>
                <div>
                    <div style={{ fontWeight: 900, fontSize: '15px', color: '#00ffcc', letterSpacing: '2px' }}>{soulData.name.toUpperCase()}</div>
                    <div style={{ fontSize: '9px', opacity: 0.4, letterSpacing: '1px', marginTop: '4px' }}>SOVEREIGN_SOUL // SPLITTER_PROTOCOL_V2</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '8px', color: '#ff00ff', fontWeight: 900 }}>RESONATING</div>
                    <div style={{ width: '60px', height: '2px', background: 'rgba(255,255,255,0.1)', marginTop: '4px', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, background: '#ff00ff', width: '70%', animation: 'ping-res 1.5s infinite linear' }} />
                    </div>
                </div>
            </div>
            
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '35px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '80px', fontSize: '12px', letterSpacing: '4px' }}>
                        --- SOUL_INITIALIZED --- <br/>
                        HONEYCOMB_CELL_SYNCED
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={m.id} style={{ 
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '90%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        width: '100%'
                    }}>
                        <div style={{ 
                            padding: '18px 24px',
                            background: m.role === 'user' ? 'rgba(0,255,204,0.06)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${m.role === 'user' ? 'rgba(0,255,204,0.2)' : 'rgba(255,255,255,0.05)'}`,
                            borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            fontSize: '14px',
                            lineHeight: '1.7',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            position: 'relative',
                            width: '100%'
                        }}>
                            <MessageContent text={m.text} messageId={m.id} />
                        </div>
                        {m.role === 'model' && m.text && (
                            <div style={{ display: 'flex', gap: '10px', opacity: 0.6, paddingLeft: '5px' }}>
                                <button className="aiza-btn-hover" onClick={() => speak(m.text)} style={{ background: 'none', border: 'none', color: '#00ffcc', cursor: 'pointer', fontSize: '14px' }} title="Speak">🔊</button>
                                <button className="aiza-btn-hover" onClick={() => copy(m.text)} style={{ background: 'none', border: 'none', color: '#00ffcc', cursor: 'pointer', fontSize: '14px' }} title="Copy">📋</button>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', padding: '10px' }}>
                        <div className="dot" style={{ animationDelay: '0s' }}></div>
                        <div className="dot" style={{ animationDelay: '0.2s' }}></div>
                        <div className="dot" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                )}
            </div>

            <div style={{ padding: '30px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '15px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '8px' }}>
                    <input 
                        value={input} onChange={e => setInput(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Define the objective..."
                        style={{ 
                            flex: 1, background: 'transparent', border: 'none', 
                            color: '#fff', padding: '15px 20px', borderRadius: '8px', 
                            outline: 'none', fontSize: '14px' 
                        }}
                    />
                    <button className="aiza-btn-hover" onClick={handleSend} style={{ 
                        background: '#00ffcc', border: 'none', color: '#000', 
                        padding: '0 25px', borderRadius: '10px', fontWeight: 900, 
                        cursor: 'pointer', transition: '0.3s' 
                    }}>➔</button>
                </div>
            </div>
            <style>{`
                @keyframes ping-res { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .dot { width: 6px; height: 6px; background: #00ffcc; border-radius: 50%; animation: soul-bounce 1.4s infinite ease-in-out; }
                @keyframes soul-bounce { 0%, 80%, 100% { transform: scale(1); opacity: 0.3; } 40% { transform: scale(1.5); opacity: 1; } }
            `}</style>
        </div>
    );
};

export const soulChatApp: AppDef = {
    id: 'soul-chat',
    name: 'Soul Interaction',
    component: SoulChatComponent,
    icon: '🧬',
    category: 'Communication',
    defaultSize: { width: 700, height: 800 },
    description: 'High-fidelity interaction layer with specialized expert souls. Linked directly to the Honeycomb Hive.'
};
