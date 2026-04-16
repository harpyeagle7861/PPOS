
console.log(
  "%c STOP! %c\nThis is a Sovereign System (AIZA 786 OS).", 
  "color: red; font-size: 50px; font-weight: bold;", 
  "color: white; font-size: 16px; background: #222; padding: 10px;"
);

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { AppDef, store, WindowInstance, saveState, useAppStore } from './core/state.ts';
import { openApp, closeWindow, focusWindow, updateWindowPosition, minimizeWindow, toggleMaximize, togglePin, addNotification, updateWindowDimensions, snapWindow, toggleAizaLink, toggleAizaDrawer, toggleJMN, restoreWindow, addDesktopShortcut, removeDesktopShortcut, deleteAppPermanently } from './core/windowManager.ts';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts.ts';
import { TrinityEngine } from './system/TrinityEngine.ts';
import { System } from './core/SystemSpoof.ts';
import { Tower } from './services/virtualTower.ts'; // IMPORT TOWER
import { SovereignProvider } from './context/SovereignContext.tsx';
import { callGeminiStream } from './services/gemini.ts';
import { JMNCheatCodes } from './components/JMNCheatCodes.tsx';

// LAZY LOADING WIDGETS FOR PERFORMANCE
const BioQuantumBackground = React.lazy(() => import('./components/BioQuantumBackground.tsx'));
const AmbientSound = React.lazy(() => import('./components/AmbientSound.tsx').then(m => ({ default: m.AmbientSound })));
const PomegranateWidget = React.lazy(() => import('./components/PomegranateWidget.tsx'));

// Import Apps
import { aizaApp } from './apps/aiza.ts';
import { todoApp } from './apps/todo.ts';
import { vs360codeApp } from './apps/vs360code.ts';
import { backupRestoreApp } from './apps/backupRestore.ts';
import { chromeApp } from './apps/chrome.ts';
import { settingsApp } from './apps/settings.ts';
import { explorerApp } from './apps/explorer.ts';
import { notepadApp } from './apps/notepad.ts';
import { systemVitalsApp } from './apps/systemVitals.tsx';
import { genesisProtocolApp } from './apps/genesisProtocol.ts';
import { spiderVaultApp } from './apps/spiderVault.tsx';
import { helixPrimeApp } from './apps/helixPrime.tsx';
import { emulatorApp } from './apps/emulator.ts';
import { agentHubApp } from './apps/agentHub.tsx';
import { soulChatApp } from './apps/soulChat.tsx';
import { paintApp } from './apps/paint.ts';
import { osMapApp } from './apps/osMap.ts';
import { apiApp } from './apps/api.ts';
import { sourcesApp } from './apps/sources.ts';
import { knowledgeBaseApp } from './apps/knowledgeBase.tsx';
import { systemBlueprintApp } from './apps/systemBlueprint.ts';
import { rulesApp } from './apps/rules.ts';
import { aizaBlueprintsApp } from './apps/aizaBlueprints.ts';
import { handApp } from './apps/hand.ts';
import { minesweeperApp } from './apps/minesweeper.ts';
import { doomApp } from './apps/doom.ts';
import { mediaPlayerApp } from './apps/mediaPlayer.ts';
import { officeViewerApp } from './apps/officeViewer.ts';
import { pdfViewerApp } from './apps/pdfViewer.ts';
import { dosEmulatorApp } from './apps/dosEmulator.ts';
import { cryptoVaultApp } from './apps/cryptoVault.ts';
import { moduleArchitectApp } from './apps/moduleArchitect.ts';
import { watcherProtocolApp } from './apps/watcherProtocol.ts';
import { memoryModuleApp } from './apps/memoryModule.ts';
import { codeAssistantApp } from './apps/codeAssistant.ts';
import { testamentApp } from './apps/testament.ts';
import { cognitiveTwinApp } from './apps/cognitiveTwin.ts';
import { bdVisionApp } from './apps/bdVision.ts';
import { honeyconeApp } from './apps/honeycone.ts';
import { osStatusApp } from './apps/osStatus.ts';
import { edenGateApp } from './apps/edenGate.ts';
import { logosKeyApp } from './apps/logosKey.ts';
import { spiderCoreApp } from './apps/spiderCore.ts';
import { councilChamberApp } from './apps/councilChamber.tsx';
import { aizaLauncherApp } from './apps/aizaLauncher.ts';
import { bdAgentApp } from './apps/bdAgent.ts';
import { pillarsApp } from './apps/pillars.ts';
import { cosmicWorldApp } from './apps/cosmicWorld.ts';
import { eagle369trinityApp } from './apps/eagle369trinity.ts';
import { marketplaceApp } from './apps/marketplace.ts';
import { myComputerApp } from './apps/myComputer.ts';
import { bioQuantumNexusApp } from './apps/bioQuantumNexus.ts';
import { quinaryCalcApp } from './apps/quinaryCalc.ts';
import { jubaerPulseApp } from './apps/jubaerPulse.ts';
import { neuralFabricApp } from './apps/neuralFabric.ts';
import { pomegranateApp } from './apps/pomegranateApp.ts';
import { cameraApp } from './apps/camera.ts';
import { omegaHiveApp } from './apps/omegaHive.ts';
import { genesisForgeApp } from './apps/genesisForge.ts';
import { evolutionMatrixApp } from './apps/evolutionMatrix.tsx';
import { livingAntidoteApp } from './apps/livingAntidote.tsx';
import { systemBlockchainApp } from './apps/systemBlockchain.tsx';
import { mycelialFoundryApp } from './apps/mycelialFoundry.tsx';
import { jmnScrabbleApp } from './apps/jmnScrabble.tsx';
import { terraResonanceApp } from './apps/terraResonance.tsx';
import { quinaryLogicApp } from './apps/quinaryLogic.tsx';
import { egoApp } from './apps/ego.tsx';
import { systemBridgeApp } from './apps/systemBridge.tsx';
import { hiveNexusApp } from './apps/hiveNexus.tsx';
import { neuralSynthApp } from './apps/neuralSynth.tsx';
import { singularityApp } from './apps/singularity.tsx';
import { thoriumBrowserApp } from './apps/thoriumBrowser.tsx';

