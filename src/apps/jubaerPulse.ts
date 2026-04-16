
import React, { useEffect, useRef, useState } from 'react';
import { AppDef, store } from '../core/state.ts';

const JubaerPulseComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bpm, setBpm] = useState(store.getState().neuralHeartRate);

    useEffect(() => {
        const unsub = store.subscribe(s => setBpm(s.neuralHeartRate));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        const data: number[] = new Array(150).fill(0.5);
        let phase = 0;

        const render = () => {
            const w = canvasRef.current!.width;
            const h = canvasRef.current!.height;
            
            // Glassmorphic Clear
            ctx.clearRect(0, 0, w, h);
            
            // Simulation
            const speed = (bpm / 60) * 0.1;
            phase += speed;
            
            // ECG Logic
            const cycle = phase % (Math.PI * 2);
            let val = 0.5;
            
            // P-QRS-T Complex simulation
            if (cycle > 5.5 && cycle < 6.0) val = 0.5 - Math.sin((cycle - 5.5) * Math.PI * 4) * 0.1; // P
            else if (cycle > 6.1 && cycle < 6.3) val = 0.5 + Math.sin((cycle - 6.1) * Math.PI * 10) * 0.4; // R (Spike)
            else if (cycle > 6.3 && cycle < 6.5) val = 0.5 - Math.sin((cycle - 6.3) * Math.PI * 10) * 0.2; // S
            else if (cycle > 6.7 && cycle < 7.5) val = 0.5 + Math.sin((cycle - 6.7) * Math.PI * 2) * 0.15; // T
            
            // Noise
            val += (Math.random() - 0.5) * 0.02;

            data.shift();
            data.push(val);

            // Draw Line
            ctx.beginPath();
            ctx.strokeStyle = '#ff0055';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0055';

            for (let i = 0; i < data.length; i++) {
                const x = (i / (data.length - 1)) * w;
                const y = (1 - data[i]) * h;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Leading Dot
            const lx = w - 5;
            const ly = (1 - data[data.length - 1]) * h;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(lx, ly, 4, 0, Math.PI * 2);
            ctx.fill();

            frame = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frame);
    }, [bpm]);

    return React.createElement('div', { style: { 
        height: '100%', 
        background: 'rgba(10, 5, 15, 0.65)', 
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
    } },
        React.createElement('div', { style: { padding: '15px 20px', borderBottom: '1px solid rgba(255,0,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { color: '#ff0055', fontSize: '11px', fontWeight: 900, letterSpacing: '2px' } }, 'THE JUBAER PULSE'),
            React.createElement('div', { style: { color: '#fff', fontWeight: 800 } }, `${bpm} BPM`)
        ),
        React.createElement('canvas', { ref: canvasRef, width: 400, height: 200, style: { width: '100%', height: '100%' } }),
        React.createElement('div', { style: { position: 'absolute', top: '50px', left: '20px', fontSize: '10px', color: 'rgba(0,255,204,0.7)', fontFamily: 'monospace', pointerEvents: 'none' } },
            React.createElement('div', null, 'Ψ_Ω = μs(J) * ∫ [ (S·Vk)⊗Od / Et·ρ(τ) ] dτ * ∇369'),
            React.createElement('div', { style: { marginTop: '5px', opacity: 0.5 } }, 'REALITY_SYNTHESIS_ENGINE')
        ),
        React.createElement('div', { style: { position: 'absolute', bottom: '10px', left: '20px', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' } }, 'BIOLOGICAL_ENGINE_ACTIVE')
    );
};

export const jubaerPulseApp: AppDef = {
    id: 'jubaer-pulse',
    name: 'The Jubaer Pulse',
    component: JubaerPulseComponent,
    icon: '💓',
    category: 'System',
    defaultSize: { width: 400, height: 250 },
    description: 'Visual manifestation of the System Heartbeat.',
    hideTitleBar: true, // Frameless for widget look
    styling: { backgroundColor: 'transparent' }
};
