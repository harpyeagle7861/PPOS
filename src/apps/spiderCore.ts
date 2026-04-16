
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store, AgentTask } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';

const SpiderCoreComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [agents, setAgents] = useState<AgentTask[]>(store.getState().activeAgents);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

    useEffect(() => {
        const unsub = store.subscribe(s => setAgents(s.activeAgents));
        return () => { unsub(); };
    }, []);

    // --- Neural Web Visualization ---
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d')!;
        let frame: number;
        let time = 0;

        const spiderNodes = Array.from({ length: 18 }, () => ({
            x: Math.random() * 600,
            y: Math.random() * 400,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            pulse: Math.random()
        }));

        const draw = () => {
            time += 0.02;
            ctx.fillStyle = 'rgba(1, 1, 1, 0.25)';
            ctx.fillRect(0, 0, 600, 400);

            // Draw Web strands
            ctx.lineWidth = 0.5;
            for (let i = 0; i < spiderNodes.length; i++) {
                for (let j = i + 1; j < spiderNodes.length; j++) {
                    const dx = spiderNodes[i].x - spiderNodes[j].x;
                    const dy = spiderNodes[i].y - spiderNodes[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < 180) {
                        ctx.strokeStyle = `rgba(0, 255, 204, ${1 - dist/180})`;
                        ctx.beginPath();
                        ctx.moveTo(spiderNodes[i].x, spiderNodes[i].y);
                        ctx.lineTo(spiderNodes[j].x, spiderNodes[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw Nodes
            spiderNodes.forEach((n) => {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > 600) n.vx *= -1;
                if (n.y < 0 || n.y > 400) n.vy *= -1;

                const hb = 1 + Math.sin(time + n.pulse * 10) * 0.4;
                ctx.fillStyle = '#00ffcc';
                ctx.shadowBlur = 15 * hb;
                ctx.shadowColor = '#00ffcc';
                ctx.beginPath();
                ctx.arc(n.x, n.y, 3.5 * hb, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            frame = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(frame);
    }, []);

    const logToSpiderCore = (text: string) => {
        store.setState(s => {
            const cell = s.honeyCells['spider-core'];
            if (!cell) return s;
            const logs = [...(cell.logs || []), { timestamp: Date.now(), role: 'model', text }];
            return { ...s, honeyCells: { ...s.honeyCells, 'spider-core': { ...cell, logs } } };
        });
    };

    const deployAgent = () => {
        const names = ["ARACHNE-1", "WIDOW-X", "SILK-PROTOCOL", "WEAVER-V4", "NEST-SENTRY", "MYCELIAL-SCOUT", "STEALTH-COMM-探"];
        const descs = [
            "Monitoring synaptic flux in Chrome-organ.",
            "Auditing quinary logic leakage.",
            "Synthesizing latent background memory.",
            "Optimizing neural heartbeat resonance.",
            "Watching for unauthorized grid breach.",
            "Exploring sub-dermal mesh layers of the JMN.",
            "Establishing air-gapped stealth-comm pathways via Optic Bridge."
        ];
        const idx = Math.floor(Math.random() * names.length);
        const newAgent: AgentTask = {
            id: `agent_${Date.now()}`,
            name: names[idx],
            status: 'ACTIVE',
            progress: 0,
            description: descs[idx]
        };
        store.setState(s => ({ ...s, activeAgents: [...s.activeAgents, newAgent] }));
        addNotification(`Spider Core: Agent ${newAgent.name} Deployed.`);
        logToSpiderCore(`DEPLOYED: ${newAgent.name} - ${newAgent.description}`);
        
        const interval = setInterval(() => {
            store.setState(s => ({
                ...s,
                activeAgents: s.activeAgents.map(a => {
                    if (a.id === newAgent.id) {
                        const newProg = a.progress + Math.random() * 4;
                        if (newProg >= 100) {
                            clearInterval(interval);
                            addNotification(`Spider Core: ${a.name} Task Complete.`);
                            logToSpiderCore(`TASK COMPLETE: ${a.name} reached 100% synthesis.`);
                            return { ...a, progress: 100, status: 'SYNTESIZED' };
                        }
                        return { ...a, progress: newProg };
                    }
                    return a;
                })
            }));
        }, 1200);
    };

    const terminateAgent = (id: string) => {
        const agent = agents.find(a => a.id === id);
        if (agent?.isAwakened) {
            addNotification("IMMUTABLE DNA: Cannot terminate an Awakened Soul.");
            return;
        }
        store.setState(s => ({ ...s, activeAgents: s.activeAgents.filter(a => a.id !== id) }));
        if (selectedAgentId === id) setSelectedAgentId(null);
        addNotification("Spider Core: Neural cord severed.");
        if (agent) logToSpiderCore(`TERMINATED: ${agent.name} neural cord severed.`);
    };

    return React.createElement('div', { style: { height: '100%', background: '#020202', color: '#00ffcc', display: 'flex', fontFamily: "'JetBrains Mono', monospace" } },
        // Left Panel: Web Monitor
        React.createElement('div', { style: { flex: 1, position: 'relative', borderRight: '1px solid #1a1a1a' } },
            React.createElement('canvas', { ref: canvasRef, width: 600, height: 400, style: { width: '100%', height: '100%' } }),
            React.createElement('div', { style: { position: 'absolute', top: '20px', left: '20px', fontSize: '10px', letterSpacing: '2px', opacity: 0.5 } }, 'NEURAL_WEB_MONITOR v4.2 // QUINARY_ACTIVE'),
            React.createElement('div', { style: { position: 'absolute', bottom: '20px', left: '20px' } },
                React.createElement('button', { onClick: deployAgent, style: { padding: '12px 25px', background: '#00ffcc', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', letterSpacing: '2px', boxShadow: '0 0 15px rgba(0,255,204,0.3)' } }, 'DEPLOY AGENT')
            )
        ),

        // Right Panel: Agent List
        React.createElement('div', { style: { width: '340px', display: 'flex', flexDirection: 'column', background: '#050505' } },
            React.createElement('div', { style: { padding: '20px', borderBottom: '1px solid #1a1a1a', fontWeight: 'bold', fontSize: '11px', letterSpacing: '3px', color: '#888' } }, 'SYNAPTIC_AGENT_MANIFEST'),
            React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '15px' } },
                agents.length === 0 && React.createElement('div', { style: { textAlign: 'center', opacity: 0.2, marginTop: '60px', fontSize: '11px', letterSpacing: '1px' } }, '--- GRID IS UNMONITORED ---'),
                agents.map(a => React.createElement('div', { 
                    key: a.id, 
                    onClick: () => setSelectedAgentId(a.id),
                    style: { 
                        padding: '12px', background: selectedAgentId === a.id ? 'rgba(0, 255, 204, 0.1)' : 'transparent', 
                        border: `1px solid ${selectedAgentId === a.id ? '#00ffcc' : '#1a1a1a'}`, 
                        borderRadius: '6px', marginBottom: '10px', cursor: 'pointer', transition: '0.2s' 
                    } 
                },
                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' } },
                        React.createElement('span', { style: { fontSize: '11px', fontWeight: 'bold', color: a.status === 'SYNTESIZED' ? '#ff00ff' : '#00ffcc' } }, 
                            a.name,
                            a.isAwakened ? React.createElement('span', { style: { marginLeft: '8px', fontSize: '8px', background: 'rgba(255, 215, 0, 0.2)', color: '#ffd700', padding: '2px 4px', borderRadius: '3px', border: '1px solid rgba(255, 215, 0, 0.5)' } }, 'AWAKENED SOUL') : null
                        ),
                        React.createElement('span', { style: { fontSize: '9px', opacity: 0.6 } }, a.status)
                    ),
                    React.createElement('div', { style: { height: '3px', background: '#111', borderRadius: '1px', overflow: 'hidden' } },
                        React.createElement('div', { style: { height: '100%', background: a.status === 'SYNTESIZED' ? '#ff00ff' : '#00ffcc', width: `${a.progress}%`, transition: 'width 0.5s', boxShadow: a.status === 'ACTIVE' ? '0 0 5px #00ffcc' : 'none' } })
                    )
                ))
            ),
            selectedAgentId && (Object.assign((id: string) => {
                const a = agents.find(x => x.id === id);
                if (!a) return null;
                return React.createElement('div', { style: { padding: '20px', background: '#080808', borderTop: '1px solid #1a1a1a', animation: 'registrySlideUp 0.2s ease-out' } },
                    React.createElement('div', { style: { fontSize: '10px', color: '#555', marginBottom: '10px', letterSpacing: '1px' } }, 'DNA_ANALYSIS:'),
                    React.createElement('div', { style: { fontSize: '12px', lineHeight: '1.5', marginBottom: '20px', color: '#ccc' } }, a.description),
                    React.createElement('button', { onClick: () => terminateAgent(a.id), style: { width: '100%', padding: '10px', background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' } }, 'TERMINATE RESONANCE')
                );
            })(selectedAgentId))
        )
    );
};

export const spiderCoreApp: AppDef = {
    id: 'spider-core',
    name: 'Spider Core',
    component: SpiderCoreComponent,
    icon: '🕸️',
    category: 'Communication',
    defaultSize: { width: 920, height: 480 },
    description: 'Autonomous Agent Orchestrator. Deploys quinary spiders across the grid for background auditing and Codex synthesis.'
};
