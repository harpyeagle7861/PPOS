
import React, { useRef, useEffect, useState } from 'react';
import { AppDef, store } from '../core/state.ts';
import { updateAppState, addNotification, dispatchAppAction } from '../core/windowManager.ts';
import { fs } from '../core/FileSystem.ts';

const PaintComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [brushColor, setBrushColor] = useState('#00ffcc');
    const [brushSize, setBrushSize] = useState(5);
    const [zoom, setZoom] = useState(1);
    
    // State-backed ref for drawing access
    const stateRef = useRef({ brushColor, brushSize, zoom });
    useEffect(() => {
        stateRef.current = { brushColor, brushSize, zoom };
    }, [brushColor, brushSize, zoom]);

    const getCanvasState = () => canvasRef.current?.toDataURL('image/png');

    const saveHistory = () => {
        const currentData = getCanvasState();
        if (!currentData) return;
        const appState = store.getState().appState[instanceId] || {};
        const history = appState.history || [];
        // Limit history to 20 steps
        const newHistory = [...history, currentData].slice(-20);
        updateAppState(instanceId, { history: newHistory, redoStack: [] });
    };

    const handleUndo = () => {
        const appState = store.getState().appState[instanceId] || {};
        const history = [...(appState.history || [])];
        if (history.length <= 1) {
            addNotification("E360_SYNC: No previous states in buffer.");
            return;
        }
        const current = history.pop();
        const prev = history[history.length - 1];
        const redoStack = [current, ...(appState.redoStack || [])];
        
        redrawCanvas(prev);
        updateAppState(instanceId, { history, redoStack });
        addNotification("E360_UNDO: Neural fragment restored.");
    };

    const handleRedo = () => {
        const appState = store.getState().appState[instanceId] || {};
        const redoStack = [...(appState.redoStack || [])];
        if (redoStack.length === 0) return;
        
        const next = redoStack.shift();
        const history = [...(appState.history || []), next];
        
        redrawCanvas(next!);
        updateAppState(instanceId, { history, redoStack });
        addNotification("E360_REDO: Future state manifested.");
    };

    const redrawCanvas = (dataUrl: string) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        const img = new Image();
        img.onload = () => {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        };
        img.src = dataUrl;
    };

    const handleSaveToVFS = () => {
        const data = getCanvasState();
        if (!data) return;
        const filename = prompt("E360_VFS: Input chosen filename (PNG):", "aiza_manifest_visual");
        if (!filename) return;
        
        const finalName = filename.endsWith('.png') ? filename : `${filename}.png`;
        
        // Save to Virtual File System (Desktop)
        fs.createFile(finalName, 'desktop', data);
        
        addNotification(`E360_DISK: ${finalName} saved to Desktop.`);
    };

    const handleDownload = () => {
        const data = getCanvasState();
        if (!data) return;
        const link = document.createElement('a');
        link.download = `aiza_visual_${Date.now()}.png`;
        link.href = data;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification("E360_EXPORT: Visual manifestation downloaded to physical realm.");
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        const parent = canvas.parentElement!;
        const handleResize = () => {
            // Fix: Wrap in requestAnimationFrame to avoid ResizeObserver loop error
            window.requestAnimationFrame(() => {
                if (!canvas || !parent) return;
                const dpr = window.devicePixelRatio || 1;
                const rect = parent.getBoundingClientRect();
                // Store current image to restore after resize
                const temp = canvas.toDataURL();
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                ctx.scale(dpr, dpr);
                redrawCanvas(temp);
            });
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(parent);
        handleResize();
        
        // Initial history save
        setTimeout(saveHistory, 100);

        const unsubscribe = store.subscribe(newState => {
            const appState = newState.appState[instanceId] || {};
            if (appState.restoreData) {
                redrawCanvas(appState.restoreData);
                updateAppState(instanceId, { restoreData: null });
                saveHistory();
            }
            // AIZA remote control triggers
            if (appState.triggerUndo) { handleUndo(); updateAppState(instanceId, { triggerUndo: false }); }
            if (appState.triggerRedo) { handleRedo(); updateAppState(instanceId, { triggerRedo: false }); }
            if (appState.remoteZoom) { setZoom(appState.remoteZoom); updateAppState(instanceId, { remoteZoom: null }); }
        });

        const startDrawing = (e: MouseEvent) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        };

        const draw = (e: MouseEvent) => {
            if (!isDrawing) return;
            ctx.strokeStyle = stateRef.current.brushColor;
            ctx.lineWidth = stateRef.current.brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            [lastX, lastY] = [e.offsetX, e.offsetY];
        };

        const stopDrawing = () => { if (isDrawing) saveHistory(); isDrawing = false; };
        
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        return () => {
            resizeObserver.disconnect();
            unsubscribe();
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);
        };
    }, [instanceId]);

    const handleClear = () => {
        if (!window.confirm("E360_PURGE: Are you sure you want to dissolve all visual logic?")) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            const rect = canvas.parentElement!.getBoundingClientRect();
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveHistory();
        }
    };
    
    return React.createElement('div', { 
        style: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#050505', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace" },
        role: "region",
        "aria-label": "Quantum Paint Application"
    },
        React.createElement('div', { style: { padding: '12px', display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #1a1a1a' } },
            React.createElement('input', { 
                type: 'color', value: brushColor, onChange: e => setBrushColor(e.target.value), 
                title: "Select Brush Color", "aria-label": "Brush Color Picker",
                style: { width: '40px', height: '30px', background: 'none', border: '1px solid #333', cursor: 'pointer' } 
            }),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                React.createElement('label', { style: { fontSize: '8px', opacity: 0.9, fontWeight: 'bold' }, id: "brush-size-label" }, 'BRUSH_SIZE'),
                React.createElement('input', { 
                    type: 'range', min: 1, max: 50, value: brushSize, 
                    onChange: e => setBrushSize(Number(e.target.value)), 
                    "aria-labelledby": "brush-size-label",
                    style: { accentColor: '#00ffcc', width: '100px' } 
                })
            ),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                React.createElement('label', { style: { fontSize: '8px', opacity: 0.9, fontWeight: 'bold' }, id: "zoom-label" }, 'OPTIC_ZOOM'),
                React.createElement('input', { 
                    type: 'range', min: 0.5, max: 3, step: 0.1, value: zoom, 
                    onChange: e => setZoom(Number(e.target.value)), 
                    "aria-labelledby": "zoom-label",
                    style: { accentColor: '#ff00ff', width: '100px' } 
                })
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px', marginLeft: '10px' } },
                React.createElement('button', { onClick: handleUndo, "aria-label": "Undo visual change", style: styles.toolBtn }, '⟲'),
                React.createElement('button', { onClick: handleRedo, "aria-label": "Redo visual change", style: styles.toolBtn }, '⟳'),
                React.createElement('button', { onClick: handleClear, "aria-label": "Purge visual canvas", style: { ...styles.toolBtn, color: '#ff4d4d' } }, 'CLEAR'),
                React.createElement('button', { onClick: handleSaveToVFS, "aria-label": "Archive visual to VFS", style: { ...styles.toolBtn, color: '#00ccff' } }, 'SAVE (VFS)'),
                React.createElement('button', { onClick: handleDownload, "aria-label": "Download visual to Device", style: { ...styles.toolBtn, color: '#ff00ff' } }, 'EXPORT (File)')
            )
        ),
        React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'auto', background: '#000', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' } },
            React.createElement('div', { style: { transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 0 50px rgba(0,0,0,1)' } },
                React.createElement('canvas', { ref: canvasRef, style: { display: 'block', cursor: 'crosshair', background: '#000' }, "aria-label": "Painting Substrate" })
            )
        )
    );
};

const styles = {
    toolBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#00ffcc', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }
};

export const paintApp: AppDef = {
    id: 'paint',
    name: 'Paint',
    component: PaintComponent,
    icon: '🎨',
    category: 'Entertainment',
    defaultSize: { width: 800, height: 600 },
    description: 'Autonomous E360 Visual Manifestor. Equipped with Undo/Redo buffers, Optical Zoom, and Disk Export protocols.'
};
