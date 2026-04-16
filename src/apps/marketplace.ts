
import React from 'react';
import { AppDef } from '../core/state';

const PlaceholderComponent: React.FC<{appName: string}> = ({appName}) => (
    React.createElement('div', { style: { padding: 20, height: '100%', boxSizing: 'border-box', background: '#fff', color: '#333' } },
        React.createElement('h1', null, appName),
        React.createElement('p', null, 'This application is a placeholder. Functionality will be implemented in a future update.')
    )
);

const MarketplaceComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    return React.createElement(PlaceholderComponent, { appName: "Marketplace" });
};

// Added missing category
export const marketplaceApp: AppDef = {
    id: 'marketplace',
    name: 'Marketplace',
    component: MarketplaceComponent,
    icon: '🛍️',
    category: 'Utility',
    defaultSize: { width: 500, height: 400 },
    description: 'A placeholder for a future application marketplace.'
};
