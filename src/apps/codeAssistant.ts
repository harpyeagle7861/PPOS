
import React, { useState, useRef, useEffect } from 'react';
import { AppDef, store, SourceItem } from '../core/state.ts';
import { callGeminiStream } from '../services/gemini.ts';
import { addNotification, updateAppState } from '../core/windowManager.ts';

const CodeAssistantComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState('// Awaiting neural DNA synthesis...');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'synth' | 'audit' | 'debug'>('synth');
    const outRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = store.subscribe(s => {
            const externalCode = s.appState[instanceId]?.generatedCode;
            if (externalCode && externalCode !== generatedCode) {
                setGeneratedCode(externalCode);
            }
        });
        return () => { unsubscribe(); };
    }, [instanceId, generatedCode]);

    useEffect(() => {
        if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
    }, [generatedCode]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const newSource: SourceItem = { id: `src_ca_${Date.now()}`, type: 'file', name: file.name, content };
            store.setState(s => ({ ...s, sources: [...s.sources, newSource] }));
            addNotification(`DNA_UPLOADED: Integrated "${file.name}"`);
        };
        reader.readAsText(file);
    };

    const handleAction = async () => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true); setGeneratedCode('');

        const modeMap = {
            synth: "PROTOCOL: CODE_GENERATION - Output raw, production-grade React/TS code. No markdown.",
            audit: "PROTOCOL: SECURITY_AUDIT - Analyze for vulnerabilities and logic leaks.",
            debug: "PROTOCOL: SYSTEM_DEBUGGING - Trace syntax entropy and provide stabilized fixes."
        };

        try {
            const stream = callGeminiStream(`${modeMap[mode]}\n\nArchitect Request: ${prompt}`);
            let res = '';
            for await (const chunk of stream) { 
                res += chunk.text; 
                setGeneratedCode(res); 
            }
            updateAppState(instanceId, { generatedCode: res });
        } catch { 
            setGeneratedCode("// Synthesis failure: Neural rift detected."); 
        } finally { 
            setIsLoading(false); 
        }
    };

    const highlight = (code: string) => {
        return code.split('\n').map((line, i) => {
            const isComment = /^\s*(\/\/|\/\*|\*|#|--)/.test(line);
            const isKeyword = /\b(const|let|var|function|return|if|else|for|while|export|import|class|type|async|await)\b/.test(line);
            const isType = /\b(string|number|boolean|any|void|Record|Promise)\b/.test(line);
            
            let color = '#d4d4d4';
            if (isComment) color = '#6a9955';
            else if (isKeyword) color = '#569cd6';
            else if (isType) color = '#4ec9b0';
            else if (/\b[A-Z][a-zA-Z0-9]*\b/.test(line)) color = '#dcdcaa';

            return React.createElement('div', { key: i, style: { color, minHeight: '1.2em', whiteSpace: 'pre', opacity: line.trim() === '' ? 0.3 : 1 } }, line);
        });
    };

    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', background: '#050505', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace" } },
        React.createElement('div', { style: { padding: '12px 25px', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '15px', alignItems: 'center' } },
            React.createElement('button', { onClick: () => setMode('synth'), style: styles.tab(mode === 'synth', '#00ffcc') }, 'SYNTHESIZE'),
            React.createElement('button', { onClick: () => setMode('debug'), style: styles.tab(mode === 'debug', '#00bfff') }, 'DEBUG'),
            React.createElement('button', { onClick: () => setMode('audit'), style: styles.tab(mode === 'audit', '#ff00ff') }, 'AUDIT'),
            React.createElement('button', { 
                onClick: () => { navigator.clipboard.writeText(generatedCode); addNotification("DNA_COPIED"); },
                style: { marginLeft: 'auto', background: 'transparent', border: '1px solid #333', color: '#888', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }
            }, 'COPY')
        ),
        React.createElement('div', { ref: outRef, style: { flex: 1, padding: '25px', overflowY: 'auto', background: 'rgba(0,0,0,0.8)', fontSize: '13px', lineHeight: '1.7', border: '1px solid #111', margin: '15px', borderRadius: '8px' } }, 
            highlight(generatedCode)
        ),
        React.createElement('div', { style: { padding: '20px 30px', background: '#000', borderTop: '1px solid #111', display: 'flex', flexDirection: 'column', gap: '15px' } },
            React.createElement('textarea', { 
                value: prompt, onChange: e => setPrompt(e.target.value),
                onKeyDown: e => { if (e.key === 'Enter' && e.ctrlKey) handleAction(); },
                placeholder: 'INPUT ARCHITECTURAL SPECS... (CTRL+ENTER TO MANIFEST)',
                style: { width: '100%', height: '80px', background: '#080808', border: '1px solid #222', color: '#fff', padding: '15px', outline: 'none', resize: 'none', borderRadius: '6px', fontSize: '13px' }
            } as any),
            React.createElement('button', { onClick: handleAction, disabled: isLoading, style: styles.mainBtn(isLoading, mode) }, isLoading ? 'RESONATING...' : 'MANIFEST DNA')
        )
    );
};

const styles = {
    tab: (active: boolean, color: string) => ({
        padding: '8px 18px', background: active ? color : 'transparent', color: active ? '#000' : color, 
        border: `1px solid ${color}`, borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', letterSpacing: '1px'
    }),
    mainBtn: (isLoading: boolean, mode: string) => ({
        padding: '15px', background: isLoading ? '#333' : (mode === 'synth' ? '#00ffcc' : mode === 'debug' ? '#00bfff' : '#ff00ff'),
        color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', letterSpacing: '4px', 
        transition: '0.3s', boxShadow: isLoading ? 'none' : '0 0 15px rgba(0,255,204,0.3)'
    })
};

export const codeAssistantApp: AppDef = {
    id: 'code-assistant', name: 'Code Assistant', component: CodeAssistantComponent, icon: '🧬', category: 'Utility', defaultSize: { width: 850, height: 750 },
    description: 'Neural DNA synthesizer. Specialized for Generation, Debugging, and Security Auditing. Reactive to AIZA core commands.'
};
