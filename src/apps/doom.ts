
import React from 'react';
import { AppDef } from '../core/state';

const DoomComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => (
    React.createElement('div', { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', color: '#fff' } },
        React.createElement('p', { style: { textAlign: 'center', padding: '5px', margin: 0 } }, 'Running WebAssembly Doom'),
        React.createElement('iframe', { 
            src: "https://wasm-doom.netlify.app/", 
            style: { flex: 1, border: 'none' }, 
            title: "doom-iframe",
            sandbox: "allow-scripts allow-same-origin"
        })
    )
);

// Added missing category
export const doomApp: AppDef = {
    id: 'doom',
    name: 'DOOM',
    component: DoomComponent,
    icon: '👹',
    category: 'Entertainment',
    defaultSize: { width: 640, height: 480 },
    description: 'The classic first-person shooter game, running in WebAssembly.'
};
