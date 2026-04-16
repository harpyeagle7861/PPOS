import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { openApp, addNotification } from '../core/windowManager.ts';

// --- 1. DATA ARCHITECTURE ---

interface Node {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    label: string;
    icon: string | any;
    color: string;
    category: string;
    isSystem: boolean;
    pinned: boolean;
    flashAlpha: number;
}

interface Link {
    source: Node;
    target: Node;
}

interface SavedLayout {
    id: string;
    name: string;
    timestamp: number;
    nodes: { id: string; x: number; y: number; pinned: boolean }[];
}

// --- CONFIGURATION ---
const CFG = {
    REPULSION: 6000,
    SPRING_LEN: 180,
    SPRING_K: 0.002,
    FRICTION: 0.90,
    CENTER_GRAVITY: 0.0002,
    COLORS: {
        VOID: '#000000',
        GOLD: '#FFD700',
        ORANGE: '#FF4500',
        CYAN: '#00FFCC',
        SYSTEM: '#FF00FF',
        TEXT: '#FFFFFF'
    }
};

const SpiderVaultComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [resonanceColor, setResonanceColor] = useState(CFG.COLORS.CYAN);
    
    // Layout State
    const [layouts, setLayouts] = useState<SavedLayout[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('AIZA_SPIDER_LAYOUTS') || '[]');
        } catch { return []; }
    });
    const [showLayouts, setShowLayouts] = useState(false);
    const [layoutName, setLayoutName] = useState('');

    // Physics State Refs (Mutable for performance)
    const nodesRef = useRef<Node[]>([]);
    const linksRef = useRef<Link[]>([]);
    const draggedNodeRef = useRef<Node | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);
    const clickTimeoutRef = useRef<any>(null); 

    // --- NODE FACTORY ---
    const createNode = (app: AppDef, x?: number, y?: number, pinned?: boolean): Node => {
        return {
            id: app.id,
            x: x ?? (600 + (Math.random() - 0.5) * 200),
            y: y ?? (450 + (Math.random() - 0.5) * 200),
            vx: 0, vy: 0,
            radius: 35,
            label: app.name,
            icon: app.icon,
            color: pinned ? CFG.COLORS.ORANGE : (app.category === 'System' ? CFG.COLORS.SYSTEM : CFG.COLORS.GOLD),
            category: app.category,
            isSystem: app.category === 'System',
            pinned: pinned ?? false,
            flashAlpha: 1.0
        };
    };

    // --- INITIALIZATION ---
    useEffect(() => {
        const state = store.getState();
        const allApps = Object.values(state.apps) as AppDef[];
        
        // 1. Resonance Color
        const bpm = state.neuralHeartRate || 72;
        setResonanceColor(bpm > 110 ? '#ff3333' : (bpm > 90 ? '#bd00ff' : CFG.COLORS.CYAN));

        // 2. Load Position State
        let savedState: Record<string, { x: number, y: number, pinned: boolean }> = {};
        try {
            const raw = localStorage.getItem('AIZA_SPIDER_STATE');
            if (raw) {
                const arr = JSON.parse(raw);
                arr.forEach((n: any) => savedState[n.id] = n);
            }
        } catch {}

        // 3. Create Core Node
        const coreNode: Node = {
            id: 'AIZA_CORE', x: 600, y: 450, vx: 0, vy: 0,
            radius: 55, label: 'AIZA', icon: '🧿',
            color: resonanceColor, category: 'CORE', isSystem: true,
            pinned: true, flashAlpha: 0
        };

        // 4. Create App Nodes
        const appNodes = allApps.map((app, i) => {
            const saved = savedState[app.id];
            if (saved) {
                return createNode(app, saved.x, saved.y, saved.pinned);
            } else {
                const angle = (i / allApps.length) * Math.PI * 2;
                const dist = 300;
                return createNode(app, 600 + Math.cos(angle) * dist, 450 + Math.sin(angle) * dist, false);
            }
        });

        nodesRef.current = [coreNode, ...appNodes];
        rebuildLinks();

        // 5. Store Subscription for New Apps (Genesis Protocol Support)
        const unsub = store.subscribe((s) => {
            const currentIds = new Set(nodesRef.current.map(n => n.id));
            const freshApps = Object.values(s.apps) as AppDef[];
            let added = false;

            freshApps.forEach(app => {
                if (!currentIds.has(app.id)) {
                    // New App Detected! Spawn it.
                    const angle = Math.random() * Math.PI * 2;
                    const newNode = createNode(app, 600 + Math.cos(angle) * 300, 450 + Math.sin(angle) * 300, false);
                    nodesRef.current.push(newNode);
                    added = true;
                    addNotification(`SPIDER_VAULT: New Node "${app.name}" Integrated.`);
                }
            });

            if (added) rebuildLinks();
            
            // Update Heartrate Color
            const newBpm = s.neuralHeartRate || 72;
            const newColor = newBpm > 110 ? '#ff3333' : (newBpm > 90 ? '#bd00ff' : CFG.COLORS.CYAN);
            setResonanceColor(newColor);
            if (nodesRef.current[0]) nodesRef.current[0].color = newColor;
        });

        return () => unsub();
    }, []);

    const rebuildLinks = () => {
        const core = nodesRef.current.find(n => n.id === 'AIZA_CORE');
        if (!core) return;

        const links: Link[] = [];
        const others = nodesRef.current.filter(n => n.id !== 'AIZA_CORE');

        // Link everything to Core
        others.forEach(n => links.push({ source: core, target: n }));

        // Link by Category (Cluster effect)
        for (let i = 0; i < others.length; i++) {
            for (let j = i + 1; j < others.length; j++) {
                if (others[i].category === others[j].category) {
                    links.push({ source: others[i], target: others[j] });
                }
            }
        }
        linksRef.current = links;
    };

    // Auto-Save Loop
    useEffect(() => {
        const interval = setInterval(() => {
            if (nodesRef.current.length > 0) {
                const state = nodesRef.current.map(n => ({ id: n.id, x: n.x, y: n.y, pinned: n.pinned }));
                localStorage.setItem('AIZA_SPIDER_STATE', JSON.stringify(state));
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // --- PHYSICS LOOP ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;

        const loop = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const time = Date.now();

            // 1. PHYSICS
            nodesRef.current.forEach(node => {
                if (node.pinned && node !== draggedNodeRef.current) return;

                // Center Gravity
                const dx = centerX - node.x;
                const dy = centerY - node.y;
                node.vx += dx * CFG.CENTER_GRAVITY;
                node.vy += dy * CFG.CENTER_GRAVITY;

                // Repulsion
                nodesRef.current.forEach(other => {
                    if (node === other) return;
                    const rx = node.x - other.x;
                    const ry = node.y - other.y;
                    const distSq = rx * rx + ry * ry || 1;
                    const force = CFG.REPULSION / distSq;
                    const dist = Math.sqrt(distSq);
                    node.vx += (rx / dist) * force;
                    node.vy += (ry / dist) * force;
                });

                node.vx *= CFG.FRICTION;
                node.vy *= CFG.FRICTION;
            });

            // Spring Links
            linksRef.current.forEach(link => {
                const dx = link.target.x - link.source.x;
                const dy = link.target.y - link.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist - CFG.SPRING_LEN) * CFG.SPRING_K;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (!link.source.pinned) { link.source.vx += fx; link.source.vy += fy; }
                if (!link.target.pinned) { link.target.vx -= fx; link.target.vy -= fy; }
            });

            // Move
            nodesRef.current.forEach(node => {
                if (draggedNodeRef.current === node) {
                    node.x = mousePos.current.x;
                    node.y = mousePos.current.y;
                    node.vx = 0; node.vy = 0;
                } else if (!node.pinned) {
                    node.x += node.vx;
                    node.y += node.vy;
                }
                
                // Bounds
                const pad = node.radius + 10;
                if (node.x < pad) { node.x = pad; node.vx *= -1; }
                if (node.x > width - pad) { node.x = width - pad; node.vx *= -1; }
                if (node.y < pad) { node.y = pad; node.vy *= -1; }
                if (node.y > height - pad) { node.y = height - pad; node.vy *= -1; }

                if (node.flashAlpha > 0) node.flashAlpha -= 0.05;
            });

            // 2. RENDER
            ctx.fillStyle = CFG.COLORS.VOID;
            ctx.fillRect(0, 0, width, height);

            // Links
            linksRef.current.forEach(link => {
                const isVisible = activeCategory === 'ALL' || 
                    (link.source.category === activeCategory || link.source.category === 'CORE') &&
                    (link.target.category === activeCategory || link.target.category === 'CORE');
                
                const alpha = isVisible ? 0.2 : 0.02;
                ctx.globalAlpha = alpha + (Math.sin(time * 0.003) * 0.05);
                
                const grad = ctx.createLinearGradient(link.source.x, link.source.y, link.target.x, link.target.y);
                grad.addColorStop(0, resonanceColor);
                grad.addColorStop(1, link.target.color);
                
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(link.source.x, link.source.y);
                ctx.lineTo(link.target.x, link.target.y);
                ctx.stroke();
            });
            ctx.globalAlpha = 1.0;

            // Nodes
            nodesRef.current.forEach(node => {
                const isMatch = activeCategory === 'ALL' || node.category === activeCategory || node.category === 'CORE';
                const isSearch = !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase());
                const visible = isMatch && isSearch;
                
                ctx.globalAlpha = visible ? 1.0 : 0.1;
                const isHovered = hoveredNode?.id === node.id;
                const scale = isHovered ? 1.2 : 1.0;

                // Glow
                if (isHovered && visible) {
                    ctx.shadowBlur = 30; ctx.shadowColor = node.color;
                } else if (node.flashAlpha > 0) {
                    ctx.shadowBlur = 30 * node.flashAlpha; ctx.shadowColor = '#fff';
                } else if (node.category === 'CORE') {
                    ctx.shadowBlur = 20 + Math.sin(time * 0.005) * 15; ctx.shadowColor = resonanceColor;
                } else {
                    ctx.shadowBlur = 0;
                }

                // Body
                const grad = ctx.createRadialGradient(node.x - 10, node.y - 10, 5, node.x, node.y, node.radius * scale);
                grad.addColorStop(0, node.flashAlpha > 0 ? '#fff' : '#fff');
                grad.addColorStop(0.3, node.color);
                grad.addColorStop(1, '#000');
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Pinned Ring
                if (node.pinned && !node.isSystem) {
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(node.x, node.y, node.radius * scale + 4, 0, Math.PI * 2); ctx.stroke();
                }

                // Icon & Text
                ctx.fillStyle = '#fff';
                ctx.font = `${node.radius * scale}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                
                // Fix: Handle icon safely
                let iconText = '📦';
                if (typeof node.icon === 'string') {
                    iconText = node.icon;
                } else if (node.label) {
                    iconText = node.label.charAt(0).toUpperCase();
                }
                
                ctx.fillText(iconText, node.x, node.y + 2);

                if (visible) {
                    ctx.font = '10px "JetBrains Mono"';
                    ctx.fillStyle = isHovered ? '#fff' : node.color;
                    ctx.fillText(node.label.toUpperCase(), node.x, node.y + node.radius + 15);
                }
            });
            ctx.globalAlpha = 1.0;

            animationFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [activeCategory, searchQuery, hoveredNode, resonanceColor]);

    // --- INTERACTION ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const r = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const hit = nodesRef.current.find(n => Math.sqrt((n.x - x)**2 + (n.y - y)**2) < n.radius);
        if (hit) draggedNodeRef.current = hit;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const r = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        mousePos.current = { x, y };
        
        const hit = nodesRef.current.find(n => Math.sqrt((n.x - x)**2 + (n.y - y)**2) < n.radius);
        if (hit !== hoveredNode) setHoveredNode(hit || null);
        if (hit) setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => { draggedNodeRef.current = null; };

    const handleClick = (e: React.MouseEvent) => {
        const r = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const hit = nodesRef.current.find(n => Math.sqrt((n.x - x)**2 + (n.y - y)**2) < n.radius);

        if (hit) {
            if (clickTimeoutRef.current) {
                // Double Click: Toggle Pin
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;
                if (!hit.isSystem) {
                    hit.pinned = !hit.pinned;
                    hit.color = hit.pinned ? CFG.COLORS.ORANGE : (hit.category === 'System' ? CFG.COLORS.SYSTEM : CFG.COLORS.GOLD);
                    addNotification(hit.pinned ? `ANCHORED: ${hit.label}` : `RELEASED: ${hit.label}`);
                }
            } else {
                // Single Click: Open App with Visual Feedback
                hit.flashAlpha = 1.0; // Trigger flash
                addNotification(`NODE_ACTIVATED: ${hit.label}`);
                
                clickTimeoutRef.current = setTimeout(() => {
                    openApp(hit.id);
                    clickTimeoutRef.current = null;
                }, 250);
            }
        }
    };

    // --- LAYOUTS ---
    const saveLayout = () => {
        if (!layoutName.trim()) return;
        const layout: SavedLayout = {
            id: `layout_${Date.now()}`,
            name: layoutName,
            timestamp: Date.now(),
            nodes: nodesRef.current.map(n => ({ id: n.id, x: n.x, y: n.y, pinned: n.pinned }))
        };
        const next = [layout, ...layouts];
        setLayouts(next);
        localStorage.setItem('AIZA_SPIDER_LAYOUTS', JSON.stringify(next));
        setLayoutName('');
        addNotification(`NEURAL_ARCHITECT: Snapshot "${layout.name}" crystallized.`);
    };

    const loadLayout = (layout: SavedLayout) => {
        const map = new Map(layout.nodes.map(n => [n.id, n]));
        nodesRef.current.forEach(n => {
            const s = map.get(n.id);
            if (s) {
                n.x = s.x; n.y = s.y; n.pinned = s.pinned;
                n.vx = 0; n.vy = 0;
                n.color = n.pinned ? CFG.COLORS.ORANGE : (n.isSystem ? CFG.COLORS.SYSTEM : CFG.COLORS.GOLD);
            }
        });
        addNotification(`NEURAL_ARCHITECT: Loading "${layout.name}"...`);
    };

    const deleteLayout = (id: string) => {
        const next = layouts.filter(l => l.id !== id);
        setLayouts(next);
        localStorage.setItem('AIZA_SPIDER_LAYOUTS', JSON.stringify(next));
    };

    const resetGrid = () => {
        if (confirm("Reset Grid Entropy?")) {
            localStorage.removeItem('AIZA_SPIDER_STATE');
            window.location.reload();
        }
    };

    // --- RENDER ---
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden', fontFamily: "'JetBrains Mono', monospace" }}>
            
            {/* TOP LEFT HUD */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                <div style={{ color: resonanceColor, fontSize: '12px', fontWeight: 900, letterSpacing: '2px', textShadow: `0 0 10px ${resonanceColor}` }}>SPIDER_VAULT // SOLAR_NAV</div>
                <div style={{ color: '#fff', fontSize: '10px', opacity: 0.6, marginTop: '5px' }}>NODES: {nodesRef.current.length} // HEARTBEAT: {store.getState().neuralHeartRate} BPM</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                    <button onClick={() => setShowLayouts(!showLayouts)} className="aiza-btn-hover" style={{ background: 'rgba(0,255,204,0.1)', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                        {showLayouts ? 'CLOSE_ARCHITECT' : 'NEURAL_ARCHITECT'}
                    </button>
                    <button onClick={resetGrid} className="aiza-btn-hover" style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid #FF4500', color: '#FF4500', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                        RESET_GRID
                    </button>
                </div>
            </div>

            {/* NEURAL ARCHITECT PANEL */}
            {showLayouts && (
                <div style={{ 
                    position: 'absolute', top: 100, left: 20, width: '260px', 
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', 
                    border: '1px solid rgba(0,255,204,0.3)', borderRadius: '12px', 
                    padding: '20px', zIndex: 20, animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
                }}>
                    <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', marginBottom: '15px', letterSpacing: '1px' }}>LAYOUT_MEMORY_BANK</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <input 
                            value={layoutName} onChange={e => setLayoutName(e.target.value)}
                            placeholder="SNAPSHOT_NAME..."
                            style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#fff', padding: '8px', fontSize: '10px', borderRadius: '4px', outline: 'none' }}
                        />
                        <button onClick={saveLayout} style={{ background: '#00ffcc', color: '#000', border: 'none', borderRadius: '4px', padding: '0 12px', cursor: 'pointer', fontWeight: 'bold' }}>💾</button>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {layouts.length === 0 && <div style={{ fontSize: '10px', color: '#555', textAlign: 'center' }}>NO_ARCHIVES</div>}
                        {layouts.map(l => (
                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px' }}>
                                <div onClick={() => loadLayout(l)} style={{ cursor: 'pointer', flex: 1 }}>
                                    <div style={{ color: '#00ffcc', fontSize: '11px', fontWeight: 'bold' }}>{l.name}</div>
                                    <div style={{ color: '#666', fontSize: '8px' }}>{new Date(l.timestamp).toLocaleDateString()}</div>
                                </div>
                                <button onClick={() => deleteLayout(l.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CATEGORY FILTER */}
            <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '20px', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                {['ALL', 'SYSTEM', 'UTILITY', 'COMMUNICATION', 'CREATIVE'].map(cat => (
                    <button 
                        key={cat} onClick={() => setActiveCategory(cat)}
                        className="aiza-btn-hover"
                        style={{
                            background: activeCategory === cat ? resonanceColor : 'transparent',
                            color: activeCategory === cat ? '#000' : '#888',
                            border: 'none', padding: '6px 12px', borderRadius: '12px',
                            fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: '0.3s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* TOP RIGHT SEARCH */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                <input 
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="FILTER_NODES..."
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,255,204,0.3)', padding: '10px 15px', color: '#00ffcc', borderRadius: '20px', outline: 'none', textAlign: 'right', width: '200px' }}
                />
            </div>

            {/* TOOLTIP */}
            {hoveredNode && (
                <div style={{
                    position: 'fixed', left: tooltipPos.x + 20, top: tooltipPos.y - 20,
                    background: 'rgba(0,0,0,0.9)', border: `1px solid ${hoveredNode.color}`,
                    borderRadius: '8px', padding: '12px', pointerEvents: 'none', zIndex: 100,
                    boxShadow: `0 0 20px ${hoveredNode.color}44`
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: hoveredNode.color }}>{hoveredNode.label}</div>
                    <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>CAT: {hoveredNode.category}</div>
                    <div style={{ fontSize: '8px', color: '#666', marginTop: '8px' }}>DOUBLE-CLICK TO {hoveredNode.pinned ? 'UNANCHOR' : 'ANCHOR'}</div>
                </div>
            )}

            <canvas 
                ref={canvasRef} width={1200} height={900} 
                onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp} onClick={handleClick}
                style={{ width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }} 
            />

            <style>{`@keyframes slideIn { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
    );
};

export const spiderVaultApp: AppDef = {
    id: 'spider-vault',
    name: 'Spider Vault',
    component: SpiderVaultComponent,
    icon: '🕸️',
    category: 'System',
    defaultSize: { width: 900, height: 700 },
    description: 'Spatial Neural OS Navigator using Force-Directed physics and solar reactor aesthetics.'
};