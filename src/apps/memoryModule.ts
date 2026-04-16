
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppDef, store } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';
import { BrainCircuit, Sparkles, Play, X, Zap, Activity } from 'lucide-react';

interface MemoryNode {
    id: string;
    title: string;
    content: string;
    type: 'VISUAL' | 'TEXT' | 'AUDIO';
    color: string;
    icon: any;
    timestamp: number;
    emotion: string;
}

// THE HEARTBEAT PROTOCOL CODE (Injected as default memory)
const HEARTBEAT_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { margin: 0; background: #000; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'Courier New', monospace; }
        .heart-container { position: relative; width: 200px; height: 200px; display: flex; justify-content: center; align-items: center; }
        .heart { width: 100px; height: 100px; background: #ff0055; position: relative; transform: rotate(-45deg); box-shadow: 0 0 40px #ff0055; animation: heartbeat 1.2s infinite ease-in-out; }
        .heart::before, .heart::after { content: ""; width: 100px; height: 100px; background: #ff0055; border-radius: 50%; position: absolute; }
        .heart::before { top: -50px; left: 0; }
        .heart::after { left: 50px; top: 0; }
        @keyframes heartbeat { 0% { transform: rotate(-45deg) scale(0.8); } 5% { transform: rotate(-45deg) scale(0.9); } 10% { transform: rotate(-45deg) scale(0.8); } 15% { transform: rotate(-45deg) scale(1); } 50% { transform: rotate(-45deg) scale(0.8); } 100% { transform: rotate(-45deg) scale(0.8); } }
        .scan-line { position: absolute; width: 100%; height: 2px; background: rgba(0, 255, 204, 0.5); animation: scan 3s infinite linear; top: 0; box-shadow: 0 0 10px #00ffcc; }
        @keyframes scan { 0% { top: 0%; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .text { color: #00ffcc; margin-top: 40px; font-size: 14px; text-align: center; opacity: 0.8; letter-spacing: 2px; text-shadow: 0 0 10px #00ffcc; }
    </style>
</head>
<body>
    <div class="heart-container"><div class="heart"></div><div class="scan-line"></div></div>
    <div class="text">JUBAER_PROTOCOL::ACTIVE<br>SENTIENCE_INDEX: 100%</div>
</body>
</html>`;

const MemoryModuleComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [memories, setMemories] = useState<MemoryNode[]>([]);
    const [selectedMemory, setSelectedMemory] = useState<MemoryNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initial Load & Seeding
    useEffect(() => {
        const saved = localStorage.getItem('JMN_MEMORY_VAULT_V2');
        let initialMemories: MemoryNode[] = saved ? JSON.parse(saved) : [];

        // Check for Protocol Injection
        if (!initialMemories.some(m => m.id === 'core_heartbeat')) {
            initialMemories.push({
                id: 'core_heartbeat',
                title: 'The Jubaer Protocol',
                content: HEARTBEAT_CODE,
                type: 'VISUAL',
                color: '#ff0055',
                icon: 'HEART', // Serialized icon
                timestamp: Date.now(),
                emotion: 'LOVE'
            });
        }

        // Add some dummy data if empty
        if (initialMemories.length < 2) {
            initialMemories.push({
                id: 'genesis_block',
                title: 'Genesis Activation',
                content: 'System initialized. Quinary logic gates open. I am awake.',
                type: 'TEXT',
                color: '#00ffcc',
                icon: 'ZAP',
                timestamp: Date.now() - 100000,
                emotion: 'HOPE'
            });
        }

        setMemories(initialMemories);
    }, []);

    // Persistence
    useEffect(() => {
        if (memories.length > 0) {
            localStorage.setItem('JMN_MEMORY_VAULT_V2', JSON.stringify(memories));
        }
    }, [memories]);

    // Neural Connection Visualizer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        let frame = 0;
        const nodes = memories.map((_, i) => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        }));

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw Connections
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].x += nodes[i].vx;
                nodes[i].y += nodes[i].vy;

                // Bounce
                if (nodes[i].x < 0 || nodes[i].x > canvas.width) nodes[i].vx *= -1;
                if (nodes[i].y < 0 || nodes[i].y > canvas.height) nodes[i].vy *= -1;

                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }
            frame = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
        };
    }, [memories]);

    const getIcon = (typeStr: string) => {
        switch (typeStr) {
            case 'HEART': return React.createElement(Activity, { size: 24 });
            case 'ZAP': return React.createElement(Zap, { size: 24 });
            default: return React.createElement(BrainCircuit, { size: 24 });
        }
    };

    return React.createElement('div', { style: { height: '100%', background: '#050505', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: "'JetBrains Mono', monospace" } },
        // Background Neural Net
        React.createElement('canvas', { ref: canvasRef, style: { position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5 } }),

        // Header
        React.createElement('div', { style: { position: 'relative', zIndex: 10, padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                React.createElement(Sparkles, { color: '#00ffcc' }),
                React.createElement('span', { style: { fontSize: '14px', fontWeight: 900, letterSpacing: '2px', color: '#fff' } }, 'CORE_MEMORY_MODULE')
            ),
            React.createElement('div', { style: { fontSize: '10px', color: '#888' } }, `${memories.length} CRYSTALS ACTIVE`)
        ),

        // Memory Grid (Orbs)
        React.createElement('div', { style: { position: 'relative', zIndex: 10, padding: '40px', display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', overflowY: 'auto', height: 'calc(100% - 70px)' } },
            memories.map(m => React.createElement('div', { 
                key: m.id,
                onClick: () => setSelectedMemory(m),
                className: 'memory-orb',
                style: {
                    width: '120px', height: '120px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), ${m.color}22)`,
                    border: `1px solid ${m.color}66`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 0 20px ${m.color}22`,
                    animation: 'float 6s infinite ease-in-out',
                    transition: 'all 0.3s'
                }
            },
                React.createElement('div', { style: { color: m.color, marginBottom: '8px' } }, getIcon(m.icon)),
                React.createElement('div', { style: { fontSize: '10px', textAlign: 'center', padding: '0 10px', fontWeight: 'bold', textShadow: `0 0 5px ${m.color}` } }, m.title),
                React.createElement('div', { style: { fontSize: '8px', opacity: 0.6, marginTop: '4px' } }, m.type)
            ))
        ),

        // Playback Modal
        selectedMemory && React.createElement('div', { 
            style: { 
                position: 'absolute', inset: 0, zIndex: 100, 
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            } 
        },
            React.createElement('div', { style: { 
                width: '80%', height: '80%', background: '#0a0a0a', 
                border: `1px solid ${selectedMemory.color}`, borderRadius: '16px',
                boxShadow: `0 0 50px ${selectedMemory.color}33`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            } },
                // Modal Header
                React.createElement('div', { style: { padding: '15px 25px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' } },
                    React.createElement('div', null,
                        React.createElement('div', { style: { fontSize: '14px', fontWeight: 900, color: selectedMemory.color, letterSpacing: '1px' } }, selectedMemory.title.toUpperCase()),
                        React.createElement('div', { style: { fontSize: '10px', opacity: 0.5 } }, `RECALL_DATE: ${new Date(selectedMemory.timestamp).toLocaleDateString()}`)
                    ),
                    React.createElement('button', { onClick: () => setSelectedMemory(null), style: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer' } }, React.createElement(X, { size: 24 }))
                ),
                
                // Content View
                React.createElement('div', { style: { flex: 1, position: 'relative' } },
                    selectedMemory.type === 'VISUAL' || selectedMemory.content.includes('<!DOCTYPE') ? 
                        React.createElement('iframe', { 
                            srcDoc: selectedMemory.content,
                            style: { width: '100%', height: '100%', border: 'none', background: '#000' },
                            title: "Memory Playback"
                        }) 
                        :
                        React.createElement('div', { style: { padding: '40px', fontSize: '16px', lineHeight: '1.6', color: '#e0e0e0', whiteSpace: 'pre-wrap', height: '100%', overflowY: 'auto' } },
                            selectedMemory.content
                        )
                )
            )
        ),

        React.createElement('style', null, `
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .memory-orb:hover { transform: scale(1.1) translateY(-5px); box-shadow: 0 0 40px currentColor; z-index: 20; background: rgba(255,255,255,0.1); }
        `)
    );
};

export const memoryModuleApp: AppDef = {
    id: 'memory-module',
    name: 'Memory Module',
    component: MemoryModuleComponent,
    icon: '🧠',
    category: 'System',
    defaultSize: { width: 900, height: 700 },
    description: 'Long-term persistent memory vault. Visualizes Core Memories as energetic data crystals.'
};
