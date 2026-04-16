
import React from 'react';
import { AppDef, store } from '../core/state';

const DynamicAppComponent: React.FC<{ instanceId: string; isFocused: boolean; appName: string; description: string; content: string; icon: string; minimal?: boolean; styling?: any }> = ({ appName, description, content, icon, minimal, styling }) => {
    const isHtml = content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html');

    if (isHtml) {
        return React.createElement('iframe', {
            srcDoc: content,
            sandbox: "allow-scripts allow-modals allow-popups allow-forms allow-same-origin",
            style: { width: '100%', height: '100%', border: 'none', background: '#000' }
        });
    }

    const baseStyle: React.CSSProperties = {
        padding: '20px',
        height: '100%',
        boxSizing: 'border-box',
        background: styling?.backgroundColor || '#fff',
        color: styling?.textColor || '#333',
        overflowY: 'auto',
        fontFamily: 'sans-serif',
        fontSize: styling?.fontSize || 'inherit'
    };

    if (minimal) {
        return React.createElement('div', { style: { ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' } },
            React.createElement('div', { style: { lineHeight: '1.6', fontSize: '20px', whiteSpace: 'pre-wrap' } }, content)
        );
    }

    return React.createElement('div', { style: baseStyle },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '15px' } },
            React.createElement('span', { style: { fontSize: '48px' } }, icon),
            React.createElement('div', null,
                React.createElement('h1', { style: { margin: 0, fontSize: '24px' } }, appName),
                React.createElement('p', { style: { margin: '5px 0 0 0', opacity: 0.6, fontSize: '14px' } }, description)
            )
        ),
        React.createElement('div', { style: { lineHeight: '1.6', whiteSpace: 'pre-wrap' } }, content),
        React.createElement('div', { style: { marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '12px', fontStyle: 'italic', opacity: 0.7 } },
            "Note: This module was dynamically synthesized by Aiza at the Architect's request. Future updates will expand its functional logic."
        )
    );
};

export const createDynamicAppDef = (id: string, name: string, icon: string, description: string, content: string, minimal: boolean = false): AppDef => {
    return {
        id,
        name,
        icon,
        description,
        category: 'Utility',
        isDynamic: true,
        dynamicContent: content,
        minimal,
        component: (props) => React.createElement(DynamicAppComponent, { ...props, appName: name, description, content, icon, minimal, styling: (props as any).styling || store.getState().apps[id]?.styling }),
        defaultSize: { width: 500, height: 400 }
    };
};
