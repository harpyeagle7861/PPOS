
import React, { useEffect, useRef, useState } from 'react';
import { openApp } from '../core/windowManager.ts';

const PomegranateWidget: React.FC = () => {
    const [pulsing, setPulsing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pulseSource = useRef<string>('');

    useEffect(() => {
        const handlePulse = (e: Event) => {
            const customEvent = e as CustomEvent;
            pulseSource.current = customEvent.detail?.source || 'SYSTEM';
            setPulsing(true);
            setTimeout(() => setPulsing(false), 600);
        };

        window.addEventListener('POMEGRANATE_PULSE', handlePulse);
        return () => window.removeEventListener('POMEGRANATE_PULSE', handlePulse);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        
        const render = () => {
            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;

            ctx.clearRect(0, 0, w, h);

            // Base Glow
            const time = Date.now() / 1000;
            const idleBeat = Math.sin(time * 2) * 0.1 + 1; // Slow breathing
            const activeBeat = pulsing ? 1.4 : 1.0;
            const scale = idleBeat * activeBeat;

            // Draw Pomegranate Core (Abstract Seed Shape)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            
            // Outer Aura
            const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 60);
            grad.addColorStop(0, pulsing ? '#ff00ff' : '#ff3333');
            grad.addColorStop(0.6, pulsing ? 'rgba(255, 0, 255, 0.4)' : 'rgba(255, 51, 51, 0.2)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, Math.PI * 2);
            ctx.fill();

            // Inner Seeds (Hexagonal Cluster)
            ctx.fillStyle = pulsing ? '#fff' : '#ffaa00';
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + (time * 0.5);
                const r = 20;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Core
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = pulsing ? 30 : 10;
            ctx.shadowColor = pulsing ? '#ff00ff' : '#ff3333';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Source Text (Ephemeral)
            if (pulsing) {
                ctx.fillStyle = '#00ffcc';
                ctx.font = '10px "JetBrains Mono"';
                ctx.textAlign = 'center';
                ctx.fillText(pulseSource.current, cx, cy - 70);
            }

            frame = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frame);
    }, [pulsing]);

    return (
        <div 
            onClick={() => openApp('pomegranate')}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '140px',
                height: '140px',
                cursor: 'pointer',
                zIndex: 9000 // Below windows, above background
            }}
            title="Open Pomegranate Engine"
        >
            <canvas ref={canvasRef} width={140} height={140} />
        </div>
    );
};

export default PomegranateWidget;
