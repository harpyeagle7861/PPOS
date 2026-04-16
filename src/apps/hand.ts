import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppDef, store, FileNode, WindowInstance } from '../core/state.ts';
import { openApp, focusWindow, closeWindow, addNotification } from '../core/windowManager.ts';
import { FileHandler } from '../core/FileHandler.ts';
import { Search, Monitor, FileText, Zap, Package, Power } from 'lucide-react';

interface SearchResult {
    id: string;
    type: 'APP' | 'WINDOW' | 'FILE' | 'CMD';
    title: string;
    subtitle: string;
    icon: any;
    action: () => void;
    score: number; // For sorting relevance
}

const OmniSearchComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [results, setResults] = useState<SearchResult[]>([]);
    
    // Store access
    const [state, setState] = useState(store.getState());
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = store.subscribe(s => setState(s));
        // Auto-focus input on mount
        setTimeout(() => inputRef.current?.focus(), 50);
        return () => unsub();
    }, []);

    // --- SEARCH LOGIC ---
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setSelectedIndex(0);
            return;
        }

        const q = query.toLowerCase();
        const newResults: SearchResult[] = [];

        // 1. SYSTEM COMMANDS (Prefix '>')
        if (query.startsWith('>')) {
            const cmd = q.substring(1);
            if ('reload'.includes(cmd)) {
                newResults.push({
                    id: 'cmd_reload', type: 'CMD', title: 'SYSTEM RELOAD', subtitle: 'Refresh Browser Substrate', icon: React.createElement(Zap, { size: 18 }),
                    action: () => window.location.reload(), score: 100
                });
            }
            if ('sleep'.includes(cmd)) {
                newResults.push({
                    id: 'cmd_sleep', type: 'CMD', title: 'HYBERNATE', subtitle: 'Suspend Neural Activity', icon: React.createElement(Power, { size: 18 }),
                    action: () => { document.body.style.opacity = '0.1'; }, score: 90
                });
            }
        } else {
            // 2. OPEN WINDOWS (Switch focus)
            state.windows.forEach(win => {
                if (win.title.toLowerCase().includes(q)) {
                    newResults.push({
                        id: `win_${win.instanceId}`,
                        type: 'WINDOW',
                        title: win.title,
                        subtitle: 'Active Synapse (Switch Focus)',
                        icon: React.createElement(Monitor, { size: 18 }),
                        action: () => focusWindow(win.instanceId),
                        score: 50
                    });
                }
            });

            // 3. APPS (Launch)
            (Object.values(state.apps) as AppDef[]).forEach(app => {
                if (app.name.toLowerCase().includes(q) || (app.description && app.description.toLowerCase().includes(q))) {
                    newResults.push({
                        id: `app_${app.id}`,
                        type: 'APP',
                        title: app.name,
                        subtitle: app.category.toUpperCase(),
                        icon: typeof app.icon === 'string' ? React.createElement('span', { style: { fontSize: '18px' } }, app.icon) : React.createElement(Package, { size: 18 }),
                        action: () => openApp(app.id),
                        score: 40
                    });
                }
            });

            // 4. FILES (VFS)
            (Object.values(state.fileSystem) as FileNode[]).forEach(node => {
                if (node.name.toLowerCase().includes(q) && node.type === 'file') {
                    newResults.push({
                        id: `file_${node.id}`,
                        type: 'FILE',
                        title: node.name,
                        subtitle: `FS: .../${state.fileSystem[node.parentId]?.name || 'root'}`,
                        icon: React.createElement(FileText, { size: 18 }),
                        action: () => FileHandler.openFile(node),
                        score: 30
                    });
                }
            });
        }

        // Sort by score then title
        newResults.sort((a, b) => b.score - a.score);
        setResults(newResults);
        setSelectedIndex(0);

    }, [query, state.apps, state.fileSystem, state.windows]);

    // --- KEYBOARD NAVIGATION ---
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
            scrollSelectedIntoView(selectedIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            scrollSelectedIntoView(selectedIndex - 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const target = results[selectedIndex];
            if (target) {
                target.action();
                // If opening an app/window, usually we want to close the launcher, 
                // but for "tools" maybe not. Standard OS behavior is close.
                // We find our own window and close it.
                const myWin = state.windows.find(w => w.instanceId === instanceId);
                if (myWin) closeWindow(myWin.instanceId);
            }
        }
    };

    const scrollSelectedIntoView = (index: number) => {
        // Simple heuristic scrolling
        const el = listRef.current?.children[index] as HTMLElement;
        el?.scrollIntoView({ block: 'nearest' });
    };

    // --- DEFAULT GRID (Pinned Apps) ---
    const pinnedApps = (Object.values(state.apps) as AppDef[]).filter(a => 
        ['aiza', 'explorer', 'chrome', 'settings', 'todo', 'spider-vault', 'helix-prime', 'soul-chat'].includes(a.id)
    );

    return React.createElement('div', { 
        style: { 
            display: 'flex', flexDirection: 'column', height: '100%', 
            background: 'rgba(5, 8, 10, 0.9)', backdropFilter: 'blur(40px)', 
            color: '#fff', fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid rgba(0, 255, 204, 0.2)',
            borderRadius: '16px', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
        } 
    },
        // --- SEARCH HEADER ---
        React.createElement('div', { style: { padding: '24px 24px 12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' } },
            React.createElement('div', { style: { position: 'relative', display: 'flex', alignItems: 'center' } },
                React.createElement(Search, { size: 20, color: '#00ffcc', style: { position: 'absolute', left: '15px' } }),
                React.createElement('input', {
                    ref: inputRef,
                    type: 'text',
                    placeholder: 'Initialize Neural Query...',
                    value: query,
                    onChange: (e) => setQuery(e.target.value),
                    onKeyDown: handleKeyDown,
                    style: { 
                        width: '100%', padding: '16px 16px 16px 50px', 
                        background: 'rgba(0,0,0,0.3)', 
                        border: '1px solid rgba(0, 255, 204, 0.3)', 
                        borderRadius: '12px', color: '#fff', outline: 'none',
                        fontSize: '16px', fontFamily: 'inherit',
                        boxShadow: '0 0 20px rgba(0,255,204,0.05)'
                    }
                })
            )
        ),

        // --- CONTENT AREA ---
        React.createElement('div', { 
            ref: listRef,
            style: { flex: 1, overflowY: 'auto', padding: '10px' } 
        },
            // CASE A: RESULTS LIST
            query ? (
                results.length > 0 ? results.map((res, i) => (
                    React.createElement('div', {
                        key: res.id,
                        onClick: () => {
                            res.action();
                            const myWin = state.windows.find(w => w.instanceId === instanceId);
                            if (myWin) closeWindow(myWin.instanceId);
                        },
                        onMouseEnter: () => setSelectedIndex(i),
                        style: {
                            display: 'flex', alignItems: 'center', gap: '15px',
                            padding: '12px 20px', borderRadius: '8px', cursor: 'pointer',
                            background: i === selectedIndex ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                            borderLeft: i === selectedIndex ? '3px solid #00ffcc' : '3px solid transparent',
                            transition: 'all 0.1s'
                        }
                    },
                        React.createElement('div', { style: { color: i === selectedIndex ? '#fff' : '#00ffcc', opacity: 0.8 } }, res.icon),
                        React.createElement('div', { style: { flex: 1 } },
                            React.createElement('div', { style: { fontSize: '14px', fontWeight: 700, color: '#fff' } }, res.title),
                            React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, letterSpacing: '1px' } }, res.subtitle)
                        ),
                        res.type === 'APP' && React.createElement('div', { style: { fontSize: '9px', border: '1px solid #444', padding: '2px 6px', borderRadius: '4px', opacity: 0.5 } }, 'APP'),
                        res.type === 'WINDOW' && React.createElement('div', { style: { fontSize: '9px', border: '1px solid #00ffcc', color: '#00ffcc', padding: '2px 6px', borderRadius: '4px' } }, 'ACTIVE'),
                        i === selectedIndex && React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc', fontWeight: 'bold' } }, '⏎')
                    )
                )) : (
                    React.createElement('div', { style: { padding: '40px', textAlign: 'center', opacity: 0.3 } },
                        React.createElement('div', { style: { fontSize: '40px', marginBottom: '10px' } }, '🕸️'),
                        'NO MATCHING DNA FOUND'
                    )
                )
            ) : (
                // CASE B: DEFAULT GRID (Start Menu)
                React.createElement('div', { style: { padding: '10px 15px' } },
                    React.createElement('div', { style: { fontSize: '10px', fontWeight: 900, color: '#00ffcc', marginBottom: '15px', letterSpacing: '2px' } }, 'CORE_MODULES'),
                    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' } },
                        pinnedApps.map(app => React.createElement('div', {
                            key: app.id,
                            onClick: () => {
                                openApp(app.id);
                                const myWin = state.windows.find(w => w.instanceId === instanceId);
                                if (myWin) closeWindow(myWin.instanceId);
                            },
                            className: 'aiza-hover',
                            style: { 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', 
                                padding: '15px', borderRadius: '12px', cursor: 'pointer', 
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
                            }
                        },
                            React.createElement('div', { style: { fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(0,255,204,0.3))' } }, typeof app.icon === 'string' ? app.icon : '📦'),
                            React.createElement('div', { style: { fontSize: '10px', textAlign: 'center', fontWeight: 700 } }, app.name)
                        ))
                    ),
                    
                    React.createElement('div', { style: { fontSize: '10px', fontWeight: 900, color: '#00ffcc', margin: '25px 0 15px 0', letterSpacing: '2px' } }, 'SYSTEM_COMMANDS'),
                    React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
                        ['>reload', '>sleep'].map(cmd => (
                            React.createElement('button', {
                                key: cmd,
                                onClick: () => { setQuery(cmd); inputRef.current?.focus(); },
                                style: { 
                                    background: 'rgba(255, 0, 255, 0.1)', border: '1px solid rgba(255, 0, 255, 0.3)', 
                                    color: '#ff00ff', padding: '8px 12px', borderRadius: '6px', 
                                    fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' 
                                }
                            }, cmd)
                        ))
                    )
                )
            )
        ),

        // --- FOOTER ---
        React.createElement('div', { 
            style: { 
                padding: '12px 24px', background: 'rgba(0,0,0,0.4)', 
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '10px', color: '#666'
            } 
        },
            React.createElement('div', null, 'AIZA_OMNI_SEARCH v4.0'),
            React.createElement('div', { style: { display: 'flex', gap: '15px' } },
                React.createElement('span', null, '↑↓ NAVIGATE'),
                React.createElement('span', null, '⏎ EXECUTE'),
                React.createElement('span', null, 'ESC CLOSE')
            )
        )
    );
};

export const handApp: AppDef = {
    id: 'hand-search',
    name: 'Omni-Search',
    component: OmniSearchComponent,
    icon: '💠',
    category: 'System',
    defaultSize: { width: 680, height: 550 },
    description: 'The Unified Launch Interface. Search Apps, Files, and Windows via Neural Query.',
    hideTitleBar: true 
};