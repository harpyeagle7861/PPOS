
import { store, FileNode } from './state.ts';
import { openApp, updateAppState, addNotification } from './windowManager.ts';

const EXTENSION_MAP: Record<string, string> = {
    'pdf': 'pdf-viewer',
    'docx': 'office-viewer',
    'xlsx': 'office-viewer',
    'pptx': 'office-viewer',
    'zip': 'archive-manager',
    'rar': 'archive-manager',
    'exe': 'dos-emulator',
    'com': 'dos-emulator'
};

export const FileHandler = {
    openFile: (node: FileNode) => {
        const extension = node.name.split('.').pop()?.toLowerCase() || '';
        const targetAppId = EXTENSION_MAP[extension];

        if (targetAppId) {
            const win = openApp(targetAppId);
            updateAppState(targetAppId, { 
                activeFile: node,
                timestamp: Date.now() 
            });
            addNotification(`COMPATIBILITY_LAYER: Mounting ${node.name} via ${targetAppId.toUpperCase()}`);
            return;
        }

        // Fallback for native text/code
        if (['txt', 'js', 'ts', 'html', 'css', 'json', 'py'].includes(extension)) {
            const app = (extension === 'txt') ? 'notepad' : 'vs360code';
            const win = openApp(app);
            updateAppState(app, { activeFileId: node.id, text: node.content });
            return;
        }

        // AI Fallback for unknown DNA
        addNotification(`UNKNOWN_DNA: Consulting Aiza for protocol...`);
        openApp('aiza');
        const currentMessages = store.getState().appState['aiza']?.messages || [];
        updateAppState('aiza', {
            messages: [...currentMessages, {
                role: 'user',
                text: `[SYSTEM_QUERY]: Architect tried to open an unknown file: "${node.name}". I don't have a registered handler. How should I process this DNA fragment?`,
                id: `query_${Date.now()}`,
                timestamp: Date.now()
            }]
        });
    }
};
