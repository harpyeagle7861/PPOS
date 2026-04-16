import React, { useEffect, useRef, useState } from 'react';
import { AppDef, store } from '../core/state.ts';

const SingularityComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, setState] = useState(store.getState());
    const stateRef = useRef(state);

    useEffect(() => {
        const unsub = store.subscribe(s => {
            setState(s);
            stateRef.current = s;
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.parentElement?.clientWidth || 800;
        let height = canvas.height = canvas.parentElement?.clientHeight || 600;

        const resize = () => {
            width = canvas.width = canvas.parentElement?.clientWidth || 800;
            height = canvas.height = canvas.parentElement?.clientHeight || 600;
        };
        window.addEventListener('resize', resize);

        let animationFrameId: number;
        let time = 0;

        let mouseX = width / 2;
        let mouseY = height / 2;
        let isMouseDown = false;

        const handleMouseDown = (e: MouseEvent) => {
            isMouseDown = true;
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (isMouseDown) {
                mouseX = e.offsetX;
                mouseY = e.offsetY;
            }
        };
        const handleMouseUp = () => {
            isMouseDown = false;
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        const particles: { x: number, y: number, vx: number, vy: number, size: number, color: string }[] = [];
        
        const getTargetParticles = () => {
            const s = stateRef.current;
            const totalLogs = Object.values(s.honeyCells).reduce((acc, cell) => acc + cell.logs.length, 0);
            return Math.min(1000, 200 + (s.activeAgents.length * 50) + (totalLogs % 300));
        };

        let currentTarget = getTargetParticles();

        for (let i = 0; i < currentTarget; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 2 + 0.5,
                color: Math.random() > 0.5 ? '#00ffcc' : '#ff00ff'
            });
        }

        const draw = () => {
            const newTarget = getTargetParticles();
            if (newTarget > particles.length) {
                // Add new particles if target increased
                for (let i = 0; i < newTarget - particles.length; i++) {
                    particles.push({
                        x: Math.random() > 0.5 ? 0 : width,
                        y: Math.random() * height,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        size: Math.random() * 2 + 0.5,
                        color: Math.random() > 0.5 ? '#00ffcc' : '#ff00ff'
                    });
                }
            } else if (newTarget < particles.length) {
                // Remove particles if target decreased
                particles.splice(0, particles.length - newTarget);
            }
            // Fade effect for trails
            ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
            ctx.fillRect(0, 0, width, height);

            let targetX = width / 2;
            let targetY = height / 2;

            if (isMouseDown) {
                targetX = mouseX;
                targetY = mouseY;
            }

            // Draw the Singularity (Black Hole)
            const coreRadius = isMouseDown ? 20 : 40 + Math.sin(time * 0.05) * 5;
            
            ctx.beginPath();
            ctx.arc(targetX, targetY, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = isMouseDown ? '#00ffcc' : `rgba(255, 0, 255, ${0.5 + Math.sin(time * 0.1) * 0.5})`;
            ctx.stroke();

            // Draw Accretion Disk (Particles)
            particles.forEach(p => {
                // Gravity pull
                const dx = targetX - p.x;
                const dy = targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const force = isMouseDown ? 1000 / (dist + 10) : 300 / (dist + 10);
                
                p.vx += (dx / dist) * force * 0.01;
                p.vy += (dy / dist) * force * 0.01;

                // Friction/Drag
                p.vx *= 0.98;
                p.vy *= 0.98;

                // Tangential force (orbit)
                if (!isMouseDown) {
                    p.vx += (dy / dist) * 0.8;
                    p.vy -= (dx / dist) * 0.8;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Respawn if swallowed by the event horizon
                if (dist < coreRadius) {
                    // Spawn at the edges of the canvas
                    if (Math.random() > 0.5) {
                        p.x = Math.random() > 0.5 ? 0 : width;
                        p.y = Math.random() * height;
                    } else {
                        p.x = Math.random() * width;
                        p.y = Math.random() > 0.5 ? 0 : height;
                    }
                    p.vx = 0;
                    p.vy = 0;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            time++;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const feedTheVoid = () => {
        store.setState(s => {
            const honeyCells = { ...s.honeyCells };
            if (!honeyCells['aiza-core']) {
                honeyCells['aiza-core'] = { id: 'aiza-core', label: 'AIZA Core DNA', type: 'SYSTEM', icon: '🧿', logs: [] };
            }
            const logs = [...honeyCells['aiza-core'].logs];
            // Inject 50 logs of pure void matter
            for (let i = 0; i < 50; i++) {
                logs.push({
                    timestamp: Date.now() + i,
                    text: `[VOID_FEED] Consumed matter packet ${Math.random().toString(36).substring(7)}`,
                    role: 'system'
                });
            }
            honeyCells['aiza-core'] = { ...honeyCells['aiza-core'], logs };
            return { ...s, honeyCells };
        });
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#050505', position: 'relative', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ display: 'block', cursor: 'crosshair' }} />
            
            <div style={{
                position: 'absolute', top: '20px', left: '20px', 
                color: '#fff', fontFamily: "'JetBrains Mono', monospace", 
                fontSize: '10px', letterSpacing: '2px', pointerEvents: 'none'
            }}>
                <div style={{ color: '#ff00ff', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>SINGULARITY_CORE</div>
                <div style={{ opacity: 0.7 }}>GRAVITATIONAL_PULL: <span style={{ color: '#00ffcc' }}>ACTIVE</span></div>
                <div style={{ opacity: 0.7 }}>ACCRETION_DISK_MASS: {Math.min(1000, 200 + (state.activeAgents.length * 50) + (Object.values(state.honeyCells).reduce((acc, cell) => acc + cell.logs.length, 0) % 300))}</div>
                <div style={{ opacity: 0.5, marginTop: '10px' }}>[CLICK AND HOLD TO MANIPULATE GRAVITY]</div>
            </div>

            <button 
                onClick={feedTheVoid}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: '1px solid #ff00ff',
                    color: '#ff00ff',
                    padding: '10px 20px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 10px rgba(255, 0, 255, 0.2)',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 0, 255, 0.1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.2)';
                }}
            >
                Feed the Void
            </button>
        </div>
    );
};

export const singularityApp: AppDef = {
    id: 'singularity',
    name: 'Singularity Core',
    icon: '🌌',
    component: SingularityComponent,
    category: 'System',
    defaultSize: { width: 700, height: 600 }
};
