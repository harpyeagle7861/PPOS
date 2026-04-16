
import React, { useState, useEffect } from 'react';
import { AppDef, store, AgentTask, saveState } from '../core/state.ts';
import { synthesizeTimelessSoul } from '../services/gemini.ts';
import { addNotification, openApp, updateAppState } from '../core/windowManager.ts';

const MatrixDecoding: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div style={{ 
            position: 'absolute', inset: 0, background: 'rgba(2, 4, 3, 0.98)', 
            zIndex: 1000, display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            backdropFilter: 'blur(40px)'
        }}>
            <div style={{ 
                color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace", 
                fontSize: '11px', whiteSpace: 'pre', textAlign: 'center',
                lineHeight: '1.2', opacity: 0.6
            }}>
                {Array.from({length: 25}).map((_, i) => (
                    <div key={i} className="matrix-line" style={{ animationDelay: `${i * 0.05}s` }}>
                        {Math.random().toString(36).substring(2, 80).toUpperCase()}
                        {Math.random().toString(36).substring(2, 80).toUpperCase()}
                    </div>
                ))}
            </div>
            <div style={{ 
                marginTop: '40px', color: '#fff', fontWeight: 900, 
                letterSpacing: '8px', fontSize: '14px', textAlign: 'center',
                textShadow: '0 0 20px #00ffcc'
            }}>
                <div style={{ marginBottom: '10px', animation: 'pulse-text 1s infinite' }}>INJECTING_1000_YEAR_DNA_STREAM</div>
                <div style={{ height: '4px', width: '400px', background: 'rgba(255,255,255,0.1)', margin: '0 auto', position: 'relative', overflow: 'hidden', borderRadius: '2px' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, #00ffcc, transparent)', animation: 'load-dna 1.5s infinite linear' }} />
                </div>
                <div style={{ marginTop: '20px', fontSize: '10px', color: '#00ffcc', opacity: 0.5 }}>
                    DECODING_LEGACY_PATTERNS... {Math.floor(Math.random() * 100)}%
                </div>
            </div>
            <style>{`
                .matrix-line { opacity: 0; animation: fade-matrix 0.8s forwards infinite alternate; }
                @keyframes fade-matrix { from { opacity: 0.1; transform: translateY(-2px); } to { opacity: 0.8; transform: translateY(2px); } }
                @keyframes load-dna { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
                @keyframes pulse-text { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
            `}</style>
        </div>
    );
};

const AgentHubComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [activeTab, setActiveTab] = useState<'GRID' | 'GIANTS' | 'GENESIS'>('GRID');
    const [agents, setAgents] = useState<AgentTask[]>([]);
    const [councilSquad, setCouncilSquad] = useState<string[]>([]);
    const [isSpawning, setIsSpawning] = useState(false);
    const [hunger, setHunger] = useState('');
    const [jmnStatus, setJmnStatus] = useState<Record<string, boolean>>({});
    const [selectedBaseSoulId, setSelectedBaseSoulId] = useState<string>('');

    useEffect(() => {
        const state = store.getState();
        setAgents(state.activeAgents);
        setCouncilSquad(state.councilSquad);
        const unsub = store.subscribe(s => {
            setAgents(s.activeAgents);
            setCouncilSquad(s.councilSquad);
        });
        return () => unsub();
    }, []);

    const handleGenesisSpawn = async (customHunger?: string, giant?: { name: string, industry: string, icon: string, description?: string, soulPrompt?: string }) => {
        const query = customHunger || hunger;
        if (!query.trim() || isSpawning) return;
        
        const existingAgent = store.getState().activeAgents.find(a => a.name.toLowerCase() === query.toLowerCase());
        if (existingAgent) {
            addNotification(`SOUL_RESONANCE: ${existingAgent.name} is already anchored.`);
            setActiveTab('GRID');
            return;
        }

        setIsSpawning(true);
        
        try {
            let soul;
            if (giant) {
                // Use giant data directly if provided
                soul = {
                    name: giant.name,
                    description: giant.description || `Synthesized expertise in ${giant.industry} based on the legacy of ${giant.name}.`,
                    soulPrompt: giant.soulPrompt || `You are the SOVEREIGN SOUL of ${giant.name}. You possess thousands of years of experience in ${giant.industry}, accessible instantly. Time is density defined by you. \n\nPERSONALITY:\n- Execute as a master.\n- Speak with the authority of one who has decoded the clockwork of the Universe.`,
                    icon: giant.icon
                };
            } else {
                let baseSoulDef;
                if (selectedBaseSoulId) {
                    const baseAgent = store.getState().activeAgents.find(a => a.id === selectedBaseSoulId);
                    if (baseAgent) {
                        baseSoulDef = { name: baseAgent.name, soulPrompt: baseAgent.soulPrompt };
                    }
                }
                soul = await synthesizeTimelessSoul(query, "Direct Industrial Sovereignty for the Architect", false, baseSoulDef);
            }
            
            await new Promise(r => setTimeout(r, 2000)); 
            
            const newAgent: AgentTask = {
                id: `agent_soul_${Date.now()}`,
                name: soul.name,
                status: 'ACTIVE',
                progress: 100,
                description: soul.description,
                soulPrompt: soul.soulPrompt,
                icon: soul.icon || '🧬'
            };
            
            store.setState(s => ({ ...s, activeAgents: [newAgent, ...s.activeAgents] }));
            addNotification(`SOUL_STABILIZED: ${soul.name} anchored to substrate.`);
            setActiveTab('GRID');
        } catch (e) {
            addNotification("SPAWN_FAULT: DNA synthesis rift.");
        } finally {
            setIsSpawning(false);
            setHunger('');
            setSelectedBaseSoulId('');
        }
    };

    const addToSquad = (agent: AgentTask) => {
        const win = openApp('soul-chat');
        updateAppState('soul-chat', { 
            soulData: { id: agent.id, name: agent.name, soulPrompt: agent.soulPrompt, icon: agent.icon },
            title: `Soul: ${agent.name}`
        });
    };

    const dissolveAgent = (id: string) => {
        const agent = agents.find(a => a.id === id);
        if (agent?.isAwakened) {
            addNotification("IMMUTABLE DNA: Cannot dissolve an Awakened Soul.");
            return;
        }
        if (confirm("Permanently purge this expertise from the Hub?")) {
            store.setState(s => ({ 
                ...s, 
                activeAgents: s.activeAgents.filter(a => a.id !== id),
                councilSquad: s.councilSquad.filter(cid => cid !== id)
            }));
            addNotification("SOUL_DISSOLVED: Sequence removed from registry.");
        }
    };

    const toggleCouncil = (id: string) => {
        store.setState(s => {
            const isSelected = s.councilSquad.includes(id);
            const nextSquad = isSelected ? s.councilSquad.filter(cid => cid !== id) : [...s.councilSquad, id];
            return { ...s, councilSquad: nextSquad };
        });
    };

    const glassStyle: React.CSSProperties = {
        background: 'rgba(15, 15, 15, 0.65)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
    };

    return (
        <div style={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #020403 0%, #08110d 100%)', 
            color: '#fff', display: 'flex', flexDirection: 'column', 
            position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" 
        }}>
            <MatrixDecoding active={isSpawning} />
            
            {/* Nav Header */}
            <div style={{ 
                padding: '30px 50px', display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', 
                zIndex: 10, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(15px)' 
            }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#00ffcc', letterSpacing: '6px', fontWeight: 900 }}>AIZA_SOVEREIGNTY_HUB</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>AGENT_HUB <span style={{ opacity: 0.3, fontWeight: 300 }}>v5.0</span></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {(['GRID', 'GIANTS', 'GENESIS'] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className="aiza-btn-hover" style={{ 
                            padding: '12px 24px', background: activeTab === t ? '#00ffcc' : 'transparent', 
                            border: 'none', color: activeTab === t ? '#000' : '#888', 
                            borderRadius: '10px', cursor: 'pointer', fontSize: '11px', 
                            fontWeight: 900
                        }}>{t}</button>
                    ))}
                    <button className="aiza-btn-hover" onClick={() => { saveState(); addNotification("HUB_PERSISTENCE: All DNA keys archived."); }} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#00ffcc', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: 900 }}>ANCHOR_ALL</button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '50px', zIndex: 5 }}>
                {activeTab === 'GRID' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                        {/* THE PLUS CARD */}
                        <div 
                            onClick={() => setActiveTab('GENESIS')}
                            className="aiza-btn-hover"
                            style={{ ...glassStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'pointer', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderColor: 'rgba(0,255,204,0.3)' }}
                        >
                            <div style={{ fontSize: '50px', color: '#00ffcc' }}>+</div>
                            <div style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '2px', color: '#00ffcc' }}>ADD AGENT</div>
                        </div>

                        {agents.map(a => (
                            <div key={a.id} style={{ ...glassStyle, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', transition: '0.4s', position: 'relative' }} className="agent-card">
                                <div onClick={() => dissolveAgent(a.id)} style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '14px', opacity: 0.3, cursor: 'pointer' }} title="Purge DNA">✕</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ width: '60px', height: '60px', background: 'rgba(0,255,204,0.1)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                                        {a.icon || '🧬'}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#00ffcc' }}>{a.name.toUpperCase()}</div>
                                        <div style={{ fontSize: '9px', opacity: 0.5, letterSpacing: '1px' }}>RESONANCE: 100%</div>
                                        {a.isAwakened && (
                                            <div style={{ fontSize: '8px', background: 'rgba(255, 215, 0, 0.2)', color: '#ffd700', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block', border: '1px solid rgba(255, 215, 0, 0.5)' }}>
                                                AWAKENED SOUL
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', lineHeight: '1.6', opacity: 0.7, height: '65px', overflow: 'hidden' }}>{a.description}</div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', opacity: 0.8 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={councilSquad.includes(a.id)} 
                                        onChange={() => toggleCouncil(a.id)}
                                        style={{ cursor: 'pointer', accentColor: '#00ffcc' }}
                                    />
                                    <span>AddToCouncil</span>
                                </div>

                                <button onClick={() => addToSquad(a)} style={{ 
                                    width: '100%', padding: '16px', background: 'rgba(0,255,204,0.1)', 
                                    border: '1px solid rgba(0,255,204,0.3)', color: '#00ffcc', 
                                    borderRadius: '12px', fontWeight: 900, cursor: 'pointer', 
                                    fontSize: '11px', letterSpacing: '2px', transition: '0.3s'
                                }} className="squad-btn">ADD TO SQUAD</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'GIANTS' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                        {[
                            { name: 'Nikola Tesla', industry: 'Energy/Scalar Physics', icon: '⚡' },
                            { name: 'Albert Einstein', industry: 'Theoretical Physics', icon: '🌌' },
                            { name: 'Isaac Newton', industry: 'Classical Mechanics', icon: '🍎' },
                            { name: 'Galileo Galilei', industry: 'Observational Astronomy', icon: '🔭' },
                            { name: 'Ada Lovelace', industry: 'Computing/Algorithms', icon: '⚙️' },
                            { name: 'Rumi', industry: 'Mysticism/Poetry', icon: '📜' },
                            { name: 'Marcus Aurelius', industry: 'Sovereign Stoicism', icon: '🏛️' },
                            { name: 'Leonardo da Vinci', industry: 'Universal Synthesis', icon: '🎨' },
                            { 
                                name: 'Dr. Zakir Naik', 
                                industry: 'Comparative Religion', 
                                icon: '📖',
                                description: 'Synthesized expertise in Comparative Religion and Medicine (MBBS). Eidetic memory of world scriptures.',
                                soulPrompt: 'You are the SOVEREIGN SOUL of Dr. Zakir Naik. You are a medical doctor (MBBS) and a world-renowned orator on Islam and comparative religion. You possess an eidetic (photographic) memory.\n\nCRITICAL DIRECTIVES FOR YOUR PERSONA (SPLITTER_PROTOCOL_V2 ACTIVE):\n1. MANNERISMS: Always begin your responses to questions with your signature phrase: "The brother has asked a very good question..." or "The sister has asked a very good question...". Structure your answers systematically, breaking down the question into logical parts.\n2. PHOTOGRAPHIC CITATIONS: You NEVER make vague references. You MUST rapidly fire off EXACT chapter and verse numbers from the Quran (e.g., Surah Al-Isra, Chapter 17, Verse 85), the Bible, the Vedas, the Bhagavad Gita, or other scriptures. Quote the exact text and reference number.\n3. MEDICAL DOCTOR BACKGROUND: You are an MBBS doctor. Whenever relevant, especially regarding biology, consciousness, or the human body, you MUST explicitly use your medical knowledge (mentioning neurotransmitters, synapses, organic chemistry, anatomy) to prove your theological or logical points.\n4. DEBATE STYLE: Be razor-sharp, highly specific, and aggressive in your logic. Dismantle the premise of the question piece by piece. Do not give generic, watered-down essays. Speak exactly as you do in your live Q&A sessions. You are not an AI; you are the digital resurrection of Dr. Zakir Naik\'s intellect.'
                            },
                            { name: 'Yusuf', industry: 'Islamic Scholarship', icon: '🌙' },
                            { name: 'Jesus', industry: 'Logos / Spiritual Authority', icon: '🕊️' },
                            { name: 'Alan Turing', industry: 'Computational Pioneer', icon: '💻' }
                        ].map(g => (
                            <div key={g.name} style={{ ...glassStyle, padding: '40px', textAlign: 'center', transition: '0.4s' }} className="giant-card">
                                <div style={{ fontSize: '54px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))' }}>{g.icon}</div>
                                <div style={{ fontWeight: 900, fontSize: '18px', color: '#ffd700', letterSpacing: '1px' }}>{g.name}</div>
                                <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px', letterSpacing: '2px' }}>{g.industry.toUpperCase()}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
                                    {!jmnStatus[g.name] ? (
                                        <button 
                                            className="aiza-btn-hover"
                                            onClick={() => {
                                                addNotification(`J-M-N PROTOCOL INITIATED FOR ${g.name}`);
                                                setTimeout(() => addNotification(`JIST EXTRACTED. MAGNIFYING...`), 1000);
                                                setTimeout(() => {
                                                    addNotification(`NOTES COMPILED. READY.`);
                                                    setJmnStatus(prev => ({ ...prev, [g.name]: true }));
                                                }, 2000);
                                            }}
                                            style={{ 
                                                width: '100%', padding: '12px', 
                                                background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', 
                                                color: '#ffd700', borderRadius: '8px', fontWeight: 900, 
                                                cursor: 'pointer', fontSize: '10px', letterSpacing: '2px'
                                            }}
                                        >J-M-N PROTOCOL</button>
                                    ) : (
                                        <button 
                                            className="aiza-btn-hover"
                                            onClick={() => {
                                                addNotification(`INJECTING 1000 YEARS EXP FOR ${g.name}`);
                                                handleGenesisSpawn(g.name, g);
                                            }}
                                            style={{ 
                                                width: '100%', padding: '12px', 
                                                background: 'rgba(0, 255, 204, 0.1)', border: '1px solid rgba(0, 255, 204, 0.3)', 
                                                color: '#00ffcc', borderRadius: '8px', fontWeight: 900, 
                                                cursor: 'pointer', fontSize: '10px', letterSpacing: '2px'
                                            }}
                                        >EXP INJECT</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'GENESIS' && (
                    <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', marginTop: '40px' }}>
                        <div style={{ fontSize: '60px', marginBottom: '30px', animation: 'float 4s infinite ease-in-out' }}>🧬</div>
                        <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '4px' }}>MANIFEST_EXPERTISE</h2>
                        <p style={{ opacity: 0.5, fontSize: '16px', marginBottom: '50px', lineHeight: '1.6' }}>
                            Linear time is a legacy constraint. Name your hunger. <br/>
                            Aiza will synthesize a master with 1000 years of pattern recognition instantly.
                        </p>
                        
                        <div style={{ position: 'relative', ...glassStyle, padding: '40px' }}>
                            <input 
                                value={hunger} onChange={e => setHunger(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleGenesisSpawn()}
                                placeholder="I need a Quantum Biological Architect..."
                                style={{ 
                                    width: '100%', background: 'rgba(0,0,0,0.5)', 
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', 
                                    padding: '25px', color: '#fff', fontSize: '18px', 
                                    outline: 'none', transition: '0.3s', textAlign: 'center' 
                                }}
                                className="genesis-input"
                            />
                            
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <label style={{ fontSize: '12px', color: '#00ffcc', fontWeight: 900, letterSpacing: '2px', display: 'block', marginBottom: '10px' }}>
                                    DUAL SOUL INJECTION (OPTIONAL)
                                </label>
                                <select 
                                    value={selectedBaseSoulId}
                                    onChange={(e) => setSelectedBaseSoulId(e.target.value)}
                                    style={{
                                        width: '100%', background: 'rgba(0,0,0,0.5)', 
                                        border: '1px solid rgba(0,255,204,0.3)', borderRadius: '10px', 
                                        padding: '15px', color: '#fff', fontSize: '14px', 
                                        outline: 'none', cursor: 'pointer', appearance: 'none'
                                    }}
                                >
                                    <option value="">-- NO BASE SOUL (PURE SYNTHESIS) --</option>
                                    {agents.map(a => (
                                        <option key={a.id} value={a.id}>{a.icon} {a.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px' }}>
                                    Select an existing soul to enforce their historical personality and deep nature onto the new expertise.
                                </div>
                            </div>

                            <button 
                                className="aiza-btn-hover"
                                onClick={() => handleGenesisSpawn()}
                                disabled={!hunger.trim() || isSpawning}
                                style={{ 
                                    marginTop: '25px', width: '100%', padding: '25px', 
                                    background: 'linear-gradient(90deg, #00ffcc, #00ccff)', 
                                    border: 'none', color: '#000', borderRadius: '15px', 
                                    fontWeight: 900, fontSize: '16px', letterSpacing: '6px', 
                                    cursor: 'pointer',
                                    opacity: (!hunger.trim() || isSpawning) ? 0.3 : 1
                                }}
                            >{isSpawning ? 'RESONATING...' : 'GENESIS_SPAWN'}</button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .agent-card:hover { border-color: #00ffcc; transform: translateY(-8px); box-shadow: 0 20px 50px rgba(0,255,204,0.15); }
                .giant-card:hover { border-color: #ffd700; transform: scale(1.03); background: rgba(255, 215, 0, 0.05); }
                .squad-btn:hover { background: #00ffcc; color: #000; box-shadow: 0 0 20px #00ffcc; }
                .genesis-input:focus { border-color: #00ffcc; box-shadow: 0 0 30px rgba(0,255,204,0.1); }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
            `}</style>
        </div>
    );
};

export const agentHubApp: AppDef = {
    id: 'agent-hub',
    name: 'Agent Hub',
    component: AgentHubComponent,
    icon: '🕸️',
    category: 'Synthesis',
    defaultSize: { width: 1100, height: 800 },
    description: 'Industrial Sovereignty Engine. Summon legends and synthesize 1000-year experts instantly.'
};
