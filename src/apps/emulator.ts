
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';
import { callGemini } from '../services/gemini.ts';

// --- External Logic Hooks ---
declare const Paho: any;
declare const Html5Qrcode: any;
declare const QRious: any;

const QUINARY_THEMES: any = {
  [-2]: { 
    name: 'VOID', 
    color: '#ff1a1a', 
    glyph: '𓐍', 
    desc: 'Total Entropy', 
    particleSpeed: 0.2, 
    pattern: 'erratic',
    glow: 'rgba(255, 26, 26, 0.9)',
    friction: 0.99
  },
  [-1]: { 
    name: 'NEGATION', 
    color: '#ffaa00', 
    glyph: '𓐰', 
    desc: 'Void Resistance', 
    particleSpeed: 2.2, 
    pattern: 'jitter',
    glow: 'rgba(255, 170, 0, 0.8)',
    friction: 0.35
  },
  [0]: { 
    name: 'NEUTRAL', 
    color: '#00ffcc', 
    glyph: '𓋹', 
    desc: 'Potential Equilibrium', 
    particleSpeed: 1.0, 
    pattern: 'circular',
    glow: 'rgba(0, 255, 204, 0.6)',
    friction: 0.94
  },
  [1]: { 
    name: 'ORDER', 
    color: '#00ccff', 
    glyph: '𓊗', 
    desc: 'Logic Alignment', 
    particleSpeed: 3.2, 
    pattern: 'grid',
    glow: 'rgba(0, 204, 255, 0.8)',
    friction: 0.96
  },
  [2]: { 
    name: 'GENESIS', 
    color: '#ff00ff', 
    glyph: '𓁹', 
    desc: 'Singularity Origin', 
    particleSpeed: 16.0, 
    pattern: 'expansion',
    glow: 'rgba(255, 0, 255, 1.0)',
    friction: 1.0
  },
  [3]: { 
    name: 'HYPER-FLOW', 
    color: '#e0ffff', 
    glyph: '∞', 
    desc: 'Omni-Resonance State', 
    particleSpeed: 25.0, 
    pattern: 'stream',
    glow: 'rgba(224, 255, 255, 1.0)',
    friction: 1.02 // slight acceleration
  },
};

type NetMode = 'OFFLINE' | 'LOCAL' | 'CLOUD';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  type: 'cloud' | 'local' | 'optic';
}

interface KernelLog {
  id: string;
  prev: number;
  curr: number;
  text: string;
  timestamp: number;
}

const EmulatorComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
  // --- IDENTITY & CORE STATE ---
  const [jmnId] = useState(() => {
    const saved = localStorage.getItem('AIZA_JMN_ID');
    if (saved) return saved;
    const newId = `JMN-${Math.floor(1000 + Math.random() * 8999)}`;
    localStorage.setItem('AIZA_JMN_ID', newId);
    return newId;
  });

  const [partnerId, setPartnerId] = useState(() => localStorage.getItem('AIZA_PARTNER_ID') || '');
  const [netMode, setNetMode] = useState<NetMode>(() => (localStorage.getItem('AIZA_NET_MODE') as NetMode) || 'OFFLINE');
  const [messages, setMessages] = useState<Message[]>(() => JSON.parse(localStorage.getItem('AIZA_CHAT_HISTORY') || '[]'));
  const [kernelState, setKernelState] = useState<number>(() => {
    const saved = localStorage.getItem('AIZA_KERNEL_STATE');
    return saved !== null ? parseInt(saved) : 0;
  });
  const [kernelLogs, setKernelLogs] = useState<KernelLog[]>(() => JSON.parse(localStorage.getItem('AIZA_KERNEL_LOGS') || '[]'));
  const [inputText, setInputText] = useState('');
  const [hoveredGate, setHoveredGate] = useState<number | null>(null);
  const [sysHeartbeat, setSysHeartbeat] = useState(store.getState().neuralHeartRate);
  const [showQrModal, setShowQrModal] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);

  // Sync with OS heart rate
  useEffect(() => {
    const unsubscribe = store.subscribe(s => setSysHeartbeat(s.neuralHeartRate));
    return () => { unsubscribe(); };
  }, []);

  // Persistent State Engine
  useEffect(() => {
    localStorage.setItem('AIZA_PARTNER_ID', partnerId);
    localStorage.setItem('AIZA_NET_MODE', netMode);
    localStorage.setItem('AIZA_KERNEL_STATE', kernelState.toString());
    localStorage.setItem('AIZA_CHAT_HISTORY', JSON.stringify(messages));
    localStorage.setItem('AIZA_KERNEL_LOGS', JSON.stringify(kernelLogs));
  }, [partnerId, netMode, kernelState, messages, kernelLogs]);

  // Handle Logic Transitions & Logging
  const prevKernelState = useRef(kernelState);
  useEffect(() => {
    if (prevKernelState.current !== kernelState) {
      const pState = prevKernelState.current;
      const cState = kernelState;
      const theme = QUINARY_THEMES[cState];
      const newLog: KernelLog = {
        id: `log_${Date.now()}`,
        prev: pState,
        curr: cState,
        text: `GATE RE-CALIBRATION: [${QUINARY_THEMES[pState].name}] ➔ [${theme.name}]. ${theme.desc}.`,
        timestamp: Date.now()
      };
      setKernelLogs(logs => [...logs.slice(-49), newLog]);
      prevKernelState.current = cState;
      addNotification(`Quinary Resonance: ${theme.name} Active`);
    }
  }, [kernelState]);

  // QR Generation Effect
  useEffect(() => {
    if (showQrModal && qrCanvasRef.current) {
        new QRious({
            element: qrCanvasRef.current,
            value: showQrModal,
            size: 280,
            background: '#ffffff',
            foreground: '#000000',
            level: 'H'
        });
    }
  }, [showQrModal]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [kernelLogs]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- REFINED VISUALIZER (STATE LERPING & BPM SYNC) ---
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    let frame: number;
    let time = 0;
    
    // Lerp targets for smooth transitions
    const currentProps = {
      speed: QUINARY_THEMES[kernelState].particleSpeed,
      friction: QUINARY_THEMES[kernelState].friction,
      color: QUINARY_THEMES[kernelState].color
    };

    const particles = Array.from({length: 220}, () => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      r: Math.random() * 1.5 + 0.6,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      angle: Math.random() * Math.PI * 2,
      life: Math.random(),
      speedMult: Math.random() * 0.7 + 0.3
    }));

    const draw = () => {
      const activeTheme = QUINARY_THEMES[kernelState] || QUINARY_THEMES[0];
      const previewTheme = hoveredGate !== null ? QUINARY_THEMES[hoveredGate] : null;
      const theme = previewTheme || activeTheme;
      
      // Interpolate visuals
      currentProps.speed += (theme.particleSpeed - currentProps.speed) * 0.06;
      currentProps.friction += (theme.friction - currentProps.friction) * 0.08;
      
      // Heartbeat pulse calculation
      const bpmFactor = sysHeartbeat / 60;
      const hb = 1 + Math.sin((Date.now() / 1000) * (Math.PI * 2) * bpmFactor) * 0.12;
      time += 0.02 * bpmFactor;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fillRect(0, 0, 800, 600);

      ctx.globalAlpha = 0.8 * hb;
      ctx.shadowBlur = (previewTheme ? 25 : 12) * hb;
      ctx.shadowColor = theme.glow;
      ctx.fillStyle = theme.color;

      particles.forEach((p) => {
        // Distinct Patterns
        switch(theme.pattern) {
          case 'erratic': 
            p.vx += (Math.random() - 0.5) * 0.2;
            p.vy += (Math.random() - 0.5) * 0.2;
            break;
          case 'jitter': 
            const j = 10 * hb;
            p.x += (Math.random() - 0.5) * j;
            p.y += (Math.random() - 0.5) * j;
            break;
          case 'circular': 
            p.angle += 0.025 * p.speedMult * hb;
            const orbitR = 120 + p.life * 240;
            const tx = 400 + Math.cos(p.angle) * orbitR;
            const ty = 300 + Math.sin(p.angle) * orbitR;
            p.vx = (tx - p.x) * 0.06;
            p.vy = (ty - p.y) * 0.06;
            break;
          case 'grid': 
            if (Math.abs(p.vx) < 0.1 && Math.abs(p.vy) < 0.1) {
              const dir = Math.random() > 0.5 ? 1 : -1;
              if (Math.random() > 0.5) p.vx = dir * 2; else p.vy = dir * 2;
            }
            if (Math.random() > 0.982) { // 90deg Branch
              const oldVx = p.vx; p.vx = p.vy; p.vy = -oldVx;
            }
            break;
          case 'expansion':
            const dx = p.x - 400; const dy = p.y - 300;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            p.vx = (dx / dist) * currentProps.speed * 0.5 * p.speedMult;
            p.vy = (dy / dist) * currentProps.speed * 0.5 * p.speedMult;
            if (dist > 520) { p.x = 400; p.y = 300; }
            break;
          case 'stream':
            // Hyper-Flow: Everything flows rapidly right, slightly wavy
            p.vx = currentProps.speed * 0.2 * p.speedMult;
            p.vy = Math.sin(p.x * 0.01 + time) * 2;
            if (p.x > 800) p.x = 0;
            break;
        }

        p.x += p.vx * currentProps.speed;
        p.y += p.vy * currentProps.speed;
        p.vx *= currentProps.friction;
        p.vy *= currentProps.friction;

        if (theme.pattern !== 'expansion') {
            if (p.x < 0) p.x = 800; if (p.x > 800) p.x = 0;
            if (p.y < 0) p.y = 600; if (p.y > 600) p.y = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * hb, 0, Math.PI * 2);
        ctx.fill();
      });

      // Core Resonator Glyph
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 50 * hb;
      ctx.shadowColor = theme.glow;
      ctx.fillStyle = theme.color;
      ctx.font = `bold ${100 * hb}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(theme.glyph, 400, 300);

      // Ripple Rings
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = theme.color;
      for (let i = 0; i < 4; i++) {
          const r = (160 + i * 80) + Math.sin(time + i) * 35;
          ctx.globalAlpha = 0.07 * (1 - (i * 0.22)) * hb;
          ctx.beginPath();
          ctx.arc(400, 300, r, 0, Math.PI * 2);
          ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [kernelState, hoveredGate, sysHeartbeat]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const msg: Message = { id: `m_${Date.now()}`, sender: jmnId, text: inputText, timestamp: Date.now(), type: 'local' };
    setMessages(prev => [...prev, msg]);
    setInputText('');
    if (netMode === 'OFFLINE') setShowQrModal(`MSG::${jmnId}::${inputText}`);
  };

  const startScanning = async () => {
    setScannerActive(true);
    setTimeout(() => {
        try {
            const scanner = new Html5Qrcode("scanner-region");
            scannerRef.current = scanner;
            scanner.start({ facingMode: "environment" }, { fps: 15, qrbox: 250 }, (text: string) => {
                if (text.startsWith('JMN-')) setPartnerId(text);
                else if (text.startsWith('MSG::')) {
                    const parts = text.split('::');
                    if (parts.length >= 3) setMessages(prev => [...prev, { id: `o_${Date.now()}`, sender: parts[1], text: parts.slice(2).join('::'), timestamp: Date.now(), type: 'optic' }]);
                }
                stopScanning();
            }, () => {});
        } catch (e) {
            setScannerActive(false);
            addNotification("Optic Breach: Failed to initialize lens.");
        }
    }, 150);
  };

  const stopScanning = () => {
    if (scannerRef.current) scannerRef.current.stop().then(() => { setScannerActive(false); scannerRef.current = null; });
    else setScannerActive(false);
  };

  const currentTheme = QUINARY_THEMES[kernelState] || QUINARY_THEMES[0];

  return React.createElement('div', { style: { height: '100%', background: '#000', display: 'flex', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden' } },
    // Sidebar: Identity, Controls & Telemetry
    React.createElement('div', { style: { width: '400px', borderRight: '1px solid #111', background: '#050505', display: 'flex', flexDirection: 'column', padding: '25px', gap: '25px', zIndex: 10 } },
      
      React.createElement('div', { style: { borderBottom: '1px solid #222', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('div', null,
            React.createElement('div', { style: { fontSize: '10px', opacity: 0.4, letterSpacing: '2px', marginBottom: '6px' } }, 'NODE IDENTITY'),
            React.createElement('div', { style: { fontSize: '22px', fontWeight: 900, color: '#fff', textShadow: `0 0 10px ${currentTheme.color}` } }, jmnId)
        ),
        React.createElement('button', {
            onClick: () => setShowQrModal(jmnId),
            className: 'beacon-trigger',
            style: { 
              background: 'rgba(0, 255, 204, 0.05)', border: '1px solid #333', color: '#fff', 
              padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s',
              display: 'flex', alignItems: 'center', gap: '8px'
            }
        }, 
          React.createElement('span', { style: { fontSize: '16px' } }, '📟'),
          React.createElement('span', { style: { fontSize: '10px', fontWeight: 900, letterSpacing: '1px' } }, 'ID_QR')
        )
      ),

      React.createElement('div', null,
        React.createElement('div', { style: { fontSize: '10px', opacity: 0.4, marginBottom: '15px', letterSpacing: '1px' } }, 'KERNEL_STATE_GATES'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' } },
            [-2, -1, 0, 1, 2, 3].map(v => React.createElement('button', {
              key: v, 
              onClick: () => setKernelState(v),
              onMouseEnter: () => setHoveredGate(v),
              onMouseLeave: () => setHoveredGate(null),
              className: `gate-ctrl ${kernelState === v ? 'active' : ''}`,
              style: { 
                padding: '14px 0', border: `1px solid ${kernelState === v ? QUINARY_THEMES[v].color : '#222'}`, borderRadius: '6px', cursor: 'pointer',
                background: kernelState === v ? `linear-gradient(135deg, ${QUINARY_THEMES[v].color}22, ${QUINARY_THEMES[v].color}44)` : 'transparent',
                color: kernelState === v ? '#fff' : '#666',
                fontWeight: 900, transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
                boxShadow: (hoveredGate === v) ? `0 0 20px ${QUINARY_THEMES[v].color}55` : 'none',
                fontSize: '10px'
              }
            }, 
              v > 0 ? `+${v}` : v,
              kernelState === v && React.createElement('div', { style: { position: 'absolute', inset: 0, boxShadow: `inset 0 0 15px ${QUINARY_THEMES[v].color}88`, pointerEvents: 'none' } })
            ))
        ),
        React.createElement('div', { style: { marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${currentTheme.color}`, borderRadius: '0 8px 8px 0', transition: 'border-color 0.4s' } },
            React.createElement('div', { style: { fontSize: '12px', fontWeight: 900, color: currentTheme.color } }, `${currentTheme.name} RESONANCE`),
            React.createElement('div', { style: { fontSize: '10px', opacity: 0.6, marginTop: '4px' } }, currentTheme.desc)
        )
      ),

      // Scrollable Transition Logs
      React.createElement('div', { style: { flex: 1, border: '1px solid #1a1a1a', background: '#020202', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
        React.createElement('div', { style: { padding: '12px 15px', borderBottom: '1px solid #1a1a1a', background: 'rgba(255,255,255,0.03)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', color: '#ff00ff' } }, 'TRANSITION_TELEMETRY'),
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '15px' } },
          kernelLogs.length === 0 && React.createElement('div', { style: { fontSize: '9px', opacity: 0.2, textAlign: 'center', marginTop: '40px' } }, 'AWAITING SYNAPTIC SHIFT...'),
          kernelLogs.map(log => React.createElement('div', { key: log.id, style: { fontSize: '10px', color: QUINARY_THEMES[log.curr].color, marginBottom: '15px', borderLeft: `2px solid ${QUINARY_THEMES[log.curr].color}`, paddingLeft: '12px' } }, 
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', opacity: 0.5, fontSize: '8px', marginBottom: '4px' } }, 
              React.createElement('span', null, `[${QUINARY_THEMES[log.prev].name}] ➔ [${QUINARY_THEMES[log.curr].name}]`),
              React.createElement('span', null, new Date(log.timestamp).toLocaleTimeString())
            ),
            React.createElement('div', { style: { lineHeight: '1.4', opacity: 0.8 } }, log.text)
          )),
          React.createElement('div', { ref: logEndRef })
        )
      ),

      React.createElement('button', { onClick: startScanning, className: 'scan-trigger', style: { padding: '15px', background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', fontWeight: 900, borderRadius: '8px', cursor: 'pointer', letterSpacing: '2px', fontSize: '11px', transition: '0.3s' } }, '👁️ ACTIVATE OPTIC BRIDGE')
    ),

    // Main: Visualizer & Feed
    React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' } },
      React.createElement('div', { style: { flex: 1, background: '#000', position: 'relative' } },
        React.createElement('canvas', { ref: canvasRef, width: 800, height: 600, style: { width: '100%', height: '100%', cursor: 'crosshair' } }),
        React.createElement('div', { style: { position: 'absolute', top: '30px', right: '30px', textAlign: 'right', pointerEvents: 'none' } },
          React.createElement('div', { style: { fontSize: '20px', color: currentTheme.color, fontWeight: 900, letterSpacing: '6px', textShadow: `0 0 15px ${currentTheme.color}88` } }, currentTheme.name),
          React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, marginTop: '6px', letterSpacing: '1px' } }, `JMN SYNC // HEARTBEAT: ${sysHeartbeat} BPM`)
        )
      ),

      React.createElement('div', { style: { height: '340px', background: '#020202', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '20px' } },
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '10px' } },
          messages.length === 0 && React.createElement('div', { style: { opacity: 0.1, textAlign: 'center', marginTop: '60px', fontSize: '14px', letterSpacing: '5px' } }, '--- NO RESONANCE ---'),
          messages.map(m => React.createElement('div', { key: m.id, style: { alignSelf: m.sender === jmnId ? 'flex-end' : 'flex-start', maxWidth: '78%' } },
            React.createElement('div', { style: { fontSize: '9px', opacity: 0.5, marginBottom: '6px', textAlign: m.sender === jmnId ? 'right' : 'left', fontWeight: 800 } }, `${m.sender.toUpperCase()} // ${m.type.toUpperCase()}`),
            React.createElement('div', { style: { 
                padding: '12px 18px', borderRadius: '8px', 
                background: m.sender === jmnId ? 'rgba(0,255,204,0.08)' : 'rgba(255,0,255,0.08)', 
                border: `1px solid ${m.sender === jmnId ? '#00ffcc44' : '#ff00ff44'}`, 
                position: 'relative', fontSize: '13px', lineHeight: '1.6', color: '#fff',
                boxShadow: m.sender === jmnId ? '0 4px 15px rgba(0,255,204,0.03)' : '0 4px 15px rgba(255,0,255,0.03)'
              } },
              m.text
            )
          )),
          React.createElement('div', { ref: msgEndRef })
        ),
        React.createElement('div', { style: { display: 'flex', gap: '12px', marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #1a1a1a' } },
          React.createElement('input', {
            value: inputText, onChange: e => setInputText(e.target.value),
            onKeyDown: e => e.key === 'Enter' && handleSendMessage(),
            placeholder: 'TRANSMIT SIGNAL...',
            style: { flex: 1, background: '#000', border: '1px solid #333', color: '#00ffcc', padding: '14px 20px', borderRadius: '8px', outline: 'none', fontSize: '13px', transition: 'all 0.3s' }
          } as any),
          React.createElement('button', { 
            onClick: handleSendMessage, 
            style: { background: '#00ffcc', color: '#000', border: 'none', padding: '0 28px', fontWeight: 900, borderRadius: '8px', cursor: 'pointer', letterSpacing: '1px', fontSize: '12px', boxShadow: '0 0 15px rgba(0,255,204,0.2)' } 
          }, 'SEND')
        )
      ),

      // QR Display Modal
      showQrModal && React.createElement('div', { onClick: () => setShowQrModal(null), style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', backdropFilter: 'blur(20px)' } },
        React.createElement('div', { style: { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: `0 0 60px ${currentTheme.color}88`, animation: 'registrySlideUp 0.4s' } },
          React.createElement('canvas', { ref: qrCanvasRef, style: { display: 'block' } })
        ),
        React.createElement('div', { style: { marginTop: '30px', color: '#00ffcc', fontWeight: 900, letterSpacing: '5px', fontSize: '20px', textShadow: '0 0 15px #00ffcc' } }, 'NODE IDENTITY BEACON'),
        React.createElement('div', { style: { fontSize: '12px', opacity: 0.7, marginTop: '10px', color: '#fff' } }, `ID-RESONANCE: ${jmnId}`)
      ),

      // Optic Scanner UI Overlay
      scannerActive && React.createElement('div', { style: { position: 'absolute', inset: 0, background: '#000', zIndex: 1000 } },
        React.createElement('div', { id: 'scanner-region', style: { width: '100%', height: '100%' } } ),
        React.createElement('button', { 
            onClick: stopScanning, 
            style: { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', padding: '18px 50px', background: '#ff3333', color: '#fff', border: 'none', fontWeight: 900, borderRadius: '8px', cursor: 'pointer', boxShadow: '0 0 30px rgba(255,51,51,0.5)', letterSpacing: '3px' } 
        }, 'TERMINATE SCAN')
      )
    ),

    React.createElement('style', null, `
      .beacon-trigger:hover {
        background: rgba(0, 255, 204, 0.15) !important;
        border-color: #00ffcc !important;
        box-shadow: 0 0 20px rgba(0, 255, 204, 0.3);
        transform: translateY(-2px);
      }
      .gate-ctrl:hover {
        border-color: #555 !important;
        transform: scale(1.05);
      }
      .gate-ctrl.active:hover {
        transform: scale(1.1);
      }
      .scan-trigger:hover {
        background: rgba(0, 255, 204, 0.05) !important;
        box-shadow: 0 0 25px rgba(0, 255, 204, 0.2);
      }
      input:focus {
        border-color: #00ffcc !important;
        background: rgba(0, 255, 204, 0.02) !important;
      }
    `)
  );
};

export const emulatorApp: AppDef = {
  id: 'emulator-node',
  name: 'Emulator',
  component: EmulatorComponent,
  icon: '💬',
  category: 'Communication',
  defaultSize: { width: 1150, height: 780 },
  description: 'Synaptic Quinary Logic Emulator. Evolved to support State +3 (Hyper-Flow) via Trinity Audit.'
};