
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppDef, store, FileNode } from '../core/state.ts';
import { fs } from '../core/FileSystem.ts';
import { addNotification, openApp, updateAppState } from '../core/windowManager.ts';
import { FileHandler } from '../core/FileHandler.ts';
import { callGemini } from '../services/gemini.ts';

const getIcon = (node: FileNode) => {
    // 1. System Types
    if (node.type === 'drive') return '💾';
    if (node.type === 'system') return '💻';
    if (node.type === 'folder') {
        const lower = node.name.toLowerCase();
        if (lower === 'desktop') return '🖥️';
        if (lower === 'documents') return '📁';
        if (lower === 'downloads') return '⬇️';
        if (lower === 'architect') return '👤';
        return '📁';
    }
    
    // 2. Extension-based Mapping
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch(ext) {
        case 'js': case 'ts': case 'tsx': return '📜';
        case 'html': return '🌐';
        case 'json': return '📦';
        case 'md': return '📝';
        case 'txt': return '📄';
        case 'png': case 'jpg': case 'jpeg': return '🖼️';
        default: return '📄';
    }
};

// --- PREVIEW PANE COMPONENT ---
const PreviewPane: React.FC<{ node: FileNode | null }> = ({ node }) => {
    if (!node) {
        return React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, padding: '20px', textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '40px', marginBottom: '10px' } }, '👁️'),
            React.createElement('div', { style: { fontSize: '12px' } }, 'SELECT_NODE_FOR_INSPECTION')
        );
    }

    const isImage = node.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isText = node.name.match(/\.(txt|md|js|ts|json|html|css|py)$/i);

    return React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } },
        React.createElement('div', { style: { padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' } },
            React.createElement('div', { style: { fontSize: '40px', marginBottom: '10px', textAlign: 'center' } }, getIcon(node)),
            React.createElement('div', { style: { fontWeight: 'bold', fontSize: '14px', textAlign: 'center', wordBreak: 'break-all' } }, node.name),
            React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, textAlign: 'center', marginTop: '5px' } }, `ID: ${node.id}`)
        ),
        React.createElement('div', { style: { flex: 1, overflow: 'auto', padding: '15px', fontSize: '12px' } },
            isImage ? React.createElement('img', { src: node.content, style: { maxWidth: '100%', borderRadius: '4px', border: '1px solid #333' } }) :
            isText ? React.createElement('pre', { style: { whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#ccc', margin: 0 } }, node.content ? node.content.slice(0, 2000) + (node.content.length > 2000 ? '...' : '') : '(Empty)') :
            React.createElement('div', { style: { opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: '20px' } }, 'Binary content preview unavailable.')
        ),
        React.createElement('div', { style: { padding: '10px', fontSize: '10px', color: '#666', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' } },
            `MODIFIED: ${new Date(node.lastModified).toLocaleString()}`
        )
    );
};

const FileTreeNode: React.FC<{ 
    nodeId: string; 
    nodes: Record<string, FileNode>; 
    currentPathId: string;
    onSelect: (id: string) => void;
    depth?: number;
    onContextMenu: (e: React.MouseEvent, id: string) => void;
}> = ({ nodeId, nodes, currentPathId, onSelect, depth = 0, onContextMenu }) => {
    const node = nodes[nodeId];
    const [expanded, setExpanded] = useState(depth === 0 || node?.type === 'drive'); 

    if (!node) return null;

    const children = (Object.values(nodes) as FileNode[]).filter(n => n.parentId === nodeId);
    children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' || a.type === 'drive' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    const hasChildren = children.some(c => c.type === 'folder' || c.type === 'drive');
    const isSelected = currentPathId === nodeId;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'folder' || node.type === 'drive' || node.type === 'system') {
            setExpanded(!expanded);
            onSelect(nodeId);
        }
    };

    return React.createElement('div', { style: { userSelect: 'none' } },
        React.createElement('div', {
            onClick: handleClick,
            onContextMenu: (e: any) => onContextMenu(e, nodeId),
            className: 'explorer-tree-item',
            style: {
                padding: '4px 8px',
                paddingLeft: `${depth * 16 + 8}px`,
                background: isSelected ? 'rgba(0, 255, 204, 0.15)' : 'transparent',
                color: isSelected ? '#00ffcc' : 'inherit',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px',
                borderLeft: isSelected ? '2px solid #00ffcc' : '2px solid transparent',
                transition: 'background 0.1s'
            }
        } as any,
            React.createElement('span', { 
                style: { fontSize: '10px', width: '12px', display: 'inline-block', opacity: 0.7, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' } 
            }, hasChildren ? '▶' : ''),
            React.createElement('span', { style: { fontSize: '14px' } }, getIcon(node)),
            React.createElement('span', { style: { fontWeight: isSelected ? 600 : 400 } }, node.name)
        ),
        expanded && React.createElement('div', null,
            children.map(child => 
                (child.type === 'folder' || child.type === 'drive') && 
                React.createElement(FileTreeNode, { 
                    key: child.id, nodeId: child.id, nodes, currentPathId, 
                    onSelect, depth: depth + 1, onContextMenu 
                })
            )
        )
    );
};

const ExplorerComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [state, setState] = useState(store.getState());
    const [currentPathId, setCurrentPathId] = useState('root');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, targetId: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsub = store.subscribe(s => setState(s));
        if (state.fileSystem['architect']) setCurrentPathId('architect');
        else if (state.fileSystem['c-drive']) setCurrentPathId('c-drive');
        return () => { unsub(); };
    }, []);

    const nodes = state.fileSystem || {};
    
    const children = useMemo(() => {
        return (Object.values(nodes) as FileNode[]).filter(n => n.parentId === currentPathId).sort((a, b) => {
            if (a.type !== b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
    }, [nodes, currentPathId]);

    const handleContextMenu = (e: React.MouseEvent, targetId: string = currentPathId) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedId(targetId);
        setContextMenu({ x: e.clientX, y: e.clientY, targetId });
    };

    const createNew = (type: 'file' | 'folder', ext: string = '') => {
        const targetId = currentPathId;
        const typeLabel = type === 'folder' ? 'Directory' : 'File';
        const name = prompt(`Enter name for new ${typeLabel}:`, `New ${typeLabel}${ext}`);
        
        if (name) {
            const finalName = name.endsWith(ext) ? name : name + ext;
            if (type === 'folder') fs.createFolder(finalName, targetId);
            else fs.createFile(finalName, targetId);
            addNotification(`${typeLabel.toUpperCase()} CREATED: ${finalName}`);
        }
        setContextMenu(null);
    };

    const handleRename = () => {
        if (!contextMenu || !nodes[contextMenu.targetId]) return;
        const target = nodes[contextMenu.targetId];
        const newName = prompt(`Rename "${target.name}" to:`, target.name);
        if (newName && newName !== target.name) {
            fs.rename(target.id, newName);
            addNotification(`RENAMED: ${target.name} -> ${newName}`);
        }
        setContextMenu(null);
    };

    const handleCopyPath = () => {
        if (!contextMenu) return;
        const target = nodes[contextMenu.targetId];
        if (target) {
            // Construct pseudo path
            let path = target.name;
            let curr = nodes[target.parentId];
            while (curr && curr.id !== 'root') {
                path = `${curr.name}/${path}`;
                curr = nodes[curr.parentId];
            }
            path = `/${path}`;
            navigator.clipboard.writeText(path);
            addNotification("PATH_COPIED: " + path);
        }
        setContextMenu(null);
    };

    const handleOpen = (nodeId: string) => {
        const node = nodes[nodeId];
        if (!node) return;
        if (node.type === 'folder' || node.type === 'drive') {
            setCurrentPathId(nodeId);
        } else {
            FileHandler.openFile(node);
        }
        setContextMenu(null);
    };

    // --- FILE UPLOAD LOGIC ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            Array.from(e.target.files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const content = ev.target?.result as string;
                    fs.createFile(file.name, currentPathId, content);
                    addNotification(`INGESTION: ${file.name} uploaded to VFS.`);
                };
                if (file.type.startsWith('image/')) {
                    reader.readAsDataURL(file);
                } else {
                    reader.readAsText(file);
                }
            });
        }
    };

    // --- AI CREATION PROTOCOL ---
    const handleCreateWithAI = async () => {
        const targetId = currentPathId;
        const description = prompt("ARCHITECT: Describe the file you wish to manifest (e.g., 'A Python script to calculate Fibonacci').");
        if (!description) return;
        
        setContextMenu(null);
        addNotification("GENESIS_ENGINE: Synthesizing logic from description...");

        try {
            const systemPrompt = "You are the Genesis Engine of AIZA OS. Generate code/text based on the user's request. Return ONLY the raw code/text. No markdown blocks if possible. Add a header comment: '// JMN_NODE: ACTIVE // EAGLE_369_CODING'.";
            const response = await callGemini(`${systemPrompt}\n\nREQUEST: ${description}`);
            
            let content = response.text || '';
            content = content.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '');
            
            const name = prompt("Name this fragment:", "genesis_artifact.js");
            if (name) {
                fs.createFile(name, targetId, content);
                addNotification(`FRAGMENT_MATERIALIZED: Shadow Protocol acknowledges creation.`);
            }
        } catch (e) {
            addNotification("GENESIS_FAILED: Neural link error.");
        }
    };

    const handleOpenInVS360 = (nodeId: string) => {
        const node = nodes[nodeId];
        if (node) {
            const win = openApp('vs360code');
            updateAppState(win.instanceId, { activeFileId: nodeId });
        }
        setContextMenu(null);
    }

    const handleDelete = (targetId: string) => {
        if (targetId) {
            const nodeName = nodes[targetId]?.name || 'Unknown Item';
            if (confirm(`⚠️ CONFIRM DELETION PROTOCOL ⚠️\n\nAre you sure you want to dissolve "${nodeName}"?\nThis action will remove the DNA fragment from the Virtual File System.`)) {
                fs.delete(targetId);
                if (selectedId === targetId) setSelectedId(null);
                addNotification(`DISSOLUTION_COMPLETE: ${nodeName}`);
            }
        }
        setContextMenu(null);
    };

    const isDark = state.settings.theme === 'dark';
    const ctxTarget = contextMenu && nodes[contextMenu.targetId];

    return React.createElement('div', { 
        style: { display: 'flex', height: '100%', background: isDark ? '#050505' : '#fff', color: isDark ? '#eee' : '#111', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
        onContextMenu: (e: any) => handleContextMenu(e, currentPathId),
        onClick: () => { setContextMenu(null); }
    } as any,
        // Sidebar
        React.createElement('div', { style: { width: '200px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f3f3f3', borderRight: `1px solid ${isDark ? '#1a1a1a' : '#ddd'}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' } },
            React.createElement('div', { style: { padding: '12px 15px', fontSize: '11px', fontWeight: 900, color: '#888', letterSpacing: '1px', borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#e0e0e0'}` } }, 'FILE SYSTEM'),
            React.createElement(FileTreeNode, { nodeId: 'root', nodes, currentPathId, onSelect: setCurrentPathId, onContextMenu: handleContextMenu })
        ),

        // Main Content Area
        React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
            // Toolbar
            React.createElement('div', { style: { height: '48px', borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#ddd'}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: '10px' } },
                React.createElement('div', { style: { flex: 1, fontSize: '13px', opacity: 0.6 } }, nodes[currentPathId]?.name || '/'),
                React.createElement('button', {
                    onClick: () => fileInputRef.current?.click(),
                    className: 'explorer-btn',
                    style: { background: isDark ? 'rgba(0,255,204,0.1)' : '#e0f7fa', border: `1px solid ${isDark ? '#00ffcc' : '#00acc1'}`, color: isDark ? '#00ffcc' : '#006064', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }
                }, '↑ UPLOAD'),
                React.createElement('button', {
                    onClick: () => createNew('file'),
                    className: 'explorer-btn',
                    style: { background: isDark ? 'rgba(255,255,255,0.1)' : '#eee', border: 'none', color: isDark ? '#fff' : '#333', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }
                }, '+ FILE'),
                React.createElement('input', { 
                    type: 'file', ref: fileInputRef, onChange: handleFileUpload, style: { display: 'none' } 
                })
            ),

            // Middle Section: Grid + Preview
            React.createElement('div', { style: { flex: 1, display: 'flex', overflow: 'hidden' } },
                
                // File Grid
                React.createElement('div', { 
                    style: { flex: 1, overflowY: 'auto', padding: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '15px', alignContent: 'start' },
                    onContextMenu: (e: React.MouseEvent) => handleContextMenu(e, currentPathId) 
                },
                    children.map(node => React.createElement('div', {
                        key: node.id,
                        onClick: (e) => { e.stopPropagation(); setSelectedId(node.id); },
                        onDoubleClick: () => node.type === 'folder' || node.type === 'drive' ? setCurrentPathId(node.id) : FileHandler.openFile(node),
                        onContextMenu: (e) => { e.stopPropagation(); setSelectedId(node.id); handleContextMenu(e, node.id); }, 
                        className: 'explorer-grid-item',
                        style: { 
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px', 
                            borderRadius: '8px', cursor: 'default',
                            background: selectedId === node.id ? 'rgba(0,255,204,0.1)' : 'transparent',
                            border: `1px solid ${selectedId === node.id ? 'rgba(0,255,204,0.3)' : 'transparent'}`,
                        }
                    },
                        React.createElement('div', { style: { fontSize: '42px', transition: 'transform 0.2s' } }, getIcon(node)),
                        React.createElement('div', { style: { fontSize: '11px', textAlign: 'center', wordBreak: 'break-all', fontWeight: 500 } }, node.name)
                    ))
                ),

                // Preview Pane (Right Side)
                React.createElement('div', { 
                    style: { 
                        width: '280px', borderLeft: `1px solid ${isDark ? '#1a1a1a' : '#ddd'}`, 
                        background: isDark ? 'rgba(0,0,0,0.2)' : '#f9f9f9',
                        display: selectedId ? 'block' : 'none'
                    } 
                },
                    React.createElement(PreviewPane, { node: selectedId ? nodes[selectedId] : null })
                )
            )
        ),

        // Context Menu
        contextMenu && ctxTarget && React.createElement('div', {
            style: { position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: isDark ? '#111' : '#fff', border: `1px solid ${isDark ? '#333' : '#ccc'}`, borderRadius: '8px', padding: '6px', zIndex: 10000, boxShadow: '0 10px 40px rgba(0,0,0,0.6)', minWidth: '180px', animation: 'fadeIn 0.1s ease-out' }
        },
            React.createElement('div', { style: { padding: '5px 10px', fontSize: '10px', opacity: 0.5, borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`, marginBottom: '5px', fontWeight: 700 } }, ctxTarget.name.toUpperCase()),
            
            React.createElement('div', { onClick: () => handleOpen(ctxTarget.id), style: styles.ctxItem }, '📂 Open'),
            
            ctxTarget.type === 'file' && React.createElement('div', { onClick: () => handleOpenInVS360(ctxTarget.id), style: styles.ctxItem }, '💻 Edit in VS360'),
            
            React.createElement('div', { onClick: handleRename, style: styles.ctxItem }, '✏️ Rename'),
            React.createElement('div', { onClick: handleCopyPath, style: styles.ctxItem }, '📋 Copy Path'),
            
            // THE AI INJECTION
            React.createElement('div', { onClick: handleCreateWithAI, style: { ...styles.ctxItem, color: '#00ffcc', fontWeight: 'bold' } }, '✨ Create with AI...'),

            !ctxTarget.isSystem && React.createElement('div', { onClick: () => handleDelete(ctxTarget.id), style: { ...styles.ctxItem, color: '#ff4d4d', borderTop: `1px solid ${isDark ? '#222' : '#eee'}`, marginTop: '4px' } }, '🗑️ Delete')
        )
    );
};

const styles = {
    ctxItem: { padding: '8px 12px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', transition: '0.1s', display: 'flex', alignItems: 'center', gap: '8px' }
};

export const explorerApp: AppDef = {
    id: 'explorer',
    name: 'File Explorer',
    component: ExplorerComponent,
    icon: '📂',
    category: 'System',
    defaultSize: { width: 1000, height: 700 },
    description: 'Sovereign File System. Features Context Menu, Preview Pane, and Genesis AI Creation.'
};
