
import React, { useState, useEffect } from 'react';
import { AppDef, store } from '../core/state.ts';

const OfficeViewerComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [activeFile, setActiveFile] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'SHEET' | 'DOCUMENT'>('DOCUMENT');

    useEffect(() => {
        const unsub = store.subscribe(s => {
            const file = s.appState[instanceId]?.activeFile;
            if (file) {
                setActiveFile(file);
                setViewMode(file.name.endsWith('.xlsx') ? 'SHEET' : 'DOCUMENT');
            }
        });
        return () => unsub();
    }, [instanceId]);

    if (!activeFile) {
        return React.createElement('div', { style: { height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' } }, 'DRAG_AND_DROP_OFFICE_DNA');
    }

    return React.createElement('div', { style: { height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', color: '#333' } },
        React.createElement('div', { style: { padding: '15px 30px', background: '#2b579a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px' } },
                React.createElement('span', { style: { fontSize: '20px' } }, viewMode === 'SHEET' ? '📊' : '📜'),
                React.createElement('span', { style: { fontWeight: 'bold' } }, activeFile.name.toUpperCase())
            ),
            React.createElement('div', { style: { fontSize: '11px', opacity: 0.8 } }, 'DOCUMIND_COMPATIBILITY_V1.0')
        ),
        React.createElement('div', { style: { flex: 1, padding: '40px', overflowY: 'auto', background: '#e6e6e6', display: 'flex', justifyContent: 'center' } },
            React.createElement('div', { 
                style: { 
                    width: '100%', maxWidth: '800px', background: '#fff', minHeight: '1000px', 
                    padding: '60px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #ddd' 
                } 
            },
                React.createElement('h1', null, activeFile.name.split('.')[0]),
                React.createElement('div', { style: { marginTop: '30px', opacity: 0.2, textAlign: 'center', border: '2px dashed #ccc', padding: '100px' } },
                    `[WASM_PARSER_ACTIVE]: Reconstructing ${viewMode} substrate...`
                )
            )
        )
    );
};

export const officeViewerApp: AppDef = {
    id: 'office-viewer',
    name: 'DocuMind',
    component: OfficeViewerComponent,
    icon: '📄',
    category: 'Utility',
    defaultSize: { width: 900, height: 700 },
    description: 'WASM-powered Office compatibility layer.'
};
