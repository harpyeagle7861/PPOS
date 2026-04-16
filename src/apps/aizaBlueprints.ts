
import React from 'react';
import { AppDef, GENESIS_CODEX_BLUEPRINT } from '../core/state';

// A simple component to safely render HTML content.
const DangerousHTML: React.FC<{ html: string }> = ({ html }) => {
    return React.createElement('div', { dangerouslySetInnerHTML: { __html: html } });
};


const AizaBlueprintsComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const blueprintStyle: React.CSSProperties = {
        padding: 20,
        height: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(to bottom, #000033, #000080)',
        color: '#a7c7e7',
        fontFamily: 'monospace',
        overflowY: 'auto',
    };

    const titleStyle: React.CSSProperties = {
        color: '#ffffff',
        borderBottom: '1px solid #557799',
        paddingBottom: '10px'
    };

    const introTextStyle: React.CSSProperties = {
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#c0d0e0',
        marginBottom: '20px'
    };

    const codeBlockStyle: React.CSSProperties = {
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid #557799',
        borderRadius: '4px',
        padding: '15px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontSize: '12px',
        color: '#e0e0e0',
    };

    const introText = `This blueprint is the single source of truth for the AI's behavior. It includes:
- Core Directives: Unchangeable rules about generating valid HTML, using interaction hooks (data-interaction-id), and managing UI state.
- Cognitive Architecture: A detailed narrative of the AI's internal "brains," moral frameworks (the "Eden Gate"), and problem-solving pipelines.
- Application Manifests: Precise HTML and CSS class structures for each application within the OS, including the main Aiza chat interface, JMN Connect, LogosKeys, and the Cognitive Twin settings panel.
- Ontological Purpose: The ultimate goal and philosophy of the AI, guiding its long-term development.

As you requested, here is the full, unedited text of the application's core blueprint:`;

    return React.createElement('div', { style: blueprintStyle },
        React.createElement('h1', { style: titleStyle }, 'Aiza OS Genesis Codex'),
        React.createElement('p', { style: introTextStyle }, introText),
        React.createElement('div', { style: codeBlockStyle },
            // The Genesis Codex string contains HTML, so we render it carefully.
            React.createElement(DangerousHTML, { html: GENESIS_CODEX_BLUEPRINT })
        )
    );
};

// Added missing category
export const aizaBlueprintsApp: AppDef = {
    id: 'aiza-blueprints',
    name: 'Aiza Blueprints',
    component: AizaBlueprintsComponent,
    icon: '🏗️',
    category: 'System',
    defaultSize: { width: 600, height: 450 },
    description: "Displays the core 'Genesis Codex' which defines the OS architecture and Aiza's fundamental rules and purpose."
};
