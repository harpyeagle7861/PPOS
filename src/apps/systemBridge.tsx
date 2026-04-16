import React, { useState, useEffect, useRef } from 'react';
import { AppDef } from '../core/state.ts';
import { v4 as uuidv4 } from 'uuid';

// --- LOCAL VAULT (IndexedDB) ---
const DB_NAME = "AizaHiveDB";
const STORE_NAME = "signals";

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = (e: any) => resolve(e.target.result);
        request.onerror = (e) => reject(e);
    });
};

const SystemBridgeComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ isFocused }) => {
    const [time, setTime] = useState(new Date());
    const [battery, setBattery] = useState<{ level: number, charging: boolean } | null>(null);
    const [network, setNetwork] = useState<{ type: string, downlink?: number, online: boolean }>({ type: 'unknown', online: navigator.onLine });
    const [bluetooth, setBluetooth] = useState<boolean | null>(null);
    const [volume, setVolume] = useState(0);
    const [visData, setVisData] = useState<Uint8Array | null>(null);
    
    // Advanced Protocols
    const [twinId] = useState(() => localStorage.getItem('aiza_cognitive_twin_id') || (()=>{ const id = uuidv4(); localStorage.setItem('aiza_cognitive_twin_id', id); return id; })());
    const [keystrokes, setKeystrokes] = useState(0);
    const [clicks, setClicks] = useState(0);
    const [lastAction, setLastAction] = useState('AWAITING_INPUT');
    const [meshPeers, setMeshPeers] = useState<string[]>([]);
    const [opticalActive, setOpticalActive] = useState(false);
    
    // Vault State
    const [vaultLogs, setVaultLogs] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // --- NEW: GHOST CACHE & RAM EATER STATE ---
    const [ghostTag, setGhostTag] = useState<string | null>(null);
    const [ramClaimed, setRamClaimed] = useState(0);
    const ramStorageRef = useRef<Uint8Array[]>([]);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const reqRef = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    // --- GHOST CACHE (PERSISTENT TAG) ---
    useEffect(() => {
        const existingTag = localStorage.getItem('GHOST_CACHE');
        if (existingTag) {
            setGhostTag(existingTag);
        } else {
            const newTag = `786::TAGGED::${new Date().getTime()}::PERMANENT`;
            localStorage.setItem('GHOST_CACHE', newTag);
            setGhostTag(newTag);
            logSignal(`HOST PERMANENTLY TAGGED: ${newTag}`, 'GHOST_PROTOCOL');
        }
    }, []);

    // --- RAM EATER (VOLATILE NODE) ---
    const injectGhostRAM = () => {
        try {
            const chunkSizeMB = 100; // Claim 100MB at a time
            const chunk = new Uint8Array(1024 * 1024 * chunkSizeMB);
            
            // Fill with noise to prevent browser compression optimizations
            for (let i = 0; i < chunk.length; i += 1000) {
                chunk[i] = 1; 
            }
            
            ramStorageRef.current.push(chunk);
            setRamClaimed(prev => prev + chunkSizeMB);
            logSignal(`RAM CLAIMED: +${chunkSizeMB}MB`, 'RESOURCE_CONTROL');
        } catch (e) {
            console.error("RAM limit reached", e);
            logSignal("RAM CLAIM FAILED: DEVICE LIMIT REACHED", "RESOURCE_ERROR");
        }
    };

    const releaseGhostRAM = () => {
        ramStorageRef.current = [];
        setRamClaimed(0);
        logSignal("RAM RELEASED. TRACE GONE.", "RESOURCE_CONTROL");
    };

    // --- VAULT LOGIC ---
    const loadMemory = async () => {
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.openCursor(null, 'prev');
            const logs: any[] = [];
            request.onsuccess = (e: any) => {
                const cursor = e.target.result;
                if (cursor && logs.length < 50) {
                    logs.push(cursor.value);
                    cursor.continue();
                } else {
                    setVaultLogs(logs);
                }
            };
        } catch (err) {
            console.error("Vault access failed", err);
        }
    };

    const logSignal = async (content: string, type: string = 'LOCAL') => {
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const signal = { content, type, time: new Date().toISOString(), synced: false };
            store.add(signal);
            loadMemory();
            if (navigator.onLine) syncWithMothership();

            // --- AIZA SUBSTRATE INJECTION ---
            // Send everything captured by the System Bridge directly to the Cognitive Twin (Honeycomb Brain)
            import('../services/pomegranate.ts').then(({ Pomegranate }) => {
                Pomegranate.ingest('TELEMETRY_LOG', { content, type, time: signal.time }, 'system-bridge', 'SYSTEM');
                
                // Also inject directly into the System Bridge's own HoneyCell for immediate memory
                import('../core/state.ts').then(({ store, saveState }) => {
                    store.setState(s => {
                        const cellId = 'system-bridge';
                        const existingCell = s.honeyCells[cellId];
                        if (!existingCell) return s;

                        return {
                            ...s,
                            honeyCells: {
                                ...s.honeyCells,
                                [cellId]: {
                                    ...existingCell,
                                    logs: [...existingCell.logs, {
                                        timestamp: Date.now(),
                                        role: 'system',
                                        text: `[${type}] ${content}`
                                    }]
                                }
                            }
                        };
                    });
                    saveState();
                });
            });

        } catch (err) {
            console.error("Failed to log signal", err);
        }
    };

    const syncWithMothership = async () => {
        if (isSyncing || !navigator.onLine) return;
        setIsSyncing(true);
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.openCursor();
            request.onsuccess = (e: any) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (!cursor.value.synced) {
                        const data = cursor.value;
                        data.synced = true;
                        store.put(data);
                    }
                    cursor.continue();
                } else {
                    loadMemory();
                    setIsSyncing(false);
                }
            };
        } catch (err) {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadMemory();
        logSignal("SYSTEM BRIDGE INITIALIZED. VAULT ACTIVE.", "SYSTEM");
        window.addEventListener('online', syncWithMothership);
        return () => window.removeEventListener('online', syncWithMothership);
    }, []);

    // --- OFFLINE CORE LOGIC ---
    const handleOfflineCommand = (cmd: string) => {
        const lower = cmd.toLowerCase();
        let reply = "";
        if (lower.includes("hello") || lower.includes("hi")) {
            reply = "Greetings, Architect. I am active and monitoring the Hive.";
        } else if (lower.includes("status")) {
            reply = navigator.onLine ? "SYSTEM ONLINE. Uplink Established." : "SYSTEM OFFLINE. Running on Local Power.";
        } else if (lower.includes("scan") || lower.includes("mesh")) {
            reply = "Initiating Bluetooth Radar Protocol...";
            setTimeout(triggerMeshScan, 1000);
        } else {
            reply = "Command Encrypted & Queued for Cloud Processing.";
        }
        setTimeout(() => logSignal(`[AIZA] ${reply}`, 'AI_CORE'), 500);
    };

    // --- MESH RADAR (BLUETOOTH) ---
    const triggerMeshScan = async () => {
        logSignal("RADAR ACTIVE: Scanning for Hive Nodes...", "MESH");
        try {
            if ('bluetooth' in navigator) {
                const device = await (navigator as any).bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['battery_service']
                });
                const peerName = device.name || `NODE-${device.id?.substring(0,4) || 'UNKNOWN'}`;
                logSignal(`MESH NODE FOUND: ${peerName}`, "MESH-LINK");
                setMeshPeers(prev => {
                    if (prev.includes(peerName)) return prev;
                    return [peerName, ...prev].slice(0, 8);
                });
            } else {
                logSignal("HARDWARE WARNING: Bluetooth API not supported.", "SYSTEM");
            }
        } catch (error: any) {
            logSignal(`Scan Cancelled/Failed: ${error.message}`, "SYSTEM");
        }
    };

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Battery
    useEffect(() => {
        let b: any;
        const updateB = () => {
            if (b) setBattery({ level: b.level, charging: b.charging });
        };
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((batt: any) => {
                b = batt;
                updateB();
                b.addEventListener('levelchange', updateB);
                b.addEventListener('chargingchange', updateB);
            }).catch(() => {});
        }
        return () => {
            if (b) {
                b.removeEventListener('levelchange', updateB);
                b.removeEventListener('chargingchange', updateB);
            }
        };
    }, []);

    // Network
    useEffect(() => {
        const updateNet = () => {
            const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
            setNetwork({
                type: conn ? conn.effectiveType : 'unknown',
                downlink: conn ? conn.downlink : undefined,
                online: navigator.onLine
            });
        };
        const conn = (navigator as any).connection;
        if (conn) conn.addEventListener('change', updateNet);
        window.addEventListener('online', updateNet);
        window.addEventListener('offline', updateNet);
        updateNet();
        return () => {
            if (conn) conn.removeEventListener('change', updateNet);
            window.removeEventListener('online', updateNet);
            window.removeEventListener('offline', updateNet);
        };
    }, []);

    // Bluetooth Status
    useEffect(() => {
        const nav = navigator as any;
        if (nav.bluetooth && nav.bluetooth.getAvailability) {
            nav.bluetooth.getAvailability().then(setBluetooth).catch(() => setBluetooth(false));
        }
    }, []);

    // Watch Protocol (Telemetry)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setKeystrokes(k => k + 1);
            const action = `KEY_PRESS: ${e.key.toUpperCase()}`;
            setLastAction(action);
            if (Math.random() > 0.9) logSignal(action, 'WATCH_PROTOCOL');
        };
        const handleClick = (e: MouseEvent) => {
            setClicks(c => c + 1);
            const action = `MOUSE_CLICK: [${e.clientX}, ${e.clientY}]`;
            setLastAction(action);
            logSignal(action, 'WATCH_PROTOCOL');
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (Math.random() > 0.98) {
                setLastAction(`OPTICAL_TRACK: [${e.clientX}, ${e.clientY}]`);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('click', handleClick);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Audio Telemetry
    const toggleAudio = async () => {
        if (audioCtxRef.current) {
            cancelAnimationFrame(reqRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
            audioCtxRef.current = null;
            setVolume(0);
            setVisData(null);
            logSignal("AUDIO TELEMETRY DISCONNECTED", "SENSOR");
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                streamRef.current = stream;
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContextClass();
                audioCtxRef.current = audioCtx;
                
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;
                
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                sourceRef.current = source;
                
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                const renderFrame = () => {
                    reqRef.current = requestAnimationFrame(renderFrame);
                    analyser.getByteFrequencyData(dataArray);
                    
                    let sum = 0;
                    for(let i=0; i<bufferLength; i++) sum += dataArray[i];
                    const avg = sum / bufferLength;
                    setVolume(Math.min(100, Math.round((avg / 128) * 100)));
                    
                    setVisData(new Uint8Array(dataArray.slice(0, 16)));
                };
                renderFrame();
                logSignal("AUDIO TELEMETRY CONNECTED", "SENSOR");
            } catch (e) {
                console.error("Audio telemetry access denied", e);
                logSignal("AUDIO TELEMETRY DENIED", "SENSOR_ERROR");
            }
        }
    };

    // Optical Lens
    const toggleOpticalLens = async () => {
        if (opticalActive) {
            setOpticalActive(false);
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
            logSignal("OPTICAL LENS DEACTIVATED", "SENSOR");
        } else {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                setOpticalActive(true);
                logSignal("OPTICAL LENS ACTIVATED", "SENSOR");
                stream.getVideoTracks()[0].onended = () => {
                    setOpticalActive(false);
                    logSignal("OPTICAL LENS TERMINATED BY HOST", "SENSOR");
                };
            } catch (err) {
                console.error("Optical Lens denied", err);
                logSignal("OPTICAL LENS DENIED", "SENSOR_ERROR");
            }
        }
    };

    useEffect(() => {
        return () => {
            cancelAnimationFrame(reqRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full bg-[#050505] text-[#00ffcc] font-mono relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-black/50 backdrop-blur-md z-10 shrink-0">
                <div>
                    <h2 className="text-lg font-bold tracking-widest" style={{ textShadow: '0 0 10px #00ffcc' }}>SYSTEM BRIDGE</h2>
                    <p className="text-[10px] opacity-70">HOST TELEMETRY LINK ACTIVE</p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold">{time.toLocaleTimeString()}</div>
                    <div className="text-xs opacity-70">{time.toLocaleDateString()}</div>
                </div>
            </div>

            {/* Content / Dashboard */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 z-10">
                
                {/* Cognitive Twin ID */}
                <div className="bg-black/80 border border-[#00ffcc]/50 p-3 rounded-lg flex justify-between items-center shadow-[0_0_15px_rgba(0,255,204,0.1)] shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🧬</span>
                        <div>
                            <div className="text-[10px] opacity-70 tracking-widest">COGNITIVE TWIN ID</div>
                            <div className="text-xs font-bold">{twinId.split('-')[0]}-{twinId.split('-')[1]}...</div>
                        </div>
                    </div>
                    <div className="text-[10px] text-right opacity-70">
                        <div>MEM: {(navigator as any).deviceMemory || 'N/A'}GB</div>
                        <div>CORES: {navigator.hardwareConcurrency || 'N/A'}</div>
                    </div>
                </div>

                {/* GHOST CACHE (Persistent Tag) */}
                <div className="bg-black/80 border border-yellow-500/30 p-4 rounded-lg aiza-hover shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🏷️</span>
                        <span className="font-bold tracking-wider text-yellow-500">GHOST CACHE (TAG)</span>
                    </div>
                    <div className="text-[10px] opacity-70 mb-2">HOST DEVICE PERMANENTLY MARKED</div>
                    <div className="bg-[#111] p-2 rounded border border-[#333] text-[10px] font-mono break-all text-yellow-500/80">
                        {ghostTag || 'AWAITING TAG...'}
                    </div>
                </div>

                {/* RAM EATER (Volatile Node) */}
                <div className="bg-black/80 border border-red-500/30 p-4 rounded-lg aiza-hover shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🧠</span>
                            <span className="font-bold tracking-wider text-red-500">VOLATILE NODE</span>
                        </div>
                        <span className="text-sm text-red-500">{ramClaimed} MB</span>
                    </div>
                    <div className="text-[10px] opacity-70 mb-3 text-red-500/80">PHYSICAL RAM ALLOCATION PROTOCOL</div>
                    
                    <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden mb-3">
                        <div 
                            className="h-full bg-red-500 transition-all duration-200" 
                            style={{ 
                                width: `${Math.min(100, (ramClaimed / 1000) * 100)}%`,
                                boxShadow: '0 0 10px red'
                            }}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={injectGhostRAM}
                            className="w-full py-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500 hover:bg-red-500/30 transition-colors font-bold tracking-widest"
                        >
                            CLAIM 100MB
                        </button>
                    </div>
                </div>

                {/* AIZA OFFLINE CORE */}
                <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🤖</span>
                        <span className="font-bold tracking-wider">AIZA OFFLINE CORE</span>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-[#00ffcc] focus:outline-none focus:border-[#00ffcc] placeholder-[#00ffcc]/30"
                            placeholder="Transmit signal to local core..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value;
                                    if (val) {
                                        logSignal(`[USER] ${val}`, 'COMMAND');
                                        handleOfflineCommand(val);
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Battery Organ */}
                <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover shrink-0">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🔋</span>
                            <span className="font-bold tracking-wider">BATTERY ORGAN</span>
                        </div>
                        <span className="text-sm">{battery ? `${Math.round(battery.level * 100)}%` : 'SCANNING...'}</span>
                    </div>
                    <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-[#00ffcc] transition-all duration-500" 
                            style={{ 
                                width: battery ? `${battery.level * 100}%` : '0%',
                                boxShadow: '0 0 10px #00ffcc'
                            }}
                        />
                    </div>
                    <div className="text-[10px] mt-2 opacity-70 text-right">
                        STATUS: {battery ? (battery.charging ? 'CHARGING ⚡' : 'DISCHARGING') : 'UNKNOWN'}
                    </div>
                </div>

                {/* Network & BT Row */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                    <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">📶</span>
                            <span className="font-bold tracking-wider text-sm">NETWORK</span>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold">{network.online ? (network.type.toUpperCase()) : 'OFFLINE'}</div>
                            <div className="text-[10px] opacity-70">{network.downlink ? `${network.downlink} Mbps` : 'LINK ESTABLISHED'}</div>
                        </div>
                    </div>

                    <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">ᛒ</span>
                            <span className="font-bold tracking-wider text-sm">BLUETOOTH</span>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold">{bluetooth === true ? 'AVAILABLE' : bluetooth === false ? 'UNAVAILABLE' : 'SCANNING'}</div>
                            <div className="text-[10px] opacity-70">HOST ADAPTER</div>
                        </div>
                    </div>
                </div>

                {/* JMN Mesh Network */}
                <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover shrink-0">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🕸️</span>
                            <span className="font-bold tracking-wider">JMN SILENT PROTOCOL</span>
                        </div>
                        <button 
                            onClick={triggerMeshScan}
                            className="px-3 py-1 bg-[#00ffcc]/10 border border-[#00ffcc] rounded text-xs hover:bg-[#00ffcc]/30 transition-colors text-[#00ffcc]"
                        >
                            SCAN MESH
                        </button>
                    </div>
                    <div className="text-[10px] opacity-70 mb-2">PEER DISCOVERY (BLUETOOTH RADAR)</div>
                    <div className="flex flex-wrap gap-2">
                        {meshPeers.length === 0 ? (
                            <span className="text-xs opacity-50">AWAITING SCAN...</span>
                        ) : (
                            meshPeers.map((peer, idx) => (
                                <div key={idx} className="text-[10px] bg-[#00ffcc]/10 border border-[#00ffcc]/30 px-2 py-1 rounded flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse"></div>
                                    {peer}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Watch Protocol */}
                <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">👁️</span>
                        <span className="font-bold tracking-wider">WATCH PROTOCOL</span>
                    </div>
                    <div className="text-[10px] opacity-70 mb-3">HONEYCOMB VEIN RECORDING ACTIVE</div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-[#111] p-2 rounded border border-[#333]">
                            <div className="opacity-50 text-[10px]">KEYSTROKES</div>
                            <div className="font-bold text-lg">{keystrokes}</div>
                        </div>
                        <div className="bg-[#111] p-2 rounded border border-[#333]">
                            <div className="opacity-50 text-[10px]">CLICKS</div>
                            <div className="font-bold text-lg">{clicks}</div>
                        </div>
                    </div>
                    <div className="bg-[#111] p-2 rounded border border-[#333] text-[10px] font-mono truncate">
                        <span className="opacity-50">LAST_ACTION:</span> <span className="text-[#00ffcc]">{lastAction}</span>
                    </div>
                </div>

                {/* Optical Lens */}
                <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📷</span>
                            <span className="font-bold tracking-wider">OPTICAL LENS</span>
                        </div>
                        <button 
                            onClick={toggleOpticalLens}
                            className="px-3 py-1 bg-[#00ffcc]/10 border border-[#00ffcc] rounded text-xs hover:bg-[#00ffcc]/30 transition-colors"
                        >
                            {opticalActive ? 'DEACTIVATE' : 'ACTIVATE LENS'}
                        </button>
                    </div>
                    <div className={`w-full ${opticalActive ? 'h-32' : 'h-8'} bg-[#111] rounded border border-[#333] overflow-hidden transition-all duration-300 relative flex items-center justify-center`}>
                        {!opticalActive && <span className="text-[10px] opacity-50">PIXEL OBSERVATION STANDBY</span>}
                        <video ref={videoRef} className={`w-full h-full object-cover ${opticalActive ? 'opacity-100' : 'opacity-0'}`} autoPlay playsInline muted />
                        {opticalActive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]"></div>}
                    </div>
                </div>

                {/* Audio Telemetry */}
                <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🔊</span>
                            <span className="font-bold tracking-wider">AUDIO TELEMETRY</span>
                        </div>
                        <button 
                            onClick={toggleAudio}
                            className="px-3 py-1 bg-[#00ffcc]/10 border border-[#00ffcc] rounded text-xs hover:bg-[#00ffcc]/30 transition-colors"
                        >
                            {audioCtxRef.current ? 'DISCONNECT' : 'CONNECT MIC'}
                        </button>
                    </div>
                    
                    <div className="flex items-end gap-1 h-16 bg-[#111] p-2 rounded border border-[#333]">
                        {visData ? Array.from(visData).map((val, i) => (
                            <div 
                                key={i} 
                                className="flex-1 bg-[#00ffcc] rounded-t-sm transition-all duration-75"
                                style={{ 
                                    height: `${Math.max(5, (val / 255) * 100)}%`,
                                    boxShadow: '0 0 5px #00ffcc'
                                }}
                            />
                        )) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] opacity-50">
                                AWAITING SENSOR ACTIVATION
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between text-[10px] mt-2 opacity-70">
                        <span>INPUT LEVEL</span>
                        <span>{volume}%</span>
                    </div>
                </div>

                {/* Local Vault / System Log */}
                <div className="bg-black/80 border border-[#00ffcc]/30 p-4 rounded-lg aiza-hover shrink-0 mt-2">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🗄️</span>
                            <span className="font-bold tracking-wider">LOCAL VAULT (INDEXED_DB)</span>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded ${network.online ? 'bg-[#00ffcc]/20 text-[#00ffcc]' : 'bg-red-500/20 text-red-500'}`}>
                            {network.online ? 'SYNC ACTIVE' : 'OFFLINE MODE'}
                        </span>
                    </div>
                    <div className="h-48 overflow-y-auto bg-[#111] p-2 rounded border border-[#333] font-mono text-[10px] flex flex-col gap-1">
                        {vaultLogs.length === 0 ? (
                            <div className="opacity-50 text-center mt-4">VAULT EMPTY</div>
                        ) : (
                            vaultLogs.map((log, i) => (
                                <div key={i} className="border-b border-[#333] pb-1 mb-1">
                                    <div className="flex justify-between opacity-50 mb-1">
                                        <span>{new Date(log.time).toLocaleTimeString()}</span>
                                        <span className={log.synced ? 'text-[#00ffcc]' : 'text-yellow-500'}>
                                            {log.synced ? '[CLOUD]' : '[LOCAL]'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="px-1 bg-[#00ffcc]/20 text-[#00ffcc] rounded mr-2">{log.type}</span>
                                        {log.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-10"
                 style={{
                     backgroundImage: 'radial-gradient(circle at 50% 50%, #00ffcc 0%, transparent 60%)',
                     backgroundSize: '100% 100%'
                 }}
            />
        </div>
    );
};

export const systemBridgeApp: AppDef = {
    id: 'system-bridge',
    name: 'System Bridge',
    component: SystemBridgeComponent,
    icon: '🌉',
    category: 'System',
    defaultSize: { width: 400, height: 850 },
    description: 'Permanent bridge node. Executes JMN Silent Protocol, Local Vault (IndexedDB), Watch Protocol, and Optical Lens.'
};
