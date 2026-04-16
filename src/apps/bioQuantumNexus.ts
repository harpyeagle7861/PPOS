import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';

const PARTICLE_COUNT = 350;

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    hue: number;
}

const BioQuantumNexusComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [resonance, setResonance] = useState(0.65);
    const [entropy, setEntropy] = useState(0.15);
    const [interactionFlux, setInteractionFlux] = useState(0.5); 
    const [mode, setMode] = useState<'STABLE' | 'FLUX' | 'GENESIS'>('STABLE');
    const [entanglement, setEntanglement] = useState(true);
    
    const mousePos = useRef({ x: 0, y: 0, active: false });
    const particles = useRef<Particle[]>([]);
    const surgeRef = useRef(0);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false })!;
        let animationId: number;

        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', resize);
        resize();

        const createParticle = (): Particle => {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 100;
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            return {
                x: w / 2 + Math.cos(angle) * dist,
                y: h / 2 + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0,
                maxLife: 150 + Math.random() * 250,
                color: '#00ffcc',
                hue: Math.random() * 360
            };
        };

        particles.current = Array.from({ length: PARTICLE_COUNT }, createParticle);

        const render = () => {
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            const centerX = width / 2;
            const centerY = height / 2;
            const time = Date.now() / 1000;

            // Fading Trails with dynamic persistence based on resonance
            ctx.fillStyle = `rgba(1, 3, 2, ${0.07 + (1 - resonance) * 0.08})`;
            ctx.fillRect(0, 0, width, height);

            surgeRef.current *= 0.97;

            const pArray = particles.current;
            
            // DRAW ENTANGLEMENT
            if (entanglement && resonance > 0.3) {
                ctx.beginPath();
                ctx.lineWidth = 0.5 * resonance;
                for (let i = 0; i < pArray.length; i += 8) {
                    for (let j = i + 1; j < pArray.length; j += 12) {
                        const p1 = pArray[i];
                        const p2 = pArray[j];
                        const dx = p1.x - p2.x;
                        const dy = p1.y - p2.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < 4500 * resonance) {
                            ctx.strokeStyle = `hsla(${p1.hue}, 80%, 50%, ${0.1 * resonance})`;
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                        }
                    }
                }
                ctx.stroke();
            }

            for (let i = 0; i < pArray.length; i++) {
                const p = pArray[i];
                
                if (mousePos.current.active) {
                    const dx = mousePos.current.x - p.x;
                    const dy = mousePos.current.y - p.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 90000) {
                        const force = (interactionFlux - 0.5) * 6;
                        const pull = (force * 300) / (distSq + 500);
                        p.vx += dx * pull * resonance;
                        p.vy += dy * pull * resonance;
                    }
                }

                // Central Gravity Well
                const cdx = centerX - p.x;
                const cdy = centerY - p.y;
                const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
                p.vx += (cdx / 1200) * resonance;
                p.vy += (cdy / 1200) * resonance;

                // Physics Update
                p.vx += (Math.random() - 0.5) * entropy * 3;
                p.vy += (Math.random() - 0.5) * entropy * 3;
                p.x += p.vx * (1 + surgeRef.current * 8);
                p.y += p.vy * (1 + surgeRef.current * 8);
                p.vx *= 0.985;
                p.vy *= 0.985;

                // Boundary Wrapping
                if (p.x < 0) p.x = width; else if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height; else if (p.y > height) p.y = 0;

                // LIFE-BASED RENDERING (Glow & Thickness)
                p.life += 0.4 + entropy * 3;
                const ageRatio = p.life / p.maxLife;
                const intensity = Math.sin(ageRatio * Math.PI); 
                const distRatio = Math.min(1, cDist / 500);
                p.hue = (time * 15 + distRatio * 240) % 360;

                const particleSize = (1 + intensity * 4) * (1 + surgeRef.current * 4);
                
                ctx.save();
                
                // Enhanced Outer Glow pass
                ctx.beginPath();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${intensity * 0.2 * resonance})`;
                ctx.arc(p.x, p.y, particleSize * 4, 0, Math.PI * 2);
                ctx.fill();

                // Core particle with bloom
                ctx.beginPath();
                ctx.globalCompositeOperation = 'source-over';
                ctx.shadowBlur = intensity * 24 * (1 + surgeRef.current * 3);
                ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${intensity * resonance})`;
                ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${intensity})`;
                ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();

                if (p.life > p.maxLife) {
                    pArray[i] = createParticle();
                }
            }

            // Central Pulsar Visualization
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(time * 0.2);
            for (let s = 0; s < 6; s++) {
                ctx.rotate((Math.PI * 2) / 6);
                ctx.strokeStyle = `hsla(${time * 40}, 100%, 50%, ${0.2 * resonance})`;
                ctx.lineWidth = 1 + surgeRef.current * 5;
                ctx.beginPath();
                const r = 100 + Math.sin(time * 2) * 30 * resonance;
                ctx.arc(r, 0, 5 + surgeRef.current * 40, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [resonance, entropy, interactionFlux, entanglement]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        mousePos.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            active: true
        };
    };

    const triggerSynthesis = () => {
        surgeRef.current = 1.0;
        setMode('GENESIS');
        addNotification("QUANTUM_COLLAPSE: Resonating at peak frequency.");
        setTimeout(() => setMode('STABLE'), 4000);
    };

    const applyPreset = (p: 'STABILITY' | 'CHAOS' | 'WELL' | 'SINGULARITY') => {
        switch(p) {
            case 'STABILITY':
                setResonance(0.25); setEntropy(0.02); setInteractionFlux(0.8); setEntanglement(true);
                break;
            case 'CHAOS':
                setResonance(0.95); setEntropy(0.85); setInteractionFlux(0.2); setEntanglement(false);
                break;
            case 'WELL':
                setResonance(0.5); setEntropy(0.08); setInteractionFlux(1.0); setEntanglement(true);
                break;
            case 'SINGULARITY':
                setResonance(1.0); setEntropy(0.01); setInteractionFlux(1.0); setEntanglement(true);
                triggerSynthesis();
                break;
        }
        addNotification(`DNA_RECONFIG: ${p} state engaged.`);
    };

    const exportState = () => {
        const data = {
            metadata: { version: "6.0", timestamp: Date.now(), config: { resonance, entropy, interactionFlux, mode } },
            particles: particles.current.map(p => ({
                pos: [p.x.toFixed(2), p.y.toFixed(2)],
                vel: [p.vx.toFixed(4), p.vy.toFixed(4)],
                life: p.life.toFixed(2),
                hue: p.hue.toFixed(0)
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus_dna_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addNotification("EXPORT_COMPLETE: Quantum state archived.");
    };

    const glassPanelStyle: React.CSSProperties = {
        position: 'absolute', bottom: '30px', right: '30px', width: '340px', 
        background: 'rgba(5, 5, 10, 0.75)', backdropFilter: 'blur(40px)', 
        border: '1px solid rgba(0, 255, 204, 0.25)', borderRadius: '24px', padding: '25px',
        display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 25px 70px rgba(0,0,0,0.85)',
        zIndex: 100
    };

    return React.createElement('div', { 
        style: { 
            position: 'relative', height: '100%', background: '#000', 
            overflow: 'hidden', fontFamily: "'JetBrains Mono', monospace",
            color: '#fff'
        },
        onMouseMove: handleMouseMove,
        onMouseLeave: () => { mousePos.current.active = false; }
    },
        React.createElement('canvas', { ref: canvasRef, style: { width: '100%', height: '100%', display: 'block' } }),
        
        // Animated HUD Overlay
        React.createElement('div', { style: { position: 'absolute', top: '30px', left: '30px', pointerEvents: 'none' } },
            React.createElement('div', { className: 'hud-breathe', style: { color: '#00ffcc', fontSize: '11px', letterSpacing: '6px', fontWeight: 900, textShadow: '0 0 15px #00ffcc' } }, 'BIO_QUANTUM_NEXUS // ALPHA_VI'),
            React.createElement('div', { className: 'hud-breathe-delayed', style: { color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' } }, mode === 'GENESIS' ? 'NEURAL_SINGULARITY' : 'QUANTUM_FIELD_STABLE'),
            React.createElement('div', { style: { height: '3px', width: '220px', background: 'rgba(255,255,255,0.08)', marginTop: '12px', overflow: 'hidden', borderRadius: '4px' } },
                React.createElement('div', { style: { height: '100%', width: `${resonance * 100}%`, background: 'linear-gradient(90deg, #00ffcc, #00ccff)', transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)' } })
            )
        ),

        // Interactive Hub
        React.createElement('div', { style: glassPanelStyle },
            // Preset Selectors
            React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                (['STABILITY', 'CHAOS', 'WELL', 'SINGULARITY'] as const).map(p => 
                    React.createElement('button', { 
                        key: p, onClick: () => applyPreset(p),
                        style: { flex: 1, padding: '6px 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, minWidth: '70px' }
                    }, p)
                )
            ),

            React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
                    React.createElement('span', { style: { fontSize: '10px', color: '#00ffcc', fontWeight: 900 } }, 'RESONANCE'),
                    React.createElement('span', { style: { fontSize: '10px', opacity: 0.5 } }, `${Math.round(resonance * 100)}%`)
                ),
                React.createElement('input', { 
                    type: 'range', min: 0, max: 1, step: 0.01, value: resonance, 
                    title: "Determines the velocity scaling and sensitivity of quantum fragments.",
                    onChange: e => setResonance(parseFloat(e.target.value)),
                    style: styles.slider('#00ffcc')
                })
            ),
            React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
                    React.createElement('span', { style: { fontSize: '10px', color: '#ff00ff', fontWeight: 900 } }, 'ENTROPY'),
                    React.createElement('span', { style: { fontSize: '10px', opacity: 0.5 } }, `${Math.round(entropy * 100)}%`)
                ),
                React.createElement('input', { 
                    type: 'range', min: 0, max: 1, step: 0.01, value: entropy, 
                    title: "Controls the stochastic noise and acceleration of the life-cycle entropy.",
                    onChange: e => setEntropy(parseFloat(e.target.value)),
                    style: styles.slider('#ff00ff')
                })
            ),
            React.createElement('div', null,
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } },
                    React.createElement('span', { style: { fontSize: '10px', color: '#00ccff', fontWeight: 900 } }, 'INTERACTION_FLUX'),
                    React.createElement('span', { style: { fontSize: '10px', opacity: 0.5 } }, interactionFlux > 0.5 ? 'GRAVITY' : 'REPULSION')
                ),
                React.createElement('input', { 
                    type: 'range', min: 0, max: 1, step: 0.01, value: interactionFlux, 
                    title: "Adjusts the polarity of mouse-to-particle attraction or repulsion.",
                    onChange: e => setInteractionFlux(parseFloat(e.target.value)),
                    style: styles.slider('#00ccff')
                })
            ),
            
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                React.createElement('button', { 
                    onClick: triggerSynthesis,
                    style: { flex: 3, padding: '16px', background: '#00ffcc', border: 'none', color: '#000', fontWeight: 900, borderRadius: '14px', cursor: 'pointer', fontSize: '11px', letterSpacing: '2px', transition: '0.3s', boxShadow: '0 8px 25px rgba(0,255,204,0.35)' } 
                }, 'INIT_GENESIS_PULSE'),
                React.createElement('button', { 
                    onClick: exportState,
                    title: "Export the current quantum field data to a JSON artifact.",
                    style: { flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 900, borderRadius: '14px', cursor: 'pointer', fontSize: '11px' } 
                }, '💾')
            )
        ),

        // Telemetry
        React.createElement('div', { style: { position: 'absolute', bottom: '30px', left: '40px', fontSize: '9px', color: 'rgba(0, 255, 204, 0.4)', lineHeight: '2.0', letterSpacing: '1px' } },
            React.createElement('div', null, `>> STABILITY_INDEX: ${(100 - entropy * 60).toFixed(2)}%`),
            React.createElement('div', null, `>> FRAGMENT_COUNT: ${PARTICLE_COUNT}`),
            React.createElement('div', null, `>> ENTANGLEMENT: ${entanglement ? 'ACTIVE' : 'DORMANT'}`),
            React.createElement('div', null, `>> RESONANCE_FREQ: ${(resonance * 432).toFixed(1)}Hz`)
        ),

        React.createElement('style', null, `
            input[type=range] { -webkit-appearance: none; background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; outline: none; width: 100%; }
            input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #fff; cursor: pointer; border: 2px solid currentColor; box-shadow: 0 0 15px rgba(0,0,0,0.5); transition: 0.2s; }
            input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
            
            @keyframes hudBreathe {
                0%, 100% { opacity: 1; transform: translateY(0); filter: drop-shadow(0 0 5px currentColor); }
                50% { opacity: 0.6; transform: translateY(-2px); filter: drop-shadow(0 0 15px currentColor); }
            }
            .hud-breathe { animation: hudBreathe 6s infinite ease-in-out; }
            .hud-breathe-delayed { animation: hudBreathe 6s infinite ease-in-out 1.5s; }
        `)
    );
};

const styles = {
    slider: (color: string) => ({ accentColor: color, color: color })
};

export const bioQuantumNexusApp: AppDef = {
    id: 'bio-quantum-nexus',
    name: 'BioQuantum Nexus',
    component: BioQuantumNexusComponent,
    icon: '🧬',
    category: 'Creative',
    defaultSize: { width: 1024, height: 768 },
    description: 'Autonomous high-fidelity biological simulator. Employs multi-layered quantum field visualization and real-time entropic synthesis.'
};
