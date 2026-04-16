
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppDef, store, AppConnection } from '../core/state.ts';
import { openApp, closeWindow, addNotification, focusWindow, updateAppState } from '../core/windowManager.ts';

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => {
    return React.createElement('label', { 
        style: { 
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', 
            background: checked ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            padding: '10px 18px', borderRadius: '10px', border: `1px solid ${checked ? '#00ffcc' : '#333'}`,
            transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)', userSelect: 'none'
        } 
    },
        React.createElement('div', { 
            style: { 
                width: '32px', height: '18px', background: checked ? '#00ffcc' : '#222', 
                borderRadius: '10px', position: 'relative', transition: '0.3s' 
            } 
        },
            React.createElement('div', { 
                style: { 
                    width: '14px', height: '14px', background: checked ? '#000' : '#444', 
                    borderRadius: '50%', position: 'absolute', top: '2px', 
                    left: checked ? '16px' : '2px', transition: '0.3s' 
                } 
            })
        ),
        React.createElement('span', { style: { fontSize: '10px', fontWeight: 900, color: checked ? '#00ffcc' : '#666', letterSpacing: '2px' } }, label.toUpperCase()),
        React.createElement('input', { type: 'checkbox', checked, onChange, style: { display: 'none' } })
    );
};

const OSMapComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [osState, setOsState] = useState(store.getState());
    const [search, setSearch] = useState('');
    const [showOnlyRunning, setShowOnlyRunning] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);

    useEffect(() => {
        const unsubscribe = store.subscribe(s => {
            setOsState(s);
            // External E360 Restore Trigger
            const restoreData = s.appState['os-map']?.restoreLayout;
            if (restoreData) {
                setPositions(restoreData);
                updateAppState('os-map', { restoreLayout: null });
                addNotification("E360_SYNC: Neural Map Restored.");
            }
        });
        try {
            const savedLayout = localStorage.getItem('AIZA_OS_MAP_LAYOUT');
            if (savedLayout) setPositions(JSON.parse(savedLayout));
        } catch (e) {}
        return () => { unsubscribe(); };
    }, []);

    useEffect(() => {
        const apps = Object.values(osState.apps) as AppDef[];
        setPositions(prev => {
            const next = { ...prev };
            let added = false;
            apps.forEach((app, i) => {
                if (!next[app.id]) {
                    if (app.id === 'aiza') {
                        next[app.id] = { x: 500, y: 400 };
                    } else {
                        const angle = (i / apps.length) * Math.PI * 2;
                        next[app.id] = { x: 500 + Math.cos(angle) * 320, y: 400 + Math.sin(angle) * 320 };
                    }
                    added = true;
                }
            });
            return added ? next : prev;
        });
    }, [osState.apps]);

    const saveLayoutToLocalStorage = useCallback(() => {
        localStorage.setItem('AIZA_OS_MAP_LAYOUT', JSON.stringify(positions));
    }, [positions]);

    const handleSaveToLogos = () => {
        saveLayoutToLocalStorage();
        const name = prompt("E360_CODING: Name this Neural Fabric Snapshot?", `Map_${new Date().toLocaleTimeString()}`);
        if (!name) return;

        const snapshot = {
            id: `logos_map_${Date.now()}`,
            label: name.toUpperCase(),
            timestamp: Date.now(),
            type: 'MAP',
            payload: positions,
            preview: canvasRef.current?.toDataURL()
        };

        const currentRegistry = osState.appState['logos-key']?.registry || [];
        updateAppState('logos-key', { registry: [snapshot, ...currentRegistry] });
        addNotification("LOGOS_KEY: Map State Saved.");
    };

    const getMouseWorld = (e: { clientX: number, clientY: number }) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - offset.x) / zoom,
            y: (e.clientY - rect.top - offset.y) / zoom
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setContextMenu(null);
        const worldPos = getMouseWorld(e);
        
        const hit = (Object.entries(positions) as [string, {x: number, y: number}][]).find(([id, p]) => {
            if (showOnlyRunning && !osState.windows.some(w => w.appDef.id === id) && id !== 'aiza') return false;
            return Math.sqrt((p.x - worldPos.x)**2 + (p.y - worldPos.y)**2) < 50;
        });

        if (e.button === 2) {
            e.preventDefault();
            if (hit) setContextMenu({ x: e.clientX, y: e.clientY, id: hit[0] });
            return;
        }

        if (hit) {
            if (e.shiftKey) setLinkSourceId(hit[0]);
            else setDraggingId(hit[0]);
        } else {
            setIsPanning(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const worldPos = getMouseWorld(e);
        setMousePos(worldPos);

        if (draggingId) {
            setPositions(prev => ({ ...prev, [draggingId]: { x: worldPos.x, y: worldPos.y } }));
        } else if (isPanning) {
            setOffset(prev => ({ x: prev.x + (e.clientX - lastMouse.x), y: prev.y + (e.clientY - lastMouse.y) }));
            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        if (linkSourceId) {
            const hit = (Object.entries(positions) as [string, {x: number, y: number}][]).find(([id, p]) => {
                return id !== linkSourceId && Math.sqrt((p.x - mousePos.x)**2 + (p.y - mousePos.y)**2) < 50;
            });
            if (hit) {
                const newConn: AppConnection = {
                    id: `conn_${Date.now()}`,
                    fromId: linkSourceId,
                    toId: hit[0],
                    strength: 0.5,
                    protocol: 'AUTO_FORWARD',
                    score: 0,
                    lastActive: Date.now()
                };
                store.setState(s => ({ ...s, connections: [...s.connections, newConn] }));
            }
            setLinkSourceId(null);
        }
        if (draggingId) saveLayoutToLocalStorage();
        setDraggingId(null);
        setIsPanning(false);
    };

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d')!;
        let frame: number;

        const draw = () => {
            const w = canvasRef.current!.width;
            const h = canvasRef.current!.height;
            ctx.clearRect(0, 0, w, h);
            
            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.scale(zoom, zoom);

            const time = Date.now() / 1000;
            const aizaPos = positions['aiza'] || { x: 500, y: 400 };

            const isNodeVisible = (id: string) => {
                if (id === 'aiza') return true;
                const isRunning = osState.windows.some(w => w.appDef.id === id);
                if (showOnlyRunning && !isRunning) return false;
                const q = search.toLowerCase();
                if (search && !osState.apps[id]?.name.toLowerCase().includes(q)) return false;
                return true;
            };

            // 1. Draw Automation
            osState.connections.forEach(conn => {
                if (!isNodeVisible(conn.fromId) || !isNodeVisible(conn.toId)) return;
                const p1 = positions[conn.fromId];
                const p2 = positions[conn.toId];
                if (!p1 || !p2) return;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.bezierCurveTo(p1.x + (p2.x-p1.x)*0.5, p1.y, p1.x + (p2.x-p1.x)*0.5, p2.y, p2.x, p2.y);
                ctx.strokeStyle = '#ff00ff';
                ctx.setLineDash([5, 5]);
                ctx.lineDashOffset = -time * 15;
                ctx.stroke();
                ctx.setLineDash([]);
            });

            // 2. Draw Nodes
            Object.keys(osState.apps).forEach(id => {
                const pos = positions[id];
                if (!pos || !isNodeVisible(id)) return;
                const isRunning = osState.windows.some(w => w.appDef.id === id);
                const isFocused = osState.focusedWindowId && osState.windows.find(w => w.instanceId === osState.focusedWindowId)?.appDef.id === id;

                ctx.save();
                if (isFocused || id === 'aiza') { ctx.shadowBlur = 25; ctx.shadowColor = '#00ffcc'; }
                ctx.fillStyle = isRunning ? 'rgba(0,255,204,0.1)' : 'rgba(255,255,255,0.02)';
                ctx.strokeStyle = isFocused ? '#00ffcc' : (isRunning ? 'rgba(0,255,204,0.4)' : '#333');
                ctx.beginPath(); ctx.arc(pos.x, pos.y, id === 'aiza' ? 60 : 45, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '24px Arial'; 
                
                let iconText = '📦';
                const appIcon = osState.apps[id].icon;
                if (typeof appIcon === 'string') {
                    iconText = appIcon;
                } else if (osState.apps[id].name) {
                    iconText = osState.apps[id].name.charAt(0).toUpperCase();
                }
                
                ctx.fillText(iconText, pos.x, pos.y + 8);
                ctx.restore();
            });

            ctx.restore();
            frame = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(frame);
    }, [osState, positions, search, showOnlyRunning, zoom, offset]);

    return React.createElement('div' as any, { 
        style: { height: '100%', background: '#000', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace", display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        onContextMenu: (e: any) => e.preventDefault()
    } as any,
        React.createElement('div' as any, { style: { padding: '15px 25px', display: 'flex', gap: '20px', background: '#050505', borderBottom: '1px solid #1a1a1a', alignItems: 'center', zIndex: 10 } } as any,
            React.createElement('input' as any, {
                value: search, onChange: (e: any) => setSearch(e.target.value),
                placeholder: "QUERY_NODES...",
                style: { flex: 1, background: '#000', border: '1px solid #333', color: '#00ffcc', padding: '10px 15px', borderRadius: '6px' }
            } as any),
            React.createElement(Toggle, { label: "Running Only", checked: showOnlyRunning, onChange: () => setShowOnlyRunning(!showOnlyRunning) }),
            React.createElement('button' as any, { 
                onClick: handleSaveToLogos, 
                style: { background: '#00ffcc', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '4px', fontWeight: 900, cursor: 'pointer' } 
            } as any, 'GENERATE_LOGOS_KEY')
        ),
        
        React.createElement('canvas' as any, {
            ref: canvasRef, width: 1000, height: 800,
            onPointerDown: handleMouseDown, onPointerMove: handleMouseMove, onPointerUp: handleMouseUp,
            onWheel: (e: any) => setZoom(prev => Math.min(Math.max(0.2, prev + (e.deltaY > 0 ? -0.1 : 0.1)), 3)),
            style: { width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }
        } as any),

        contextMenu && React.createElement('div' as any, {
            style: { position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: '#080808', border: '1px solid #00ffcc', borderRadius: '10px', padding: '5px', zIndex: 10000, boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }
        } as any,
            React.createElement('div' as any, { 
                onClick: () => { openApp(contextMenu.id); setContextMenu(null); }, 
                style: { padding: '12px 20px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #1a1a1a' }
            } as any, '⚡ ENGAGE_PROTOCOL'),
            React.createElement('div' as any, { 
                onClick: () => { 
                    const wins = osState.windows.filter(w => w.appDef.id === contextMenu.id);
                    wins.forEach(w => closeWindow(w.instanceId));
                    setContextMenu(null); 
                }, 
                style: { padding: '12px 20px', cursor: 'pointer', fontSize: '11px', color: '#ff4d4d', borderBottom: '1px solid #1a1a1a' }
            } as any, '💀 TERMINATE_THREAD'),
            React.createElement('div' as any, { 
                onClick: () => { alert(`DNA_MANIFEST: ${osState.apps[contextMenu.id].name}\nDESC: ${osState.apps[contextMenu.id].description}`); setContextMenu(null); }, 
                style: { padding: '12px 20px', cursor: 'pointer', fontSize: '11px', opacity: 0.7 }
            } as any, '🧬 INSPECT_DNA')
        )
    );
};

export const osMapApp: AppDef = {
    id: 'os-map', name: 'System Map', component: OSMapComponent, icon: '🗺️', category: 'System', defaultSize: { width: 950, height: 750 },
    description: 'Autonomous Substrate Orchestrator. Interfaces with Logos Key for persistent E360 state snapshots.'
};
