
import React, { useState, useRef, useEffect } from 'react';
import { AppDef } from '../core/state.ts';
import { fs } from '../core/FileSystem.ts';
import { addNotification } from '../core/windowManager.ts';
import { PermissionHandler } from '../core/PermissionHandler.ts';

const CameraComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        const initCamera = async () => {
            try {
                const mediaStream = await PermissionHandler.requestMediaAccess({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                setError("OPTIC_LINK_FAILED: Permission Denied or Hardware Missing.");
            }
        };
        initCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        // Trigger Flash Effect
        setFlash(true);
        setTimeout(() => setFlash(false), 150);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Draw current frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Add Timestamp Overlay
            ctx.fillStyle = '#00ffcc';
            ctx.font = '20px "JetBrains Mono"';
            ctx.fillText(`AIZA_OPTIC // ${new Date().toLocaleString()}`, 20, canvas.height - 20);

            // Convert to DNA (Base64)
            const dataUrl = canvas.toDataURL('image/png');
            
            // Save to VFS
            const filename = `capture_${Date.now()}.png`;
            fs.createFile(filename, 'desktop', dataUrl);
            
            addNotification(`OPTIC_CAPTURE: ${filename} synthesized to Desktop.`);
        }
    };

    return React.createElement('div', { 
        style: { 
            height: '100%', background: '#000', display: 'flex', 
            flexDirection: 'column', position: 'relative', overflow: 'hidden' 
        } 
    },
        error ? React.createElement('div', { style: { color: '#ff3333', padding: '40px', textAlign: 'center' } }, error) :
        React.createElement('div', { style: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' } },
            React.createElement('video', { 
                ref: videoRef, 
                autoPlay: true, 
                playsInline: true,
                style: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' } 
            }),
            
            // Flash Overlay
            React.createElement('div', { 
                style: {
                    position: 'absolute', inset: 0, background: '#fff',
                    opacity: flash ? 0.8 : 0, transition: 'opacity 0.1s', pointerEvents: 'none'
                }
            }),

            // HUD Overlay
            React.createElement('div', { 
                style: { 
                    position: 'absolute', inset: '20px', border: '2px dashed rgba(0,255,204,0.3)', 
                    pointerEvents: 'none', borderRadius: '12px' 
                } 
            },
                React.createElement('div', { style: { position: 'absolute', top: '10px', left: '10px', color: '#00ffcc', fontSize: '10px', fontWeight: 'bold' } }, 'REC ● LIVE'),
                React.createElement('div', { style: { position: 'absolute', top: '0', left: '50%', transform: 'translate(-50%, -50%)', background: '#000', padding: '0 10px', color: '#00ffcc', fontSize: '10px' } }, 'OPTIC_SENSOR')
            )
        ),
        
        // Controls
        React.createElement('div', { style: { height: '80px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #222' } },
            React.createElement('button', { 
                onClick: takePhoto,
                style: { 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    background: '#fff', border: '4px solid #333', outline: '2px solid #00ffcc',
                    cursor: 'pointer', transition: 'transform 0.1s'
                },
                className: 'shutter-btn'
            })
        ),
        
        React.createElement('canvas', { ref: canvasRef, style: { display: 'none' } }),
        React.createElement('style', null, `
            .shutter-btn:active { transform: scale(0.9); background: #ccc; }
        `)
    );
};

export const cameraApp: AppDef = {
    id: 'camera',
    name: 'Optic Capture',
    component: CameraComponent,
    icon: '📷',
    category: 'Utility',
    defaultSize: { width: 800, height: 600 },
    description: 'Hardware bridge for capturing visual reality fragments directly into the VFS.'
};
