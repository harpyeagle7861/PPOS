
import React from 'react';
import { AppDef, GENESIS_CODEX_BLUEPRINT } from '../core/state.ts';

// A simple component to safely render HTML content.
const DangerousHTML: React.FC<{ html: string }> = ({ html }) => {
    return React.createElement('div', { dangerouslySetInnerHTML: { __html: html } });
};

const SystemBlueprintComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const styles = {
        container: {
            padding: '40px',
            height: '100%',
            boxSizing: 'border-box' as const,
            background: 'linear-gradient(135deg, #050505 0%, #000 100%)',
            color: '#00ffcc',
            fontFamily: "'JetBrains Mono', monospace",
            overflowY: 'auto' as const,
            lineHeight: '1.6',
        },
        header: {
            borderBottom: '1px solid rgba(0, 255, 204, 0.3)',
            paddingBottom: '20px',
            marginBottom: '30px',
            textAlign: 'center' as const
        },
        title: {
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '4px',
            margin: '0 0 10px 0',
            textShadow: '0 0 15px rgba(0, 255, 204, 0.3)'
        },
        subTitle: {
            fontSize: '10px',
            opacity: 0.6,
            letterSpacing: '2px'
        },
        content: {
            fontSize: '12px',
            background: 'rgba(0, 255, 204, 0.02)',
            padding: '30px',
            border: '1px solid rgba(0, 255, 204, 0.1)',
            borderRadius: '8px',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)',
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-word' as const
        },
        footer: {
            marginTop: '40px',
            textAlign: 'center' as const,
            fontSize: '10px',
            opacity: 0.3,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px'
        }
    };

    return React.createElement('div', { style: styles.container },
        React.createElement('div', { style: styles.header },
            React.createElement('h1', { style: styles.title }, 'SYSTEM BLUEPRINT'),
            React.createElement('div', { style: styles.subTitle }, 'CORE_DIRECTIVES // ARCHITECTURAL_DNA')
        ),
        React.createElement('div', { style: styles.content },
            React.createElement(DangerousHTML, { html: GENESIS_CODEX_BLUEPRINT })
        ),
        React.createElement('div', { style: styles.footer }, 
            'IMMUTABLE RECORD // BLOCK 0 // GENESIS'
        )
    );
};

export const systemBlueprintApp: AppDef = {
    id: 'system-blueprint',
    name: 'System Blueprint',
    component: SystemBlueprintComponent,
    icon: '🧬',
    category: 'System',
    defaultSize: { width: 800, height: 700 },
    description: "The Immutable Law. Displays the Genesis Codex and Core OS Directives."
};
