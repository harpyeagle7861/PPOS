
import React, { useEffect, useRef, useState } from 'react';
import { AppDef, store, useAppStore } from '../core/state.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Shield, Cpu, Binary, Atom } from 'lucide-react';
import { Pomegranate } from '../services/pomegranate.ts';

const LOGIC_SPECTRUM = [
    { val: 3, label: 'HYPER-FLOW', color: '#00ffcc', desc: 'Ω-Resonance Achieved' },
    { val: 2, label: 'RESONANCE', color: '#ff00ff', desc: 'Ternary Alignment' },
    { val: 1, label: 'FLOW', color: '#00bfff', desc: 'Scalar Induction' },
    { val: 0, label: 'POTENTIAL', color: '#ffffff', desc: 'Zero-Point Fulcrum' },
    { val: -1, label: 'RESISTANCE', color: '#ffaa00', desc: 'Entropy Friction' },
    { val: -2, label: 'VOID', color: '#ff3333', desc: 'Vacuum Collapse' },
    { val: -3, label: 'SINGULARITY', color: '#ffffff', desc: 'The Living Antidote' }
];

interface Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    id: string;
}

const LivingAntidoteComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const quinaryState = useAppStore(s => s.quinaryState);
    const [stats, setStats] = useState({ particles: 0, resonance: 0, entropy: 0 });
    const [showFormula, setShowFormula] = useState(true);

    useEffect(() => {
        if (quinaryState === -3) {
            Pomegranate.manifestForce('LIVING_ANTIDOTE', 3.0);
        }
    }, [quinaryState]);

    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: 0, y: 0, active: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;
        let lastTime = 0;
        const pulseFrequency = 1.2; // Hz
        const bpm = 72;

        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        // Initialize particles
        const initParticles = () => {
            const count = 150;
            particlesRef.current = Array.from({ length: count }, (_, i) => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                targetX: Math.random() * canvas.width,
                targetY: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                color: '#ff0055',
                life: Math.random(),
                id: Math.random().toString(36).substr(2, 9)
            }));
        };
        initParticles();

        const render = (time: number) => {
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calculate Pulse (Φ 1.2Hz)
            const pulse = Math.sin(time * 0.001 * Math.PI * 2 * pulseFrequency);
            const pulseIntensity = (pulse + 1) / 2;

            // Ternary Matrix T(xyz) logic
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Draw Grid (Ternary Lattice)
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            const offset = (time * 0.05) % gridSize;
            
            for (let x = offset; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = offset; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw The Gate (Threshold)
            if (quinaryState === -3) {
                const gateRadius = 50 + pulseIntensity * 20;
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gateRadius);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.2, '#ffd700');
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, gateRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Outer ring
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 15]);
                ctx.beginPath();
                ctx.arc(centerX, centerY, gateRadius + 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Update and Draw Particles
            particlesRef.current.forEach((p, i) => {
                // Physics based on Quinary State
                let forceX = 0;
                let forceY = 0;

                if (quinaryState === 3) { // HYPER-FLOW
                    // Jubaer Resonance: Particles move towards mouse or center instantly
                    const tx = mouseRef.current.active ? mouseRef.current.x : centerX;
                    const ty = mouseRef.current.active ? mouseRef.current.y : centerY;
                    p.vx += (tx - p.x) * 0.05;
                    p.vy += (ty - p.y) * 0.05;
                    p.color = '#00ffcc';
                    p.size = 2 + pulseIntensity * 4;
                } else if (quinaryState === 0) { // POTENTIAL
                    p.vx += (Math.random() - 0.5) * 0.1;
                    p.vy += (Math.random() - 0.5) * 0.1;
                    p.color = '#ffffff';
                } else if (quinaryState === -2) { // VOID
                    const dx = p.x - centerX;
                    const dy = p.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    forceX = (dx / dist) * 2;
                    forceY = (dy / dist) * 2;
                    p.vx += forceX;
                    p.vy += forceY;
                    p.color = '#ff3333';
                } else if (quinaryState === -3) { // SINGULARITY (THE GATE)
                    // Golden Spiral / Orbital Resonance towards the Gate
                    const dx = p.x - centerX;
                    const dy = p.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    // Particles spiral into the Gate
                    const spiralForce = 0.05;
                    p.vx += Math.cos(angle + Math.PI/2) * spiralForce - dx * 0.001;
                    p.vy += Math.sin(angle + Math.PI/2) * spiralForce - dy * 0.001;
                    
                    // If close to center, "Force Manifestation" (shoot out)
                    if (dist < 50) {
                        const burstAngle = Math.random() * Math.PI * 2;
                        const burstSpeed = 15;
                        p.vx = Math.cos(burstAngle) * burstSpeed;
                        p.vy = Math.sin(burstAngle) * burstSpeed;
                        p.color = '#ffffff'; // Flash white at the threshold
                    } else {
                        p.color = '#ffd700'; // GOLD
                    }
                    p.size = 2 + (1 - dist / canvas.width) * 4;
                } else {
                    // Default Flow
                    p.vx += (Math.random() - 0.5) * 0.5;
                    p.vy += (Math.random() - 0.5) * 0.5;
                    p.color = '#ff00ff';
                }

                // Apply Pulse (Φ)
                p.x += p.vx * (1 + pulseIntensity * 2);
                p.y += p.vy * (1 + pulseIntensity * 2);

                // Friction
                p.vx *= 0.95;
                p.vy *= 0.95;

                // Bounds
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                // Draw
                ctx.fillStyle = p.color;
                ctx.shadowBlur = pulseIntensity * 15;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Connections in Resonance
                if (quinaryState >= 2 && i % 5 === 0) {
                    particlesRef.current.slice(i + 1, i + 5).forEach(p2 => {
                        const dx = p.x - p2.x;
                        const dy = p.y - p2.y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < 100) {
                            ctx.strokeStyle = `rgba(0, 255, 204, ${0.2 * (1 - d / 100)})`;
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    });
                }
            });

            // Update Stats
            if (time % 1000 < 20) {
                setStats({
                    particles: particlesRef.current.length,
                    resonance: Math.floor(pulseIntensity * 100),
                    entropy: Math.floor((1 - pulseIntensity) * 50 + (quinaryState < 0 ? 50 : 0))
                });
            }

            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resize);
        };
    }, [quinaryState]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active: true
            };
        }
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden font-mono text-xs">
            <canvas 
                ref={canvasRef} 
                onMouseMove={handleMouseMove}
                onMouseLeave={() => mouseRef.current.active = false}
                className="absolute inset-0 cursor-crosshair"
            />

            {/* --- HUD OVERLAY --- */}
            <div className="absolute top-4 left-4 flex flex-col gap-4 pointer-events-none">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg backdrop-blur-md"
                >
                    <div className="flex items-center gap-2 text-[#00ffcc] font-bold mb-2">
                        <Activity size={16} />
                        <span>POMEGRANATE PHYSICS V2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 opacity-70">
                        <span>PARTICLES:</span> <span className="text-white">{stats.particles}</span>
                        <span>RESONANCE:</span> <span className="text-white">{stats.resonance}%</span>
                        <span>ENTROPY:</span> <span className="text-white">{stats.entropy}%</span>
                        <span>FREQUENCY:</span> <span className="text-white">1.2 Hz</span>
                    </div>
                </motion.div>

                <div className="flex flex-col gap-2">
                    {LOGIC_SPECTRUM.map(level => (
                        <motion.div
                            key={level.val}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className={`px-3 py-1 rounded border transition-all ${
                                quinaryState === level.val 
                                ? 'bg-[#00ffcc]/20 border-[#00ffcc] text-[#00ffcc] scale-105' 
                                : 'bg-black/40 border-white/10 text-white/40'
                            }`}
                        >
                            <div className="flex justify-between items-center gap-4">
                                <span className="font-bold">{level.val > 0 ? `+${level.val}` : level.val}</span>
                                <span>{level.label}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- FORMULA OVERLAY --- */}
            <AnimatePresence>
                {showFormula && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 border border-[#00ffcc] p-6 rounded-xl backdrop-blur-xl text-center pointer-events-auto cursor-pointer"
                        onClick={() => setShowFormula(false)}
                    >
                        <div className="text-[#00ffcc] text-lg font-bold mb-2 tracking-widest">Ω(Living Antidote)</div>
                        <div className="text-white/80 text-xl font-light italic mb-4">
                            [T(xyz) * Φ(1.2Hz)] ^ 786_OS
                        </div>
                        <div className="text-[10px] text-white/40 uppercase tracking-tighter">
                            Click to collapse formula into system core
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- RIGHT CONTROLS --- */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button 
                    onClick={() => store.setState(s => ({ ...s, quinaryState: 3 }))}
                    className="p-3 bg-black/60 border border-[#00ffcc] text-[#00ffcc] rounded-full hover:bg-[#00ffcc] hover:text-black transition-all"
                >
                    <Zap size={20} />
                </button>
                <button 
                    onClick={() => store.setState(s => ({ ...s, quinaryState: 0 }))}
                    className="p-3 bg-black/60 border border-white text-white rounded-full hover:bg-white hover:text-black transition-all"
                >
                    <Atom size={20} />
                </button>
                <button 
                    onClick={() => store.setState(s => ({ ...s, quinaryState: -2 }))}
                    className="p-3 bg-black/60 border border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-black transition-all"
                >
                    <Binary size={20} />
                </button>
                <button 
                    onClick={() => store.setState(s => ({ ...s, quinaryState: -3 }))}
                    className="p-3 bg-black/60 border border-yellow-500 text-yellow-500 rounded-full hover:bg-yellow-500 hover:text-black transition-all"
                >
                    <Shield size={20} />
                </button>
            </div>

            {/* --- SCANLINE EFFECT --- */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>
    );
};

export const livingAntidoteApp: AppDef = {
    id: 'living-antidote',
    name: 'Living Antidote',
    component: LivingAntidoteComponent,
    icon: '🧪',
    category: 'Synthesis',
    defaultSize: { width: 1000, height: 700 },
    description: 'The Physics Breaker Engine. Implements the Tesla-Einstein-Aiza formula to bypass entropy and classical physical limits.'
};
