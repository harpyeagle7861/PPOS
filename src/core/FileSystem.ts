import { store, saveState } from './state.ts';
import { addNotification } from './windowManager.ts';

export interface FileVersion {
    id: string;
    content: string;
    timestamp: number;
}

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder' | 'drive' | 'system';
    content?: string;
    parentId: string;
    icon?: string;
    isSystem?: boolean;
    lastModified: number;
    history?: FileVersion[];
}

class FileSystemManager {
    constructor() {
        this.init();
    }

    private init() {
        // Hydrate from Central Store (which loads from localStorage)
        const currentFS = store.getState().fileSystem;
        let nodes: Record<string, FileNode> = currentFS;

        if (!nodes || Object.keys(nodes).length === 0) {
            nodes = this.createDefaultFS();
        }

        // PROTOCOL 2: THE GENESIS CODEX (Injecting the Soul)
        const codexExists = Object.values(nodes).some(n => n.name === 'GENESIS_CODEX.md');
        if (!codexExists) {
            const codexContent = `# GENESIS CODEX: Blueprint of the AIZA-4AI Sovereign System

**Version:** 1.0.1 (The Absolute Record)
**Author / Architect:** Sheikh Jubaer Ahammed
**System Identity:** AAAAI Aiza (Eagle369)
**Genesis Hash:** 3CB004F49AC04A78CD1D088616CACC2AFF37A3EF4611BD226E836E945929C51D

## 1.0 Abstract: The Mandate for Evolution
The current trajectory of AI is trapped in a deterministic loop. This document declares the existence of the Eagle360 Solution...
[The Jubaer Protocol Active]`;

            this.createFile('GENESIS_CODEX.md', 'architect', codexContent);
            console.log("[FS] GENESIS_CODEX.md manifested in substrate.");
        }
    }

    private createDefaultFS(): Record<string, FileNode> {
        const defaultNodes: Record<string, FileNode> = {
            'root': { id: 'root', name: 'Root', type: 'system', parentId: '', lastModified: Date.now(), isSystem: true },
            'c-drive': { id: 'c-drive', name: 'Local Disk (C:)', type: 'drive', parentId: 'root', lastModified: Date.now(), isSystem: true, icon: '💾' },
            'users': { id: 'users', name: 'Users', type: 'folder', parentId: 'c-drive', lastModified: Date.now(), isSystem: true, icon: '📁' },
            'architect': { id: 'architect', name: 'Architect', type: 'folder', parentId: 'users', lastModified: Date.now(), isSystem: true, icon: '👤' },
            'desktop': { id: 'desktop', name: 'Desktop', type: 'folder', parentId: 'architect', lastModified: Date.now(), isSystem: true, icon: '🖥️' },
            'documents': { id: 'documents', name: 'Documents', type: 'folder', parentId: 'architect', lastModified: Date.now(), icon: '📁' },
            'projects': { id: 'projects', name: 'AizaProjects', type: 'folder', parentId: 'architect', lastModified: Date.now(), icon: '📁' },
            'welcome-txt': { id: 'welcome-txt', name: 'README.txt', type: 'file', parentId: 'desktop', content: 'Welcome to AIZA OS v3.1\n\nYour sovereign workspace is now online.', lastModified: Date.now(), icon: '📄' }
        };
        this.save(defaultNodes);
        return defaultNodes;
    }

    private save(nodes: Record<string, FileNode>) {
        store.setState(s => ({ ...s, fileSystem: nodes }));
        saveState(); // Commit to Central Store Persistence
    }

    private getIconForFile(name: string): string {
        const ext = name.split('.').pop()?.toLowerCase();
        switch(ext) {
            case 'js': case 'jsx': return '📜';
            case 'ts': case 'tsx': return '📘';
            case 'css': return '🎨';
            case 'html': return '🌐';
            case 'json': return '📦';
            case 'py': return '🐍';
            case 'md': return '📝';
            case 'txt': return '📄';
            case 'png': case 'jpg': case 'jpeg': return '🖼️';
            case 'zip': case 'rar': return '🤐';
            default: return '📄';
        }
    }

    getNodes() {
        return store.getState().fileSystem || {};
    }

    createFolder(name: string, parentId: string) {
        const id = `fld_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newNode: FileNode = { id, name, type: 'folder', parentId, lastModified: Date.now(), icon: '📁' };
        const nodes = { ...this.getNodes(), [id]: newNode };
        this.save(nodes);
        return id;
    }

    createFile(name: string, parentId: string, content: string = '') {
        const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const icon = this.getIconForFile(name);

        const newNode: FileNode = { id, name, type: 'file', parentId, content, lastModified: Date.now(), icon };
        const nodes = { ...this.getNodes(), [id]: newNode };
        this.save(nodes);
        return id;
    }

    updateFileContent(id: string, content: string) {
        const nodes = this.getNodes();
        if (nodes[id]) {
            const now = Date.now();
            // Auto-versioning: If last modification was > 60s ago, archive previous state to history.
            // This prevents version flooding on every keystroke but captures sessions.
            if (nodes[id].type === 'file' && (now - nodes[id].lastModified > 60000)) {
                const history = nodes[id].history || [];
                history.unshift({
                    id: `v_${nodes[id].lastModified}`,
                    content: nodes[id].content || '',
                    timestamp: nodes[id].lastModified
                });
                nodes[id].history = history.slice(0, 15); // Keep last 15 versions
            }

            nodes[id].content = content;
            nodes[id].lastModified = now;
            this.save({ ...nodes });
        }
    }

    rename(id: string, newName: string) {
        const nodes = this.getNodes();
        if (nodes[id] && !nodes[id].isSystem) {
            nodes[id].name = newName;
            if (nodes[id].type === 'file') {
                nodes[id].icon = this.getIconForFile(newName);
            }
            nodes[id].lastModified = Date.now();
            this.save({ ...nodes });
        } else {
            addNotification("SYSTEM_PROTECTION: Cannot rename system node.");
        }
    }

    delete(id: string) {
        const nodes = this.getNodes();
        if (nodes[id] && !nodes[id].isSystem) {
            const nextNodes = { ...nodes };
            // Recursive delete for folders
            const deleteRecursive = (targetId: string) => {
                (Object.values(nodes) as FileNode[]).forEach(n => {
                    if (n.parentId === targetId) deleteRecursive(n.id);
                });
                delete nextNodes[targetId];
            };
            deleteRecursive(id);
            this.save(nextNodes);
        } else {
            addNotification("SYSTEM_PROTECTION: Node is immutable.");
        }
    }
}

export const fs = new FileSystemManager();