
import React, { useState, useEffect, useRef } from 'react';
import { AppDef, store } from '../core/state.ts';
import { fs } from '../core/FileSystem.ts';
import { dispatchAppAction, addNotification, updateAppState } from '../core/windowManager.ts';

const NotepadComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [text, setText] = useState('');
    const [fileId, setFileId] = useState<string | null>(null);
    const [status, setStatus] = useState('READY');
    const [zoom, setZoom] = useState(16);

    // Initial Load
    useEffect(() => {
        const state = store.getState();
        const appState = state.appState[instanceId];
        
        if (appState?.activeFileId) {
            const file = state.fileSystem[appState.activeFileId];
            if (file) {
                setFileId(file.id);
                setText(file.content || '');
            }
        } else if (appState?.text) {
            setText(appState.text);
        } else {
            // Create a default scratchpad in VFS if none exists
            const scratchName = `Scratch_${Date.now()}.txt`;
            const newId = fs.createFile(scratchName, 'desktop', '');
            setFileId(newId);
            updateAppState(instanceId, { activeFileId: newId });
        }
    }, [instanceId]);

    // VFS Auto-Save
    useEffect(() => {
        const timer = setTimeout(() => {
            if (fileId) {
                fs.updateFileContent(fileId, text);
                setStatus('SAVED');
            } else {
                // Legacy fallback
                localStorage.setItem('AIZA_NOTEPAD_PERSISTENCE', text);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [text, fileId]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        setStatus('TYPING...');
        dispatchAppAction(instanceId, { type: 'UPDATE_NOTEPAD_CONTENT', payload: { text: e.target.value } });
    };

    const isDark = store.getState().settings.theme === 'dark';

    return React.createElement('div', { 
        style: { position: 'relative', height: '100%', background: isDark ? '#050505' : '#fff', display: 'flex', flexDirection: 'column' }
    },
        React.createElement('div', { style: { padding: '8px 25px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f5f5f5', borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#ddd'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                React.createElement('span', { style: { fontSize: '10px', fontWeight: 800, opacity: 0.6 } }, status),
                React.createElement('input', { 
                    type: 'range', min: 10, max: 40, value: zoom, 
                    onChange: e => setZoom(Number(e.target.value)),
                    style: { accentColor: '#00ffcc', width: '80px' }
                })
            ),
            fileId && React.createElement('div', { style: { fontSize: '10px', opacity: 0.5 } }, `ID: ${fileId}`)
        ),
        React.createElement('textarea', {
            value: text, onChange: handleChange,
            placeholder: 'Ingesting neural stream...',
            style: { 
                flex: 1, boxSizing: 'border-box', border: 'none', resize: 'none', 
                padding: '35px', fontFamily: "'JetBrains Mono', monospace", fontSize: `${zoom}px`,
                background: 'transparent', color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#222', outline: 'none', lineHeight: '1.7'
            },
            autoFocus: true
        })
    );
};

export const notepadApp: AppDef = {
    id: 'notepad', name: 'Notepad', component: NotepadComponent, icon: '📝', category: 'Utility', defaultSize: { width: 700, height: 600 },
    description: 'Neural text buffer with real-time VFS persistence.'
};
