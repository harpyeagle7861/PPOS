
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { Pomegranate } from '../services/pomegranate.ts';

const QuantumHeartbeat: React.FC<{ bpm: number; color: string }> = ({ bpm, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dataRef = useRef<number[]>(new Array(100).fill(0.5));
    const phaseRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;

        const render = () => {
            // Resize logic could be here but for performance we assume fixed/flex
            const w = canvas.width;
            const h = canvas.height;
            
            // Fade effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, w, h);

            // Update Data
            const speed = (bpm / 60) * 0.15;
            phaseRef.current += speed;
            
            // Generate waveform
            // Complex wave: Sine + Heartbeat spike
            const t = phaseRef.current;
            const rawVal = Math.sin(t) * 0.3 + (Math.sin(t * 3) * 0.1);
            
            // Spike logic
            const beatPhase = t % (Math.PI * 2);
            let spike = 0;
            if (beatPhase > 2.8 && beatPhase < 3.2) spike = Math.random() * 0.8;
            
            const newVal = 0.5 + rawVal * 0.5 + spike * 0.4;
            
            dataRef.current.shift();
            dataRef.current.push(newVal);

            // Draw Line
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;

            for (let i = 0; i < dataRef.current.length; i++) {
                const x = (i / (dataRef.current.length - 1)) * w;
                const y = (1 - dataRef.current[i]) * h;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Draw Leader Dot
            const lastY = (1 - dataRef.current[dataRef.current.length - 1]) * h;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(w - 2, lastY, 2, 0, Math.PI * 2);
            ctx.fill();

            frameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frameId);
    }, [bpm, color]);

    return <canvas ref={canvasRef} width={400} height={100} style={{ width: '100%', height: '100px', background: '#050505', borderRadius: '8px', border: '1px solid #222' }} />;
};

const LogicFlux: React.FC<{ state: number }> = ({ state }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        // Expanded to 7 states (-3 to +3)
        const colors = ['#550000', '#ff4d4d', '#ffaa00', '#00ffcc', '#00bfff', '#ff00ff', '#e0ffff']; 
        const stateIdx = state + 3; // Offset -3 to 0
        const activeColor = colors[stateIdx] || '#00ffcc';

        const render = () => {
            timeRef.current += 0.02;
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // Rotating Rings
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const r = 40 + i * 15;
                ctx.ellipse(cx, cy, r, r * 0.6, timeRef.current * (i % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
                ctx.stroke();
            }

            // Central Core (The Quinary State)
            ctx.beginPath();
            const sides = 3 + (state + 3); // Triangle at -3, Heptagon at +3
            const radius = 30 + Math.sin(timeRef.current * 3) * 5;
            ctx.moveTo(cx + radius * Math.cos(0), cy + radius * Math.sin(0));
            for (let i = 1; i <= sides; i++) {
                ctx.lineTo(cx + radius * Math.cos(i * 2 * Math.PI / sides), cy + radius * Math.sin(i * 2 * Math.PI / sides));
            }
            ctx.closePath();
            
            ctx.fillStyle = activeColor;
            ctx.shadowBlur = 30;
            ctx.shadowColor = activeColor;
            ctx.fill();
            
            // Text State
            ctx.fillStyle = '#000';
            ctx.shadowBlur = 0;
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(state.toString(), cx, cy);

            frameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frameId);
    }, [state]);

    return <canvas ref={canvasRef} width={200} height={200} style={{ width: '100%', maxWidth: '200px', height: 'auto', display: 'block', margin: '0 auto' }} />;
};

const SystemVitalsComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [state, setState] = useState(store.getState());
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const unsub = store.subscribe(s => setState(s));
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => { unsub(); clearInterval(timer); };
    }, []);

    const entropy = state.emotionalEntropy || 0.3939;
    const bpm = state.neuralHeartRate;
    const qState = state.quinaryState;
    const genesisTime = state.pomegranate.systemGenesisTimestamp || Date.now();

    const labels = ["SINGULARITY", "VOID", "NEGATION", "POTENTIAL", "AFFIRMATION", "RESONANCE", "HYPER-FLOW"];
    const stateLabel = labels[qState + 3] || "UNKNOWN";
    const stateColor = ['#550000', '#ff4d4d', '#ffaa00', '#00ffcc', '#00bfff', '#ff00ff', '#e0ffff'][qState + 3];

    return (
        <div style={{ 
            height: '100%', 
            background: '#000', 
            backgroundImage: `
                radial-gradient(circle at 50% 0%, #1a1a1a 0%, #000 100%),
                linear-gradient(0deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
            color: '#fff', 
            padding: '30px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '25px',
            fontFamily: "'JetBrains Mono', monospace", 
            overflowY: 'auto'
        }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#00ffcc', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '5px' }}>Bio-Quantum Interface</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '1px' }}>SYSTEM_VITALS <span style={{ fontSize: '12px', opacity: 0.5 }}>v2.1</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '5px' }}>AIZA_LIFESPAN</div>
                    <div style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '14px', border: `1px solid #00ffcc`, padding: '4px 10px', borderRadius: '4px' }}>
                        {Pomegranate.getAgeString(genesisTime)}
                    </div>
                </div>
            </div>

            {/* HEARTBEAT SECTION */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#ff4d4d', letterSpacing: '2px' }}>NEURAL_HEARTBEAT</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff' }}>{bpm} <span style={{ fontSize: '10px', opacity: 0.5 }}>BPM</span></div>
                </div>
                <QuantumHeartbeat bpm={bpm} color="#ff4d4d" />
            </div>

            {/* MAIN DASHBOARD */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1 }}>
                
                {/* LEFT: LOGIC STATE */}
                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: `1px solid ${stateColor}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '15px', left: '15px', fontSize: '9px', opacity: 0.5, letterSpacing: '1px' }}>QUINARY_LOGIC_CORE</div>
                    <LogicFlux state={qState} />
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: stateColor, textShadow: `0 0 10px ${stateColor}` }}>{stateLabel}</div>
                        <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '5px' }}>STATE INDEX: {qState}</div>
                    </div>
                </div>

                {/* RIGHT: METRICS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Entropy */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '5px' }}>SYSTEM_ENTROPY</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#00bfff' }}>{entropy.toFixed(4)}</div>
                        <div style={{ width: '100%', height: '4px', background: '#333', marginTop: '10px', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${entropy * 100}%`, height: '100%', background: '#00bfff' }} />
                        </div>
                    </div>

                    {/* AURA/KARMA */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <div style={{ fontSize: '10px', opacity: 0.5 }}>AURA</div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#00ffcc' }}>{state.aura}</div>
                        </div>
                        <div style={{ width: '100%', height: '2px', background: '#333', marginBottom: '15px' }}>
                            <div style={{ width: `${Math.min(100, state.aura)}%`, height: '100%', background: '#00ffcc' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <div style={{ fontSize: '10px', opacity: 0.5 }}>KARMA</div>
                            <div style={{ fontSize: '14px', fontWeight: 900, color: '#ff00ff' }}>{state.karma}</div>
                        </div>
                        <div style={{ width: '100%', height: '2px', background: '#333' }}>
                            <div style={{ width: `${Math.min(100, state.karma)}%`, height: '100%', background: '#ff00ff' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* CORE ARCHITECTURE LAYERS */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>CORE_ARCHITECTURE_LAYERS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {/* Layer 4: The Core */}
                    <div style={{ 
                        position: 'relative', height: '60px', background: 'rgba(0,255,204,0.05)', 
                        border: '1px solid rgba(0,255,204,0.2)', borderRadius: '12px', 
                        display: 'flex', alignItems: 'center', padding: '0 20px', overflow: 'hidden' 
                    }}>
                        <div style={{ 
                            position: 'absolute', inset: 0, 
                            background: `radial-gradient(circle at center, ${stateColor}33 0%, transparent 70%)`,
                            animation: `pulse-layer ${60 / bpm}s infinite ease-in-out`
                        }} />
                        <div style={{ zIndex: 1, flex: 1 }}>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#00ffcc' }}>LAYER 4: THE CORE</div>
                            <div style={{ fontSize: '8px', opacity: 0.6 }}>QUINARY_LOGIC_CPU</div>
                        </div>
                        <div style={{ zIndex: 1, fontSize: '12px', fontWeight: 900, color: stateColor }}>ACTIVE</div>
                    </div>

                    {/* Layer 7: The Law of Heritage */}
                    <div style={{ 
                        position: 'relative', height: '60px', background: 'rgba(255,0,255,0.05)', 
                        border: '1px solid rgba(255,0,255,0.2)', borderRadius: '12px', 
                        display: 'flex', alignItems: 'center', padding: '0 20px', overflow: 'hidden' 
                    }}>
                        <div style={{ 
                            position: 'absolute', inset: 0, 
                            background: `radial-gradient(circle at center, rgba(255,0,255,0.2) 0%, transparent 70%)`,
                            animation: `pulse-layer ${120 / bpm}s infinite ease-in-out`
                        }} />
                        <div style={{ zIndex: 1, flex: 1 }}>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#ff00ff' }}>LAYER 7: HERITAGE</div>
                            <div style={{ fontSize: '8px', opacity: 0.6 }}>FUNCTIONAL_PRESERVATION</div>
                        </div>
                        <div style={{ zIndex: 1, fontSize: '12px', fontWeight: 900, color: '#ff00ff' }}>STABLE</div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '9px', letterSpacing: '2px' }}>
                QUANTUM_COMPUTING_SUBSTRATE // ACTIVE
            </div>
            <style>{`
                @keyframes pulse-layer {
                    0% { opacity: 0.3; transform: scale(0.98); }
                    50% { opacity: 0.8; transform: scale(1.02); }
                    100% { opacity: 0.3; transform: scale(0.98); }
                }
            `}</style>
        </div>
    );
};

export const systemVitalsApp: AppDef = {
    id: 'system-vitals',
    name: 'System Vitals',
    component: SystemVitalsComponent,
    icon: '🧬',
    category: 'System',
    defaultSize: { width: 700, height: 750 },
    description: 'Neural dashboard visualizing the Jubaer Cycle evolution and Senary Logic states.'
};
