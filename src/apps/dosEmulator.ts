
import React, { useState, useEffect } from 'react';
import { AppDef, store } from '../core/state.ts';

const DosEmulatorComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [activeFile, setActiveFile] = useState<any>(null);

    useEffect(() => {
        const unsub = store.subscribe(s => {
            const f = s.appState[instanceId]?.activeFile;
            if (f) setActiveFile(f);
        });
        return () => unsub();
    }, [instanceId]);

    return React.createElement('div', { style: { height: '100%', background: '#000', display: 'flex', flexDirection: 'column', fontFamily: "'Courier New', monospace" } },
        React.createElement('div', { style: { flex: 1, padding: '40px', position: 'relative', overflow: 'hidden' } },
            // CRT Filter Overlay
            React.createElement('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 3px 100%', zIndex: 10, pointerEvents: 'none' } }),
            
            React.createElement('div', { style: { color: '#00ff00', fontSize: '18px', textShadow: '0 0 10px #00ff00' } },
                React.createElement('div', null, 'AIZA_LEGACY_EXECUTOR [Version 1.0.42]'),
                React.createElement('div', { style: { marginBottom: '20px' } }, '(C) Copyright Jubaer Labs 786-2025.'),
                
                activeFile ? React.createElement('div', null,
                    React.createElement('div', null, `C:\> RUN ${activeFile.name}`),
                    React.createElement('div', { className: 'blink', style: { marginTop: '20px' } }, `_ BOOTING_DNA... [${activeFile.name}]`)
                ) : React.createElement('div', null, 'C:\> _')
            )
        ),
        React.createElement('div', { style: { height: '30px', background: '#333', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '20px' } },
            React.createElement('span', null, 'F1: HELP'),
            React.createElement('span', null, 'CTRL+F9: TERMINATE'),
            React.createElement('span', { style: { marginLeft: 'auto', color: '#00ff00' } }, 'EMULATION: NOMINAL')
        ),
        React.createElement('style', null, `
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
            .blink { animation: blink 1s infinite; }
        `)
    );
};

export const dosEmulatorApp: AppDef = {
    id: 'dos-emulator',
    name: 'Legacy Executor',
    component: DosEmulatorComponent,
    icon: '🕹️',
    category: 'Entertainment',
    defaultSize: { width: 720, height: 500 },
    description: 'x86 legacy software environment.'
};
