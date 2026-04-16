
import React, { useState, useEffect } from 'react';
import { AppDef, store } from '../core/state.ts';

const PDFViewerComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [file, setFile] = useState<any>(null);

    useEffect(() => {
        const unsub = store.subscribe(s => {
            const f = s.appState[instanceId]?.activeFile;
            if (f) setFile(f);
        });
        return () => unsub();
    }, [instanceId]);

    return React.createElement('div', { style: { height: '100%', background: '#323639', display: 'flex', flexDirection: 'column' } },
        React.createElement('div', { style: { height: '56px', background: '#202124', display: 'flex', alignItems: 'center', padding: '0 25px', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' } },
            React.createElement('div', { style: { color: '#fff', fontSize: '13px', fontWeight: 500, letterSpacing: '1px' } }, 
                file ? file.name.toUpperCase() : 'SPECTER_PDF_VIEWER'
            ),
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                ['PRINT', 'DOWNLOAD', 'ROTATE'].map(btn => React.createElement('button', { 
                    key: btn,
                    style: { background: 'transparent', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', opacity: 0.6 } 
                }, btn))
            )
        ),
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' } },
            [1, 2, 3].map(page => React.createElement('div', { 
                key: page,
                style: { width: '80%', maxWidth: '800px', height: '1100px', background: '#fff', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }, 
                React.createElement('span', { style: { color: '#eee', fontSize: '24px', fontWeight: 900 } }, `PAGE_DNA_${page}`)
            ))
        )
    );
};

export const pdfViewerApp: AppDef = {
    id: 'pdf-viewer',
    name: 'Specter PDF',
    component: PDFViewerComponent,
    icon: '📑',
    category: 'Utility',
    defaultSize: { width: 850, height: 800 },
    description: 'High-fidelity PDF document renderer.'
};
