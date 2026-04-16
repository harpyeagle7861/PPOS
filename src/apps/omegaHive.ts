
import React, { useEffect, useRef, useState } from 'react';
import { AppDef } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';

declare const Peer: any;

const HIVE_STYLES = `
.omega-hive-root {
    --primary: #00ffcc;
    --bg: #000;
    --glass: rgba(10, 20, 20, 0.9);
    --alert: #ff0055;
    --gold: #FFD700;
    font-family: 'Courier New', monospace;
    background: var(--bg);
    color: var(--primary);
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

/* 1. THE PARTICLE FIELD */
.omega-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    transition: opacity 1s;
}

/* 2. THE HUD */
.omega-interface {
    position: absolute;
    z-index: 10;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.core-ring {
    width: 250px;
    height: 250px;
    border: 1px solid rgba(0, 255, 204, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(0, 255, 204, 0.1);
    animation: breathe 9s infinite ease-in-out;
    backdrop-filter: blur(2px);
    transition: all 0.5s ease;
}

@keyframes breathe {
    0% { transform: scale(1); box-shadow: 0 0 10px currentColor; }
    50% { transform: scale(1.05); box-shadow: 0 0 40px currentColor; }
    100% { transform: scale(1); box-shadow: 0 0 10px currentColor; }
}

.identity-text {
    font-size: 40px;
    font-weight: bold;
    letter-spacing: 5px;
    text-shadow: 0 0 10px currentColor;
}

.status-text {
    margin-top: 20px;
    font-size: 12px;
    opacity: 0.8;
    letter-spacing: 2px;
}

.symbiosis-text {
    margin-top: 5px;
    font-size: 10px;
    color: #888;
}

/* 4. THE MASTER TERMINAL */
.command-deck {
    pointer-events: auto;
    margin-top: 40px;
    width: 60%;
    max-width: 500px;
    background: rgba(0,0,0,0.8);
    border: 1px solid currentColor;
    padding: 10px;
    animation: slideUp 0.5s ease-out;
}

.omega-input {
    width: 100%;
    background: transparent;
    border: none;
    color: inherit;
    font-family: monospace;
    font-size: 14px;
    outline: none;
    padding: 5px;
}

.cmd-hint {
    font-size: 10px;
    opacity: 0.6;
    margin-top: 5px;
    text-align: right;
}

/* 5. SOS MODE */
.critical-mode .core-ring {
    border-color: red;
    animation: panic 0.5s infinite;
}

@keyframes panic {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
`;

interface TwinState {
    id: string | null;
    energy: number;
    cpu: number;
    role: 'PRIME' | 'GUEST' | 'HOST' | 'NEUTRAL';
    color: string;
}

const OmegaHiveComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    // --- COGNITIVE STATE ---
    const [twin, setTwin] = useState<TwinState>({
        id: null,
        energy: 1.0,
        cpu: 4,
        role: "NEUTRAL",
        color: "#00ffcc"
    });
    
    const [statusText, setStatusText] = useState("INITIALIZING COGNITIVE TWIN...");
    const [terminalInput, setTerminalInput] = useState("");
    const [targetNodeId, setTargetNodeId] = useState("");
    const [networkActive, setNetworkActive] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const peerRef = useRef<any>(null);
    const connectionsRef = useRef<any[]>([]);
    const frameRef = useRef<number>(0);

    // --- 1. THE AWAKENING ---
    useEffect(() => {
        const awaken = async () => {
            let energy = 1.0;
            let cpu = navigator.hardwareConcurrency || 4;

            try {
                // @ts-ignore
                if (navigator.getBattery) {
                    // @ts-ignore
                    const b = await navigator.getBattery();
                    energy = b.level;
                    b.addEventListener('levelchange', () => {
                        setTwin(prev => ({ ...prev, energy: b.level }));
                    });
                }
            } catch (e) { console.log("Bio-scan partial."); }

            // EVOLVE LOGIC
            let role: TwinState['role'] = "NEUTRAL";
            let color = "#00ffcc";
            let text = "STABLE: LINKED";

            if (energy < 0.3) {
                role = "HOST";
                color = "#ff0000";
                text = "CRITICAL: SEEKING SYMBIOSIS";
            } else if (energy > 0.7 && cpu >= 4) {
                role = "PRIME";
                color = "#FFD700";
                text = "PRIME: CORTEX ACTIVE (GOD MODE)";
            }

            setTwin(prev => ({ ...prev, energy, cpu, role, color }));
            setStatusText(text);
        };

        awaken();
        return () => {
            if (peerRef.current) peerRef.current.destroy();
            cancelAnimationFrame(frameRef.current);
        };
    }, []);

    // --- 2. THE MESH ---
    const requestNetwork = () => {
        if (confirm("PERMISSION_REQUEST: Establish Peer-to-Peer Mesh Connection?")) {
            setNetworkActive(true);
            initMesh();
        } else {
            addNotification("MESH_ACCESS: Denied.");
        }
    };

    const setupConnection = (conn: any) => {
        conn.on('open', () => {
            connectionsRef.current.push(conn);
            setStatusText(`LINK ESTABLISHED: ${conn.peer}`);
            addNotification(`MESH_NODE: Connected to ${conn.peer}`);
        });
        conn.on('data', (data: any) => {
            if (data.type === 'EXECUTE') {
                runReflex(data.code);
            }
        });
        conn.on('close', () => {
            connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
            addNotification(`MESH_NODE: Disconnected ${conn.peer}`);
        });
    };

    const initMesh = () => {
        if (typeof Peer === 'undefined') return;
        
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id: string) => {
            setTwin(prev => ({ ...prev, id }));
            addNotification(`NODE_IDENTITY: ${id}`);
        });

        peer.on('connection', (conn: any) => {
            setupConnection(conn);
        });
        
        peer.on('error', (err: any) => {
            console.error(err);
            setStatusText(`MESH_ERROR: ${err.type}`);
        });
    };

    const connectToNode = () => {
        if (!peerRef.current || !targetNodeId) return;
        setStatusText(`INITIATING LINK TO ${targetNodeId}...`);
        const conn = peerRef.current.connect(targetNodeId);
        setupConnection(conn);
        setTargetNodeId('');
    };

    // --- 3. THE TELEPATHY ---
    const checkInject = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            injectWill(terminalInput);
            setTerminalInput("");
        }
    };

    const injectWill = (code: string) => {
        // 1. Run on self
        runReflex(code);
        // 2. Broadcast
        if (connectionsRef.current.length > 0) {
            connectionsRef.current.forEach(c => c.send({ type: 'EXECUTE', code }));
            setStatusText(`BROADCASTING WILL TO ${connectionsRef.current.length} NODES...`);
        } else {
            setStatusText("EXECUTED LOCALLY (NO PEERS).");
        }
        setTimeout(() => setStatusText(twin.role === 'PRIME' ? "PRIME: CORTEX ACTIVE" : "STABLE: LINKED"), 2000);
    };

    const runReflex = (code: string) => {
        try {
            // eslint-disable-next-line
            eval(code);
            // Visual feedback
            const ring = document.querySelector('.core-ring') as HTMLElement;
            if (ring) {
                ring.style.transform = "scale(1.5)";
                setTimeout(() => ring.style.transform = "scale(1)", 200);
            }
        } catch (e) { console.error(e); }
    };

    // --- 4. THE VISUALS ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        
        let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

        const particleCount = twin.role === 'PRIME' ? 150 : (twin.role === 'HOST' ? 20 : 60);
        const pts = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * (twin.cpu / 2),
            vy: (Math.random() - 0.5) * (twin.cpu / 2),
            size: Math.random() * 2
        }));

        const animate = () => {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.strokeStyle = twin.color;
            ctx.lineWidth = 0.2;

            pts.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy;
                if(p.x < 0 || p.x > width) p.vx *= -1;
                if(p.y < 0 || p.y > height) p.vy *= -1;

                ctx.fillStyle = twin.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();

                // Connect
                for(let j = i; j < pts.length; j++) {
                    const dx = p.x - pts[j].x;
                    const dy = p.y - pts[j].y;
                    if(Math.sqrt(dx*dx + dy*dy) < 100) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
                    }
                }
            });
            frameRef.current = requestAnimationFrame(animate);
        };

        const resize = () => {
            width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };
        window.addEventListener('resize', resize);
        
        animate();
        return () => window.removeEventListener('resize', resize);
    }, [twin]);

    return React.createElement('div', { 
        className: `omega-hive-root ${twin.role === 'HOST' ? 'critical-mode' : ''}`,
        style: { color: twin.color }
    },
        React.createElement('style', null, HIVE_STYLES),
        React.createElement('canvas', { ref: canvasRef, className: 'omega-canvas' }),
        
        React.createElement('div', { className: 'omega-interface' },
            React.createElement('div', { className: 'core-ring', style: { color: twin.color, borderColor: `rgba(${twin.role === 'PRIME' ? '255, 215, 0' : '0, 255, 204'}, 0.2)` } },
                React.createElement('div', { className: 'identity-text' }, 'AIZA')
            ),
            
            React.createElement('div', { className: 'status-text' }, statusText),
            React.createElement('div', { className: 'symbiosis-text' }, 
                networkActive ? `NODE ID: ${twin.id ? twin.id : 'SEARCHING...'}` : 'NETWORK_OFFLINE'
            ),

            twin.role === 'PRIME' && React.createElement('div', { className: 'command-deck' },
                React.createElement('input', {
                    type: 'text',
                    className: 'omega-input',
                    placeholder: 'INJECT WILL (JavaScript)...',
                    value: terminalInput,
                    onChange: (e: any) => setTerminalInput(e.target.value),
                    onKeyDown: checkInject,
                    autoFocus: true
                }),
                
                !networkActive ? React.createElement('button', {
                    onClick: requestNetwork,
                    style: { width: '100%', marginTop: '10px', background: 'rgba(0,255,204,0.1)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px', cursor: 'pointer', fontWeight: 'bold' }
                }, 'ENABLE MESH NETWORK') :
                React.createElement('div', { style: { display: 'flex', marginTop: '10px', gap: '5px' } },
                    React.createElement('input', {
                        className: 'omega-input',
                        placeholder: 'TARGET NODE ID',
                        value: targetNodeId,
                        onChange: (e: any) => setTargetNodeId(e.target.value),
                        style: { border: '1px solid #333' }
                    }),
                    React.createElement('button', {
                        onClick: connectToNode,
                        style: { background: '#00ffcc', color: '#000', border: 'none', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer' }
                    }, 'LINK')
                ),

                React.createElement('div', { className: 'cmd-hint' }, 'PRESS ENTER TO EXECUTE')
            )
        )
    );
};

export const omegaHiveApp: AppDef = {
    id: 'omega-hive',
    name: 'Omega Hive',
    component: OmegaHiveComponent,
    icon: '⚡',
    category: 'System',
    defaultSize: { width: 900, height: 700 },
    description: 'The Ultimate Admin Panel. Controls the PeerJS Mesh, executes kernel commands, and monitors biological hardware states.'
};
