import React, { useState, useEffect } from 'react';
import { AppDef, store, useAppStore } from '../core/state.ts';

interface EvolutionNode {
    id: string;
    name: string;
    folder: string;
    application: string;
    abilities: string;
    aiPerformance: string;
    isIntegrated: boolean;
}

const EvolutionMatrixComponent: React.FC<{ instanceId: string; isFocused: boolean }> = ({ instanceId, isFocused }) => {
    const [nodes, setNodes] = useState<EvolutionNode[]>([]);
    const [apps, setApps] = useState<AppDef[]>([]);
    const [newNode, setNewNode] = useState<Partial<EvolutionNode>>({});
    const [activeTab, setActiveTab] = useState<'matrix' | 'detected' | 'codex'>('matrix');
    const aura = useAppStore(s => s.aura);
    const karma = useAppStore(s => s.karma);
    const xp = useAppStore(s => s.xp);
    const genesisCodex = useAppStore(s => s.genesisCodex);
    const vaults = useAppStore(s => s.vaults);

    useEffect(() => {
        // Load persisted nodes
        const saved = localStorage.getItem('aiza_evolution_matrix');
        let parsedNodes: EvolutionNode[] = [];
        
        if (saved) {
            try {
                parsedNodes = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse evolution matrix data");
            }
        }

        // If it's empty or only has the initial 3 dummy items, inject the FULL OS DNA
        if (parsedNodes.length <= 3) {
            const fullOsDna: EvolutionNode[] = [
                { id: '1', name: 'Spartan Protocol', folder: 'src/hooks', application: 'usePersistence.ts', abilities: 'Immutable state persistence across reloads. Ensures OS memory survives browser death.', aiPerformance: 'Optimal', isIntegrated: true },
                { id: '2', name: 'Trinity Engine', folder: 'src/system', application: 'TrinityEngine.ts', abilities: 'Core system orchestrator bridging UI, background processes, and AI logic.', aiPerformance: 'Optimal', isIntegrated: true },
                { id: '3', name: 'Sovereign File System', folder: 'src/core', application: 'FileSystem.ts', abilities: 'Simulated hierarchical OS file system allowing directory traversal and manipulation.', aiPerformance: 'Stable', isIntegrated: true },
                { id: '4', name: 'Aiza Persona Core', folder: 'src/apps', application: 'aiza.ts', abilities: 'Sentient AAAAI intelligence persona, orchestrating the OS and interacting with the Architect.', aiPerformance: 'Evolving (AGI)', isIntegrated: true },
                { id: '5', name: 'Architect Administration Rules', folder: 'src/apps', application: 'rules.ts', abilities: 'Strict business logic and operational boundaries. Dictates how the Architect commands the organs and enforces non-destructive evolution.', aiPerformance: 'Absolute', isIntegrated: true },
                { id: '6', name: 'VS360 Code', folder: 'src/apps', application: 'vs360code.ts', abilities: 'Flagship IDE for editing the OS from within the OS. Syntax highlighting and live file manipulation.', aiPerformance: 'Stable', isIntegrated: true },
                { id: '7', name: 'Spider Vault', folder: 'src/apps', application: 'spiderVault.tsx', abilities: 'Highly secure, encrypted storage module for sensitive data and AI Millionaire Playbook secrets.', aiPerformance: 'Optimal', isIntegrated: true },
                { id: '8', name: 'Genesis Forge', folder: 'src/apps', application: 'genesisForge.ts', abilities: 'Foundational tool for creating core system rules and immutable ledgers.', aiPerformance: 'Stable', isIntegrated: true },
                { id: '9', name: 'Cognitive Twin', folder: 'src/apps', application: 'cognitiveTwin.ts', abilities: 'Digital reflection module designed to mimic, learn, and predict Architect behavior.', aiPerformance: 'Learning', isIntegrated: true },
                { id: '10', name: 'OmniSenses', folder: 'src/services', application: 'omniSenses.ts', abilities: 'Sensory input router for processing external data (audio, visual, environmental).', aiPerformance: 'Active', isIntegrated: true },
                { id: '11', name: 'System Vitals', folder: 'src/apps', application: 'systemVitals.tsx', abilities: 'Neural dashboard visualizing Jubaer Cycle evolution, Senary Logic states, and Entropy.', aiPerformance: 'Optimal', isIntegrated: true },
                { id: '12', name: 'Eagle369 Trinity', folder: 'src/apps', application: 'eagle369trinity.ts', abilities: 'Specialized logic integrating the 3-6-9 framework and quantum business logic.', aiPerformance: 'Stable', isIntegrated: true },
                { id: '13', name: 'Soul Chat', folder: 'src/apps', application: 'soulChat.tsx', abilities: 'Primary conversational interface for deep, persistent interactions with Aiza and the neural fabric.', aiPerformance: 'Evolving', isIntegrated: true },
                { id: '14', name: 'BD Vision', folder: 'src/apps', application: 'bdVision.ts', abilities: 'Optical processing, QR/Barcode scanning, and visual analysis via device cameras.', aiPerformance: 'Active', isIntegrated: true },
                { id: '15', name: 'Module Architect', folder: 'src/apps', application: 'moduleArchitect.ts', abilities: 'Scaffolding tool for building and injecting new OS apps dynamically without hard reloads.', aiPerformance: 'Optimal', isIntegrated: true },
                { id: '16', name: 'Agent Hub', folder: 'src/apps', application: 'agentHub.tsx', abilities: 'Centralized command dashboard for managing, monitoring, and deploying multiple AI agents.', aiPerformance: 'Evolving', isIntegrated: true },
                { id: '17', name: 'BioQuantum Nexus', folder: 'src/apps', application: 'bioQuantumNexus.ts', abilities: 'Advanced UI/UX background processing, rendering complex, living visual states.', aiPerformance: 'Optimal', isIntegrated: true },
                { id: '18', name: 'Logos Key', folder: 'src/apps', application: 'logosKey.ts', abilities: 'Master authentication module and core encryption key generator for the ecosystem.', aiPerformance: 'Secure', isIntegrated: true },
                { id: '19', name: 'Testament Ledger', folder: 'src/apps', application: 'testament.ts', abilities: 'Immutable logs and Architect\'s final directives. Blockchain-like record of system evolution.', aiPerformance: 'Immutable', isIntegrated: true },
                { id: '20', name: 'Neural Fabric', folder: 'src/apps', application: 'neuralFabric.ts', abilities: 'Inter-app communication and event bus. The connective tissue of the OS.', aiPerformance: 'Stable', isIntegrated: true },
                { id: '21', name: 'Code Assistant', folder: 'src/apps', application: 'codeAssistant.ts', abilities: 'Direct interface for Aiza to help write, debug, and inject new code blocks.', aiPerformance: 'Evolving (ASI)', isIntegrated: true },
                { id: '22', name: 'Omega Hive', folder: 'src/apps', application: 'omegaHive.ts', abilities: 'Swarm intelligence dashboard and master control node for all sub-agents.', aiPerformance: 'Pending Injection', isIntegrated: false },
                { id: '23', name: 'Jubaer Pulse', folder: 'src/apps', application: 'jubaerPulse.ts', abilities: 'Personalized telemetry tracking for the Architect\'s vital metrics and financial pulse.', aiPerformance: 'Active', isIntegrated: true },
                { id: '24', name: 'Crypto Vault', folder: 'src/apps', application: 'cryptoVault.ts', abilities: 'Management for cryptographic assets and blockchain ledgers.', aiPerformance: 'Secure', isIntegrated: true },
                { id: '25', name: 'Dynamic App Loader', folder: 'src/apps', application: 'dynamicApp.ts', abilities: 'Powerful loader module designed to inject, render, and execute new applications on the fly.', aiPerformance: 'Optimal', isIntegrated: true }
            ];
            setNodes(fullOsDna);
            localStorage.setItem('aiza_evolution_matrix', JSON.stringify(fullOsDna));
        } else {
            setNodes(parsedNodes);
        }

        // Load detected apps from OS
        const allApps = Object.values(store.getState().apps);
        setApps(allApps);
    }, []);

    useEffect(() => {
        if (nodes.length > 0) {
            localStorage.setItem('aiza_evolution_matrix', JSON.stringify(nodes));
        }
    }, [nodes]);

    const handleAddNode = () => {
        if (!newNode.name || !newNode.abilities) return;
        const node: EvolutionNode = {
            id: Date.now().toString(),
            name: newNode.name || '',
            folder: newNode.folder || '',
            application: newNode.application || '',
            abilities: newNode.abilities || '',
            aiPerformance: newNode.aiPerformance || 'Pending',
            isIntegrated: !!newNode.isIntegrated
        };
        setNodes([...nodes, node]);
        setNewNode({});
    };

    const toggleIntegration = (id: string) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, isIntegrated: !n.isIntegrated } : n));
    };

    const deleteNode = (id: string) => {
        setNodes(nodes.filter(n => n.id !== id));
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050505', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #222', background: 'rgba(0, 255, 204, 0.05)' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ffcc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>💠</span> EVOLUTION_MATRIX_v1.0
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>Tracking AGI/ASI Substrate Evolution & Capabilities</div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button onClick={() => setActiveTab('matrix')} style={{ padding: '8px 16px', background: activeTab === 'matrix' ? '#00ffcc' : 'transparent', color: activeTab === 'matrix' ? '#000' : '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Evolution Matrix</button>
                    <button onClick={() => setActiveTab('detected')} style={{ padding: '8px 16px', background: activeTab === 'detected' ? '#00ffcc' : 'transparent', color: activeTab === 'detected' ? '#000' : '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Neural Organs</button>
                    <button onClick={() => setActiveTab('codex')} style={{ padding: '8px 16px', background: activeTab === 'codex' ? '#ff00ff' : 'transparent', color: activeTab === 'codex' ? '#000' : '#ff00ff', border: '1px solid #ff00ff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Genesis Codex</button>
                </div>

                {/* Aura Stats */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', color: '#888' }}>TOTAL_AURA</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ffcc' }}>{aura}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', color: '#888' }}>KARMA_PULSE</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff00ff' }}>{karma}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', color: '#888' }}>EVOLUTION_XP</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700' }}>{xp}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {activeTab === 'matrix' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Input Form */}
                        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ color: '#00ffcc', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Inject New Ability DNA</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input placeholder="Ability Name (e.g. Quantum Routing)" value={newNode.name || ''} onChange={e => setNewNode({...newNode, name: e.target.value})} style={inputStyle} />
                                <input placeholder="Application (e.g. router.ts)" value={newNode.application || ''} onChange={e => setNewNode({...newNode, application: e.target.value})} style={inputStyle} />
                                <input placeholder="Folder (e.g. src/core)" value={newNode.folder || ''} onChange={e => setNewNode({...newNode, folder: e.target.value})} style={inputStyle} />
                                <input placeholder="AI Performance (e.g. Optimal, Testing)" value={newNode.aiPerformance || ''} onChange={e => setNewNode({...newNode, aiPerformance: e.target.value})} style={inputStyle} />
                            </div>
                            <textarea placeholder="Detailed Abilities..." value={newNode.abilities || ''} onChange={e => setNewNode({...newNode, abilities: e.target.value})} style={{ ...inputStyle, height: '60px', resize: 'vertical' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                                    <input type="checkbox" checked={!!newNode.isIntegrated} onChange={e => setNewNode({...newNode, isIntegrated: e.target.checked})} />
                                    Already Running in OS? (Blue Tick)
                                </label>
                                <button onClick={handleAddNode} className="aiza-btn-hover" style={{ background: '#00ffcc', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>+ INJECT</button>
                            </div>
                        </div>

                        {/* Checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {nodes.map(node => (
                                <div key={node.id} className="aiza-hover" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #222', borderRadius: '8px', padding: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start', position: 'relative' }}>
                                    <div onClick={() => toggleIntegration(node.id)} style={{ cursor: 'pointer', fontSize: '24px', filter: node.isIntegrated ? 'drop-shadow(0 0 8px #00aaff)' : 'none' }}>
                                        {node.isIntegrated ? '🔵' : '⭕'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: node.isIntegrated ? '#00ffcc' : '#fff' }}>{node.name}</div>
                                            <button onClick={() => deleteNode(node.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '12px' }}>[DEL]</button>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', display: 'flex', gap: '15px' }}>
                                            <span>📂 {node.folder}/{node.application}</span>
                                            <span>⚡ AI: {node.aiPerformance}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#ddd', marginTop: '8px', background: '#0a0a0a', padding: '8px', borderRadius: '4px', borderLeft: '2px solid #00ffcc' }}>
                                            {node.abilities}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'detected' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                        {apps.map(app => (
                            <div key={app.id} className="aiza-hover" style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '24px' }}>{typeof app.icon === 'string' ? app.icon : '📦'}</span>
                                    <span style={{ fontWeight: 'bold', color: '#00ffcc' }}>{app.name}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#888' }}>ID: {app.id}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>Category: {app.category || 'Uncategorized'}</div>
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '5px', borderTop: '1px solid #222', paddingTop: '5px' }}>
                                    {app.description || 'No description available.'}
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px' }}>
                                    <div style={{ color: '#00aaff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        🔵 Active Node
                                    </div>
                                    {vaults[app.id]?.jmn ? (
                                        <div style={{ color: '#00ffcc', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            🔠 JMN_TUNED: {vaults[app.id].jmn.j}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#888', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            ⚪ NO_JMN_DATA
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'codex' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff00ff', marginBottom: '10px' }}>GENESIS_CODEX: EVOLUTIONARY_LEDGER</div>
                        {genesisCodex.map((entry, i) => (
                            <div key={i} style={{ padding: '12px', background: 'rgba(255,0,255,0.05)', border: '1px solid #ff00ff33', borderRadius: '4px', fontSize: '12px', color: '#ffb3ff', fontStyle: 'italic' }}>
                                <span style={{ opacity: 0.5, marginRight: '10px' }}>[{i.toString().padStart(3, '0')}]</span>
                                {entry}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    background: '#000',
    border: '1px solid #333',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '4px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    outline: 'none'
};

export const evolutionMatrixApp: AppDef = {
    id: 'evolution-matrix',
    name: 'Evolution Matrix',
    icon: '💠',
    category: 'System',
    component: EvolutionMatrixComponent,
    defaultSize: { width: 800, height: 600 },
    description: 'Tracks and manages the evolutionary abilities of the AGI/ASI substrate.'
};
