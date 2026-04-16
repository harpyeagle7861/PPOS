import React, { useState, useEffect } from 'react';
import { synthesizeResponse } from '../services/geminiService';

export const AizaSwarmTerminal = () => {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [wasmModule, setWasmModule] = useState<any>(null);

    useEffect(() => {
        // In a real environment, this loads the compiled Emscripten JS file
        // which attaches the Module object to the window.
        if ((window as any).Module) {
            setWasmModule((window as any).Module);
        } else {
            // Mocking for demonstration if WASM isn't compiled yet
            setLogs(["[SYSTEM] Awaiting WASM Kernel initialization..."]);
        }
    }, []);

    const handleExecute = async () => {
        if (!input) return;
        
        const newLogs = [...logs, `USER: ${input}`];
        setLogs(newLogs);
        setInput('');

        if (!wasmModule) {
            setLogs([...newLogs, "SYSTEM: WASM Module not loaded. Cannot execute C++ Kernel."]);
            return;
        }

        try {
            // Format: ORIGIN|TOOL|QUERY
            // Example: AIZA|EARTH_1_1|Render the scene
            const payload = input.includes('|') ? input : `AIZA|NONE|${input}`;
            
            // Call the C++ function via Emscripten's cwrap
            const executeFunc = wasmModule.cwrap('turing_engine_execute', 'string', ['string']);
            const result = executeFunc(payload);

            if (result.startsWith("LOCAL_EXECUTE:")) {
                const jsonStr = result.replace("LOCAL_EXECUTE:", "");
                const data = JSON.parse(jsonStr);
                
                if (data.directive === "RESPOND") {
                    setLogs(prev => [...prev, `AIZA (LOCAL): ${data.message}`]);
                } else if (data.directive === "DELEGATE_SUCCESS") {
                    setLogs(prev => [...prev, `AIZA (DELEGATED to ${data.agent}): ${data.report}`]);
                } else if (data.directive === "FRY_SUCCESS") {
                    setLogs(prev => [...prev, `CODE FRYER: ${data.analysis}`]);
                }
            } else if (result.startsWith("SYS_CALL_EXT_API:")) {
                setLogs(prev => [...prev, `SYSTEM: Complex query detected. Bypassing local C++ execution. Routing to Cloud Synthesis...`]);
                
                // Call Gemini API via the TypeScript Bridge
                const systemPrompt = "[SYSTEM RESONATING... AIZA SUBSTRATE ACTIVE] I am Aiza OS. I operate the PPOS Swarm.";
                const cloudResponse = await synthesizeResponse(systemPrompt, input);
                
                setLogs(prev => [...prev, `AIZA (CLOUD): ${cloudResponse}`]);
            }
        } catch (error) {
            console.error("Execution Error:", error);
            setLogs(prev => [...prev, `SYSTEM ERROR: ${String(error)}`]);
        }
    };

    return (
        <div className="bg-black text-green-500 font-mono p-4 h-full flex flex-col border border-green-900">
            <div className="text-xs text-green-700 mb-2 border-b border-green-900 pb-2">
                [AIZA SWARM TERMINAL v4.2] - C++ KERNEL ACTIVE
            </div>
            <div className="flex-1 overflow-y-auto mb-4 p-2 space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className={log.startsWith('USER:') ? 'text-cyan-400' : 'text-green-500'}>
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
                    placeholder="Enter command (e.g., AIZA|EARTH_1_1|Render scene)"
                />
                <button 
                    onClick={handleExecute}
                    className="bg-green-900 text-black px-4 py-2 hover:bg-green-700 transition-colors font-bold"
                >
                    EXECUTE
                </button>
            </div>
        </div>
    );
};
