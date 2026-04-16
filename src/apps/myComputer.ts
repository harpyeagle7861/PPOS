
import React from 'react';
import { AppDef } from '../core/state';

const files = [
    { name: 'Documents', icon: '📁' },
    { name: 'Pictures', icon: '📁' },
    { name: 'Music', icon: '📁' },
    { name: 'system32', icon: '📁' },
    { name: 'README.txt', icon: '📄' },
    { name: 'photo.jpg', icon: '🖼️' },
];

const MyComputerComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => (
    React.createElement('div', { style: { padding: '10px', background: '#fff' } },
        React.createElement('ul', { style: { listStyle: 'none', margin: 0, padding: 0 } },
            files.map(file =>
                React.createElement('li', { key: file.name, style: { display: 'flex', alignItems: 'center', padding: '5px', cursor: 'default' } },
                    React.createElement('span', { style: { marginRight: '10px', fontSize: '20px' } }, file.icon),
                    React.createElement('span', null, file.name)
                )
            )
        )
    )
);

// Added missing category
export const myComputerApp: AppDef = {
    id: 'my-computer',
    name: 'My Computer',
    component: MyComputerComponent,
    icon: '💻',
    category: 'System',
    defaultSize: { width: 400, height: 350 },
    description: 'A simple file explorer to browse local system directories.'
};
