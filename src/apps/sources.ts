import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store, SourceItem, FileNode } from '../core/state.ts';
import { dispatchAppAction, addNotification, openApp, updateAppState } from '../core/windowManager.ts';
import { fs } from '../core/FileSystem.ts';
import { FileHandler } from '../core/FileHandler.ts';
import { callGemini } from '../services/gemini.ts';
import { Eagle369Codec, Eagle369Packet } from '../services/eagle369.ts';

const SourcesComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [sources, setSources] = useState<SourceItem[]>(store.getState().appState[instanceId]?.sources ?? store.getState().sources ?? []);
    // Hydrate input from store if available
    const [inputValue, setInputValue] = useState(store.getState().appState[instanceId]?.inputValue || '');
    const [isDragOver, setIsDragOver] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [eagleProgress, setEagleProgress] = useState<Record<string, number>>({});
    const [eaglePackets, setEaglePackets] = useState<Record<string, Eagle369Packet>>({});
    const [lastAutoSave, setLastAutoSave] = useState<string>('');
    const [isFetching, setIsFetching] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = store.subscribe(newState => {
            const newSources = newState.appState[instanceId]?.sources;
            if (newSources) setSources(newSources);
        });
        return () => { unsubscribe(); };
    }, [instanceId]);

    // --- LOGIC: AUTO-SAVE PROTOCOL ---
    useEffect(() => {
        const saveInterval = setInterval(() => {
            updateAppState(instanceId, { sources, inputValue });
            setLastAutoSave(new Date().toLocaleTimeString());
        }, 3000);

        return () => clearInterval(saveInterval);
    }, [sources, inputValue, instanceId]);

    // --- LOGIC: BATCH INGESTION ---
    const handleFiles = async (files: File[]) => {
        if (files.length === 0) return;

        const newItems: SourceItem[] = [];

        for (const file of files) {
            try {
                const content = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsText(file);
                });

                // AUTOMATIC VFS INJECTION
                const fileId = fs.createFile(file.name, 'architect', content);
                addNotification(`VFS: Wrote ${file.name} to Disk (ID: ${fileId})`);

                newItems.push({
                    id: `src_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: 'file',
                    name: file.name,
                    content
                });
            } catch (e) {
                console.error("File Read Error:", e);
                addNotification(`ERROR: Could not read ${file.name}`);
            }
        }

        if (newItems.length > 0) {
            const currentSources = store.getState().appState[instanceId]?.sources || [];
            const updatedSources = [...newItems, ...currentSources];
            setSources(updatedSources);
            dispatchAppAction(instanceId, { type: 'ADD_SOURCE', payload: { sources: updatedSources } });
            
            // Auto-Analyze all new items
            newItems.forEach(item => analyzeSource(item));
        }
    };

    // --- LOGIC: TEXT/URL INGESTION ---
    const handleTextInput = async () => {
        if (!inputValue.trim()) return;
        const rawInput = inputValue.trim();
        setInputValue(''); // Clear immediately

        let content = rawInput;
        let name = '';
        let type: 'text' | 'url' = 'text';

        // URL Detection & Fetching Protocol
        if (rawInput.startsWith('http://') || rawInput.startsWith('https://')) {
            type = 'url';
            try {
                const urlObj = new URL(rawInput);
                name = urlObj.hostname;
                
                setIsFetching(true);
                addNotification(`NETWORK_TRACER: Fetching content from ${name}...`);
                
                try {
                    // Attempt Fetch
                    const response = await fetch(rawInput);
                    if (response.ok) {
                        const text = await response.text();
                        // Simple cleanup to get body text if HTML, or just raw if text
                        const doc = new DOMParser().parseFromString(text, 'text/html');
                        content = doc.body.innerText || text; // Fallback to raw if not HTML
                        addNotification("NETWORK_TRACER: Content successfully extracted.");
                    } else {
                        throw new Error("Status " + response.status);
                    }
                } catch (fetchErr) {
                    console.warn("Fetch failed (likely CORS), using raw URL for analysis.", fetchErr);
                    addNotification("NETWORK_TRACER: Direct fetch blocked (CORS). Analying URL signature instead.");
                    content = rawInput; // Fallback to just the URL string
                }
            } catch {
                name = 'External Link';
            } finally {
                setIsFetching(false);
            }
        } else {
            type = 'text';
            name = `Snippet_${Date.now().toString().slice(-4)}`;
        }

        const newSource: SourceItem = {
            id: `src_${Date.now()}`,
            type,
            name,
            content
        };

        const currentSources = store.getState().appState[instanceId]?.sources || [];
        const updatedSources = [newSource, ...currentSources];
        setSources(updatedSources);
        dispatchAppAction(instanceId, { type: 'ADD_SOURCE', payload: { sources: updatedSources } });
        
        analyzeSource(newSource);
    };

    // --- LOGIC: AI ANALYSIS ---
    const analyzeSource = async (source: SourceItem) => {
        setAnalyzingId(source.id);
        
        // Context-aware prompting
        const prompt = `
        [SYSTEM: UNIVERSAL_ANALYZER]
        Analyze this data source.
        Type: ${source.type}
        Name: ${source.name}
        Content Length: ${source.content.length} chars
        
        CONTENT START:
        ${source.content.substring(0, 3000)}... 
        CONTENT END.

        MANDATE:
        1. Identify the core topic.
        2. Extract 3-5 key entities or concepts.
        3. Provide a concise summary (max 2 sentences).
        4. If it's code, identify language and function.
        
        OUTPUT FORMAT: Plain text summary.
        `;

        try {
            const response = await callGemini(prompt);
            const summary = response.text || "Analysis complete.";
            
            // Update State with Summary
            // We need to get the latest state again to avoid overwriting changes made during analysis
            const currentSources = store.getState().appState[instanceId]?.sources || [];
            const updatedSources = currentSources.map((s: SourceItem) => 
                s.id === source.id ? { ...s, summary } : s
            );
            
            setSources(updatedSources);
            dispatchAppAction(instanceId, { type: 'UPDATE', payload: { sources: updatedSources } });
            addNotification(`AIZA_ANALYSIS: ${source.name} processed.`);
        } catch (e) {
            addNotification("ANALYSIS_FAULT: Connection unstable.");
        } finally {
            setAnalyzingId(null);
        }
    };

    // --- LOGIC: EAGLE 369 CONVERSION ---
    const handleConvertToEagle = async (source: SourceItem) => {
        if (eagleProgress[source.id] !== undefined) return; // Already running
        
        setEagleProgress(prev => ({ ...prev, [source.id]: 0 }));
        
        try {
            const packet = await Eagle369Codec.transmuteFromContent(source.name, source.content, (p) => {
                setEagleProgress(prev => ({ ...prev, [source.id]: p }));
            });
            
            setEaglePackets(prev => ({ ...prev, [source.id]: packet }));
            
            // --- LAZARUS STORAGE PROTOCOL (SHARED VAULT LOGIC) ---
            const snapshot = {
                id: packet.id,
                label: `SYM: ${source.name}`,
                timestamp: Date.now(),
                type: 'E369_PACKET',
                payload: packet,
                preview: null // No visual preview for data packets
            };
            
            const existingRaw = localStorage.getItem('AIZA_LOGOS_REGISTRY');
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            localStorage.setItem('AIZA_LOGOS_REGISTRY', JSON.stringify([snapshot, ...existing]));
            
            // Signal the Logos Key app to refresh immediately
            window.dispatchEvent(new Event('logos-update'));
            // -----------------------------------------------------

            addNotification(`EAGLE_369: ${source.name} Transmuted & Vaulted.`);
        } catch (e) {
            addNotification("TRANSMUTATION_FAILURE: Logic collapse.");
        } finally {
            setEagleProgress(prev => { 
                const next = { ...prev }; 
                delete next[source.id]; // Clear progress bar
                return next; 
            });
        }
    };

    // --- LOGIC: THE BOOT PROTOCOL (ROUTING) ---
    const handleBoot = (source: SourceItem) => {
        addNotification(`ROUTING_PROTOCOL: Initializing handler for ${source.name}...`);

        if (source.type === 'file') {
            // Check if file exists in VFS (matched by name)
            const nodes = fs.getNodes();
            const existingFile = (Object.values(nodes) as FileNode[]).find(n => n.name === source.name);
            
            if (existingFile) {
                FileHandler.openFile(existingFile);
            } else {
                // Re-create if missing
                const newId = fs.createFile(source.name, 'architect', source.content);
                const newNode = fs.getNodes()[newId];
                FileHandler.openFile(newNode);
            }
        } else if (source.type === 'url') {
            const win = openApp('chrome');
            updateAppState('chrome', { url: source.content });
        } else {
            // Text -> Notepad or VS360
            const win = openApp('notepad');
            updateAppState('notepad', { text: source.content });
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const removeSource = (id: string) => {
        const next = sources.filter(s => s.id !== id);
        dispatchAppAction(instanceId, { type: 'UPDATE', payload: { sources: next } });
    };

    return React.createElement('div', { 
        style: { 
            height: '100%', background: '#050508', color: '#e0e0e0', 
            fontFamily: "'JetBrains Mono', monospace", display: 'flex', flexDirection: 'column' 
        },
        onDragOver: (e: any) => { e.preventDefault(); setIsDragOver(true); },
        onDragLeave: () => setIsDragOver(false),
        onDrop: handleDrop
    } as any,
        // --- HEADER / INGESTION ZONE ---
        React.createElement('div', { 
            style: { 
                padding: '20px', borderBottom: '1px solid #1a1a1a',
                background: isDragOver ? 'rgba(0, 255, 204, 0.1)' : 'linear-gradient(180deg, rgba(0,255,204,0.05) 0%, transparent 100%)',
                transition: '0.3s'
            } 
        } as any,
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' } },
                React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc', letterSpacing: '4px', fontWeight: 900 } }, 'UNIVERSAL INGESTION ENGINE'),
                    React.createElement('div', { style: { fontSize: '20px', fontWeight: 800, marginTop: '5px', display: 'flex', gap: '15px', alignItems: 'center' } }, 
                        'DATA_ROUTER // ACTIVE'
                    )
                ),
                React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                    React.createElement('button', { 
                        onClick: () => fileInputRef.current?.click(),
                        style: { padding: '8px 16px', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 900, cursor: 'pointer', fontSize: '10px' }
                    }, 'UPLOAD FILE STREAM'),
                    React.createElement('input', { 
                        type: 'file', 
                        ref: fileInputRef, 
                        multiple: true,
                        style: { display: 'none' }, 
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => e.target.files && handleFiles(Array.from(e.target.files)) 
                    } as any)
                )
            ),
            
            // Input Area (Textarea)
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', background: '#000', border: '1px solid #333', padding: '10px', borderRadius: '8px' } },
                React.createElement('textarea', { 
                    value: inputValue,
                    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value),
                    onKeyDown: (e: any) => e.key === 'Enter' && e.ctrlKey && handleTextInput(),
                    placeholder: 'PASTE URL, RAW TEXT, OR CODE STREAM... (CTRL+ENTER TO INGEST)',
                    style: { flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '5px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', minHeight: '60px', fontSize: '12px' }
                } as any),
                React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
                    React.createElement('button', { 
                        onClick: handleTextInput,
                        disabled: isFetching,
                        style: { background: isFetching ? '#333' : 'rgba(255,255,255,0.1)', border: '1px solid #444', color: isFetching ? '#666' : '#fff', padding: '6px 20px', borderRadius: '4px', cursor: isFetching ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '11px', transition: '0.2s' } 
                    }, isFetching ? 'FETCHING...' : 'INGEST & ANALYZE')
                )
            )
        ),

        // --- SOURCE LIST ---
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' } },
            sources.length === 0 && React.createElement('div', { style: { textAlign: 'center', opacity: 0.3, marginTop: '50px', fontSize: '12px' } }, 'AWAITING INPUT STREAM...'),
            
            sources.map(source => {
                const isConverting = eagleProgress[source.id] !== undefined;
                const progress = eagleProgress[source.id] || 0;
                const hasToken = eaglePackets[source.id];

                return React.createElement('div', { 
                    key: source.id,
                    style: { 
                        display: 'flex', flexDirection: 'column',
                        padding: '15px 20px', background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
                        transition: '0.2s', position: 'relative', overflow: 'hidden'
                    },
                    className: 'source-item'
                },
                    // Background Progress Bar
                    isConverting && React.createElement('div', { 
                        style: { 
                            position: 'absolute', left: 0, top: 0, bottom: 0, 
                            width: `${progress}%`, background: 'rgba(0, 255, 204, 0.1)', 
                            transition: 'width 0.2s linear', zIndex: 0 
                        } 
                    }),

                    // Top Row: Info & Controls
                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 } },
                        // Left: Info
                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden' } },
                            React.createElement('div', { style: { fontSize: '24px' } }, 
                                source.type === 'file' ? '📄' : (source.type === 'url' ? '🌐' : '📝')
                            ),
                            React.createElement('div', { style: { overflow: 'hidden' } },
                                React.createElement('div', { style: { fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, source.name),
                                React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, display: 'flex', gap: '10px', alignItems: 'center' } },
                                    React.createElement('span', null, source.type.toUpperCase()),
                                    analyzingId === source.id && React.createElement('span', { style: { color: '#00ffcc' } }, 'ANALYZING...'),
                                    isConverting && React.createElement('span', { style: { color: '#ff00ff' } }, `TRANSMUTING... ${Math.round(progress)}%`),
                                    hasToken && React.createElement('span', { style: { color: '#ffd700' } }, `LOGOS_KEY: ${hasToken.id.slice(0,10)}...`)
                                )
                            )
                        ),

                        // Right: Controls
                        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                            
                            // EAGLE 369 CONVERTER
                            source.type === 'file' && !hasToken && !isConverting && React.createElement('button', {
                                onClick: () => handleConvertToEagle(source),
                                title: "Transmute to Eagle 369 Symbolic String",
                                style: { 
                                    padding: '6px 10px', background: 'rgba(255,0,255,0.1)', border: '1px solid #ff00ff', 
                                    color: '#ff00ff', cursor: 'pointer', fontSize: '9px', fontWeight: 900, borderRadius: '4px' 
                                }
                            }, '🦅 E369'),

                            // EAGLE TOKEN (Success State)
                            hasToken && React.createElement('div', {
                                title: "Ready for Mesh Transmission",
                                style: { 
                                    fontSize: '20px', cursor: 'help', animation: 'pulse 2s infinite',
                                    filter: 'drop-shadow(0 0 5px #ffd700)'
                                }
                            }, '🪙'),

                            // BOOT BUTTON (The Router)
                            React.createElement('button', { 
                                onClick: () => handleBoot(source),
                                title: "Execute / Open in Dedicated App",
                                style: { 
                                    width: '32px', height: '32px', borderRadius: '50%', 
                                    background: 'rgba(0, 255, 204, 0.1)', border: '1px solid #00ffcc', 
                                    color: '#00ffcc', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', fontSize: '14px', transition: '0.2s'
                                }
                            }, '⚡'),
                            
                            // AI Re-Analyze
                            React.createElement('button', { 
                                onClick: () => analyzeSource(source),
                                title: "Ask Aiza to Re-analyze",
                                style: { background: 'none', border: '1px solid #333', borderRadius: '4px', color: '#888', cursor: 'pointer', padding: '0 8px' }
                            }, '🧠'),

                            // Delete
                            React.createElement('button', { 
                                onClick: () => removeSource(source.id),
                                style: { background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '16px', opacity: 0.5 }
                            }, '×')
                        )
                    ),

                    // Bottom Row: Summary (if active)
                    source.summary && React.createElement('div', { 
                        style: { 
                            marginTop: '12px', zIndex: 1, padding: '12px', 
                            background: 'rgba(0, 255, 204, 0.05)', 
                            borderLeft: '2px solid #00ffcc',
                            borderRadius: '0 4px 4px 0',
                            fontSize: '11px', color: '#b3ffec', lineHeight: '1.5',
                            animation: 'fadeIn 0.5s'
                        } 
                    }, 
                        React.createElement('div', { style: { fontWeight: 'bold', marginBottom: '4px', opacity: 0.7, fontSize: '9px', letterSpacing: '1px' } }, 'ANALYSIS_RESULT:'),
                        source.summary
                    )
                );
            })
        ),

        // --- FOOTER (Telemtry) ---
        React.createElement('div', { 
            style: { 
                padding: '10px 20px', 
                background: '#020202', 
                borderTop: '1px solid #1a1a1a', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: '#666'
            }
        },
            React.createElement('div', { style: { display: 'flex', gap: '10px' } }, 
                React.createElement('span', null, `ITEMS: ${sources.length}`),
                React.createElement('span', null, `MODE: INGEST`)
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                React.createElement('div', { style: { width: '6px', height: '6px', borderRadius: '50%', background: lastAutoSave ? '#00ffcc' : '#333' } }),
                React.createElement('span', { style: { color: lastAutoSave ? '#00ffcc' : '#444' } }, 
                    lastAutoSave ? `AUTO_SAVE: ${lastAutoSave}` : 'WAITING_FOR_PULSE'
                )
            )
        ),
        
        React.createElement('style', null, `
            .source-item:hover { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; }
            button:hover { transform: scale(1.05); }
            @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.7; } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        `)
    );
};

export const sourcesApp: AppDef = {
    id: 'sources',
    name: 'Ingestion Engine',
    component: SourcesComponent,
    icon: '📥',
    category: 'Utility',
    defaultSize: { width: 700, height: 600 },
    description: 'Universal Data Router. Upload files, paste links, and "Boot" them into their respective applications (VS360, Chrome, PDF).'
};