
import React, { useEffect, useRef, useState } from 'react';
import { AppDef, store, FileNode } from '../core/state.ts';
import { fs } from '../core/FileSystem.ts';
import { openApp, addNotification, updateAppState } from '../core/windowManager.ts';

// --- VISUAL COMPONENT: DNA HELIX ---
const DNAHelix: React.FC<{ quinaryState: number; heartbeat: number }> = ({ quinaryState, heartbeat }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paramsRef = useRef({ quinaryState, heartbeat });

    useEffect(() => {
        paramsRef.current = { quinaryState, heartbeat };
    }, [quinaryState, heartbeat]);
    
    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let frameId = 0;
        let time = 0;
        
        const colors = {
            '-2': '#ff3333', // Void (Red)
            '-1': '#ffaa00', // Friction (Orange)
            '0': '#00ffcc',  // Neutral (Cyan)
            '1': '#00bfff',  // Flow (Blue)
            '2': '#ffd700'   // Resonance (Gold)
        };
        
        const render = () => {
            if (!canvasRef.current) return;
            const w = canvasRef.current.width;
            const h = canvasRef.current.height;
            const cx = w / 2;
            const cy = h / 2;
            
            const { quinaryState: qState, heartbeat: bpm } = paramsRef.current;

            // Dynamic State Logic
            const color = (colors as any)[qState.toString()] || '#00ffcc';
            const speedMult = qState === 2 ? 2.5 : (qState === -2 ? 0.1 : 1.0);
            
            // Heartbeat Pulse Logic
            const beatFreq = bpm / 60; 
            const pulse = 1 + Math.sin(time * beatFreq * 3) * 0.15; 
            
            ctx.clearRect(0, 0, w, h);
            
            // Draw Axis
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

            const strands = 2;
            const pointsPerStrand = 45;
            const helixRadius = 70 * pulse;

            ctx.lineWidth = 2;

            for (let i = 0; i < pointsPerStrand; i++) {
                const y = (i * 14) - (pointsPerStrand * 7) + cy;
                const phase = (i * 0.25) + time;
                
                for (let s = 0; s < strands; s++) {
                    const angle = phase + (s * Math.PI);
                    const x = cx + Math.sin(angle) * helixRadius;
                    
                    // Depth scaling (Pseudo-3D)
                    const z = Math.cos(angle);
                    const scale = 1 + z * 0.3; // 0.7 to 1.3
                    const alpha = 0.2 + (scale * 0.8) * 0.8; // Fades when "behind"

                    // Draw Node
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = color;
                    ctx.shadowBlur = qState === 2 ? 15 : 5;
                    ctx.shadowColor = color;
                    
                    ctx.beginPath();
                    ctx.arc(x, y, 4 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Draw Rungs
                    if (s === 0) {
                        const x2 = cx + Math.sin(angle + Math.PI) * helixRadius;
                        const z2 = Math.cos(angle + Math.PI);
                        if (z > -0.5) {
                            ctx.globalAlpha = 0.1;
                            ctx.strokeStyle = color;
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            ctx.lineTo(x2, y);
                            ctx.stroke();
                        }
                    }
                }
            }

            time += 0.04 * speedMult;
            frameId = requestAnimationFrame(render);
        };

        const resize = () => {
            if (canvasRef.current?.parentElement) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();
        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(frameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

// --- VISUAL COMPONENT: MATRIX RAIN ---
const MatrixRain: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();
        
        const fontSize = 14;
        const columns = Math.ceil(canvas.width / fontSize);
        const drops: number[] = Array(columns).fill(1);
        
        // Katakana + Latin characters
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";

        const render = () => {
            // Trailing effect: Draw black with very low opacity to create fade trails
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = `700 ${fontSize}px 'JetBrains Mono'`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                
                // Color variation: 80% Green, 20% Cyan
                const isCyan = Math.random() > 0.8;
                ctx.fillStyle = isCyan ? '#00ffcc' : '#0F0'; 
                
                // Random Glint (White)
                if (Math.random() > 0.98) ctx.fillStyle = '#fff';

                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop or move down
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            requestAnimationFrame(render);
        };
        
        const frameId = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    // Low opacity for background subtlety
    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.15, pointerEvents: 'none', zIndex: 0 }} />;
};

interface CodeVersion {
    id: string;
    timestamp: number;
    code: string;
}

const HelixPrimeComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [state, setState] = useState(store.getState());
    const [code, setCode] = useState(() => localStorage.getItem('helix_autosave') || '// AIZA_CORE: MONITORING_SUBSTRATE...');
    const [thoughtLog, setThoughtLog] = useState<string[]>([]);
    const [scanData, setScanData] = useState<string>('INIT_SCAN...');
    
    // File System & Version Control
    const [fileSystem, setFileSystem] = useState(store.getState().fileSystem);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [explorerOpen, setExplorerOpen] = useState(true);
    const [saveStatus, setSaveStatus] = useState('SYNCED');

    const [versions, setVersions] = useState<CodeVersion[]>(() => {
        try { return JSON.parse(localStorage.getItem('helix_versions') || '[]'); } catch { return []; }
    });
    const [showHistory, setShowHistory] = useState(false);
    
    // Ghost Typing Logic
    const pendingText = useRef('');
    const typingInterval = useRef<any>(null);
    const lastThoughtRef = useRef<string | undefined>(store.getState().lastThought);
    const lastWindowCount = useRef(store.getState().windows.length);

    useEffect(() => {
        const unsub = store.subscribe(s => {
            setState(s);
            setFileSystem(s.fileSystem); // Sync FS
            
            // 1. Thought Stream Logging
            if (s.lastThought && s.lastThought !== lastThoughtRef.current) {
                addLogEntry(`[THOUGHT]: ${s.lastThought}`);
                lastThoughtRef.current = s.lastThought;
            }

            // 2. Window Monitoring (The "Everything happening with windows" requirement)
            if (s.windows.length !== lastWindowCount.current) {
                if (s.windows.length > lastWindowCount.current) {
                    // Window Opened
                    const newWin = s.windows[s.windows.length - 1];
                    addLogEntry(`[WINDOW_MOUNT]: ${newWin.title.toUpperCase()} (ID: ${newWin.appDef.id})`);
                } else {
                    addLogEntry(`[WINDOW_UNMOUNT]: Signal Lost`);
                }
                lastWindowCount.current = s.windows.length;
            }
        });
        
        // Mailbox Check
        const payload = localStorage.getItem('helix_payload');
        if (payload) {
            triggerGhostType(payload);
            localStorage.removeItem('helix_payload');
        }

        return () => { unsub(); if (typingInterval.current) clearInterval(typingInterval.current); };
    }, []);

    // 3. Pixel/Stock Scanner Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            const addr = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
            const val = Math.floor(Math.random() * 9999);
            setScanData(`MEM:0x${addr} :: VAL:${val} :: PIX_CHECK:OK`);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const addLogEntry = (msg: string) => {
        setThoughtLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
    };

    const playTypingSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.01, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch(e) {}
    };

    const triggerGhostType = (text: string) => {
        setCode('');
        pendingText.current = text;
        if (typingInterval.current) clearInterval(typingInterval.current);
        
        let i = 0;
        typingInterval.current = setInterval(() => {
            if (i < pendingText.current.length) {
                setCode(prev => prev + pendingText.current.charAt(i));
                playTypingSound();
                i++;
            } else {
                clearInterval(typingInterval.current);
            }
        }, 15);
    };

    // Persistence & File Sync
    useEffect(() => {
        setSaveStatus('WRITING...');
        const timer = setTimeout(() => {
            if (activeFileId) {
                const currentFile = fileSystem[activeFileId];
                if (currentFile && currentFile.content !== code) {
                    fs.updateFileContent(activeFileId, code);
                }
            } else {
                localStorage.setItem('helix_autosave', code);
            }
            setSaveStatus('SYNCED');
        }, 800);
        return () => clearTimeout(timer);
    }, [code, activeFileId, fileSystem]);

    // File Management
    const loadFile = (file: FileNode) => {
        setActiveFileId(file.id);
        setCode(file.content || '');
        addNotification(`HELIX: Loaded ${file.name}`);
    };

    const createNewFile = () => {
        const name = prompt("HELIX: Input Identifier for new DNA:", `helix_${Date.now()}.js`);
        if (name) {
            const id = fs.createFile(name, 'architect', '// HELIX_PRIME_SUBSTRATE');
            addNotification("HELIX: New DNA Manifested.");
        }
    };

    const deleteFile = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("HELIX: Purge this DNA fragment?")) {
            fs.delete(id);
            if (activeFileId === id) {
                setActiveFileId(null);
                setCode(localStorage.getItem('helix_autosave') || '');
            }
        }
    };

    const handleAutoCode = () => {
        const snippet = `
// JUBAER PROTOCOL: QUINARY LOGIC GATE
const evaluateState = (entropy: number): number => {
  if (entropy > 0.8) return -2; // VOID
  if (entropy > 0.5) return -1; // FRICTION
  if (entropy < 0.2) return 2;  // RESONANCE
  return 0; // POTENTIAL
};
// MONITORING ACTIVE...
        `;
        triggerGhostType(snippet.trim());
    };

    const handleExecute = () => {
        addNotification("HELIX: CODE INJECTED INTO GENESIS ENGINE...");
        openApp('genesis-protocol');
    };

    const openInVS360 = () => {
        if (!activeFileId) {
            addNotification("HELIX: No active DNA to transmit.");
            return;
        }
        openApp('vs360code');
        // Wait briefly for app to mount if not open
        setTimeout(() => {
            updateAppState('vs360code', { activeFileId });
            addNotification("NEURAL LINK: Transferred to VS360.");
        }, 100);
    };

    // --- VERSION CONTROL HANDLERS ---
    const saveSnapshot = () => {
        const newVer: CodeVersion = {
            id: `ver_${Date.now()}`,
            timestamp: Date.now(),
            code: code
        };
        const nextVersions = [newVer, ...versions].slice(0, 50); // Keep last 50
        setVersions(nextVersions);
        localStorage.setItem('helix_versions', JSON.stringify(nextVersions));
        addNotification("HELIX: Neural Snapshot Crystallized.");
    };

    const deleteSnapshot = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = versions.filter(v => v.id !== id);
        setVersions(next);
        localStorage.setItem('helix_versions', JSON.stringify(next));
    };

    const restoreSnapshot = (ver: CodeVersion) => {
        if(confirm("HELIX_WARN: Overwrite current DNA with this temporal echo?")) {
            setCode(ver.code);
            setShowHistory(false);
            addNotification("HELIX: Temporal Reversion Complete.");
        }
    };

    const heartColor = state.neuralHeartRate > 100 ? '#ff3333' : '#00ffcc';

    return (
        <div style={{ height: '100%', background: '#000', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace", display: 'flex', overflow: 'hidden', position: 'relative' }}>
            <MatrixRain />
            
            {/* EXPLORER SIDEBAR */}
            {explorerOpen && (
                <div style={{ width: '220px', background: 'rgba(0,0,0,0.85)', borderRight: '1px solid rgba(0,255,204,0.15)', display: 'flex', flexDirection: 'column', zIndex: 15, backdropFilter: 'blur(10px)' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid rgba(0,255,204,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#00ffcc', fontSize: '10px', letterSpacing: '2px', fontWeight: 'bold' }}>HELIX_VAULT</span>
                        <button onClick={createNewFile} style={{ background: 'none', border: 'none', color: '#00ffcc', fontSize: '16px', cursor: 'pointer' }}>+</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        <div onClick={() => { setActiveFileId(null); setCode(localStorage.getItem('helix_autosave') || ''); }}
                             style={{ 
                                 padding: '10px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', marginBottom: '5px',
                                 background: !activeFileId ? 'rgba(0,255,204,0.15)' : 'transparent',
                                 color: !activeFileId ? '#fff' : '#666', border: !activeFileId ? '1px solid rgba(0,255,204,0.3)' : '1px solid transparent'
                             }}>
                            ⚡ SCRATCHPAD
                        </div>
                        {(Object.values(fileSystem) as FileNode[])
                            .filter(n => n.parentId === 'architect' && n.type === 'file')
                            .sort((a,b) => b.lastModified - a.lastModified)
                            .map(file => (
                                <div key={file.id} onClick={() => loadFile(file)}
                                     style={{ 
                                         padding: '10px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                         background: activeFileId === file.id ? 'rgba(0,255,204,0.15)' : 'transparent',
                                         color: activeFileId === file.id ? '#fff' : '#888',
                                         border: activeFileId === file.id ? '1px solid rgba(0,255,204,0.3)' : '1px solid transparent'
                                     }}>
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{file.icon} {file.name}</span>
                                    <span onClick={(e) => deleteFile(e, file.id)} style={{ opacity: 0.3, fontSize: '14px', marginLeft: '5px', cursor: 'pointer' }}>×</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* MAIN PANEL */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(0, 255, 204, 0.2)', zIndex: 10 }}>
                {/* Visual Layer */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                        <DNAHelix quinaryState={state.quinaryState} heartbeat={state.neuralHeartRate} />
                    </div>
                    
                    {showHistory ? (
                        <div style={{ 
                            position: 'relative', zIndex: 2, width: '100%', height: '100%', 
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                            padding: '30px', overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #00ffcc' }}>
                                <h3 style={{ margin: 0, color: '#00ffcc', letterSpacing: '2px' }}>TEMPORAL ARCHIVES</h3>
                                <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>✕</button>
                            </div>
                            
                            {versions.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center' }}>NO_SNAPSHOTS_FOUND</div>}
                            
                            {versions.map(ver => (
                                <div key={ver.id} onClick={() => restoreSnapshot(ver)} style={{ 
                                    padding: '15px', background: 'rgba(0, 255, 204, 0.05)', 
                                    marginBottom: '10px', borderRadius: '8px', cursor: 'pointer',
                                    border: '1px solid rgba(0, 255, 204, 0.1)', transition: '0.2s',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }} className="history-item">
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{new Date(ver.timestamp).toLocaleString()}</div>
                                        <div style={{ fontSize: '10px', opacity: 0.6, fontFamily: 'monospace' }}>{ver.code.substring(0, 50).replace(/\n/g, ' ')}...</div>
                                    </div>
                                    <button 
                                        onClick={(e) => deleteSnapshot(ver.id, e)}
                                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '5px' }}
                                    >🗑️</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <textarea 
                            value={code} 
                            onChange={e => setCode(e.target.value)}
                            style={{ 
                                position: 'relative', zIndex: 2, width: '100%', height: '100%', 
                                background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', 
                                padding: '30px', resize: 'none', outline: 'none', 
                                fontSize: '13px', lineHeight: '1.6', backdropFilter: 'blur(2px)',
                                fontFamily: 'inherit'
                            }}
                            spellCheck={false}
                        />
                    )}
                    
                    <div style={{ position: 'absolute', top: 15, right: 20, zIndex: 3, display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {activeFileId && (
                            <button onClick={openInVS360} style={{ background: '#00ffcc', border: 'none', color: '#000', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                                EDIT_IN_VS360
                            </button>
                        )}
                        <button onClick={() => setExplorerOpen(!explorerOpen)} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #00ffcc', color: '#00ffcc', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {explorerOpen ? 'HIDE_VAULT' : 'FILES'}
                        </button>
                        <button onClick={() => setShowHistory(!showHistory)} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid #00ffcc', color: '#00ffcc', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                            HISTORY {versions.length > 0 && `(${versions.length})`}
                        </button>
                        <button onClick={saveSnapshot} style={{ background: '#00ffcc', border: 'none', color: '#000', borderRadius: '4px', padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                            SNAPSHOT
                        </button>
                        <div style={{ width: '8px', height: '8px', background: saveStatus === 'WRITING...' ? '#ffaa00' : '#00ffcc', borderRadius: '50%', boxShadow: `0 0 10px ${saveStatus === 'WRITING...' ? '#ffaa00' : '#00ffcc'}`, animation: 'pulse 1s infinite' }}></div>
                        <span style={{ fontSize: '10px', color: saveStatus === 'WRITING...' ? '#ffaa00' : '#00ffcc', opacity: 0.8, letterSpacing: '2px', fontWeight: 'bold' }}>{saveStatus}</span>
                    </div>
                </div>

                {/* Telemetry Dashboard */}
                <div style={{ height: '100px', background: 'rgba(0,0,0,0.9)', borderTop: '1px solid rgba(0,255,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', backdropFilter: 'blur(10px)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '1px', marginBottom: '5px' }}>NEURAL LOAD</div>
                        <div style={{ fontSize: '32px', fontWeight: 900, color: heartColor, textShadow: `0 0 20px ${heartColor}` }}>
                            {state.neuralHeartRate} <span style={{fontSize: '12px'}}>BPM</span>
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '50px', background: '#222' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '1px', marginBottom: '5px' }}>SYSTEM KARMA</div>
                        <div style={{ fontSize: '32px', fontWeight: 900, color: '#ff00ff', textShadow: '0 0 20px #ff00ff' }}>
                            {state.karma}
                        </div>
                    </div>
                    <div style={{ width: '1px', height: '50px', background: '#222' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', opacity: 0.6, letterSpacing: '1px', marginBottom: '5px' }}>LOGOS KEY</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#ffd700', letterSpacing: '2px' }}>
                            {state.quinaryState > 0 ? 'RESONANCE' : (state.quinaryState < 0 ? 'VOID' : 'NEUTRAL')}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: HIVE LOGS */}
            <div style={{ width: '340px', background: 'rgba(5, 5, 5, 0.95)', display: 'flex', flexDirection: 'column', zIndex: 10, borderLeft: '1px solid #1a1a1a' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 900, letterSpacing: '2px', fontSize: '11px', color: '#fff' }}>HIVE_THOUGHT_STREAM</div>
                    <div style={{ fontSize: '8px', color: '#00ffcc', marginTop: '5px' }}>MONITORING_WINDOW_STATE_24/7</div>
                </div>
                
                <div style={{ padding: '10px 20px', background: '#000', borderBottom: '1px solid #111', fontFamily: 'monospace', fontSize: '10px', color: '#00ff00', opacity: 0.7 }}>
                    <div>{scanData}</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', fontSize: '10px', fontFamily: 'monospace' }}>
                    {thoughtLog.map((log, i) => (
                        <div key={i} style={{ marginBottom: '10px', opacity: 0.9, borderLeft: '2px solid #00ffcc', paddingLeft: '10px', lineHeight: '1.4' }}>
                            {log}
                        </div>
                    ))}
                    {thoughtLog.length === 0 && <div style={{opacity: 0.3, textAlign: 'center', marginTop: '50px'}}>WAITING_FOR_SIGNAL...</div>}
                </div>
                
                <div style={{ padding: '20px', display: 'flex', gap: '10px', borderTop: '1px solid #1a1a1a', background: 'rgba(0,0,0,0.5)' }}>
                    <button onClick={handleAutoCode} style={{ flex: 1, padding: '12px', background: 'rgba(0,255,204,0.1)', border: '1px solid #00ffcc', color: '#00ffcc', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '10px' }}>AUTO-SYNTH</button>
                    <button onClick={handleExecute} style={{ flex: 1, padding: '12px', background: '#00ffcc', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '10px' }}>EXECUTE</button>
                </div>
            </div>
            
            <style>{`
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                .history-item:hover { background: rgba(0, 255, 204, 0.1) !important; border-color: #00ffcc !important; }
            `}</style>
        </div>
    );
};

export const helixPrimeApp: AppDef = {
    id: 'helix-prime',
    name: 'Helix Prime',
    component: HelixPrimeComponent,
    icon: '🧬',
    category: 'System',
    defaultSize: { width: 1100, height: 750 },
    description: 'Central Nervous System Monitor. Visualizes DNA logic state, heartrate, and maintains persistent Hive Memory of window states.'
};