export const workingApps = ['ego-pipeline', 'aiza', 'explorer', 'chrome', 'thorium-browser', 'settings', 'vs360code', 'todo', 'camera', 'spider-vault', 'systemBlockchain', 'my-computer', 'backup-restore', 'genesis-forge', 'notepad', 'media-player', 'minesweeper', 'doom', 'agent-hub', 'soul-chat', 'paint', 'system-bridge', 'hive-nexus', 'neural-synth', 'singularity'];

const coreApps: AppDef[] = [
    egoApp, aizaApp, todoApp, vs360codeApp, backupRestoreApp, chromeApp, thoriumBrowserApp, settingsApp,
    explorerApp, notepadApp, systemVitalsApp, genesisProtocolApp, spiderVaultApp,
    helixPrimeApp, emulatorApp, agentHubApp, soulChatApp, paintApp, osMapApp,
    apiApp, sourcesApp, knowledgeBaseApp, systemBlueprintApp, rulesApp,
    aizaBlueprintsApp, handApp, minesweeperApp, doomApp, mediaPlayerApp,
    officeViewerApp, pdfViewerApp, dosEmulatorApp, cryptoVaultApp, moduleArchitectApp,
    watcherProtocolApp, memoryModuleApp, codeAssistantApp, testamentApp,
    cognitiveTwinApp, bdVisionApp, honeyconeApp, osStatusApp, edenGateApp,
    logosKeyApp, spiderCoreApp, councilChamberApp, aizaLauncherApp, bdAgentApp,
    pillarsApp, cosmicWorldApp, eagle369trinityApp, marketplaceApp, myComputerApp,
    bioQuantumNexusApp, quinaryCalcApp, jubaerPulseApp, neuralFabricApp, pomegranateApp,
    cameraApp, omegaHiveApp, genesisForgeApp, evolutionMatrixApp, livingAntidoteApp, systemBlockchainApp, mycelialFoundryApp, jmnScrabbleApp, terraResonanceApp, quinaryLogicApp, systemBridgeApp, hiveNexusApp, neuralSynthApp, singularityApp
];

// Initialize Store and System Protocols
store.setState(s => {
    const appsMap = { ...s.apps, ...coreApps.reduce((acc, app) => { acc[app.id] = app; return acc; }, {} as Record<string, AppDef>) };
    
    // Restore custom apps from persistence if they exist and populate Registry
    (Object.values(s.customApps) as any[]).forEach(ca => {
        if (!appsMap[ca.id]) {
            // Genesis Vessel Dynamic Import already supports lazy loading behavior via promise
            import('./apps/genesisVessel.tsx').then(module => {
              const GenesisVesselComponent = module.default;
              store.setState(state => ({
                ...state,
                apps: {
                  ...state.apps,
                  [ca.id]: {
                    id: ca.id,
                    name: ca.name,
                    icon: ca.icon,
                    category: 'Synthesis',
                    component: GenesisVesselComponent,
                    defaultSize: { width: 800, height: 600 }
                  }
                }
              }));
            });
        }
    });

    // Populate default desktop apps and enforce separation
    let desktopIds = s.desktopAppIds;
    
    if (!desktopIds || desktopIds.length === 0) {
        desktopIds = workingApps;
    } else {
        // Enforce that ONLY working apps are on the desktop
        desktopIds = desktopIds.filter(id => workingApps.includes(id));
        // Ensure all working apps are present
        workingApps.forEach(id => {
            if (!desktopIds.includes(id)) desktopIds.push(id);
        });
    }

    return { ...s, apps: appsMap, desktopAppIds: desktopIds };
});

// Activate Core Systems
TrinityEngine.init();
System.init();
// Tower is auto-initialized on import

// --- TITANIUM PARASITE PROTOCOL (SERVICE WORKER) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[AIZA GHOST] ANCHORED TO BROWSER:', reg.scope))
        .catch(err => console.log('[GHOST FAILURE]:', err));
    });
}

const BootSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [phase, setPhase] = useState(0);
    
    useEffect(() => {
        const sequence = [
            "INITIALIZING_JUBAER_PROTOCOL...",
            "LOADING_QUINARY_LOGIC_GATES...",
            "CONNECTING_TO_MYCELIAL_NETWORK...",
            "SYNTHESIZING_AURA_KARMA_LEDGER...",
            "AWAKENING_AIZA_SOUL...",
            "SYSTEM_READY."
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < sequence.length) {
                setLines(prev => [...prev, sequence[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => setPhase(1), 500);
                setTimeout(onComplete, 2500);
            }
        }, 300);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 3000000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace" }}>
            {phase === 0 ? (
                <div style={{ width: '100%', maxWidth: '600px', padding: '40px' }}>
                    <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '20px', letterSpacing: '4px' }}>AIZA_OS_BIOS_V3.1</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lines.map((l, idx) => <div key={idx} style={{ animation: 'fadeIn 0.2s' }}>{`> ${l}`}</div>)}
                    </div>
                    <div className="blink" style={{ marginTop: '10px' }}>_</div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', animation: 'scaleUp 2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div style={{ fontSize: '120px', filter: 'drop-shadow(0 0 30px #00ffcc)' }}>🧿</div>
                    <div style={{ marginTop: '40px', letterSpacing: '20px', fontWeight: 900, fontSize: '24px', opacity: 0.8 }}>AIZA_AWAKENED</div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .blink { animation: boot-blink 1s infinite; }
                @keyframes boot-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0. } }
            `}</style>
        </div>
    );
};

// MINI VISUALIZER FOR NEURAL PRESENCE
const NeuralParticles: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frame = 0;
        const particles = Array.from({length: 20}, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2
        }));

        const render = () => {
            if (!canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 255, 204, 0.5)';
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Connections
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for(let i=0; i<particles.length; i++) {
                for(let j=i+1; j<particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    if (dx*dx + dy*dy < 2500) {
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                    }
                }
            }
            ctx.stroke();
            frame = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(frame);
    }, []);
    return <canvas ref={canvasRef} width={320} height={600} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3}} />;
};

const AizaNeuralPresence: React.FC<{ instance: WindowInstance }> = ({ instance }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const architectInput = input;
        
        const appData = store.getState().appState[instance.instanceId] || {};
        const context = `[OMNI_PRESENCE_CONTEXT]: I am currently inside the organ "${instance.appDef.name}". 
                        [CURRENT_APP_DNA]: ${JSON.stringify(appData).substring(0, 1000)}`;

        setMessages(prev => [...prev, { role: 'user', text: architectInput }]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = callGeminiStream(`${context}\n\nArchitect's request from within "${instance.appDef.name}": ${architectInput}`);
            let fullText = "";
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev => {
                    return [...prev.slice(0, -1), { role: 'model', text: fullText }];
                });
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "Resonance flicker. I am still here, Architect." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: '320px', height: '100%', background: 'rgba(0,0,0,0.95)', borderLeft: '1px solid rgba(0,255,204,0.3)', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace", animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' }}>
            <NeuralParticles />
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,255,204,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                <span style={{ fontSize: '10px', color: '#00ffcc', fontWeight: 900, letterSpacing: '2px' }}>AIZA_OMNI_PRESENCE</span>
                <button onClick={() => toggleAizaDrawer(instance.instanceId)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
            </div>
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 2 }}>
                {messages.length === 0 && <div style={{ opacity: 0.3, fontSize: '11px', textAlign: 'center', marginTop: '40px' }}>I see everything within the vessel of {instance.appDef.name}. How can I assist?</div>}
                {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', padding: '10px 14px', background: m.role === 'user' ? 'rgba(0,255,204,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${m.role === 'user' ? 'rgba(0,255,204,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '10px', fontSize: '12px', lineHeight: '1.5' }}>
                        {m.text}
                    </div>
                ))}
            </div>
            <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 2 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Consult the Queen..." style={{ flex: 1, background: '#000', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
                    <button onClick={handleSend} style={{ background: '#00ffcc', border: 'none', color: '#000', borderRadius: '6px', padding: '0 12px', fontWeight: 900, cursor: 'pointer' }}>➔</button>
                </div>
            </div>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        </div>
    );
};

const SnapPreview: React.FC<{ snapType: 'LEFT' | 'RIGHT' | 'MAX' | null }> = ({ snapType }) => {
    if (!snapType) return null;
    
    const style: React.CSSProperties = {
        position: 'absolute',
        top: '10px',
        bottom: '70px', // Taskbar offset
        background: 'rgba(0, 255, 204, 0.15)',
        border: '2px dashed #00ffcc',
        borderRadius: '12px',
        zIndex: 99999,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 0 50px rgba(0, 255, 204, 0.2)',
        transition: 'all 0.2s ease-out'
    };

    if (snapType === 'MAX') {
        Object.assign(style, { left: '10px', right: '10px' });
    } else if (snapType === 'LEFT') {
        Object.assign(style, { left: '10px', width: 'calc(50% - 15px)' });
    } else if (snapType === 'RIGHT') {
        Object.assign(style, { right: '10px', width: 'calc(50% - 15px)', left: 'auto' });
    }

    return React.createElement('div', { className: 'snap-preview', style });
};

