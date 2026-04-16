
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { Network } from 'lucide-react';
import { addNotification } from '../core/windowManager.ts';
import Peer, { DataConnection } from 'peerjs';

interface MeshNode {
    id: string;
    x: number;
    y: number;
    type: 'SELF' | 'PEER' | 'GHOST';
    status: 'ACTIVE' | 'DORMANT' | 'LOCKED';
    distance: number;
    angle: number;
    lastPing: number;
    signalQuality: number; // 0 to 1
    connectedTo: string[]; // IDs of other nodes it's connected to
}

const NeuralFabricComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // --- IDENTITY GENERATION (SHARED) ---
    const [meshId] = useState(() => {
        let id = localStorage.getItem('JMN_PERMANENT_ID');
        if (!id) id = localStorage.getItem('JMN_DEVICE_ID');
        if (!id) {
            id = "NODE_" + Math.random().toString(36).substr(2, 6).toUpperCase();
            localStorage.setItem('JMN_PERMANENT_ID', id);
        }
        return id;
    });

    const [bioToken] = useState(() => localStorage.getItem('JMN_BIO_TOKEN') ? 'VERIFIED' : 'PENDING');
    const [peerCount, setPeerCount] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
    
    // WebRTC State
    const [targetPeerId, setTargetPeerId] = useState('');
    const peerInstance = useRef<Peer | null>(null);
    const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
    
    // Simulation Ref for Animation Loop
    const peersRef = useRef<MeshNode[]>([]);
    const packetsRef = useRef<{from: MeshNode, to: MeshNode, progress: number, color: string}[]>([]);

    // --- WEBRTC INITIALIZATION ---
    useEffect(() => {
        const peer = new Peer(meshId, {
            debug: 2
        });

        peer.on('open', (id) => {
            console.log('[WEBRTC] My peer ID is: ' + id);
            addNotification(`WEBRTC_ONLINE: Identity ${id} registered.`);
        });

        peer.on('connection', (conn) => {
            setupConnection(conn);
        });

        peer.on('error', (err) => {
            console.error('[WEBRTC ERROR]', err);
            addNotification(`WEBRTC_ERROR: ${err.type}`);
        });

        peerInstance.current = peer;

        return () => {
            peer.destroy();
        };
    }, [meshId]);

    const setupConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            addNotification(`PEER_CONNECTED: ${conn.peer}`);
            connectionsRef.current.set(conn.peer, conn);
            addRealPeerNode(conn.peer);
            
            // Announce presence
            conn.send({ type: 'SYNC_PRESENCE', id: meshId });
        });

        conn.on('data', (data: any) => {
            if (data.type === 'SYNC_PRESENCE') {
                addRealPeerNode(data.id);
            } else if (data.type === 'PING') {
                triggerIncomingPacket(data.from);
            }
        });

        conn.on('close', () => {
            addNotification(`PEER_DISCONNECTED: ${conn.peer}`);
            connectionsRef.current.delete(conn.peer);
            removePeerNode(conn.peer);
        });
    };

    const connectToPeer = () => {
        if (!targetPeerId || !peerInstance.current) return;
        if (targetPeerId === meshId) {
            addNotification("CANNOT_CONNECT_TO_SELF");
            return;
        }
        addNotification(`CONNECTING_TO: ${targetPeerId}...`);
        const conn = peerInstance.current.connect(targetPeerId);
        setupConnection(conn);
        setTargetPeerId('');
    };

    const sendPingToAll = () => {
        connectionsRef.current.forEach(conn => {
            conn.send({ type: 'PING', from: meshId });
            triggerOutgoingPacket(conn.peer);
        });
        if (connectionsRef.current.size === 0) {
            addNotification("NO_PEERS_CONNECTED");
        }
    };

    const addRealPeerNode = (id: string) => {
        if (peersRef.current.some(p => p.id === id)) return;
        
        const newNode: MeshNode = {
            id,
            x: 0, y: 0,
            type: 'PEER',
            status: 'ACTIVE',
            distance: 150 + Math.random() * 100, 
            angle: Math.random() * Math.PI * 2,
            lastPing: Date.now(),
            signalQuality: 0.9 + Math.random() * 0.1,
            connectedTo: []
        };
        peersRef.current.push(newNode);
        setPeerCount(peersRef.current.length);
    };

    const removePeerNode = (id: string) => {
        peersRef.current = peersRef.current.filter(p => p.id !== id);
        setPeerCount(peersRef.current.length);
    };

    const triggerIncomingPacket = (fromId: string) => {
        const sourceNode = peersRef.current.find(p => p.id === fromId);
        if (!sourceNode) return;
        
        const selfNode: MeshNode = { 
            id: 'SELF', x: 0, y: 0, type: 'SELF', status: 'ACTIVE', 
            distance: 0, angle: 0, lastPing: 0, signalQuality: 1.0, connectedTo: [] 
        };
        
        packetsRef.current.push({
            from: sourceNode,
            to: selfNode,
            progress: 0,
            color: '#ff00ff'
        });
        addNotification(`INCOMING_PING_FROM: ${fromId}`);
    };

    const triggerOutgoingPacket = (toId: string) => {
        const targetNode = peersRef.current.find(p => p.id === toId);
        if (!targetNode) return;
        
        const selfNode: MeshNode = { 
            id: 'SELF', x: 0, y: 0, type: 'SELF', status: 'ACTIVE', 
            distance: 0, angle: 0, lastPing: 0, signalQuality: 1.0, connectedTo: [] 
        };
        
        packetsRef.current.push({
            from: selfNode,
            to: targetNode,
            progress: 0,
            color: '#00ffcc'
        });
    };

    useEffect(() => {
        // Initialize Ghost Peers for visual effect if no real peers
        const loadGhosts = () => {
            if (peersRef.current.length > 0) return;
            const count = 3;
            const ghosts = Array.from({ length: count }, (_, i) => ({
                id: `GHOST_${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                x: 0, 
                y: 0,
                type: 'GHOST' as const,
                status: 'ACTIVE' as const,
                distance: 100 + Math.random() * 200,
                angle: (Math.PI * 2 * i) / count,
                lastPing: Date.now(),
                signalQuality: 0.3 + Math.random() * 0.4,
                connectedTo: []
            }));
            peersRef.current = ghosts;
            setPeerCount(ghosts.length);
        };

        loadGhosts();

        // Background Packet Generator for Ghosts
        const packetInterval = setInterval(() => {
            if (peersRef.current.length === 0) return;
            const ghosts = peersRef.current.filter(p => p.type === 'GHOST');
            if (ghosts.length === 0) return;

            const target = ghosts[Math.floor(Math.random() * ghosts.length)];
            const isIncoming = Math.random() > 0.5;
            const selfNode: MeshNode = { 
                id: 'SELF', x: 0, y: 0, type: 'SELF', status: 'ACTIVE', 
                distance: 0, angle: 0, lastPing: 0, signalQuality: 1.0, connectedTo: [] 
            };
            
            packetsRef.current.push({
                from: isIncoming ? target : selfNode,
                to: isIncoming ? selfNode : target,
                progress: 0,
                color: isIncoming ? 'rgba(0, 255, 204, 0.5)' : 'rgba(255, 170, 0, 0.5)'
            });
        }, 2000);

        return () => {
            clearInterval(packetInterval);
        };
    }, []);

    const triggerRadarScan = async () => {
        setIsScanning(true);
        addNotification("MESH_RADAR: Scanning local spectrum...");

        setTimeout(() => {
            setIsScanning(false);
            addNotification("SCAN_COMPLETE: Awaiting manual peer connections.");
        }, 2000);
    };

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d')!;
        let animationFrame: number;
        let scanAngle = 0;
        let noiseOffset = 0;

        const render = () => {
            const w = canvasRef.current!.width;
            const h = canvasRef.current!.height;
            const cx = w / 2;
            const cy = h / 2;

            // Clear & Fade
            ctx.fillStyle = 'rgba(2, 4, 8, 0.2)';
            ctx.fillRect(0, 0, w, h);

            // Radar Grid
            ctx.strokeStyle = isScanning ? 'rgba(255, 50, 50, 0.2)' : 'rgba(0, 255, 204, 0.1)';
            ctx.lineWidth = 1;
            [100, 200, 300].forEach(r => {
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
            });
            
            // Crosshairs
            ctx.beginPath(); ctx.moveTo(cx - 350, cy); ctx.lineTo(cx + 350, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - 350); ctx.lineTo(cx, cy + 350); ctx.stroke();

            // Radar Scanner
            scanAngle += isScanning ? 0.08 : 0.02;
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(scanAngle);
            const grad = ctx.createLinearGradient(0, 0, 320, 0);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(1, isScanning ? 'rgba(255, 50, 50, 0.5)' : 'rgba(0, 255, 204, 0.3)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 320, 0, 0.25); ctx.fill();
            ctx.restore();

            // Signal Noise (During Scan)
            if (isScanning) {
                noiseOffset += 1;
                for (let i = 0; i < 5; i++) {
                    const r = 50 + Math.random() * 250;
                    const th = Math.random() * Math.PI * 2;
                    const nx = cx + Math.cos(th) * r;
                    const ny = cy + Math.sin(th) * r;
                    ctx.fillStyle = Math.random() > 0.5 ? '#ff3333' : '#fff';
                    ctx.fillRect(nx, ny, 2, 2);
                }
            }

            // Render SELF NODE
            ctx.fillStyle = isScanning ? '#ff3333' : '#00ffcc';
            ctx.shadowBlur = 20; ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            
            // Pulse Effect for Self
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            ctx.strokeStyle = `rgba(${isScanning ? '255, 50, 50' : '0, 255, 204'}, ${1 - pulse})`;
            ctx.beginPath(); ctx.arc(cx, cy, 8 + pulse * 30, 0, Math.PI * 2); ctx.stroke();

            // Render PEERS
            peersRef.current.forEach(peer => {
                // Orbital Motion
                peer.angle += 0.0005; 
                peer.x = cx + Math.cos(peer.angle) * peer.distance;
                peer.y = cy + Math.sin(peer.angle) * peer.distance;

                const isActive = peer.id === activeTargetId;

                // 1. Draw Mesh Connections (Peer-to-Peer)
                peer.connectedTo.forEach(targetId => {
                    const target = peersRef.current.find(n => n.id === targetId);
                    if (target) {
                        const dist = Math.hypot(peer.x - target.x, peer.y - target.y);
                        if (dist < 400) {
                            const strength = (peer.signalQuality + target.signalQuality) / 2;
                            ctx.beginPath();
                            ctx.moveTo(peer.x, peer.y);
                            ctx.lineTo(target.x, target.y);
                            
                            // Dynamic signal quality visualization
                            const dashOffset = (Date.now() / 50) % 20;
                            ctx.setLineDash([5, 15]);
                            ctx.lineDashOffset = -dashOffset * strength;
                            
                            ctx.strokeStyle = `rgba(0, 255, 204, ${0.2 * strength * (1 - dist / 400)})`;
                            ctx.lineWidth = 1 + strength * 2;
                            ctx.stroke();
                            ctx.setLineDash([]);
                            
                            // Signal "pulses" along the connection
                            if (Math.random() < 0.02 * strength) {
                                const p = Math.random();
                                const px = peer.x + (target.x - peer.x) * p;
                                const py = peer.y + (target.y - peer.y) * p;
                                ctx.fillStyle = '#fff';
                                ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
                            }
                        }
                    }
                });

                // 2. Draw Connection Line to SELF
                const distSq = (peer.x - cx)**2 + (peer.y - cy)**2;
                const opacity = Math.max(0, 1 - distSq / 100000);
                
                // Active Laser Link
                if (isActive) {
                    ctx.strokeStyle = '#ff00ff';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#ff00ff';
                    ctx.shadowBlur = 15;
                } else {
                    ctx.strokeStyle = peer.type === 'GHOST' ? `rgba(255, 0, 255, ${opacity * 0.3})` : `rgba(0, 255, 204, ${opacity * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.shadowBlur = 0;
                }

                if (peer.type === 'GHOST') ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(peer.x, peer.y); ctx.stroke();
                ctx.setLineDash([]);

                // Draw Node
                ctx.fillStyle = isActive ? '#ff00ff' : (peer.type === 'GHOST' ? '#ff00ff' : '#00ffcc');
                if (peer.status === 'LOCKED' || isActive) {
                    ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
                }
                ctx.beginPath(); ctx.arc(peer.x, peer.y, isActive ? 6 : 4, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                
                // Label
                ctx.fillStyle = isActive ? '#fff' : 'rgba(255,255,255,0.7)';
                ctx.font = isActive ? 'bold 11px "JetBrains Mono"' : '9px "JetBrains Mono"';
                ctx.fillText(peer.id, peer.x + 10, peer.y);
            });

            // Render PACKETS
            packetsRef.current.forEach((pkt, i) => {
                pkt.progress += 0.02;
                if (pkt.progress >= 1) {
                    packetsRef.current.splice(i, 1);
                    return;
                }

                const startX = pkt.from.type === 'SELF' ? cx : pkt.from.x;
                const startY = pkt.from.type === 'SELF' ? cy : pkt.from.y;
                const endX = pkt.to.type === 'SELF' ? cx : pkt.to.x;
                const endY = pkt.to.type === 'SELF' ? cy : pkt.to.y;

                const currX = startX + (endX - startX) * pkt.progress;
                const currY = startY + (endY - startY) * pkt.progress;

                ctx.fillStyle = pkt.color;
                ctx.shadowBlur = 10; ctx.shadowColor = pkt.color;
                ctx.beginPath(); ctx.arc(currX, currY, 3, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            });

            animationFrame = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrame);
    }, [isScanning, activeTargetId]);

    const resizeCanvas = () => {
        if (canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
            canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
        }
    };

    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    return React.createElement('div', { style: { height: '100%', background: '#000', color: '#00ffcc', position: 'relative', overflow: 'hidden', fontFamily: "'JetBrains Mono', monospace" } },
        React.createElement('canvas', { ref: canvasRef, style: { width: '100%', height: '100%', display: 'block' } }),
        
        // HUD Overlay
        React.createElement('div', { style: { position: 'absolute', top: '20px', left: '20px', pointerEvents: 'none' } },
            React.createElement('div', { style: { fontSize: '12px', fontWeight: 900, letterSpacing: '4px', color: isScanning ? '#ff3333' : '#00ffcc', textShadow: '0 0 10px currentColor' } }, isScanning ? 'RADAR_SCAN_ACTIVE' : 'NEURAL_FABRIC // MESH_VISUALIZER'),
            React.createElement('div', { style: { fontSize: '14px', marginTop: '5px', fontWeight: 'bold', color: '#fff' } }, `MY ID: ${meshId}`),
            React.createElement('div', { style: { fontSize: '10px', opacity: 0.7 } }, `BIO_TOKEN: ${bioToken}`),
        ),

        React.createElement('div', { style: { position: 'absolute', bottom: '20px', right: '20px', textAlign: 'right', pointerEvents: 'none' } },
            React.createElement('div', { style: { fontSize: '32px', fontWeight: 900, color: '#fff' } }, peerCount),
            React.createElement('div', { style: { fontSize: '10px', letterSpacing: '2px', color: '#00ffcc' } }, 'ACTIVE_SHADOW_NODES'),
            React.createElement('div', { style: { fontSize: '10px', marginTop: '5px', color: '#ff00ff' } }, 'PROTOCOL: EAGLE_369_ENCRYPTED')
        ),

        // Controls
        React.createElement('div', { style: { position: 'absolute', bottom: '20px', left: '20px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '10px' } },
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                React.createElement('input', {
                    value: targetPeerId,
                    onChange: (e: any) => setTargetPeerId(e.target.value),
                    placeholder: "ENTER PEER ID",
                    style: {
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid #00ffcc',
                        color: '#00ffcc',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        outline: 'none',
                        width: '150px'
                    }
                }),
                React.createElement('button', {
                    onClick: connectToPeer,
                    style: {
                        background: 'rgba(0, 255, 204, 0.2)',
                        border: '1px solid #00ffcc',
                        color: '#00ffcc',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontWeight: 900,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }
                }, 'LINK'),
                React.createElement('button', {
                    onClick: sendPingToAll,
                    style: {
                        background: 'rgba(255, 0, 255, 0.2)',
                        border: '1px solid #ff00ff',
                        color: '#ff00ff',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontWeight: 900,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }
                }, 'PING ALL')
            ),
            React.createElement('button', {
                onClick: triggerRadarScan,
                disabled: isScanning,
                style: {
                    background: isScanning ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 204, 0.1)',
                    border: `1px solid ${isScanning ? '#ff0000' : '#00ffcc'}`,
                    color: isScanning ? '#ff0000' : '#00ffcc',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '11px',
                    letterSpacing: '1px',
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
                    transition: 'all 0.3s'
                }
            }, isScanning ? 'SCANNING_SPECTRUM...' : 'INITIATE_RADAR_SCAN')
        ),

        // Corner Decorations
        React.createElement('div', { style: { position: 'absolute', top: '0', left: '0', width: '50px', height: '50px', borderTop: '2px solid #00ffcc', borderLeft: '2px solid #00ffcc' } }),
        React.createElement('div', { style: { position: 'absolute', top: '0', right: '0', width: '50px', height: '50px', borderTop: '2px solid #00ffcc', borderRight: '2px solid #00ffcc' } }),
        React.createElement('div', { style: { position: 'absolute', bottom: '0', left: '0', width: '50px', height: '50px', borderBottom: '2px solid #00ffcc', borderLeft: '2px solid #00ffcc' } }),
        React.createElement('div', { style: { position: 'absolute', bottom: '0', right: '0', width: '50px', height: '50px', borderBottom: '2px solid #00ffcc', borderRight: '2px solid #00ffcc' } })
    );
};

export const neuralFabricApp: AppDef = {
    id: 'neural-fabric',
    name: 'Neural Fabric',
    component: NeuralFabricComponent,
    icon: React.createElement(Network, { size: 20, color: '#00ffcc' }),
    category: 'System',
    defaultSize: { width: 800, height: 700 },
    description: 'Holographic visualization of the Jubaer Mycelial Network (Shadow Mesh). Tracks peer nodes and data packets.'
};
