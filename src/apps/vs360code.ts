import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppDef, store, FileNode } from '../core/state.ts';
import { fs } from '../core/FileSystem.ts';
import { addNotification, updateAppState, registerOrUpdateApp, openApp } from '../core/windowManager.ts';
import { callGeminiStream } from '../services/gemini.ts';
import { Code2, TerminalSquare, MessageSquare, Play, X, Eraser, Bot, Sparkles, Search, Save, FolderSearch, Eye, History, Cpu, GitBranch, UploadCloud, ArrowUpCircle, ArrowDownCircle, CheckCircle, ShieldCheck, AlertTriangle, Zap, Lock } from 'lucide-react'; 

declare const Prism: any;

interface TermLine {
    text: string;
    type: 'info' | 'success' | 'error' | 'warn' | 'cmd';
}

interface CodeDecoration {
    line: number;
    type: 'bug' | 'opt' | 'sec';
    message: string;
}

const VS360_THEME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');

.vs360-container {
    display: flex; flex-direction: column; height: 100%;
    background: #020202;
    color: #e0e0e0;
    font-family: 'JetBrains Mono', monospace;
    overflow: hidden;
    position: relative;
}

/* Neural Background Grid */
.vs360-bg-grid {
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background-image: 
        linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.5;
}

.vs360-header {
    height: 50px;
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(15px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex; align-items: center; padding: 0 15px;
    justify-content: space-between;
    z-index: 20;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

.vs360-file-tab {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px;
    padding: 6px 14px;
    background: rgba(0, 255, 204, 0.05);
    border: 1px solid rgba(0, 255, 204, 0.2);
    border-radius: 6px;
    color: #00ffcc;
    font-weight: 500;
    letter-spacing: 0.5px;
    transition: 0.3s;
}
.vs360-file-tab:hover {
    background: rgba(0, 255, 204, 0.1);
    box-shadow: 0 0 15px rgba(0, 255, 204, 0.15);
}

.vs360-icon-btn {
    width: 32px; height: 32px;
    background: transparent;
    border: 1px solid transparent;
    color: #888;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; align-items: center; justify-content: center;
}
.vs360-icon-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    transform: translateY(-1px);
}
.vs360-icon-btn.active {
    background: rgba(0, 255, 204, 0.15);
    color: #00ffcc;
    border-color: rgba(0, 255, 204, 0.3);
    box-shadow: 0 0 10px rgba(0, 255, 204, 0.2);
}

.vs360-save-btn {
    background: linear-gradient(135deg, #00ffcc 0%, #0088ff 100%);
    color: #000;
    font-weight: 800;
    border: none;
    padding: 6px 16px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: 0.2s;
    letter-spacing: 1px;
    display: flex; align-items: center; gap: 6px;
    box-shadow: 0 0 15px rgba(0, 255, 204, 0.3);
}
.vs360-save-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 25px rgba(0, 255, 204, 0.5);
}

.vs360-split-container {
    flex: 1; display: flex; overflow: hidden; position: relative; z-index: 10;
}

/* --- EDITOR CORE --- */
.vs360-editor-wrapper {
    flex: 1; position: relative; display: flex; 
    background: rgba(5, 5, 5, 0.6);
    overflow: hidden; /* Scroll handled by textarea/pre interaction */
}

.vs360-gutter {
    width: 50px;
    background: rgba(10, 10, 12, 0.95);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex; flex-direction: column;
    padding: 20px 0;
    text-align: right;
    color: #444;
    font-size: 14px;
    line-height: 1.6;
    user-select: none;
    overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
    z-index: 2;
}
.gutter-row { position: relative; padding-right: 10px; height: 1.6em; }
.gutter-marker { position: absolute; left: 4px; top: 2px; font-size: 10px; font-weight: bold; cursor: help; }
.marker-bug { color: #ff3333; }
.marker-opt { color: #00ffcc; }
.marker-sec { color: #ffaa00; }

.vs360-code-area {
    flex: 1; position: relative; overflow: auto;
}

/* The Overlay Trick for Highlighting */
.vs360-code-layer, .vs360-input-layer {
    position: absolute; top: 0; left: 0;
    min-width: 100%; min-height: 100%;
    margin: 0; padding: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px; line-height: 1.6;
    border: none; background: transparent;
    white-space: pre; overflow: hidden;
    tab-size: 4;
}

.vs360-code-layer {
    color: #e0e0e0;
    pointer-events: none;
    z-index: 1;
}

.vs360-decoration-layer {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
    padding-top: 20px;
}
.deco-line {
    position: absolute; left: 0; right: 0; height: 1.6em;
    background: rgba(255, 51, 51, 0.1);
    border-left: 2px solid #ff3333;
}
.deco-line.bug { background: rgba(255, 51, 51, 0.1); border-color: #ff3333; }
.deco-line.opt { background: rgba(0, 255, 204, 0.05); border-color: #00ffcc; }
.deco-line.sec { background: rgba(255, 170, 0, 0.1); border-color: #ffaa00; }

.vs360-input-layer {
    color: transparent;
    caret-color: #00ffcc;
    z-index: 2;
    resize: none;
    outline: none;
}
.vs360-input-layer::selection {
    background: rgba(0, 255, 204, 0.2);
    color: transparent;
}

/* Syntax Highlighting overrides for Prism Tomorrow */
code[class*="language-"], pre[class*="language-"] {
    text-shadow: none !important;
    font-family: 'JetBrains Mono', monospace !important;
    direction: ltr;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    line-height: 1.6;
    background: transparent !important;
}

/* Terminal & Chat Panels */
.vs360-sidebar-panel {
    width: 380px;
    background: rgba(8, 8, 10, 0.95);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    display: flex; flex-direction: column;
    backdrop-filter: blur(20px);
    z-index: 25;
}

.chat-msg {
    padding: 12px 16px; border-radius: 12px; font-size: 12px; line-height: 1.5; margin-bottom: 12px; max-width: 90%; animation: fadeIn 0.3s;
    white-space: pre-wrap;
}
.chat-msg.user {
    align-self: flex-end; background: rgba(0, 255, 204, 0.1); border: 1px solid rgba(0, 255, 204, 0.2); color: #e0e0e0;
}
.chat-msg.model {
    align-self: flex-start; background: rgba(255, 0, 255, 0.05); border: 1px solid rgba(255, 0, 255, 0.15); color: #fff;
}

/* Spinner */
.chat-spinner {
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #00ffcc;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
    margin: 10px auto;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.vs360-terminal {
    height: 220px;
    background: rgba(5, 5, 8, 0.98);
    border-top: 1px solid rgba(0, 255, 204, 0.2);
    display: flex; flex-direction: column;
    z-index: 30;
    font-family: 'JetBrains Mono', monospace;
}

/* Terminal Animation */
@keyframes termPulse {
    0% { text-shadow: 0 0 5px rgba(0, 255, 204, 0.5); opacity: 0.8; }
    50% { text-shadow: 0 0 15px rgba(0, 255, 204, 0.9); opacity: 1; }
    100% { text-shadow: 0 0 5px rgba(0, 255, 204, 0.5); opacity: 0.8; }
}

.term-prompt { 
    color: #00ffcc; 
    font-weight: bold; 
    margin-right: 8px; 
    animation: termPulse 2s infinite ease-in-out; 
}
.term-cmd { color: #00ffcc; font-weight: bold; }

.vs360-preview-pane {
    flex: 1;
    background: rgba(20, 20, 25, 0.95);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding: 30px;
    overflow-y: auto;
    color: #ccc;
    font-family: sans-serif;
    line-height: 1.6;
}
.vs360-preview-pane h1 { border-bottom: 1px solid #333; padding-bottom: 10px; color: #00ffcc; }
.vs360-preview-pane h2 { color: #fff; margin-top: 20px; }
.vs360-preview-pane code { background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 4px; font-family: monospace; color: #ff00ff; }
.vs360-preview-pane pre { background: #000; padding: 15px; border-radius: 8px; border: 1px solid #333; overflow-x: auto; }
.vs360-preview-pane blockquote { border-left: 3px solid #00ffcc; margin: 0; padding-left: 15px; opacity: 0.7; }

/* Git Panel Styles */
.git-panel { padding: 20px; color: #e0e0e0; display: flex; flex-direction: column; gap: 20px; }
.git-input { background: #000; border: 1px solid #333; color: #fff; padding: 10px; width: 100%; border-radius: 4px; margin-bottom: 10px; }
.git-btn { width: 100%; padding: 10px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
.git-btn-primary { background: #00ffcc; color: #000; }
.git-btn-primary:hover { box-shadow: 0 0 15px rgba(0,255,204,0.4); }
.git-btn-sec { background: rgba(255,255,255,0.1); color: #fff; }
.git-btn-sec:hover { background: rgba(255,255,255,0.2); }
.git-change-item { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 8px; border-bottom: 1px solid #222; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
`;

// Simple Markdown Parser for Live Preview
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    
    return React.createElement('div', null, lines.map((line, i) => {
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            return null;
        }
        if (inCodeBlock) {
            return React.createElement('div', { key: i, style: { fontFamily: 'monospace', opacity: 0.8, whiteSpace: 'pre' } }, line);
        }
        
        if (line.startsWith('# ')) return React.createElement('h1', { key: i }, line.slice(2));
        if (line.startsWith('## ')) return React.createElement('h2', { key: i }, line.slice(3));
        if (line.startsWith('### ')) return React.createElement('h3', { key: i }, line.slice(4));
        if (line.startsWith('> ')) return React.createElement('blockquote', { key: i }, line.slice(2));
        if (line.trim().startsWith('- ')) return React.createElement('li', { key: i, style: { marginLeft: '20px' } }, line.slice(2));
        if (line.trim() === '') return React.createElement('br', { key: i });
        
        // Basic bold/italic parsing
        const __html = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');

        return React.createElement('div', { key: i, dangerouslySetInnerHTML: { __html } });
    }));
};

const VS360CodeComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [code, setCode] = useState('');
    const [fileName, setFileName] = useState('Untitled.ts');
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [status, setStatus] = useState('READY');
    
    // UI Panels
    const [showTools, setShowTools] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [showPreview, setShowPreview] = useState(false); 
    const [activeSidebar, setActiveSidebar] = useState<'NONE' | 'CHAT' | 'GIT' | 'REVIEW'>('NONE');

    // Terminal State
    const [terminalOutput, setTerminalOutput] = useState<TermLine[]>([{text: 'VS360 Terminal [v2.2.0] - AIZA KERNEL', type: 'info'}]);
    const [terminalInput, setTerminalInput] = useState('');
    const [cmdHistory, setCmdHistory] = useState<string[]>([]);
    const [historyPtr, setHistoryPtr] = useState(-1);
    const [cwd, setCwd] = useState('architect');
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // AI Chat State
    const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [hasSelection, setHasSelection] = useState(false);

    // AI Review State
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [decorations, setDecorations] = useState<CodeDecoration[]>([]);

    // Git State
    const [gitRepo, setGitRepo] = useState('');
    const [gitBranch, setGitBranch] = useState('main');
    const [gitCommitMsg, setGitCommitMsg] = useState('');
    const [gitStatus, setGitStatus] = useState<'IDLE' | 'SYNCING'>('IDLE');
    const [gitChanges, setGitChanges] = useState<string[]>([]); // Mock changed files
    
    // Editor Scroll Sync Refs
    const gutterRef = useRef<HTMLDivElement>(null);
    const codeAreaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

    // Sync Scroll
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        if (preRef.current) preRef.current.scrollTop = e.currentTarget.scrollTop;
        if (preRef.current) preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    };

    // Load file content if activeFileId changes
    useEffect(() => {
        const state = store.getState();
        const appState = state.appState[instanceId];
        if (appState?.activeFileId) {
            const file = state.fileSystem[appState.activeFileId];
            if (file) {
                setActiveFileId(file.id);
                setFileName(file.name);
                setCode(file.content || '');
            }
        }
    }, [instanceId]);

    // Save to VFS
    const saveFile = () => {
        if (activeFileId) {
            fs.updateFileContent(activeFileId, code);
            addNotification(`VS360: Saved ${fileName}`);
        } else {
            // Create new
            const id = fs.createFile(fileName, 'architect', code);
            setActiveFileId(id);
            addNotification(`VS360: Created ${fileName}`);
        }
    };

    // Terminal Command Handler
    const handleTerminalCommand = async () => {
        const cmd = terminalInput.trim();
        if (!cmd) return;

        setTerminalOutput(prev => [...prev, { text: `${cwd} $ ${cmd}`, type: 'cmd' }]);
        setCmdHistory(prev => [...prev, cmd]);
        setHistoryPtr(prev => prev + 1);
        setTerminalInput('');

        const parts = cmd.split(' ');
        const op = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Simple FS simulation
        if (op === 'ls') {
            const nodes = fs.getNodes();
            // Just simulate output for now
            const files = (Object.values(nodes) as FileNode[]).map(n => n.name).join('  ');
            setTerminalOutput(prev => [...prev, { text: files || 'No files found', type: 'info' }]);
        } else if (op === 'echo') {
            setTerminalOutput(prev => [...prev, { text: args.join(' '), type: 'info' }]);
        } else if (op === 'clear') {
            setTerminalOutput([]);
        } else if (op === 'help') {
            setTerminalOutput(prev => [...prev, { text: 'Available commands: ls, echo, clear, help, aiza', type: 'info' }]);
        } else if (op === 'aiza') {
            // AI Command in terminal
            setTerminalOutput(prev => [...prev, { text: 'Asking AIZA...', type: 'warn' }]);
            try {
                const response = await callGeminiStream(args.join(' '));
                let full = '';
                for await (const chunk of response) full += chunk.text;
                setTerminalOutput(prev => [...prev, { text: full, type: 'success' }]);
            } catch (e) {
                setTerminalOutput(prev => [...prev, { text: 'AI Error', type: 'error' }]);
            }
        } else {
            setTerminalOutput(prev => [...prev, { text: `Command not found: ${op}`, type: 'error' }]);
        }
        
        if (terminalEndRef.current) terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };

    // Chat Handler
    const handleChat = async () => {
        if (!chatInput.trim()) return;
        const msg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
        setIsChatLoading(true);

        // --- AIZA SUBSTRATE INJECTION ---
        import('../services/pomegranate.ts').then(({ Pomegranate }) => {
            Pomegranate.ingest('VS360_CHAT_USER', { text: msg }, 'vs360-code', 'USER');
        });

        const prompt = `
        CURRENT CODE CONTEXT (${fileName}):
        \`\`\`
        ${code}
        \`\`\`
        
        USER QUERY: ${msg}
        
        Respond as an expert coding assistant (AIZA).
        `;

        try {
            const stream = callGeminiStream(prompt);
            let fullRes = '';
            setChatMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of stream) {
                fullRes += chunk.text;
                setChatMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1].text = fullRes;
                    return next;
                });
            }

            // --- AIZA SUBSTRATE INJECTION ---
            import('../services/pomegranate.ts').then(({ Pomegranate }) => {
                Pomegranate.ingest('VS360_CHAT_MODEL', { text: fullRes }, 'vs360-code', 'GIANT');
            });
        } catch (e) {
            setChatMessages(prev => [...prev, { role: 'model', text: 'Connection Error.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Line Numbers
    const lines = code.split('\n');
    const lineNumbers = lines.map((_, i) => i + 1);

    // Syntax Highlighting (using Prism if available, else simple)
    const highlightedCode = useMemo(() => {
        if (typeof Prism !== 'undefined') {
            const lang = fileName.endsWith('.ts') || fileName.endsWith('.tsx') ? 'typescript' : 
                         fileName.endsWith('.js') ? 'javascript' : 
                         fileName.endsWith('.css') ? 'css' : 
                         fileName.endsWith('.html') ? 'html' : 'clike';
            return Prism.highlight(code, Prism.languages[lang] || Prism.languages.clike, lang);
        }
        return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }, [code, fileName]);

    return React.createElement('div', { className: 'vs360-container' },
        React.createElement('style', null, VS360_THEME_CSS),
        React.createElement('div', { className: 'vs360-bg-grid' }),
        
        // Header
        React.createElement('div', { className: 'vs360-header' },
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                React.createElement('div', { className: 'vs360-file-tab' },
                    React.createElement(Code2, { size: 14 }),
                    React.createElement('span', null, fileName)
                )
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('button', { className: `vs360-icon-btn ${activeSidebar === 'CHAT' ? 'active' : ''}`, onClick: () => setActiveSidebar(activeSidebar === 'CHAT' ? 'NONE' : 'CHAT'), title: 'AI Chat' }, React.createElement(Bot, { size: 16 })),
                React.createElement('button', { className: `vs360-icon-btn ${showPreview ? 'active' : ''}`, onClick: () => setShowPreview(!showPreview), title: 'Live Preview' }, React.createElement(Eye, { size: 16 })),
                React.createElement('button', { className: `vs360-icon-btn ${showTerminal ? 'active' : ''}`, onClick: () => setShowTerminal(!showTerminal), title: 'Terminal' }, React.createElement(TerminalSquare, { size: 16 })),
                React.createElement('button', { className: 'vs360-save-btn', onClick: saveFile },
                    React.createElement(Save, { size: 14 }),
                    'SAVE'
                )
            )
        ),

        // Main Area
        React.createElement('div', { className: 'vs360-split-container' },
            
            // Editor
            React.createElement('div', { className: 'vs360-editor-wrapper' },
                // Gutter
                React.createElement('div', { ref: gutterRef, className: 'vs360-gutter' },
                    lineNumbers.map(n => React.createElement('div', { key: n, className: 'gutter-row' }, n))
                ),
                
                // Code Area
                React.createElement('div', { className: 'vs360-code-area' },
                    // Decoration Layer
                    React.createElement('div', { className: 'vs360-decoration-layer' }),
                    
                    // Highlighting Layer (Underlay)
                    React.createElement('pre', {
                        ref: preRef,
                        className: `vs360-code-layer language-${fileName.split('.').pop()}`,
                        dangerouslySetInnerHTML: { __html: highlightedCode + '<br />' } // Ensure last line break renders
                    }),
                    
                    // Input Layer (Overlay)
                    React.createElement('textarea', {
                        ref: codeAreaRef,
                        className: 'vs360-input-layer',
                        value: code,
                        onChange: (e) => setCode(e.target.value),
                        onScroll: handleScroll,
                        spellCheck: false,
                        autoCapitalize: 'off',
                        autoComplete: 'off',
                        autoCorrect: 'off'
                    })
                )
            ),

            // Sidebar (Chat)
            activeSidebar === 'CHAT' && React.createElement('div', { className: 'vs360-sidebar-panel' },
                React.createElement('div', { style: { padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', color: '#00ffcc', display: 'flex', alignItems: 'center', gap: '10px' } },
                    React.createElement(Sparkles, { size: 16 }),
                    'AIZA COPILOT'
                ),
                React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' } },
                    chatMessages.map((m, i) => React.createElement('div', { key: i, className: `chat-msg ${m.role}` }, m.text)),
                    isChatLoading && React.createElement('div', { className: 'chat-spinner' }),
                    React.createElement('div', { ref: chatEndRef })
                ),
                React.createElement('div', { style: { padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' } },
                    React.createElement('input', { 
                        value: chatInput, onChange: e => setChatInput(e.target.value), 
                        onKeyDown: e => e.key === 'Enter' && handleChat(),
                        placeholder: "Ask Aiza about this code...",
                        style: { flex: 1, background: '#000', border: '1px solid #333', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }
                    }),
                    React.createElement('button', { onClick: handleChat, style: { background: '#00ffcc', border: 'none', borderRadius: '4px', width: '30px', cursor: 'pointer' } }, '➔')
                )
            ),

            // Preview Pane
            showPreview && React.createElement('div', { className: 'vs360-preview-pane' },
                React.createElement(SimpleMarkdown, { content: code })
            )
        ),

        // Terminal
        showTerminal && React.createElement('div', { className: 'vs360-terminal' },
            React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '15px', fontFamily: 'monospace', fontSize: '12px' } },
                terminalOutput.map((l, i) => React.createElement('div', { key: i, style: { color: l.type === 'error' ? '#ff3333' : l.type === 'warn' ? '#ffaa00' : l.type === 'cmd' ? '#fff' : '#ccc', marginBottom: '4px' } }, l.text)),
                React.createElement('div', { ref: terminalEndRef })
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', padding: '10px 15px', background: '#000' } },
                React.createElement('span', { className: 'term-prompt' }, `${cwd} $`),
                React.createElement('input', { 
                    value: terminalInput, onChange: e => setTerminalInput(e.target.value), 
                    onKeyDown: e => e.key === 'Enter' && handleTerminalCommand(),
                    style: { flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontFamily: 'monospace', fontSize: '12px' },
                    autoFocus: true
                })
            )
        )
    );
};

export const vs360codeApp: AppDef = {
    id: 'vs360code',
    name: 'VS360 Code',
    component: VS360CodeComponent,
    icon: '💻',
    category: 'Creative',
    defaultSize: { width: 1200, height: 800 },
    description: 'Advanced IDE with AI Copilot, Terminal, and Neural Git integration.'
};