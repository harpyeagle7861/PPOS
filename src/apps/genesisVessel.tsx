
import React, { useMemo } from 'react';
import { store } from '../core/state.ts';

/**
 * Genesis Vessel: The universal container for software born from Aiza's neural net.
 * Uses srcDoc for high-fidelity sandboxed execution.
 */
const GenesisVesselComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const customAppData = useMemo(() => {
        const state = store.getState();
        // The original App ID is used as a lookup key for the code manifest
        const win = state.windows.find(w => w.instanceId === instanceId);
        const appId = win?.appDef.id || '';
        return state.customApps[appId];
    }, [instanceId]);

    if (!customAppData) {
        return React.createElement('div', { style: { padding: '40px', color: '#ff4d4d', background: '#000', height: '100%' } },
            React.createElement('h2', null, 'GENESIS_FAULT: MANIFEST_NOT_FOUND'),
            React.createElement('p', null, 'The logic DNA for this vessel could not be retrieved from the quinary substrate.')
        );
    }

    // Wrap the code in a full HTML shell if it's just a fragment
    const fullHtml = useMemo(() => {
        const code = customAppData.code;
        if (code.includes('<html') || code.includes('<!DOCTYPE')) return code;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        background: #050505; 
                        color: #00ffcc; 
                        font-family: 'Inter', sans-serif; 
                        overflow-x: hidden;
                        min-height: 100vh;
                    }
                    * { box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 5px; }
                    ::-webkit-scrollbar-thumb { background: rgba(0,255,204,0.3); border-radius: 10px; }
                </style>
            </head>
            <body>
                ${code}
            </body>
            </html>
        `;
    }, [customAppData.code]);

    return React.createElement('iframe', {
        title: `Genesis Vessel: ${customAppData.name}`,
        srcDoc: fullHtml,
        sandbox: "allow-scripts allow-modals allow-popups allow-forms allow-same-origin",
        style: {
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#000'
        }
    });
};

export default GenesisVesselComponent;
