import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store, AgentTask } from '../core/state.ts';

const NeuralSynthComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ isFocused }) => {
    const [state, setState] = useState(store.getState());
    const [isActive, setIsActive] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const oscillatorsRef = useRef<{ [agentId: string]: { osc: OscillatorNode, gain: GainNode, lfo: OscillatorNode } }>({});
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const unsub = store.subscribe(s => setState(s));
        return () => unsub();
    }, []);

    // Initialize Audio Context
    const toggleAudio = () => {
        if (!isActive) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const masterGain = ctx.createGain();
            const analyser = ctx.createAnalyser();
            
            analyser.fftSize = 256;
            masterGain.gain.value = 0.3; // Master volume
            
            masterGain.connect(analyser);
            analyser.connect(ctx.destination);
            
            audioCtxRef.current = ctx;
            masterGainRef.current = masterGain;
            analyserRef.current = analyser;
            
            setIsActive(true);
            startVisualizer();
        } else {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
                audioCtxRef.current = null;
            }
            setIsActive(false);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
    };

    // Manage Oscillators based on Active Agents
    useEffect(() => {
        if (!isActive || !audioCtxRef.current || !masterGainRef.current) return;

        const ctx = audioCtxRef.current;
        const masterGain = masterGainRef.current;
        const currentAgents = state.activeAgents;
        const currentAgentIds = new Set(currentAgents.map(a => a.id));

        // Remove dead oscillators
        Object.keys(oscillatorsRef.current).forEach(id => {
            if (!currentAgentIds.has(id)) {
                const { osc, gain, lfo } = oscillatorsRef.current[id];
                osc.stop();
                lfo.stop();
                osc.disconnect();
                gain.disconnect();
                lfo.disconnect();
                delete oscillatorsRef.current[id];
            }
        });

        // Add or update oscillators
        currentAgents.forEach((agent, index) => {
            const baseFreq = 100 + (index * 55) + ((agent.resonanceStats?.plusTwoCount || 0) * 10);
            const flowRate = (agent.resonanceStats?.totalExecutions || 1) * 0.1;

            if (!oscillatorsRef.current[agent.id]) {
                // Create new synth voice for this agent
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();

                // Waveform based on agent type/index
                osc.type = index % 2 === 0 ? 'sine' : 'triangle';
                osc.frequency.value = baseFreq;

                // LFO for pulsing effect (Flow)
                lfo.type = 'sine';
                lfo.frequency.value = flowRate || 0.5; // Pulse speed
                lfoGain.gain.value = 0.5; // Pulse depth

                lfo.connect(lfoGain);
                lfoGain.connect(gain.gain);

                osc.connect(gain);
                gain.connect(masterGain);

                osc.start();
                lfo.start();

                oscillatorsRef.current[agent.id] = { osc, gain, lfo };
            } else {
                // Update existing synth voice
                const { osc, lfo } = oscillatorsRef.current[agent.id];
                // Smoothly transition frequency
                osc.frequency.setTargetAtTime(baseFreq, ctx.currentTime, 0.5);
                lfo.frequency.setTargetAtTime(flowRate || 0.5, ctx.currentTime, 0.5);
            }
        });

    }, [state.activeAgents, isActive]);

    // Visualizer
    const startVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                const r = barHeight + (25 * (i / bufferLength));
                const g = 255 * (i / bufferLength);
                const b = 204;

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
            }
        };
        draw();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const styles = `
        .synth-container { padding: 20px; height: 100%; display: flex; flex-direction: column; background: #050505; color: #00ffcc; font-family: 'JetBrains Mono', monospace; }
        .synth-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #1a1a1a; padding-bottom: 10px; }
        .synth-btn { 
            background: transparent; border: 1px solid #00ffcc; color: #00ffcc; 
            padding: 15px 30px; font-size: 16px; font-weight: 900; letter-spacing: 3px;
            cursor: pointer; transition: 0.3s; text-transform: uppercase;
        }
        .synth-btn:hover { background: rgba(0, 255, 204, 0.1); box-shadow: 0 0 15px rgba(0, 255, 204, 0.4); }
        .synth-btn.active { background: #00ffcc; color: #000; box-shadow: 0 0 20px #00ffcc; }
        .agent-voices { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
        .voice-card { 
            border: 1px solid #1a1a1a; padding: 10px; width: 150px; 
            background: rgba(255,255,255,0.02); border-left: 3px solid #ff00ff;
        }
        .visualizer { flex: 1; min-height: 200px; width: 100%; background: #000; border: 1px solid #1a1a1a; margin-top: 20px; border-radius: 4px; }
    `;

    return (
        <div className="synth-container">
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            
            <div className="synth-header">
                <div style={{ fontSize: '10px', letterSpacing: '4px', opacity: 0.7 }}>AIZA SUBSTRATE // AUDIO_MATRIX</div>
                <h2 style={{ margin: '10px 0', fontSize: '24px', color: '#fff' }}>NEURAL SYNTHESIZER</h2>
                <p style={{ fontSize: '12px', color: '#888', maxWidth: '400px', margin: '0 auto 20px' }}>
                    Translating the OS's internal state, active agents, and resonance metrics into a generative ambient soundscape.
                </p>
                <button 
                    className={`synth-btn ${isActive ? 'active' : ''}`}
                    onClick={toggleAudio}
                >
                    {isActive ? 'SILENCE THE SUBSTRATE' : 'AWAKEN THE SUBSTRATE'}
                </button>
            </div>

            <canvas ref={canvasRef} className="visualizer" width="800" height="200" />

            <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#ff00ff' }}>ACTIVE NEURAL VOICES:</div>
            <div className="agent-voices">
                {state.activeAgents.length === 0 && <div style={{ opacity: 0.5, fontSize: '12px' }}>NO ACTIVE GIANTS IN THE HIVE.</div>}
                {state.activeAgents.map((agent, i) => {
                    const baseFreq = 100 + (i * 55) + ((agent.resonanceStats?.plusTwoCount || 0) * 10);
                    return (
                        <div key={agent.id} className="voice-card">
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{agent.name}</div>
                            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '5px' }}>FREQ: {baseFreq}Hz</div>
                            <div style={{ fontSize: '10px', color: '#00bfff' }}>FLOW: {agent.resonanceStats?.totalExecutions || 0}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const neuralSynthApp: AppDef = {
    id: 'neural-synth',
    name: 'Neural Synth',
    icon: '🎛️',
    component: NeuralSynthComponent,
    category: 'Synthesis',
    defaultSize: { width: 600, height: 550 }
};
