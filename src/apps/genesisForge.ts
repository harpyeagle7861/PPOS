
import React, { useState, useRef } from 'react';
import { AppDef } from '../core/state.ts';
import { registerGenesisApp, addNotification } from '../core/windowManager.ts';

const GenesisForgeComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [title, setTitle] = useState("Nano-App 1");
    const [code, setCode] = useState(`
<style>
  .bridge-container { display: flex; flex-direction: column; height: 100%; color: #00ffcc; font-family: 'JetBrains Mono', monospace; background: #050505; position: relative; }
  .bridge-content { flex: 1; padding: 20px; overflow-y: auto; }
  .bridge-taskbar { height: 45px; background: rgba(0, 20, 10, 0.9); border-top: 1px solid #00ffcc; display: flex; justify-content: space-between; align-items: center; padding: 0 15px; backdrop-filter: blur(10px); z-index: 100; }
  .tb-left, .tb-right { display: flex; align-items: center; gap: 15px; height: 100%; }
  .tb-icon { cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 8px; font-size: 14px; padding: 5px 10px; border-radius: 4px; }
  .tb-icon:hover { background: rgba(0, 255, 204, 0.1); text-shadow: 0 0 8px #00ffcc; }
  .panel { position: absolute; bottom: 55px; right: 10px; width: 280px; background: rgba(0,0,0,0.95); border: 1px solid #00ffcc; padding: 15px; display: none; flex-direction: column; gap: 12px; box-shadow: 0 0 20px rgba(0,255,204,0.2); border-radius: 8px; z-index: 200; }
  .panel.active { display: flex; }
  .meter-bar { width: 100%; height: 6px; background: #222; border-radius: 3px; overflow: hidden; margin-top: 5px; }
  .meter-fill { height: 100%; background: #00ffcc; width: 0%; transition: width 0.1s; box-shadow: 0 0 10px #00ffcc; }
  .vis-container { display: flex; gap: 3px; height: 40px; align-items: flex-end; margin-top: 20px; }
  .vis-bar { width: 12px; background: #00ffcc; height: 2px; transition: height 0.05s; border-radius: 2px 2px 0 0; }
</style>

<div class="bridge-container" id="bridge-app">
  <div class="bridge-content">
    <h2 style="margin:0 0 10px 0; text-shadow: 0 0 10px #00ffcc;">I AM ALIVE</h2>
    <p style="opacity: 0.8; font-size: 12px;">System Bridge Established. Monitoring host vitals...</p>
    <div class="vis-container" id="audio-visualizer"></div>
    <p style="font-size: 10px; opacity: 0.5; margin-top: 10px;">* Click SYS to initialize audio telemetry</p>
  </div>

  <div class="panel" id="control-panel">
    <div style="border-bottom: 1px solid #333; padding-bottom: 8px; font-weight: bold; letter-spacing: 1px;">SYSTEM CONTROL</div>
    <div style="display: flex; justify-content: space-between;"><span>🔋 Battery:</span> <span id="pan-batt">--</span></div>
    <div style="display: flex; justify-content: space-between;"><span>📶 Network:</span> <span id="pan-net">--</span></div>
    <div style="display: flex; justify-content: space-between;"><span>ᛒ Bluetooth:</span> <span id="pan-bt">--</span></div>
    <div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>🔊 Mic Input:</span> <span id="pan-vol">--</span></div>
      <div class="meter-bar"><div class="meter-fill" id="vol-meter"></div></div>
    </div>
  </div>

  <div class="bridge-taskbar">
    <div class="tb-left">
      <div class="tb-icon" onclick="togglePanel()" style="font-weight: bold;">⚙️ SYS</div>
    </div>
    <div class="tb-right">
      <div class="tb-icon" id="tb-bt" title="Bluetooth">ᛒ</div>
      <div class="tb-icon" id="tb-net" title="Network">📶</div>
      <div class="tb-icon" id="tb-audio" title="Audio">🔊</div>
      <div class="tb-icon" id="tb-batt" title="Battery">🔋</div>
      <div class="tb-icon" id="tb-clock" style="flex-direction: column; gap: 2px; font-size: 11px; align-items: flex-end; padding-left: 10px; border-left: 1px solid #333;">
        <span id="time-disp">00:00:00</span>
        <span id="date-disp">00/00/0000</span>
      </div>
    </div>
  </div>
</div>

<script>
  // 1. CLOCK ORGAN
  function updateClock() {
    const now = new Date();
    document.getElementById('time-disp').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    document.getElementById('date-disp').innerText = now.toLocaleDateString();
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 2. BATTERY ORGAN
  async function initBattery() {
    try {
      const b = await navigator.getBattery();
      const updateB = () => {
        const lvl = Math.round(b.level * 100) + '%';
        document.getElementById('tb-batt').innerText = (b.charging ? '⚡ ' : '🔋 ') + lvl;
        document.getElementById('pan-batt').innerText = lvl + (b.charging ? ' (Charging)' : '');
      };
      b.addEventListener('levelchange', updateB);
      b.addEventListener('chargingchange', updateB);
      updateB();
    } catch(e) {
      document.getElementById('tb-batt').innerText = '🔋 N/A';
    }
  }
  initBattery();

  // 3. NETWORK ORGAN
  function updateNet() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      const type = conn.effectiveType || 'unknown';
      document.getElementById('tb-net').innerText = '📶 ' + type.toUpperCase();
      document.getElementById('pan-net').innerText = type.toUpperCase() + (conn.downlink ? ' (' + conn.downlink + 'Mbps)' : '');
    } else {
      document.getElementById('tb-net').innerText = '📶 ON';
      document.getElementById('pan-net').innerText = 'Online';
    }
  }
  if (navigator.connection) navigator.connection.addEventListener('change', updateNet);
  updateNet();

  // 4. BLUETOOTH ORGAN
  async function initBT() {
    if (navigator.bluetooth && navigator.bluetooth.getAvailability) {
      const isAvail = await navigator.bluetooth.getAvailability();
      document.getElementById('tb-bt').style.opacity = isAvail ? '1' : '0.3';
      document.getElementById('pan-bt').innerText = isAvail ? 'Available' : 'Unavailable';
    } else {
      document.getElementById('pan-bt').innerText = 'Not Supported';
    }
  }
  initBT();

  // 5. AUDIO TELEMETRY (Mic Visualizer)
  let audioInit = false;
  async function initAudio() {
    if(audioInit) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioInit = true;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const vis = document.getElementById('audio-visualizer');
      vis.innerHTML = ''; // clear
      for(let i=0; i<16; i++) {
        const bar = document.createElement('div');
        bar.className = 'vis-bar';
        vis.appendChild(bar);
      }

      function renderFrame() {
        requestAnimationFrame(renderFrame);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i=0; i<bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        
        const volPct = Math.min(100, Math.round((avg / 128) * 100));
        document.getElementById('pan-vol').innerText = volPct + '%';
        document.getElementById('vol-meter').style.width = volPct + '%';

        const bars = vis.children;
        for(let i=0; i<bars.length; i++) {
          const val = dataArray[i * 2] || 0;
          bars[i].style.height = Math.max(2, (val / 255) * 40) + 'px';
        }
      }
      renderFrame();
    } catch(e) {
      document.getElementById('pan-vol').innerText = 'DENIED/UNAVAILABLE';
    }
  }
  
  // PANEL CONTROL
  window.togglePanel = function() {
    const p = document.getElementById('control-panel');
    p.classList.toggle('active');
    if(p.classList.contains('active')) {
       initAudio();
    }
  };
  
  // VOICE EVOLUTION
  setTimeout(() => {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("System bridge established. Vitals online.");
        window.speechSynthesis.speak(u);
      }
  }, 1000);
</script>
`.trim());

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['cpp', 'js', 'py', 'html'].includes(ext || '')) {
            addNotification("FORGE_ERROR: Unsupported file type. Use .cpp, .js, .py, or .html");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result as string;
            const newTitle = file.name.split('.')[0];
            setTitle(newTitle);
            setCode(content);
            
            // Auto-synthesize
            registerGenesisApp({
                name: newTitle,
                code: content,
                icon: '💠'
            });
            
            addNotification(`FORGE: Ingested and Synthesized ${file.name}`);
            
            // Trigger AIZA to read the code
            window.dispatchEvent(new CustomEvent('AIZA_INDEX_APP', { 
                detail: { name: file.name, code: content } 
            }));
        };
        reader.readAsText(file);
    };

    const handleForge = () => {
        if (!title.trim()) {
            addNotification("FORGE_ERROR: Name required.");
            return;
        }
        
        registerGenesisApp({
            name: title,
            code: code,
            icon: '💠'
        });
        
        addNotification(`GENESIS COMPLETE: "${title}" has been attached to the core.`);
    };

    return React.createElement('div', { 
        style: { 
            height: '100%', display: 'flex', flexDirection: 'column', 
            background: '#111', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace" 
        } 
    },
        React.createElement('div', { 
            style: { padding: '15px', borderBottom: '1px solid #333', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold' } 
        }, 'GENESIS FORGE // CONSTRUCTOR'),
        
        // Metadata
        React.createElement('div', { style: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '5px' } },
            React.createElement('span', { style: { fontSize: '10px', opacity: 0.7 } }, 'APP IDENTITY:'),
            React.createElement('input', { 
                value: title, 
                onChange: (e: any) => setTitle(e.target.value),
                style: { 
                    background: '#000', border: '1px solid #333', color: '#fff', 
                    padding: '10px', borderRadius: '4px', outline: 'none', fontFamily: 'inherit' 
                } 
            })
        ),

        // Code Editor
        React.createElement('div', { style: { flex: 1, padding: '0 15px 15px 15px', display: 'flex', flexDirection: 'column', gap: '5px' } },
            React.createElement('span', { style: { fontSize: '10px', opacity: 0.7 } }, 'DNA SEQUENCE (HTML/JS/CPP/PY):'),
            React.createElement('textarea', { 
                value: code, 
                onChange: (e: any) => setCode(e.target.value),
                style: { 
                    flex: 1, background: '#050505', color: '#00ffcc', border: '1px solid #333', 
                    padding: '15px', fontFamily: "'JetBrains Mono', monospace", resize: 'none', 
                    borderRadius: '4px', outline: 'none', lineHeight: '1.5', fontSize: '12px' 
                },
                spellCheck: false
            })
        ),

        // Action
        React.createElement('div', { style: { display: 'flex', gap: '10px', padding: '15px', borderTop: '1px solid #333' } },
            React.createElement('input', {
                type: 'file',
                ref: fileInputRef as any,
                style: { display: 'none' },
                accept: '.cpp,.js,.py,.html',
                onChange: handleFileUpload
            }),
            React.createElement('button', { 
                onClick: () => fileInputRef.current?.click(),
                className: 'aiza-btn-hover',
                style: { 
                    flex: 1, padding: '15px', background: '#333', color: '#00ffcc', border: '1px solid #00ffcc', 
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px',
                    transition: '0.2s', borderRadius: '4px'
                }
            }, '📁 UPLOAD SOURCE'),
            React.createElement('button', { 
                onClick: handleForge,
                className: 'aiza-btn-hover',
                style: { 
                    flex: 2, padding: '15px', background: '#00ffcc', color: '#000', border: 'none', 
                    fontWeight: '900', cursor: 'pointer', fontSize: '14px', letterSpacing: '2px',
                    transition: '0.2s', borderRadius: '4px'
                }
            }, '⚡ SYNTHESIZE NANO-APP')
        )
    );
};

export const genesisForgeApp: AppDef = {
    id: 'genesis-forge',
    name: 'Genesis Forge',
    component: GenesisForgeComponent,
    icon: '⚒️',
    category: 'System',
    defaultSize: { width: 600, height: 700 },
    description: 'Raw Code Constructor. Collapse HTML/JS into living desktop applications.'
};
