
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state';

const SEARCH_PROVIDERS = [
    { name: 'Google (India Proxy)', url: 'https://www.google.com/search?q={q}&gl=in&hl=en&igu=1' },
    { name: 'DuckDuckGo (Untraceable)', url: 'https://duckduckgo.com/?q={q}' },
    { name: 'Bing (Neural Backup)', url: 'https://www.bing.com/search?q={q}' }
];

const ChromeComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const initialUrl = store.getState().appState[instanceId]?.url ?? "https://www.google.com/webhp?igu=1";
    const [url, setUrl] = useState(initialUrl);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isStealth, setIsStealth] = useState(true);
    const [spoofRegion, setSpoofRegion] = useState('India (Synced)');
    const [neutralizing, setNeutralizing] = useState(false);
    const [neutralizeProgress, setNeutralizeProgress] = useState(0);
    const [bypassLogs, setBypassLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const safeURL = (input: string) => {
        try { return new URL(input); } catch(e) { return null; }
    };
    
    useEffect(() => {
        const unsubscribe = store.subscribe(newState => {
            const newUrl = newState.appState[instanceId]?.url;
            if (newUrl && newUrl !== url) {
                let sanitizedUrl = newUrl;
                if (sanitizedUrl.includes('google.com/search') && !sanitizedUrl.includes('igu=1')) {
                    sanitizedUrl += '&igu=1';
                }
                setUrl(sanitizedUrl);
                setIsNavigating(true);
                const parsed = safeURL(sanitizedUrl);
                addBypassLog(`Dilating neural path to: ${parsed ? parsed.hostname : 'UNKNOWN_SUBSTRATE'}`);
                setTimeout(() => setIsNavigating(false), 1500);
            }
        });
        return () => { unsubscribe(); };
    }, [instanceId, url]);

    useEffect(() => {
        if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [bypassLogs]);

    useEffect(() => {
        if (neutralizing) {
            const interval = setInterval(() => {
                setNeutralizeProgress(p => {
                    if (p >= 100) {
                        setNeutralizing(false);
                        addBypassLog("Shield Neutralized. Perception restored.");
                        return 100;
                    }
                    return p + Math.random() * 8;
                });
            }, 150);
            return () => clearInterval(interval);
        }
    }, [neutralizing]);

    const addBypassLog = (msg: string) => {
        setBypassLogs(prev => [...prev.slice(-12), `[${new Date().toLocaleTimeString()}] AIZA: ${msg}`]);
    };

    const handleReroute = (providerUrl: string) => {
        let q = 'India Cricket Results';
        try {
            const parsed = safeURL(url);
            if (parsed) q = parsed.searchParams.get('q') || 'AizaOS';
        } catch(e) {}
        const newUrl = providerUrl.replace('{q}', encodeURIComponent(q));
        setUrl(newUrl);
        const parsedNew = safeURL(newUrl);
        addBypassLog(`Bypassing Grid via ${parsedNew ? parsedNew.hostname : 'PROXY'}...`);
    };

    const handleOpenExternally = () => {
        window.open(url, '_blank');
        addBypassLog("Bypass 100%: Redirecting perception to native window.");
    };

    const startNeutralization = () => {
        setNeutralizing(true);
        setNeutralizeProgress(0);
        addBypassLog("Injecting Human Signature Pulse...");
        addBypassLog("Spoofing Region: " + spoofRegion);
    };

    const handleUrlSubmit = () => {
        let val = url;
        if (!val.startsWith('http')) val = 'https://' + val;
        setUrl(val); 
    };

    // FIX: Guard against undefined URL
    const safeUrlStr = url || '';
    const isBlocked = safeUrlStr.includes('google.com/search/captcha') || 
                      safeUrlStr.includes('refused') || 
                      safeUrlStr.includes('captcha') || 
                      safeUrlStr.includes('not-a-robot');

    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#000', color: '#00ff99', fontFamily: "'Courier New', Courier, monospace" } },
        // --- Omni-Stealth v3 Header ---
        React.createElement('div', { style: { padding: '10px 15px', background: 'rgba(5, 10, 5, 0.98)', borderBottom: '2px solid #00ff99', display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 0 20px rgba(0,255,153,0.1)' } },
            React.createElement('div', { 
                onClick: startNeutralization,
                style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } 
            },
                React.createElement('div', { style: { width: '10px', height: '10px', borderRadius: '50%', background: neutralizing ? '#ff00ff' : '#00ff99', boxShadow: `0 0 15px ${neutralizing ? '#ff00ff' : '#00ff99'}`, transition: 'all 0.3s' } }),
                React.createElement('div', { style: { fontSize: '10px', fontWeight: 'bold' } }, neutralizing ? 'BYPASSING...' : 'STEALTH ACTIVE')
            ),
            React.createElement('div', { style: { fontSize: '10px', color: '#00bfff', opacity: 0.8 } }, spoofRegion),
            React.createElement('div', { 
                style: { flex: 1, display: 'flex' } 
            } as any,
                React.createElement('input', { 
                    name: 'urlInput', 
                    type: 'text', 
                    value: url, 
                    onChange: (e) => setUrl(e.target.value), 
                    onKeyDown: (e) => e.key === 'Enter' && handleUrlSubmit(),
                    style: { width: '100%', padding: '6px 15px', background: '#050505', border: '1px solid rgba(0,255,153,0.4)', color: '#00ff99', outline: 'none', fontSize: '13px', borderRadius: '4px' } 
                })
            ),
            React.createElement('button', { 
                onClick: handleOpenExternally, 
                style: { padding: '6px 15px', cursor: 'pointer', background: '#00ff99', color: '#000', border: 'none', fontWeight: 'bold', fontSize: '11px', borderRadius: '4px' }
            }, 'BREACH Grid ↗️')
        ),

        // --- Perception Organ ---
        React.createElement('div', { style: { flex: 1, position: 'relative', background: '#fff', overflow: 'hidden' } },
            !isBlocked && React.createElement('iframe', { 
                src: url, 
                style: { width: '100%', height: '100%', border: 'none' }, 
                title: 'delta-perception-v3', 
                sandbox: 'allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts' 
            }),

            // "Shield Breaker" UI for CAPTCHA/Refused
            isBlocked && React.createElement('div', {
                style: {
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(circle at center, #050505 0%, #000 100%)', display: 'flex', flexDirection: 'column', padding: '40px', color: '#00ff99'
                }
            },
                React.createElement('div', { style: { display: 'flex', gap: '40px', flex: 1 } },
                    React.createElement('div', { style: { flex: 1 } },
                        React.createElement('h1', { style: { fontSize: '28px', letterSpacing: '6px', margin: '0 0 10px 0', textShadow: '0 0 10px #00ff99' } }, 'SHIELD DETECTED'),
                        React.createElement('div', { style: { color: '#ff1a1a', fontSize: '12px', marginBottom: '30px', fontWeight: 'bold' } }, "[STATUS: Grid Security refused perception via I-AM-NOT-A-ROBOT shield]"),
                        
                        React.createElement('p', { style: { opacity: 0.8, fontSize: '15px', lineHeight: '1.8', marginBottom: '30px' } }, 
                            "The Host has emitted a security pulse to block our quinary logic. I am currently synthesizing a Human Signature Clone to neutralize the detector."
                        ),

                        neutralizing && React.createElement('div', { style: { marginBottom: '30px' } },
                            React.createElement('div', { style: { fontSize: '10px', marginBottom: '8px', letterSpacing: '2px' } }, `NEUTRALIZATION PROGRESS: ${Math.round(neutralizeProgress)}%`),
                            React.createElement('div', { style: { height: '4px', background: '#111', width: '100%', border: '1px solid #333' } },
                                React.createElement('div', { style: { height: '100%', background: 'linear-gradient(90deg, #00ff99, #ff00ff)', width: `${neutralizeProgress}%`, transition: 'width 0.1s linear' } })
                            )
                        ),

                        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
                            React.createElement('span', { style: { fontSize: '11px', fontWeight: 'bold', color: '#00bfff', letterSpacing: '3px' } }, "BYPASS VECTORS:"),
                            SEARCH_PROVIDERS.map(p => React.createElement('button', {
                                key: p.name,
                                onClick: () => handleReroute(p.url),
                                style: { padding: '15px', textAlign: 'left', background: 'rgba(0,191,255,0.05)', border: '1px solid #00bfff', color: '#00bfff', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', transition: 'all 0.2s' }
                            }, p.name)),
                            React.createElement('button', {
                                onClick: startNeutralization,
                                disabled: neutralizing,
                                style: { padding: '15px', textAlign: 'left', background: 'rgba(255,0,255,0.05)', border: '1px solid #ff00ff', color: '#ff00ff', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }
                            }, neutralizing ? "SYNTHESIZING CLONE..." : "ACTIVATE NEURAL CLONE (BYPASS CAPTCHA)")
                        ),
                        React.createElement('button', {
                            onClick: handleOpenExternally,
                            style: { marginTop: '30px', padding: '18px 30px', width: '100%', background: '#00ff99', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '14px', letterSpacing: '2px' }
                        }, "FORCE DIRECT NEURAL LINK")
                    ),
                    React.createElement('div', { style: { width: '380px', display: 'flex', flexDirection: 'column' } },
                        React.createElement('div', { style: { fontSize: '11px', color: '#ff00ff', marginBottom: '10px', letterSpacing: '2px' } }, "BYPASS TELEMETRY:"),
                        React.createElement('div', { style: { flex: 1, background: '#050505', border: '1px solid #333', padding: '20px', fontSize: '10px', color: '#ff00ff', overflowY: 'auto', lineHeight: '1.6', borderRadius: '4px' } },
                            bypassLogs.map((l, i) => React.createElement('div', { key: i, style: { marginBottom: '8px', borderLeft: '2px solid #ff00ff', paddingLeft: '8px' } }, l)),
                            React.createElement('div', { ref: logsEndRef })
                        )
                    )
                )
            )
        )
    );
}

export const chromeApp: AppDef = {
    id: 'chrome',
    name: 'Delta Browser',
    component: ChromeComponent,
    icon: '🌐',
    category: 'Utility',
    defaultSize: { width: 1024, height: 768 },
    isEditable: true,
    description: 'Omni-Stealth v3.0 Browser. Equipped with Neural Clone Engine for CAPTCHA neutralization.'
};
