
import React from 'react';
import { AppDef } from '../core/state';

const PlaceholderComponent: React.FC<{appName: string}> = ({appName}) => (
    React.createElement('div', { style: { padding: 20, height: '100%', boxSizing: 'border-box', background: '#00001a', color: '#fff' } },
        React.createElement('h1', null, appName),
        React.createElement('p', null, 'This application is a placeholder. Functionality will be implemented in a future update.')
    )
);

const CosmicWorldComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    return React.createElement(PlaceholderComponent, { appName: "Cosmic World" });
};

// Added missing category
export const cosmicWorldApp: AppDef = {
    id: 'cosmic-world',
    name: 'Cosmic World',
    component: CosmicWorldComponent,
    icon: '🌌',
    category: 'Entertainment',
    defaultSize: { width: 500, height: 400 },
    description: "A placeholder for the AI's reality simulation engine."
};
