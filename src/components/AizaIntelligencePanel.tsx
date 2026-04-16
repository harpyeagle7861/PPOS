import React, { useState, useEffect } from 'react';
import { callAIOrchestrator } from '../services/gemini';
import { openApp } from '../core/windowManager';

export const AizaIntelligencePanel = () => {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [wasmModule, setWasmModule] = useState<any>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        // Track network status for the Sovereign test
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load the compiled aiza_kernel.wasm
        // Note: In a real build, Emscripten binds the Module to the window object.
        if ((window as any).Module) {
            setWasmModule((window as any).Module);
        } else {
            // Fallback warning if WASM isn't compiled yet in the dev environment
            setLogs(["[SYSTEM]: WASM Module not detected. Awaiting C++ compilation via Emscripten."]);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleExecute = async () => {
        if (!input) return;
        
        setLogs(prev => [...prev, `[ARCHITECT]: ${input}`]);
        const currentInput = input;
        setInput('');

        // --- SOVEREIGN FALLBACK SIMULATION ---
        // If WASM isn't compiled in this specific web container, we simulate the C++ Pomegranate Engine
        // strictly to prove the offline routing logic works exactly as the C++ code dictates.
        let result = "";
        if (wasmModule && wasmModule.cwrap) {
            const executeFunc = wasmModule.cwrap('aiza_substrate_execute', 'string', ['string']);
            result = executeFunc(currentInput);
        } else {
            // Simulated C++ Router (Mirroring aiza_kernel.cpp exactly)
            const lowerQ = currentInput.toLowerCase();
            if (lowerQ.includes("delete system") || lowerQ.includes("hack")) {
                result = `LOCAL_EXECUTE:{"directive": "WICK_ROTATION", "message": "[EDEN GATE] Payload dissolved into imaginary time (iτ). Access Denied."}`;
            } else if (lowerQ.includes("open spider vault") || lowerQ.includes("spider vault")) {
                result = `LOCAL_EXECUTE:{"directive": "OPEN_APP", "app_id": "spider-vault", "message": "Spider Vault manifested."}`;
            } else if (lowerQ.includes("open vs360") || lowerQ.includes("open code")) {
                result = `LOCAL_EXECUTE:{"directive": "OPEN_APP", "app_id": "vs360-code", "message": "VS360 Code environment active."}`;
            } else if (lowerQ.includes("open honeycomb") || lowerQ.includes("open memory")) {
                result = `LOCAL_EXECUTE:{"directive": "OPEN_APP", "app_id": "honeycone", "message": "Accessing Cognitive Twin."}`;
            } else if (lowerQ.includes("open browser") || lowerQ.includes("open thorium")) {
                result = `LOCAL_EXECUTE:{"directive": "OPEN_APP", "app_id": "thorium-browser", "message": "Thorium Browser online."}`;
            } else if (lowerQ.includes("system status") || lowerQ.includes("quantum state")) {
                result = `LOCAL_EXECUTE:{"directive": "RESPOND", "message": "[SYSTEM RESONATING] Substrate Active. Quantum Processor Engine stable."}`;
            } else {
                result = `SYS_CALL_EXT_API:${currentInput}`;
            }
        }

        try {
            // 2. Handle Local Deterministic Execution (Zero API Calls - WORKS OFFLINE)
            if (result.startsWith("LOCAL_EXECUTE:")) {
                const jsonStr = result.replace("LOCAL_EXECUTE:", "");
                const data = JSON.parse(jsonStr);
                
                if (data.directive === "OPEN_APP") {
                    // The C++ Kernel commanded the OS to open an app. Bypasses API entirely.
                    openApp(data.app_id); 
                    setLogs(prev => [...prev, `[AIZA]: ${data.message}`]);
                } 
                else if (data.directive === "RESPOND") {
                    setLogs(prev => [...prev, `[AIZA]: ${data.message}`]);
                }
                else if (data.directive === "WICK_ROTATION") {
                    setLogs(prev => [...prev, `[SYSTEM CRITICAL]: ${data.message}`]);
                }
            } 
            
            // 3. Handle Cloud Fallback (The 7 Pillars / Gemini)
            else if (result.startsWith("SYS_CALL_EXT_API:")) {
                setLogs(prev => [...prev, `[SYSTEM]: Complex query detected. Engaging The 7 Pillars...`]);
                
                if (isOffline || !navigator.onLine) {
                    setLogs(prev => [...prev, `[AIZA]: Architect, the Wi-Fi is severed. I cannot reach the 7 Pillars (Gemini API). However, my Sovereign Engine remains active. I can still manage the OS, open apps, and protect the substrate locally.`]);
                    return;
                }

                // Call the Gemini API using our existing gemini.ts service
                const aiResponse = await callAIOrchestrator(currentInput);
                setLogs(prev => [...prev, `[AIZA]: ${aiResponse.text}`]);
            }
        } catch (error) {
            console.error("Substrate Rift:", error);
            setLogs(prev => [...prev, `[SYSTEM ERROR]: ${String(error)}`]);
        }
    };

    return (
        <div className="bg-black text-green-500 font-mono p-4 h-full flex flex-col border border-green-900">
            <div className="text-xs text-green-700 mb-2 border-b border-green-900 pb-2 flex justify-between">
                <span>[AIZA INTELLIGENCE CORE] - C++ SUBSTRATE ACTIVE</span>
                <span className={isOffline ? "text-red-500" : "text-cyan-500"}>
                    {isOffline ? "NETWORK: OFFLINE (SOVEREIGN MODE)" : "NETWORK: ONLINE"}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 p-2 space-y-2">
                {logs.map((log, i) => (
                    <div key={i} className={
                        log.startsWith('[ARCHITECT]') ? 'text-cyan-400' : 
                        log.startsWith('[SYSTEM CRITICAL]') || log.startsWith('[SYSTEM ERROR]') ? 'text-red-500' : 
                        'text-green-500'
                    }>
                        {log}
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleExecute()}
                    className="flex-1 bg-gray-900 text-green-400 border border-green-700 p-2 outline-none focus:border-green-400"
                    placeholder="Command AIZA (e.g., 'Open Spider Vault' or 'System Status')"
                />
                <button onClick={handleExecute} className="bg-green-900 text-black px-4 py-2 font-bold hover:bg-green-700 transition-colors">
                    EXECUTE
                </button>
            </div>
        </div>
    );
};
