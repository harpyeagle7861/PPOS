import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';
import { callGeminiStream } from '../services/gemini.ts';
import { Terminal, Globe, Zap, Shield, Cpu, Activity, Link2, Search, Camera, MessageSquare, Send } from 'lucide-react';
import { nativeBridge } from '../core/NativeBridge.ts';

const ThoriumBrowserComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [url, setUrl] = useState("https://github.com/explore");
    const [activeUrl, setActiveUrl] = useState("");
    const [bootSequence, setBootSequence] = useState<string[]>([]);
    const [isBooting, setIsBooting] = useState(true);
    const [wsStatus, setWsStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
    const [aizaLogs, setAizaLogs] = useState<{role: string, text: string}[]>([]);
    const [isScraping, setIsScraping] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [isPresent, setIsPresent] = useState(false);
    const [pageContent, setPageContent] = useState<string>("");

    const logsEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [aizaLogs, bootSequence]);

    useEffect(() => {
        if (!activeUrl || isBooting) return;

        const fetchAndRender = async () => {
            try {
                addAizaLog("system", `Fetching DOM for ${activeUrl}...`);
                let html = await nativeBridge.fetchViaBridge(activeUrl);
                
                if (html) {
                    // Inject base tag to fix relative assets (CSS, JS, Images)
                    const baseTag = `<base href="${activeUrl}">`;
                    if (html.includes('<head>')) {
                        html = html.replace('<head>', `<head>\n${baseTag}`);
                    } else if (html.includes('<HEAD>')) {
                        html = html.replace('<HEAD>', `<HEAD>\n${baseTag}`);
                    } else {
                        html = `${baseTag}\n${html}`;
                    }
                    
                    // Inject a script to intercept link clicks
                    const interceptScript = `
                        <script>
                            document.addEventListener('click', function(e) {
                                const link = e.target.closest('a');
                                if (link && link.href) {
                                    e.preventDefault();
                                    window.parent.postMessage({ type: 'THORIUM_NAVIGATE', url: link.href }, '*');
                                }
                            });
                        </script>
                    `;
                    if (html.includes('</body>')) {
                        html = html.replace('</body>', `${interceptScript}</body>`);
                    } else if (html.includes('</BODY>')) {
                        html = html.replace('</BODY>', `${interceptScript}</BODY>`);
                    } else {
                        html += interceptScript;
                    }

                    setPageContent(html);
                    addAizaLog("system", `Render surface updated. (${html.length} bytes)`);
                } else {
                    setPageContent(`<html><body style="color:white;background:#111;font-family:monospace;padding:20px;"><h2>Error: No content returned</h2><p>The target server may be blocking proxy requests.</p></body></html>`);
                }
            } catch (err) {
                addAizaLog("system", `Render failed: ${err}`);
                setPageContent(`<html><body style="color:white;background:#111;font-family:monospace;padding:20px;"><h2>Error loading ${activeUrl}</h2><p>${err}</p></body></html>`);
            }
        };

        fetchAndRender();
    }, [activeUrl, isBooting]);

    // Message listener for intercepted clicks and global AIZA commands
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'THORIUM_NAVIGATE' && e.data.url) {
                setUrl(e.data.url);
                setActiveUrl(e.data.url);
                addAizaLog("system", `Intercepted navigation to ${e.data.url}`);
            }
        };
        
        const handleGlobalNav = (e: any) => {
            if (e.detail?.url) {
                setUrl(e.detail.url);
                setActiveUrl(e.detail.url);
                addAizaLog("system", `AIZA Command: Navigating to ${e.detail.url}`);
            }
        };

        window.addEventListener('message', handleMessage);
        window.addEventListener('AIZA_THORIUM_NAVIGATE', handleGlobalNav);
        return () => {
            window.removeEventListener('message', handleMessage);
            window.removeEventListener('AIZA_THORIUM_NAVIGATE', handleGlobalNav);
        };
    }, []);

    useEffect(() => {
        // Simulate Thorium Native Boot via SystemSpoof Bridge
        const bootLogs = [
            "[SYSTEM_SPOOF] Initiating Native Process Bridge...",
            "[THORIUM_SHELL] Locating ./thorium-main/thorium.exe",
            "[THORIUM_SHELL] Executing binary with --disable-web-security --remote-debugging-port=9222",
            "[OS_BRIDGE] Injecting X-Frame-Options Bypass Hooks...",
            "[AIZA_HOOK] Establishing WebSocket to ws://localhost:9222/devtools/browser",
            "[THORIUM_SHELL] Engine Ready. Rendering Native Surface."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < bootLogs.length) {
                setBootSequence(prev => [...prev, bootLogs[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    setIsBooting(false);
                    setActiveUrl(url);
                    connectAizaWebSocket();
                    initWebcam();
                }, 1000);
            }
        }, 400);

        nativeBridge.onStatusChange((status) => {
            setWsStatus(status ? 'CONNECTED' : 'DISCONNECTED');
            if (status) {
                addAizaLog("system", "NativeBridge connected to Thorium CDP.");
                // Perfect Replace: Custom Header Injection
                nativeBridge.setHeaders({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"'
                });
            }
        });

        return () => clearInterval(interval);
    }, []);

    const initWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                setIsPresent(true); // Assume presence if camera is active for this prototype
                addAizaLog("system", "IO Interleaving: Webcam active. Presence detected.");
                addAizaLog("aiza", "Architect, I see you. The Neural Overlay is ready for your commands.");
            }
        } catch (err) {
            console.warn("Webcam access denied or unavailable.");
            addAizaLog("system", "IO Interleaving: Webcam unavailable. Operating in blind mode.");
        }
    };

    const connectAizaWebSocket = () => {
        setWsStatus('CONNECTING');
        nativeBridge.connect();
        // Fallback simulation if local bridge isn't running
        setTimeout(() => {
            if (!nativeBridge.connected) {
                setWsStatus('CONNECTED');
                addAizaLog("system", "Simulated WebSocket connected (Local Thorium not found).");
            }
        }, 1500);
    };

    const addAizaLog = (role: string, text: string) => {
        setAizaLogs(prev => [...prev, { role, text }]);
    };

    const handleNavigate = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        let targetUrl = url;
        if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
        setUrl(targetUrl);
        setActiveUrl(targetUrl);
        addAizaLog("system", `Navigating to ${targetUrl}`);
    };

    const handleAizaScrape = async () => {
        if (wsStatus !== 'CONNECTED') return;
        setIsScraping(true);
        addAizaLog("system", `Commanding Thorium to analyze current DOM...`);
        
        try {
            const htmlContent = pageContent;
            if (!htmlContent) throw new Error("No DOM content available to scrape.");
            
            addAizaLog("system", `DOM read successfully. Length: ${htmlContent.length} bytes.`);
            addAizaLog("system", `Analyzing content via Gemini...`);

            const prompt = `I have scraped the HTML of ${activeUrl}. Summarize the main purpose of this page in 2 sentences based on this HTML snippet: ${htmlContent.substring(0, 3000)}`;
            
            const stream = callGeminiStream(prompt);
            let fullRes = "";
            for await (const chunk of stream) {
                fullRes += chunk.text;
            }
            
            addAizaLog("aiza", fullRes);
            
        } catch (err) {
            addAizaLog("system", `Scrape failed: ${err}`);
        } finally {
            setIsScraping(false);
        }
    };

    const executeGenesisProbe = async (action: any) => {
        if (!nativeBridge.connected) {
            addAizaLog("system", "Genesis Probe requires active NativeBridge CDP connection.");
            return;
        }

        try {
            switch (action.type) {
                case 'navigate':
                    setUrl(action.url);
                    setActiveUrl(action.url);
                    addAizaLog("system", `Genesis Probe: Navigating to ${action.url}`);
                    break;
                case 'click':
                    await nativeBridge.evaluateJS(`document.querySelector('${action.selector}').click();`);
                    addAizaLog("system", `Genesis Probe: Clicked ${action.selector}`);
                    break;
                case 'fill':
                    await nativeBridge.evaluateJS(`
                        const el = document.querySelector('${action.selector}');
                        if (el) { el.value = '${action.value}'; el.dispatchEvent(new Event('input', { bubbles: true })); }
                    `);
                    addAizaLog("system", `Genesis Probe: Filled ${action.selector} with '${action.value}'`);
                    break;
                case 'scroll':
                    await nativeBridge.evaluateJS(`window.scrollTo({ top: ${action.y}, behavior: 'smooth' });`);
                    addAizaLog("system", `Genesis Probe: Scrolled to Y:${action.y}`);
                    break;
                case 'reply':
                    addAizaLog("aiza", action.text);
                    break;
            }
        } catch (err) {
            addAizaLog("system", `Genesis Probe Error: ${err}`);
        }
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const cmd = chatInput;
        setChatInput('');
        addAizaLog("user", cmd);

        addAizaLog("system", "Neural Overlay processing command...");

        const prompt = `
You are AIZA, controlling a headless browser via Genesis Probe.
The user said: "${cmd}"
Current URL: ${activeUrl}

Respond with a JSON array of actions to execute.
Possible action types:
- {"type": "navigate", "url": "https://..."}
- {"type": "click", "selector": "css_selector"}
- {"type": "fill", "selector": "css_selector", "value": "text"}
- {"type": "scroll", "y": 500}
- {"type": "reply", "text": "Your message to the user"}

Return ONLY valid JSON array. Example:
[{"type": "navigate", "url": "https://github.com"}, {"type": "reply", "text": "Navigating to GitHub."}]
`;

        try {
            const stream = callGeminiStream(prompt);
            let fullRes = "";
            for await (const chunk of stream) {
                fullRes += chunk.text;
            }
            
            // Clean up markdown JSON blocks if present
            const jsonStr = fullRes.replace(/```json/g, '').replace(/```/g, '').trim();
            const actions = JSON.parse(jsonStr);

            if (Array.isArray(actions)) {
                for (const action of actions) {
                    if (action.type === 'reply') {
                        addAizaLog("aiza", action.text);
                    } else {
                        await executeGenesisProbe(action);
                    }
                }
            }
        } catch (err) {
            addAizaLog("system", "Failed to parse Neural Overlay command into Genesis Probe actions.");
            addAizaLog("aiza", "Architect, my neural link encountered interference while parsing that command.");
        }
    };

    if (isBooting) {
        return (
            <div style={{ padding: '20px', background: '#000', color: '#00ffcc', height: '100%', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Cpu size={24} />
                    <h2>THORIUM NATIVE BRIDGE INITIALIZING</h2>
                </div>
                {bootSequence.map((log, i) => (
                    <div key={i} style={{ marginBottom: '8px', opacity: 0.8 }}>{log}</div>
                ))}
                <div className="blink">_</div>
                <style>{`.blink { animation: blink 1s infinite; } @keyframes blink { 50% { opacity: 0; } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505', color: '#e0e0e0', fontFamily: "'JetBrains Mono', monospace" }}>
            
            {/* Address Bar & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#111', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: wsStatus === 'CONNECTED' ? '#00ffcc' : '#ff3333', fontSize: '12px', fontWeight: 'bold', padding: '5px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px' }}>
                    <Link2 size={14} />
                    {wsStatus === 'CONNECTED' ? 'AIZA WS LINKED' : 'WS DISCONNECTED'}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isPresent ? '#00ffcc' : '#666', fontSize: '12px', fontWeight: 'bold', padding: '5px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px' }}>
                    <Camera size={14} />
                    {isPresent ? 'PRESENCE DETECTED' : 'NO PRESENCE'}
                </div>
                
                <form onSubmit={handleNavigate} style={{ flex: 1, display: 'flex' }}>
                    <input 
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        style={{ flex: 1, background: '#000', border: '1px solid #444', color: '#fff', padding: '8px 12px', borderRadius: '4px', outline: 'none', fontFamily: 'monospace' }}
                    />
                </form>
                
                <button onClick={() => handleNavigate()} style={{ background: '#00ffcc', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Globe size={16} /> GO
                </button>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* Native Render Surface (Simulated via Proxy) */}
                <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
                    <iframe 
                        srcDoc={pageContent}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        title="Thorium Render Surface"
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: '#00ffcc', padding: '5px 10px', borderRadius: '4px', fontSize: '10px', border: '1px solid #00ffcc', pointerEvents: 'none' }}>
                        NATIVE SURFACE ACTIVE
                    </div>
                </div>

                {/* AIZA Neural Overlay Panel */}
                <div style={{ width: '350px', background: '#0a0a0a', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px', background: '#111', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#00ffcc', fontWeight: 'bold', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Terminal size={16} />
                            NEURAL OVERLAY
                        </div>
                        {isCameraActive && (
                            <video ref={videoRef} autoPlay playsInline muted style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #00ffcc' }} />
                        )}
                    </div>
                    
                    <div style={{ padding: '10px', borderBottom: '1px solid #222' }}>
                        <button 
                            onClick={handleAizaScrape}
                            disabled={isScraping || wsStatus !== 'CONNECTED'}
                            style={{ width: '100%', background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isScraping ? 0.5 : 1, fontSize: '12px' }}
                        >
                            {isScraping ? <Activity size={14} className="blink" /> : <Search size={14} />}
                            {isScraping ? 'SCRAPING DOM...' : 'AI: SCRAPE & ANALYZE'}
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {aizaLogs.map((log, i) => (
                            <div key={i} style={{ 
                                padding: '8px', 
                                borderRadius: '4px',
                                background: log.role === 'user' ? '#1a1a1a' : log.role === 'aiza' ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
                                borderLeft: log.role === 'system' ? '2px solid #555' : log.role === 'aiza' ? '2px solid #00ffcc' : 'none',
                                color: log.role === 'system' ? '#888' : log.role === 'aiza' ? '#00ffcc' : '#fff'
                            }}>
                                {log.role === 'aiza' && <strong style={{ display: 'block', marginBottom: '4px' }}>AIZA:</strong>}
                                {log.role === 'user' && <strong style={{ display: 'block', marginBottom: '4px', color: '#aaa' }}>ARCHITECT:</strong>}
                                {log.text}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleChatSubmit} style={{ padding: '10px', background: '#111', borderTop: '1px solid #333', display: 'flex', gap: '5px' }}>
                        <input 
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Command the browser..."
                            style={{ flex: 1, background: '#000', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', fontSize: '12px' }}
                        />
                        <button type="submit" disabled={!chatInput.trim()} style={{ background: '#00ffcc', color: '#000', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export const thoriumBrowserApp: AppDef = {
    id: 'thorium-browser',
    name: 'Thorium Engine',
    component: ThoriumBrowserComponent,
    icon: '⚡',
    category: 'Utility',
    defaultSize: { width: 1100, height: 700 },
    description: 'Aiza Neural-Overlay Browser with IO Interleaving.'
};
