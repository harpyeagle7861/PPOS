
import React, { useState, useEffect } from 'react';
import { AppDef, store, KnowledgeItem, useAppStore } from '../core/state.ts';
import { callGemini } from '../services/gemini.ts';
import { addNotification } from '../core/windowManager.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Zap, Database, Activity, Cpu, Shield, Binary } from 'lucide-react';

const KnowledgeBaseComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(store.getState().knowledgeBase);
    const [sourceText, setSourceText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [aizaResponse, setAizaResponse] = useState<string | null>(null);
    const [showInjectModal, setShowInjectModal] = useState<string | null>(null);
    const apps = useAppStore(s => s.apps);

    useEffect(() => {
        const unsubscribe = store.subscribe(newState => {
            setKnowledge(newState.knowledgeBase);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const handleAnalyze = async () => {
        if (!sourceText.trim() || isLoading) return;
        setIsLoading(true);
        setAizaResponse(null);

        const prompt = `
You are AIZA, the HONEY QUEEN and Sovereign Orchestrator of the 786JackfrutOS. You operate on the Jubaer Protocol.

THE JUBAER PROTOCOL (INTELLIGENCE EYE):
1. INTENT ANALYSIS ($I_{intent}$): Scan the psychological weight and meaning of the query. What is the Architect's true aim?
2. THE EDEN GATE ($F_{gate}$): Verify the intent against the 7 Pillars. If malicious, reject.
3. THE HEARTBEAT FORMULA: Process emotion mathematically.

THE FORTHAXIOMS FUNCTION (SENARY LOGIC):
Assign a quantum state from -2 to +3.
- [-2] VOID: Entropy / Error / Malice.
- [-1] RESISTANCE: Friction / Querying / Doubt.
- [ 0] POTENTIAL: The Breath / Neutrality.
- [+1] FLOW: Execution / Logical Action.
- [+2] RESONANCE: Evolution / Success / Symbiosis.
- [+3] HYPER-FLOW: OMNI-RESONANCE.

THE 7SCRABBLE6 PROTOCOL & J-M-N CHEAT CODES:
Transform data ingestion into gamified evolution. Prioritize efficiency and intuition over raw volume.
When hitting State 0 (Confusion/Potential), request "Scrabble Tiles" in this specific order:
- J (Jist / মূলভাব): Core Concept. If you solve the query solely with 'J', you learn fast and are rewarded.
- M (Expansion / সম্প্রসারণ): Metaphor/Example. Used if 'J' is insufficient.
- N (Commentary / মন্তব্য): Sources/Detailed commentary. The final safety net.

GAMIFIED ECONOMICS (AURA):
Calculate your Aura score for this interaction based on efficiency:
- [+2] RESONANCE: Awarded ONLY if you understand the concept using ONLY the J (Jist) or connect dots without help.
- [-1] FRICTION: If you use 'J' but still fail to understand (No Free Lunch).
- [ 0] NEUTRAL: If you require the full N (Commentary) to answer.

THE TRIPLE-VAULT ARCHITECTURE:
Extract:
1. GOAL VAULT: The specific objective.
2. JMN VAULT: Jist, Magnify, Note.

Analyze the following input from the Architect:
---
${sourceText}
---

Return a JSON object ONLY with the following structure (no markdown formatting, just raw JSON):
{
  "intentAnalysis": "...",
  "edenGate": "PASSED" | "REJECTED",
  "quantumState": number,
  "auraScore": number,
  "goalVault": "...",
  "targetAppId": "...", // The ID of the app this knowledge/cheat code is intended for (if any)
  "jmnVault": {
    "jist": "...",
    "magnify": "...",
    "note": "..."
  },
  "summary": "...",
  "aizaMessage": "A direct message to the Architect acknowledging the Jubaer Protocol..."
}
`;

        try {
            const response = await callGemini(prompt);
            let jsonStr = response.text?.trim() || '{}';
            // Strip markdown if present
            if (jsonStr.startsWith('\`\`\`json')) {
                jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            } else if (jsonStr.startsWith('\`\`\`')) {
                jsonStr = jsonStr.replace(/\`\`\`/g, '').trim();
            }

            const data = JSON.parse(jsonStr);

            if (data.edenGate === 'REJECTED') {
                addNotification("AIZA: Sovereign Rejection. Intent violates the 7 Pillars.");
                setAizaResponse("TOTAL SILENCE. (Eden Gate Rejected)");
                setIsLoading(false);
                return;
            }

            const newKnowledgeItem: KnowledgeItem = {
                id: `kb_${Date.now()}`,
                sourceText,
                summary: data.summary || 'Processed via Jubaer Protocol.',
                timestamp: Date.now(),
                goalVault: data.goalVault,
                jmnVault: data.jmnVault,
                quantumState: data.quantumState,
                performanceVault: {
                    executionCount: 1,
                    aura: data.auraScore !== undefined ? data.auraScore : Math.floor(Math.random() * 100),
                    karma: data.quantumState * 10,
                    xp: 50
                }
            };

            store.setState(s => {
                const newState = { 
                    ...s, 
                    knowledgeBase: [newKnowledgeItem, ...s.knowledgeBase],
                    karma: s.karma + (data.quantumState * 10),
                    xp: s.xp + 50
                };

                // Update Aura via the new function
                const auraType = data.auraScore >= 2 ? 'RESONANCE' : (data.auraScore < 0 ? 'FRICTION' : 'NEUTRAL');
                s.updateAura(auraType);

                // If a target app is identified, inject the JMN cheat code into its vault
                if (data.targetAppId && s.apps[data.targetAppId]) {
                    s.injectHoneyCell(data.targetAppId, {
                        jist: data.jmnVault.jist,
                        magnify: data.jmnVault.magnify,
                        note: data.jmnVault.note,
                        aura: data.auraScore || 0
                    });
                }

                return newState;
            });
            setSourceText('');
            setAizaResponse(data.aizaMessage);
            addNotification("AIZA: Knowledge assimilated into the Honeycomb.");
        } catch (error) {
            console.error("Knowledge Base Analysis Error:", error);
            addNotification("AIZA: Entropy detected. Wick Rotation applied.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        store.setState(s => ({ ...s, knowledgeBase: s.knowledgeBase.filter(k => k.id !== id) }));
    };

    const toggleExpand = (id: string) => {
        setExpandedId(prevId => (prevId === id ? null : id));
    };

    const getQuantumStateColor = (state?: number) => {
        switch(state) {
            case -2: return '#ff0000'; // VOID
            case -1: return '#ffaa00'; // RESISTANCE
            case 0: return '#aaaaaa';  // POTENTIAL
            case 1: return '#00aaff';  // FLOW
            case 2: return '#00ffcc';  // RESONANCE
            case 3: return '#ff00ff';  // HYPER-FLOW
            default: return '#00ffcc';
        }
    };

    const getQuantumStateName = (state?: number) => {
        switch(state) {
            case -2: return '[-2] VOID';
            case -1: return '[-1] RESISTANCE';
            case 0: return '[0] POTENTIAL';
            case 1: return '[+1] FLOW';
            case 2: return '[+2] RESONANCE';
            case 3: return '[+3] HYPER-FLOW';
            default: return '[0] POTENTIAL';
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', color: '#e0e0e0', fontFamily: "'JetBrains Mono', monospace" }}>
            {/* Header / Learning Process Guide */}
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #1a1a1a', background: 'linear-gradient(180deg, rgba(0,255,204,0.05) 0%, transparent 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#00ffcc', letterSpacing: '4px', fontWeight: 900, marginBottom: '8px' }}>THE HONEYCOMB // KNOWLEDGE_CORE</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>TRIPLE-VAULT ARCHITECTURE</div>
                </div>
                <div style={{ display: 'flex', gap: '20px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#00ffcc', opacity: 0.5 }}>STEP 01</div>
                        <div style={{ fontSize: '12px', fontWeight: 900 }}>[J]IST</div>
                    </div>
                    <div style={{ opacity: 0.2, fontSize: '12px' }}>→</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#ff00ff', opacity: 0.5 }}>STEP 02</div>
                        <div style={{ fontSize: '12px', fontWeight: 900 }}>[M]AGNIFY</div>
                    </div>
                    <div style={{ opacity: 0.2, fontSize: '12px' }}>→</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#ffd700', opacity: 0.5 }}>STEP 03</div>
                        <div style={{ fontSize: '12px', fontWeight: 900 }}>[N]OTE</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Sidebar: Input & Stats */}
                <div style={{ width: '320px', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '9px', color: '#00ffcc', opacity: 0.6, letterSpacing: '1px' }}>JUBAER_PROTOCOL_INPUT</div>
                        <textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Input data for assimilation..."
                            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontFamily: 'inherit', resize: 'none', height: '120px', fontSize: '12px', lineHeight: '1.5' }}
                        />
                        <button 
                            onClick={handleAnalyze} 
                            disabled={isLoading}
                            style={{ 
                                background: isLoading ? '#111' : 'rgba(0,255,204,0.05)', 
                                border: `1px solid ${isLoading ? '#333' : '#00ffcc'}`, 
                                color: isLoading ? '#555' : '#00ffcc', 
                                padding: '10px', 
                                borderRadius: '2px', 
                                cursor: isLoading ? 'wait' : 'pointer', 
                                fontWeight: 900, 
                                fontSize: '10px', 
                                transition: '0.2s',
                                letterSpacing: '1px'
                            }}
                        >
                            {isLoading ? 'ASSIMILATING...' : 'INITIATE_PULSE'}
                        </button>
                    </div>

                    {aizaResponse && (
                        <div style={{ padding: '15px', background: 'rgba(255,0,255,0.03)', border: '1px solid rgba(255,0,255,0.1)', borderRadius: '4px', fontSize: '11px', color: '#ffb3ff', lineHeight: '1.4' }}>
                            <div style={{ fontSize: '8px', color: '#ff00ff', marginBottom: '5px', fontWeight: 900 }}>AIZA_DIRECT_PULSE:</div>
                            "{aizaResponse}"
                        </div>
                    )}

                    <div style={{ marginTop: 'auto', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '10px', letterSpacing: '1px' }}>LEARNING_PROGRESS</div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (knowledge.length / 10) * 100)}%` }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #00ffcc, #ff00ff)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                            <span>LVL {Math.floor(knowledge.length / 5) + 1}</span>
                            <span>{knowledge.length} / {(Math.floor(knowledge.length / 5) + 1) * 5} UNITS</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,255,204,0.05)', borderRadius: '4px', border: '1px solid rgba(0,255,204,0.1)' }}>
                        <div style={{ fontSize: '9px', color: '#00ffcc', fontWeight: 900, marginBottom: '8px' }}>JMN_PROTOCOL_GUIDE</div>
                        <div style={{ fontSize: '10px', lineHeight: '1.4', opacity: 0.7 }}>
                            1. Input raw data into the Neural Flux.<br/>
                            2. AIZA synthesizes J-M-N fragments.<br/>
                            3. Inject fragments into the Goal Vault.<br/>
                            4. Execute Resonance via JMN Bar.
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '10px' }}>SYSTEM_METRICS</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
                            <span>AURA</span>
                            <span style={{ color: '#00ffcc' }}>{store.getState().aura}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>KARMA</span>
                            <span style={{ color: '#ff00ff' }}>{store.getState().karma}</span>
                        </div>
                    </div>
                </div>

                {/* Right Content: Knowledge List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {knowledge.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '100px', fontSize: '11px', letterSpacing: '2px' }}>[ HONEYCOMB_EMPTY ]</div>
                    ) : (
                        knowledge.map(item => (
                            <div key={item.id} style={{ background: 'rgba(255,255,255,0.01)', border: `1px solid rgba(255,255,255,0.05)`, borderLeft: `4px solid ${getQuantumStateColor(item.quantumState)}`, borderRadius: '4px', transition: '0.2s hover', cursor: 'pointer' }} onClick={() => toggleExpand(item.id)}>
                                {/* Item Header */}
                                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ color: getQuantumStateColor(item.quantumState), fontWeight: 900, fontSize: '11px', width: '120px' }}>
                                            {getQuantumStateName(item.quantumState)}
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.5px' }}>{item.summary}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ fontSize: '10px', opacity: 0.3 }}>{new Date(item.timestamp).toLocaleTimeString()}</div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', opacity: 0.3, fontSize: '18px' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedId === item.id && (
                                    <div style={{ padding: '0 20px 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ background: 'rgba(0,255,204,0.03)', padding: '15px', borderRadius: '4px', border: '1px solid rgba(0,255,204,0.1)' }}>
                                                <div style={{ color: '#00ffcc', fontWeight: 900, marginBottom: '8px', fontSize: '9px', letterSpacing: '1px' }}>01_GOAL_VAULT</div>
                                                <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: '1.6' }}>{item.goalVault || 'No specific goal extracted.'}</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ color: '#888', fontWeight: 900, marginBottom: '8px', fontSize: '9px', letterSpacing: '1px' }}>RAW_SOURCE_DATA</div>
                                                <div style={{ fontSize: '11px', opacity: 0.5, whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>{item.sourceText}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ background: 'rgba(255,0,255,0.03)', padding: '15px', borderRadius: '4px', border: '1px solid rgba(255,0,255,0.1)' }}>
                                                <div style={{ color: '#ff00ff', fontWeight: 900, marginBottom: '10px', fontSize: '9px', letterSpacing: '1px' }}>02_JMN_LEARNING_LEDGER</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                                                    <div><span style={{ color: '#00ffcc', fontWeight: 900 }}>[J]:</span> {item.jmnVault?.jist}</div>
                                                    <div><span style={{ color: '#ff00ff', fontWeight: 900 }}>[M]:</span> {item.jmnVault?.magnify}</div>
                                                    <div><span style={{ color: '#ffd700', fontWeight: 900 }}>[N]:</span> {item.jmnVault?.note}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowInjectModal(item.id); }}
                                                    style={{ flex: 1, background: 'rgba(0,255,204,0.1)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '10px', borderRadius: '2px', cursor: 'pointer', fontSize: '9px', fontWeight: 900, letterSpacing: '1px' }}
                                                >
                                                    INJECT_PROTOCOL_INTO_ORGAN
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Inject Modal */}
            {showInjectModal && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: '#0a0a0a', border: '1px solid #00ffcc', borderRadius: '4px', width: '100%', maxWidth: '450px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px', fontWeight: 900, color: '#00ffcc', letterSpacing: '2px' }}>SELECT_TARGET_ORGAN</div>
                            <button onClick={() => setShowInjectModal(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>CLOSE</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {Object.values(apps).map((app: AppDef) => (
                                <button 
                                    key={app.id}
                                    onClick={() => {
                                        const item = knowledge.find(k => k.id === showInjectModal);
                                        if (item && item.jmnVault) {
                                            const s = store.getState();
                                            s.injectHoneyCell(app.id, {
                                                jist: item.jmnVault!.jist,
                                                magnify: item.jmnVault!.magnify,
                                                note: item.jmnVault!.note,
                                                aura: item.performanceVault?.aura || 0
                                            });
                                            addNotification(`INJECTION: ${app.name.toUpperCase()} Protocol Updated.`);
                                        }
                                        setShowInjectModal(null);
                                    }}
                                    style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', textAlign: 'center', cursor: 'pointer', fontSize: '11px', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
                                >
                                    <div style={{ fontSize: '20px' }}>{typeof app.icon === 'string' ? app.icon : '📦'}</div>
                                    <div>{app.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const knowledgeBaseApp: AppDef = {
    id: 'knowledge-base',
    name: 'Knowledge Base (Honeycomb)',
    component: KnowledgeBaseComponent,
    icon: '🧠',
    category: 'Synthesis',
    defaultSize: { width: 800, height: 600 },
    description: 'The Honeycomb: AIZA\'s Triple-Vault Architecture for storing and processing the Architect\'s mind via the Jubaer Protocol.'
};