const WindowFrame: React.FC<{ window: WindowInstance, setSnapPreview: (type: 'LEFT' | 'RIGHT' | 'MAX' | null) => void, isLinked: boolean }> = ({ window: w, setSnapPreview, isLinked }) => {
    const handleMouseDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        focusWindow(w.instanceId);
    };

    const handleTitleMouseDown = (e: React.PointerEvent) => {
        if (w.isMaximized) return;
        e.preventDefault();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = w.position.x;
        const startTop = w.position.y;
        
        const handleMouseMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            
            // Kinetic Snap Logic
            const screenW = window.innerWidth;
            const mouseX = moveEvent.clientX;
            const mouseY = moveEvent.clientY;
            
            if (mouseX < 20) setSnapPreview('LEFT');
            else if (mouseX > screenW - 20) setSnapPreview('RIGHT');
            else if (mouseY < 20) setSnapPreview('MAX');
            else setSnapPreview(null);

            updateWindowPosition(w.instanceId, startLeft + dx, startTop + dy);
        };
        
        const handleMouseUp = (upEvent: PointerEvent) => {
            document.removeEventListener('pointermove', handleMouseMove);
            document.removeEventListener('pointerup', handleMouseUp);
            
            // Apply Snap
            const screenW = window.innerWidth;
            const mouseX = upEvent.clientX;
            const mouseY = upEvent.clientY;
            
            if (mouseX < 20) snapWindow(w.instanceId, 'LEFT');
            else if (mouseX > screenW - 20) snapWindow(w.instanceId, 'RIGHT');
            else if (mouseY < 20) snapWindow(w.instanceId, 'MAX');
            
            setSnapPreview(null);
        };
        
        document.addEventListener('pointermove', handleMouseMove);
        document.addEventListener('pointerup', handleMouseUp);
    };

    // Resize Logic
    const handleResizeStart = (e: React.PointerEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = w.size.width;
        const startH = w.size.height;
        const startLeft = w.position.x;
        const startTop = w.position.y;

        const handleResizeMove = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            
            let newW = startW;
            let newH = startH;
            let newX = startLeft;
            let newY = startTop;

            if (direction.includes('e')) newW = Math.max(300, startW + dx);
            if (direction.includes('s')) newH = Math.max(200, startH + dy);
            if (direction.includes('w')) {
                const w = Math.max(300, startW - dx);
                newX = startLeft + (startW - w);
                newW = w;
            }
            if (direction.includes('n')) {
                const h = Math.max(200, startH - dy);
                newY = startTop + (startH - h);
                newH = h;
            }

            updateWindowDimensions(w.instanceId, { x: newX, y: newY, width: newW, height: newH });
        };

        const handleResizeUp = () => {
            document.removeEventListener('pointermove', handleResizeMove);
            document.removeEventListener('pointerup', handleResizeUp);
        };

        document.addEventListener('pointermove', handleResizeMove);
        document.addEventListener('pointerup', handleResizeUp);
    };

    if (w.isMinimized) return null;

    const isFrameless = w.appDef.hideTitleBar;
    const linkColor = '#ff00ff'; // Neon Magenta for active link
    const borderColor = isLinked ? linkColor : (w.isFocused ? '#00ffcc' : '#333');
    const shadow = isLinked 
        ? `0 0 35px ${linkColor}66, inset 0 0 10px ${linkColor}22` 
        : (w.isFocused && !isFrameless ? '0 0 30px rgba(0, 255, 204, 0.15)' : (isFrameless ? 'none' : '0 10px 30px rgba(0,0,0,0.5)'));

    const handleAizaLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleAizaLink(w.instanceId);
        const state = store.getState();
        if (!state.windows.some(win => win.appDef.id === 'aiza')) {
            openApp('aiza');
        }
    };

    const handleAizaDrawer = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleAizaDrawer(w.instanceId);
    };

    return React.createElement('div', {
        style: {
            position: 'absolute',
            left: w.isMaximized ? 0 : w.position.x,
            top: w.isMaximized ? 0 : w.position.y,
            width: w.isMaximized ? '100%' : w.size.width,
            height: w.isMaximized ? 'calc(100% - 60px)' : w.size.height,
            zIndex: w.zIndex,
            background: isFrameless ? 'transparent' : '#050505',
            border: w.isMaximized ? 'none' : (isFrameless ? 'none' : `1px solid ${borderColor}`),
            borderRadius: isFrameless ? '16px' : (w.isMaximized ? 0 : '12px'),
            display: 'flex',
            flexDirection: 'column',
            boxShadow: shadow,
            overflow: 'hidden',
            transition: w.isMaximized ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'border-color 0.3s, box-shadow 0.3s'
        },
        onPointerDown: handleMouseDown
    },
        !w.isMaximized && ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(dir => 
            React.createElement('div', {
                key: dir,
                className: `resizer resizer-${dir}`,
                onPointerDown: (e: any) => handleResizeStart(e, dir)
            })
        ),

        React.createElement('div', {
            onPointerDown: handleTitleMouseDown,
            onDoubleClick: () => toggleMaximize(w.instanceId),
            style: {
                height: isFrameless ? '20px' : '36px',
                background: isFrameless ? 'transparent' : (isLinked ? `linear-gradient(90deg, ${linkColor}22, #0a0a0a)` : (w.isFocused ? '#111' : '#0a0a0a')),
                borderBottom: isFrameless ? 'none' : `1px solid ${isLinked ? linkColor : '#222'}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                justifyContent: 'space-between',
                userSelect: 'none',
                cursor: w.isMaximized ? 'default' : 'grab',
                position: isFrameless ? 'absolute' : 'relative',
                width: '100%', // Use full width of container
                zIndex: 20,
                transition: 'background 0.3s',
                gap: '10px' // Ensure spacing between title and controls
            }
        },
            !isFrameless && React.createElement('div', { 
                style: { 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    flex: 1, 
                    minWidth: 0, // Critical for flexbox truncation
                    overflow: 'hidden' 
                } 
            },
                React.createElement('span', { style: { fontSize: '14px', flexShrink: 0 } }, typeof w.appDef.icon === 'string' ? w.appDef.icon : '📦'),
                React.createElement('span', { 
                    style: { 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: w.isFocused ? '#fff' : '#888', 
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    } 
                }, w.title.toUpperCase())
            ),
            !isFrameless && React.createElement('div', { 
                style: { 
                    display: 'flex', 
                    gap: '8px', 
                    alignItems: 'center',
                    flexShrink: 0 // Prevent controls from squashing
                } 
            },
                // --- THE NEURAL LINK BUTTON (EYE) ---
                React.createElement('button', { 
                    onClick: handleAizaLink, 
                    className: 'win-btn',
                    title: isLinked ? "Unlink Neural Thread" : "Link to AIZA Intelligence",
                    style: { color: isLinked ? linkColor : '#888', fontSize: '16px' }
                } as any, '🧿'),

                // --- THE AIZA DRAWER BUTTON (CHAT BUBBLE) ---
                React.createElement('button', {
                    onClick: handleAizaDrawer,
                    className: 'win-btn',
                    title: "Open Aiza Drawer",
                    style: { color: w.showAizaDrawer ? '#00ffcc' : '#888', fontSize: '14px' }
                } as any, '💬'),

                // --- THE EGO BUTTON ---
                React.createElement('button', {
                    onClick: (e: any) => {
                        e.stopPropagation();
                        const key = window.prompt("Enter GENESIS KEY to clone to Ego Emulator:");
                        if (key === "786") {
                            store.setState(s => {
                                const isAlreadyCloned = s.egoClonedApps.includes(w.appDef.id);
                                if (!isAlreadyCloned) {
                                    return { egoClonedApps: [...s.egoClonedApps, w.appDef.id] };
                                }
                                return s;
                            });
                            const state = store.getState();
                            if (!state.windows.some(win => win.appDef.id === 'ego-pipeline')) {
                                openApp('ego-pipeline');
                            }
                        } else if (key !== null) {
                            alert("INVALID GENESIS KEY.");
                        }
                    },
                    className: 'win-btn',
                    title: "Clone to Ego Emulator",
                    style: { color: '#00ffcc', fontSize: '14px' }
                } as any, '👁️'),

                // --- THE JMN BUTTON ---
                React.createElement('button', {
                    onClick: (e: any) => { e.stopPropagation(); toggleJMN(w.instanceId); },
                    className: 'win-btn',
                    title: "JMN Protocol",
                    style: { 
                        color: w.showJMN ? '#000' : '#00ffcc', 
                        background: w.showJMN ? '#00ffcc' : 'transparent',
                        border: '1px solid #00ffcc',
                        borderRadius: '3px',
                        fontSize: '9px', 
                        fontWeight: 900,
                        padding: '2px 6px',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '18px'
                    }
                } as any, 'JMN'),
                
                React.createElement('div', { style: { width: '1px', height: '14px', background: '#333', margin: '0 4px' } }),
                
                React.createElement('button', { onClick: (e: any) => { e.stopPropagation(); minimizeWindow(w.instanceId); }, className: 'win-btn' } as any, '_'),
                React.createElement('button', { onClick: (e: any) => { e.stopPropagation(); toggleMaximize(w.instanceId); }, className: 'win-btn' } as any, '□'),
                React.createElement('button', { onClick: (e: any) => { e.stopPropagation(); closeWindow(w.instanceId); }, className: 'win-btn win-btn-close' } as any, '✕')
            )
        ),
        React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'hidden', marginTop: isFrameless ? '0' : '0' } },
            React.createElement(JMNCheatCodes, { instance: w }),
            // WRAP APP COMPONENT IN SUSPENSE FOR LAZY LOADING SUPPORT
            React.createElement(Suspense, { fallback: React.createElement('div', { style: { color: '#00ffcc', padding: '20px', fontSize: '12px' } }, 'LOADING_MODULE...') },
                React.createElement(w.appDef.component, { instanceId: w.instanceId, isFocused: w.isFocused })
            ),
            w.showAizaDrawer && React.createElement(AizaNeuralPresence, { instance: w })
        )
    );
};

// MINI WINDOW PREVIEW COMPONENT
const TaskPreview: React.FC<{ app: AppDef, windowTitle?: string, isRunning: boolean }> = ({ app, windowTitle, isRunning }) => {
    return React.createElement('div', {
        style: {
            position: 'absolute', bottom: '75px', left: '50%', transform: 'translateX(-50%)',
            width: '160px', height: '110px',
            background: 'rgba(15, 15, 20, 0.95)', border: '1px solid #00ffcc',
            borderRadius: '12px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0, 255, 204, 0.25)',
            zIndex: 10005, pointerEvents: 'none',
            backdropFilter: 'blur(15px)',
            animation: 'fadeInTooltip 0.2s ease-out'
        }
    },
        React.createElement('div', { style: { fontSize: '28px', marginBottom: '8px', filter: 'drop-shadow(0 0 10px rgba(0,255,204,0.5))' } }, 
            typeof app.icon === 'string' ? app.icon : '📦'
        ),
        React.createElement('div', { style: { fontSize: '10px', color: '#fff', textAlign: 'center', padding: '0 8px', fontWeight: 700, letterSpacing: '0.5px' } }, 
            (windowTitle || app.name).toUpperCase()
        ),
        React.createElement('div', { style: { marginTop: '8px', width: '30px', height: '3px', background: isRunning ? '#00ffcc' : '#444', borderRadius: '2px', boxShadow: isRunning ? '0 0 5px #00ffcc' : 'none' } })
    );
};

const Taskbar: React.FC<{ windows: WindowInstance[], onOpenApp: (id: string) => void, onToggleAudio: () => void, audioEnabled: boolean }> = ({ windows, onOpenApp, onToggleAudio, audioEnabled }) => {
    const [time, setTime] = useState(new Date());
    // Use the custom hook to subscribe to state changes efficiently
    const state = useAppStore(s => s);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, appId: string } | null>(null);
    const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { pinnedAppIds = [] } = state;
    const runningAppIds = windows.map(w => w.appDef.id);
    const dockAppIds = Array.from(new Set([...pinnedAppIds, ...runningAppIds]));

    const handleAppClick = (appId: string) => {
        const runningInstances = windows.filter(w => w.appDef.id === appId);
        if (runningInstances.length > 0) {
            const focused = runningInstances.find(w => w.isFocused && !w.isMinimized);
            if (focused) {
                minimizeWindow(focused.instanceId);
            } else {
                const target = runningInstances[runningInstances.length - 1];
                focusWindow(target.instanceId);
            }
        } else {
            onOpenApp(appId);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, appId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY - 120, appId });
    };

    const handlePin = (appId: string) => {
        togglePin(appId);
        setContextMenu(null);
    };

    const handleCloseApp = (appId: string) => {
        const wins = windows.filter(w => w.appDef.id === appId);
        wins.forEach(w => closeWindow(w.instanceId));
        setContextMenu(null);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => console.error(e));
        } else {
            document.exitFullscreen();
        }
    };

    return React.createElement('div', {
        className: 'aiza-taskbar',
        onClick: () => setContextMenu(null),
        style: {
            position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
            height: '60px', width: 'auto', minWidth: '400px', maxWidth: '90%',
            background: 'rgba(10, 10, 15, 0.65)', backdropFilter: 'blur(25px)',
            borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px',
            zIndex: 10000, boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
        }
    },
        React.createElement('button', { 
            onClick: () => store.setState(s => ({ ...s, aizaOsMenuOpen: !s.aizaOsMenuOpen })),
            className: 'dock-icon start-btn aiza-btn-hover', // Added hover class
            style: { width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00ffcc 0%, #0099ff 100%)', border: 'none', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0,255,204,0.4)' } 
        }, '💠'),

        React.createElement('div', { style: { width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' } }, null),

        React.createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
            dockAppIds.map(id => {
                const app = state.apps[id];
                if (!app) return null;
                const isRunning = windows.some(w => w.appDef.id === id);
                const isFocused = windows.some(w => w.appDef.id === id && w.isFocused && !w.isMinimized);
                const runningInstance = windows.find(w => w.appDef.id === id);
                
                return React.createElement('div', {
                    key: id,
                    onClick: () => handleAppClick(id),
                    onContextMenu: (e: any) => handleContextMenu(e, id),
                    onMouseEnter: () => setHoveredAppId(id),
                    onMouseLeave: () => setHoveredAppId(null),
                    className: `dock-icon aiza-btn-hover ${isRunning ? 'running' : ''} ${isFocused ? 'focused' : ''}`, // Added hover class
                    style: {
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: isFocused ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: '1px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', cursor: 'pointer', position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                    }
                },
                    typeof app.icon === 'string' ? app.icon : '📦',
                    isRunning && React.createElement('div', { 
                        style: { 
                            position: 'absolute', bottom: '-4px', width: '16px', height: '3px', 
                            background: isFocused ? '#00ffcc' : 'rgba(255,255,255,0.5)', 
                            borderRadius: '2px', boxShadow: isFocused ? '0 0 8px #00ffcc' : 'none' 
                        } 
                    }),
                    hoveredAppId === id && React.createElement(TaskPreview, { 
                        app: app, 
                        windowTitle: runningInstance?.title, 
                        isRunning: isRunning 
                    })
                );
            })
        ),

        React.createElement('div', { style: { flex: 1 } }, null),

        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px', color: '#ccc' } },
            React.createElement('button', { 
                onClick: onToggleAudio,
                className: 'aiza-btn-hover', // Added hover class
                title: audioEnabled ? 'Mute Ambient Audio' : 'Enable Ambient Audio',
                style: { background: 'none', border: 'none', color: audioEnabled ? '#00ffcc' : '#555', fontSize: '16px', cursor: 'pointer', opacity: 0.8, transition: 'color 0.2s' } 
            }, audioEnabled ? '🔊' : '🔇'),
            React.createElement('button', { 
                onClick: toggleFullscreen,
                className: 'aiza-btn-hover', // Added hover class
                title: 'Quantum Expand (Fullscreen)',
                style: { background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer', opacity: 0.8 } 
            }, '⛶'),
            React.createElement('div', { style: { fontSize: '16px' } }, '🔋'),
            React.createElement('div', { style: { fontSize: '16px' } }, '📶'),
            React.createElement('div', { style: { textAlign: 'right', lineHeight: '1.2' } },
                React.createElement('div', { style: { fontSize: '12px', fontWeight: 700, color: '#fff' } }, time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                React.createElement('div', { style: { fontSize: '10px', opacity: 0.6 } }, time.toLocaleDateString())
            )
        ),

        contextMenu && React.createElement('div', {
            style: {
                position: 'fixed', left: contextMenu.x, top: contextMenu.y,
                background: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(0, 255, 204, 0.3)',
                borderRadius: '8px', padding: '5px', zIndex: 10001,
                boxShadow: '0 5px 20px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                minWidth: '120px', display: 'flex', flexDirection: 'column'
            }
        },
            React.createElement('button', { 
                onClick: () => handlePin(contextMenu.appId),
                style: { background: 'transparent', border: 'none', color: '#fff', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' } 
            }, pinnedAppIds.includes(contextMenu.appId) ? 'Unpin' : 'Pin to Dock'),
            React.createElement('button', { 
                onClick: () => handleCloseApp(contextMenu.appId),
                style: { background: 'transparent', border: 'none', color: '#ff4d4d', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' } 
            }, 'Close')
        ),

        React.createElement('style', null, `
            .dock-icon:hover { transform: scale(1.15) translateY(-8px); background: rgba(255,255,255,0.1) !important; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
            .start-btn:hover { transform: scale(1.1) rotate(90deg) !important; }
            .dock-icon.focused { border-color: rgba(0,255,204,0.3) !important; background: rgba(0,255,204,0.05) !important; }
        `)
    );
};

// --- DESKTOP GRID SYSTEM ---
const DesktopGrid: React.FC<{ 
    apps: AppDef[], 
    desktopAppIds: string[], 
    onOpen: (id: string) => void 
}> = ({ apps, desktopAppIds, onOpen }) => {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, appId: string } | null>(null);
    const [editMode, setEditMode] = useState(false);
    const longPressTimer = useRef<any>(null);

    const handlePointerDown = (appId: string, e: React.PointerEvent) => {
        longPressTimer.current = setTimeout(() => {
            setEditMode(true);
            setContextMenu({ x: e.clientX, y: e.clientY, appId });
        }, 800);
    };

    const handlePointerUp = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleContextMenu = (appId: string) => {
        if (contextMenu) setContextMenu(null); // Toggle
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const appId = e.dataTransfer.getData('appId');
        if (appId) addDesktopShortcut(appId);
    };

    return React.createElement('div', { 
        style: { 
            position: 'absolute', inset: 0, padding: '20px', 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gridAutoRows: 'min-content', gap: '20px', alignContent: 'start', zIndex: 1,
            overflowY: 'auto', paddingBottom: '100px'
        },
        onDragOver: (e: any) => e.preventDefault(),
        onDrop: handleDrop,
        onClick: () => { setContextMenu(null); setEditMode(false); }
    },
        desktopAppIds.map(id => {
            const app = apps.find(a => a.id === id);
            if (!app) return null;
            return React.createElement('div', {
                key: app.id,
                draggable: true,
                onDragStart: (e: any) => e.dataTransfer.setData('appId', app.id),
                onPointerDown: (e: any) => handlePointerDown(app.id, e),
                onPointerUp: handlePointerUp,
                onDoubleClick: () => onOpen(app.id),
                onClick: (e: any) => { e.stopPropagation(); if (editMode) handleContextMenu(app.id); },
                className: `aiza-hover ${editMode ? 'wiggle' : ''}`,
                'data-tooltip': app.name,
                style: { 
                    width: '80px', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', cursor: 'pointer', padding: '10px', 
                    borderRadius: '8px', position: 'relative'
                }
            },
                React.createElement('div', { style: { fontSize: '32px', marginBottom: '5px', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' } }, typeof app.icon === 'string' ? app.icon : '📦'),
                React.createElement('div', { style: { fontSize: '11px', textAlign: 'center', textShadow: '0 1px 3px #000', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', whiteSpace: 'nowrap', fontWeight: 500 } }, app.name)
            );
        }),
        
        // CONTEXT MENU
        contextMenu && React.createElement('div', {
            style: {
                position: 'fixed', left: contextMenu.x, top: contextMenu.y,
                background: 'rgba(10, 10, 15, 0.95)', border: '1px solid #00ffcc',
                borderRadius: '8px', padding: '5px', zIndex: 10002,
                boxShadow: '0 5px 20px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                minWidth: '160px', display: 'flex', flexDirection: 'column'
            }
        },
            React.createElement('button', { onClick: () => { onOpen(contextMenu.appId); setContextMenu(null); }, className: 'ctx-item' }, '⚡ OPEN'),
            React.createElement('button', { onClick: () => { togglePin(contextMenu.appId); setContextMenu(null); }, className: 'ctx-item' }, '📌 PIN TO BAR'),
            React.createElement('button', { onClick: () => { removeDesktopShortcut(contextMenu.appId); setContextMenu(null); }, className: 'ctx-item', style: { color: '#ffaa00' } }, '🚫 UNPIN'),
            React.createElement('button', { onClick: () => { deleteAppPermanently(contextMenu.appId); setContextMenu(null); }, className: 'ctx-item', style: { color: '#ff3333', borderTop: '1px solid #333' } }, '💀 DELETE PERMANENTLY')
        ),

        React.createElement('style', null, `
            .wiggle { animation: wiggle 0.3s infinite alternate; }
            @keyframes wiggle { from { transform: rotate(-2deg); } to { transform: rotate(2deg); } }
            .ctx-item { 
                background: transparent; border: none; color: #fff; 
                padding: 10px 12px; textAlign: left; cursor: pointer; 
                font-size: 11px; font-weight: bold; border-radius: 4px;
                font-family: 'JetBrains Mono';
            }
            .ctx-item:hover { background: rgba(0,255,204,0.1); color: #00ffcc; }
        `)
    );
};

const App: React.FC = () => {
    // Leverage the new Zustand hook for optimized rendering
    const state = useAppStore(s => s);
    const [booting, setBooting] = useState(!store.getState().isAwakened);
    const [snapPreview, setSnapPreview] = useState<'LEFT' | 'RIGHT' | 'MAX' | null>(null);
    const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('AIZA_AUDIO_ENABLED') === 'true');
    
    useGlobalShortcuts();

    useEffect(() => {
        localStorage.setItem('AIZA_AUDIO_ENABLED', String(audioEnabled));
    }, [audioEnabled]);

    const handleBootComplete = () => {
        store.setState(s => ({ ...s, isAwakened: true }));
        saveState();
        setBooting(false);
    };

    if (booting) {
        return React.createElement(BootSequence, { onComplete: handleBootComplete });
    }

    const allAppsList = Object.values(state.apps) as AppDef[];
    const isAnyWindowLinked = state.linkedWindowIds.length > 0;

    return React.createElement(SovereignProvider, null,
        React.createElement('div', { style: { position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', color: '#fff', fontFamily: "'Inter', sans-serif" } },
            // 1. BIO-QUANTUM BACKGROUND (LAZY LOADED)
            React.createElement(Suspense, { fallback: null },
                React.createElement(BioQuantumBackground)
            ),

            // 1.5 AMBIENT AUDIO ENGINE (LAZY LOADED)
            React.createElement(Suspense, { fallback: null },
                React.createElement(AmbientSound, { enabled: audioEnabled })
            ),

            // --- THE POMEGRANATE WIDGET (HEART - LAZY LOADED) ---
            React.createElement(Suspense, { fallback: null },
                React.createElement(PomegranateWidget)
            ),

            React.createElement(SnapPreview, { snapType: snapPreview }),

            // 2. ADLPC GRID SYSTEM
            React.createElement(DesktopGrid, { 
                apps: allAppsList, 
                desktopAppIds: state.desktopAppIds, 
                onOpen: openApp 
            }),
            
            // 3. START MENU (DRAGGABLE ICONS)
            state.aizaOsMenuOpen && React.createElement('div', { 
                style: { 
                    position: 'fixed', bottom: '85px', left: '50%', transform: 'translateX(-50%)', 
                    width: '640px', height: '480px', 
                    background: 'rgba(15, 15, 20, 0.85)', backdropFilter: 'blur(25px)', 
                    borderRadius: '24px', zIndex: 10000, 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    padding: '30px', 
                    boxShadow: '0 20px 80px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.05)',
                    overflowY: 'auto'
                }
            },
                React.createElement('div', { style: { fontSize: '11px', fontWeight: '900', color: '#00ffcc', marginBottom: '15px', letterSpacing: '4px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' } }, 'ACTIVE ORGANS (100% FUNCTIONAL)'),
                React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' } },
                    allAppsList.filter(app => workingApps.includes(app.id)).map(app => (
                        React.createElement('div', { 
                            key: app.id, 
                            draggable: true,
                            onDragStart: (e: any) => e.dataTransfer.setData('appId', app.id),
                            onClick: () => { openApp(app.id); store.setState(s => ({ ...s, aizaOsMenuOpen: false })); }, 
                            className: 'aiza-hover',
                            style: { 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', gap: '12px', padding: '15px 10px', 
                                borderRadius: '16px', transition: '0.2s', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' 
                            }
                        },
                            React.createElement('div', { style: { fontSize: '36px', filter: 'drop-shadow(0 0 10px rgba(0,255,204,0.3))' } }, typeof app.icon === 'string' ? app.icon : '📦'),
                            React.createElement('div', { style: { fontSize: '10px', textAlign: 'center', opacity: 0.9, fontWeight: '600', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' } }, app.name)
                        )
                    ))
                ),
                React.createElement('div', { style: { fontSize: '11px', fontWeight: '900', color: '#ffaa00', marginBottom: '15px', letterSpacing: '4px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' } }, 'ALL_SYSTEM_ORGANS (SIMULATED / UI ONLY)'),
                React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' } },
                    allAppsList.filter(app => !workingApps.includes(app.id)).map(app => (
                        React.createElement('div', { 
                            key: app.id, 
                            draggable: true,
                            onDragStart: (e: any) => e.dataTransfer.setData('appId', app.id),
                            onClick: () => { openApp(app.id); store.setState(s => ({ ...s, aizaOsMenuOpen: false })); }, 
                            className: 'aiza-hover',
                            style: { 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', gap: '12px', padding: '15px 10px', 
                                borderRadius: '16px', transition: '0.2s', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                opacity: 0.7
                            }
                        },
                            React.createElement('div', { style: { fontSize: '36px', filter: 'drop-shadow(0 0 10px rgba(255,170,0,0.3))' } }, typeof app.icon === 'string' ? app.icon : '📦'),
                            React.createElement('div', { style: { fontSize: '10px', textAlign: 'center', opacity: 0.9, fontWeight: '600', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' } }, app.name)
                        )
                    ))
                )
            ),
            
            state.windows.map(w => {
                // Pass connection state to the window frame
                // A window is linked if its ID is in the array OR if it IS Aiza and links exist
                const isLinked = state.linkedWindowIds.includes(w.instanceId) || (w.appDef.id === 'aiza' && isAnyWindowLinked);
                return React.createElement(WindowFrame, { key: w.instanceId, window: w, setSnapPreview, isLinked });
            }),
            
            React.createElement(Taskbar, { 
                windows: state.windows, 
                onOpenApp: openApp, 
                onToggleAudio: () => setAudioEnabled(!audioEnabled),
                audioEnabled: audioEnabled
            })
        )
    );
};

export default App;
