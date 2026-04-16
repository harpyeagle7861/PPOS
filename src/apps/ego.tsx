import React, { useState, useRef, useEffect } from 'react';
import { AppDef, useAppStore } from '../core/state.ts';

const EgoCanvas: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId, isFocused }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const state = useAppStore(s => s);
    const clonedApps = state.egoClonedApps.map(id => state.apps[id]).filter(Boolean);

    // The 9 Fixed Organs
    const fixedOrgans = [
        { id: 'core-aiza', name: 'Aiza Intelligence', icon: '🧬' },
        { id: 'core-spider', name: 'Spider Vault', icon: '🕸️' },
        { id: 'core-genesis', name: 'Genesis Forge', icon: '⚙️' },
        { id: 'core-blockchain', name: 'System Blockchain', icon: '⛓️' },
        { id: 'core-vs360', name: 'VS360 Code', icon: '💻' },
        { id: 'core-agent', name: 'Agent Hub', icon: '🧠' },
        { id: 'core-soul', name: 'Soul Chat', icon: '🌌' },
        { id: 'core-neural', name: 'Neural Fabric', icon: '🧶' },
        { id: 'core-terra', name: 'Terra Resonance', icon: '🌍' },
    ];

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.1, scale * Math.exp(delta)), 5953773733); // Extreme zoom limit

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newX = mouseX - (mouseX - position.x) * (newScale / scale);
            const newY = mouseY - (mouseY - position.y) * (newScale / scale);

            setPosition({ x: newX, y: newY });
        }
        setScale(newScale);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        if (containerRef.current) {
            containerRef.current.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace" }}>
            
            {/* Emulator Banner */}
            <div style={{ borderBottom: '1px solid #00ffcc', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#050505', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', textShadow: '0 0 10px #00ffcc' }}>👁️ EGO</span>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Left Panel: System Blockchain Pipeline (Master Tree) */}
                <div style={{ width: '250px', borderRight: '1px solid rgba(0,255,204,0.3)', padding: '10px', display: 'flex', flexDirection: 'column', backgroundColor: '#020202', zIndex: 10 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '15px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px' }}>
                        ⛓️ SYSTEM BLOCKCHAIN PIPELINE
                    </div>
                    <div style={{ fontSize: '10px', color: '#00ff00', marginBottom: '10px' }}>[ MASTER TREE ]</div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
                        {fixedOrgans.map(organ => (
                            <div key={organ.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderLeft: '1px solid #00ffcc', backgroundColor: 'rgba(0,255,204,0.05)', marginBottom: '5px' }}>
                                <span style={{ fontSize: '16px' }}>{organ.icon}</span>
                                <span style={{ fontSize: '12px', color: '#00ffcc' }}>{organ.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Infinite Canvas */}
                <div 
                    ref={containerRef}
                    onWheel={handleWheel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                        flex: 1, position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab',
                        backgroundImage: 'radial-gradient(circle at center, rgba(0,255,204,0.3) 1px, transparent 1px)',
                        backgroundSize: `${50 * scale}px ${50 * scale}px`,
                        backgroundPosition: `${position.x}px ${position.y}px`,
                        backgroundColor: '#050505'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        width: '0', height: '0'
                    }}>
                        {/* Center Origin Marker */}
                        <div style={{ position: 'absolute', left: -100, top: -100, width: 200, height: 200, border: '1px dashed rgba(0,255,204,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                            <span style={{ fontSize: '10px', letterSpacing: '4px' }}>VOID_CENTER</span>
                        </div>

                        {/* Cloned Organs */}
                        {clonedApps.map((app, index) => {
                            const Component = app.component;
                            const x = (index % 3) * 1000 - 1000;
                            const y = Math.floor(index / 3) * 800 - 400;
                            return (
                                <div key={app.id} style={{
                                    position: 'absolute',
                                    left: x,
                                    top: y,
                                    width: app.defaultSize?.width || 800,
                                    height: app.defaultSize?.height || 600,
                                    backgroundColor: '#050505',
                                    border: '1px solid #00ffcc',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 0 30px rgba(0,255,204,0.2)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ padding: '10px', backgroundColor: '#111', borderBottom: '1px solid #00ffcc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span>{typeof app.icon === 'string' ? app.icon : '📦'}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00ffcc' }}>{app.name} (QUINARY MODE)</span>
                                    </div>
                                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                        <React.Suspense fallback={<div style={{ color: '#00ffcc', padding: '20px' }}>LOADING...</div>}>
                                            <Component instanceId={`ego-clone-${app.id}`} isFocused={false} />
                                        </React.Suspense>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const egoApp: AppDef = {
    id: 'ego-pipeline',
    name: 'Ego',
    component: EgoCanvas,
    icon: '👁️',
    category: 'System',
    defaultSize: { width: 1000, height: 700 },
    description: 'The Quinary Logic Quantum Emulator and base substrate of the Jetfoot OS.'
};
