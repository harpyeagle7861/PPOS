
import React, { useRef, useEffect } from 'react';
import { store } from '../core/state.ts';

interface Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    size: number;
    density: number;
    phase: number;
}

const BioQuantumBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -9999, y: -9999 }); // Off-screen default
    const stateRef = useRef({ quinaryState: 0, heartbeat: 72 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        
        const handleTouchMove = (e: TouchEvent) => {
             mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        
        const unsub = store.subscribe(s => {
            stateRef.current = { 
                quinaryState: s.quinaryState,
                heartbeat: s.neuralHeartRate 
            };
        });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            unsub();
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const connectionDistance = 120;
        const mouseRadius = 200;

        const initParticles = () => {
            particles = [];
            // Density scaling based on screen size to maintain performance
            // Reduced density for better performance on all devices
            const particleCount = Math.min(150, (window.innerWidth * window.innerHeight) / 15000); 
            for (let i = 0; i < particleCount; i++) {
                const size = Math.random() * 2 + 1;
                const x = Math.random() * window.innerWidth;
                const y = Math.random() * window.innerHeight;
                
                particles.push({
                    x, y,
                    baseX: x, baseY: y,
                    size,
                    density: (Math.random() * 30) + 1,
                    phase: Math.random() * Math.PI * 2
                });
            }
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };
        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            const { quinaryState, heartbeat } = stateRef.current;
            const width = canvas.width;
            const height = canvas.height;
            const time = Date.now() / 1000;

            // --- THEME SELECTION ---
            let r = 0, g = 255, b = 204; // Cyan (0: Potential)
            let particleSpeed = 1.0;

            if (quinaryState === -2) { // Void (Red)
                r = 255; g = 20; b = 20;
                particleSpeed = 0.5;
            } else if (quinaryState === -1) { // Resistance (Orange)
                r = 255; g = 170; b = 0;
            } else if (quinaryState === 1) { // Flow (Blue)
                r = 0; g = 150; b = 255;
                particleSpeed = 1.5;
            } else if (quinaryState === 2) { // Resonance (Gold)
                r = 255; g = 215; b = 0;
                particleSpeed = 2.0;
            } else if (quinaryState === 3) { // Hyper-Flow (White/Cyan)
                r = 224; g = 255; b = 255;
                particleSpeed = 3.0;
            }

            // Pulse based on Heartbeat
            const pulseFreq = heartbeat / 60; // beats per second
            const globalPulse = (Math.sin(time * Math.PI * pulseFreq) + 1) / 2; // 0 to 1 range

            // Clear with Trail (Ghosting Effect)
            // Higher opacity clear for cleaner look in high motion, lower for trails
            ctx.fillStyle = `rgba(5, 5, 8, ${quinaryState >= 2 ? 0.25 : 0.15})`;
            ctx.fillRect(0, 0, width, height);

            // Update & Draw Particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Mouse Interaction (Observer Effect)
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Physics: Move away/towards mouse + return to base
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = mouseRadius;
                
                let force = (maxDistance - distance) / maxDistance;
                if (force < 0) force = 0;

                // Repulsion/Attraction based on State (Void pushes away, Resonance pulls)
                const direction = (quinaryState < 0) ? -1 : 1; 

                if (distance < mouseRadius) {
                    p.x -= forceDirectionX * force * p.density * direction * 2;
                    p.y -= forceDirectionY * force * p.density * direction * 2;
                } else {
                    if (p.x !== p.baseX) {
                        const dxBase = p.x - p.baseX;
                        p.x -= dxBase / 20; // Return spring
                    }
                    if (p.y !== p.baseY) {
                        const dyBase = p.y - p.baseY;
                        p.y -= dyBase / 20;
                    }
                }
                
                // Apply Quantum Jitter (Wave Function)
                const jitterX = Math.cos(time * p.density * 0.2 + p.phase) * (0.5 * particleSpeed);
                const jitterY = Math.sin(time * p.density * 0.2 + p.phase) * (0.5 * particleSpeed);
                
                const finalX = p.x + jitterX;
                const finalY = p.y + jitterY;

                // Draw Particle (Probability Cloud)
                ctx.beginPath();
                const sizePulse = p.size * (1 + globalPulse * 0.3);
                ctx.arc(finalX, finalY, sizePulse, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + globalPulse * 0.4})`;
                ctx.fill();
            }

            // Draw Connections (Entanglement Web)
            ctx.lineWidth = 0.5;
            const connDistSq = connectionDistance * connectionDistance;
            
            for (let a = 0; a < particles.length; a++) {
                let connections = 0;
                for (let b = a + 1; b < particles.length; b++) {
                    // Limit max connections per particle to maintain performance
                    if (connections > 5) break;

                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connDistSq) {
                        connections++;
                        const distance = Math.sqrt(distSq);
                        const opacity = 1 - (distance / connectionDistance);
                        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.3})`;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />;
};

export default BioQuantumBackground;
