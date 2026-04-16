
import React, { useState, useEffect, useRef } from 'react';
import { AppDef } from '../core/state.ts';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { addNotification } from '../core/windowManager.ts';
import { PermissionHandler } from '../core/PermissionHandler.ts';

function decode(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
}

const WatcherProtocolComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [status, setStatus] = useState('IDLE');
    const [view, setView] = useState<'menu' | 'session'>('menu');
    const [telemetry, setTelemetry] = useState({ transferRate: 0, latency: 24, totalFlux: 0 });
    
    const sessionRef = useRef<any>(null);
    const nextStartTime = useRef<number>(0);

    useEffect(() => {
        if (view === 'session') {
            const interval = setInterval(() => {
                const newRate = Math.floor(Math.random() * 450 + 50);
                setTelemetry(prev => ({ 
                    transferRate: newRate, 
                    latency: Math.floor(Math.random() * 15 + 18),
                    totalFlux: prev.totalFlux + (newRate / 10)
                }));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [view]);

    const startWatcher = async () => {
        setStatus('CONNECTING...');
        setView('session');
        try {
            // Protocol 2: Request via Permission Vault
            await PermissionHandler.requestMediaAccess({ audio: true });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: { responseModalities: [Modality.AUDIO], systemInstruction: "You are WATCHER. Be vigilant. You monitor the grid for the Architect." },
                callbacks: {
                    onopen: () => { setStatus('RESONATING'); addNotification("Watcher: Overwatch active."); },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            nextStartTime.current = Math.max(nextStartTime.current, outputCtx.currentTime);
                            const buffer = await decodeAudioData(decode(audioData), outputCtx);
                            const source = outputCtx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outputCtx.destination);
                            source.start(nextStartTime.current);
                            nextStartTime.current += buffer.duration;
                        }
                    },
                    onclose: () => stopWatcher()
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (e) { 
            setView('menu'); 
            setStatus('IDLE'); 
        }
    };

    const stopWatcher = () => {
        if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
        setView('menu'); setStatus('IDLE');
    };

    return React.createElement('div', { style: { height: '100%', background: '#020202', color: '#00ffcc', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace" } },
        React.createElement('div', { style: { padding: '15px 25px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px' } },
                React.createElement('div', { className: status === 'RESONATING' ? 'synapse-resonant' : '', style: { width: '12px', height: '12px', background: status === 'RESONATING' ? '#00ffcc' : '#ff3333', borderRadius: '50%', boxShadow: `0 0 15px ${status === 'RESONATING' ? '#00ffcc' : '#ff3333'}`, '--pulse-color': '#00ffcc' } as any }),
                React.createElement('span', { style: { fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px' } }, status)
            ),
            view === 'session' && React.createElement('div', { style: { display: 'flex', gap: '25px', fontSize: '10px', opacity: 0.7 } },
                React.createElement('div', null, `FLUX_RATE: ${telemetry.transferRate} KB/s`),
                React.createElement('div', null, `LAG: ${telemetry.latency} ms`)
            )
        ),
        view === 'menu' ? React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px' } },
            React.createElement('div', { style: { fontSize: '80px', filter: 'drop-shadow(0 0 20px rgba(0,255,204,0.4))' } }, '🧿'),
            React.createElement('div', { style: { textAlign: 'center', maxWidth: '300px' } },
                React.createElement('h2', { style: { fontSize: '14px', letterSpacing: '4px', marginBottom: '10px' } }, 'WATCHER PROTOCOL'),
                React.createElement('p', { style: { fontSize: '10px', opacity: 0.5, lineHeight: '1.6' } }, 'Initiate full neural overwatch to monitor the quinary grid state.')
            ),
            React.createElement('button', { onClick: startWatcher, style: { padding: '18px 50px', background: '#00ffcc', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', letterSpacing: '6px', fontSize: '14px', transition: '0.3s', boxShadow: '0 0 20px rgba(0,255,204,0.3)' } }, 'INITIATE')
        ) : React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '30px', gap: '30px' } },
            React.createElement('div', { style: { flex: 1, background: '#010101', border: '1px solid #111', padding: '30px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' } },
                React.createElement('div', { style: { width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(0,255,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' } },
                    React.createElement('div', { style: { position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid #00ffcc', opacity: 0.1, transform: `scale(${1 + (telemetry.transferRate/1000)})`, transition: 'transform 0.5s' } }),
                    React.createElement('div', { style: { textAlign: 'center' } },
                        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold' } }, telemetry.transferRate),
                        React.createElement('div', { style: { fontSize: '9px', opacity: 0.5, letterSpacing: '2px' } }, 'KB/S FLUX')
                    )
                ),
                React.createElement('div', { style: { position: 'absolute', bottom: '20px', left: '20px', right: '20px' } },
                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '8px', opacity: 0.5, marginBottom: '5px' } },
                        React.createElement('span', null, 'SYNAPTIC CAPACITY'),
                        React.createElement('span', null, `${Math.round((telemetry.transferRate/500)*100)}%`)
                    ),
                    React.createElement('div', { style: { height: '2px', width: '100%', background: '#111', borderRadius: '1px', overflow: 'hidden' } },
                        React.createElement('div', { style: { height: '100%', background: '#00ffcc', width: `${(telemetry.transferRate / 500) * 100}%`, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px #00ffcc' } })
                    )
                )
            ),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' } },
                React.createElement('div', { style: { padding: '15px', background: '#050505', border: '1px solid #222', borderRadius: '8px' } },
                    React.createElement('div', { style: { fontSize: '9px', opacity: 0.4, marginBottom: '5px' } }, 'ACCUMULATED_FLUX'),
                    React.createElement('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, `${Math.round(telemetry.totalFlux)} MB`)
                ),
                React.createElement('div', { style: { padding: '15px', background: '#050505', border: '1px solid #222', borderRadius: '8px' } },
                    React.createElement('div', { style: { fontSize: '9px', opacity: 0.4, marginBottom: '5px' } }, 'LINK_STABILITY'),
                    React.createElement('div', { style: { fontSize: '18px', fontWeight: 'bold', color: telemetry.latency < 25 ? '#00ffcc' : '#ffaa00' } }, telemetry.latency < 25 ? 'OPTIMAL' : 'FLUCTUATING')
                )
            ),
            React.createElement('button', { onClick: stopWatcher, style: { padding: '15px', background: 'transparent', border: '1px solid #ff3333', color: '#ff3333', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', letterSpacing: '2px', fontSize: '11px', transition: '0.3s' } }, 'TERMINATE RESONANCE')
        )
    );
};

export const watcherProtocolApp: AppDef = {
    id: 'watcher-protocol', name: 'Watcher Protocol', component: WatcherProtocolComponent, icon: '🧿', category: 'System', defaultSize: { width: 450, height: 600 },
    description: 'Neural overwatch with real-time synaptic telemetry and visual flux monitoring.'
};
