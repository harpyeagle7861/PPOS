
import React, { useState, useEffect } from 'react';
import { AppDef, store } from '../core/state.ts';
import { renameApp, registerApp, addNotification, openApp } from '../core/windowManager.ts';
import { createDynamicAppDef } from './dynamicApp.ts';

const ModuleArchitectComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [apps, setApps] = useState<AppDef[]>(Object.values(store.getState().apps));
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<'info' | 'code' | 'synthesis'>('info');
    
    // Metadata Edit State
    const [metaName, setMetaName] = useState('');
    const [metaIcon, setMetaIcon] = useState('');
    const [metaDesc, setMetaDesc] = useState('');

    // Synthesis Form State
    const [synthName, setSynthName] = useState('');
    const [synthIcon, setSynthIcon] = useState('🧪');
    const [synthContent, setSynthContent] = useState('// Your application DNA...');
    const [synthBg, setSynthBg] = useState('#ffffff');
    const [synthFontSize, setSynthFontSize] = useState('16px');
    const [synthTextCol, setSynthTextCol] = useState('#333333');

    const selectedApp = apps.find(a => a.id === selectedId);

    useEffect(() => {
        const unsubscribe = store.subscribe(s => {
            setApps(Object.values(s.apps));
        });
        return () => { unsubscribe(); };
    }, []);

    useEffect(() => {
        if (selectedApp) {
            setMetaName(selectedApp.name);
            setMetaIcon(typeof selectedApp.icon === 'string' ? selectedApp.icon : '📦');
            setMetaDesc(selectedApp.description || '');
        }
    }, [selectedApp]);

    const handleSaveInfo = () => {
        if (selectedId) {
            renameApp(selectedId, metaName, metaIcon);
            addNotification(`Metadata Refactored: ${metaName}`);
        }
    };

    const handleSynthesize = () => {
        if (!synthName.trim()) {
            addNotification("Synthesis aborted: Name required.");
            return;
        }
        const newId = `synth_${Date.now()}`;
        const newApp = createDynamicAppDef(newId, synthName, synthIcon, "Dynamically synthesized neural organ.", synthContent, false);
        newApp.styling = {
            backgroundColor: synthBg,
            fontSize: synthFontSize,
            textColor: synthTextCol
        };
        registerApp(newApp);
        openApp(newId);
        addNotification(`Organ Synthesis Successful: ${synthName}`);
        setEditMode('info');
        setSelectedId(newId);
    };

    const styles: any = {
        container: { display: 'flex', height: '100%', background: '#0a0a0a', color: '#00ff99', fontFamily: 'monospace' },
        sidebar: { width: '220px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
        appItem: (active: boolean) => ({
            padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #111',
            background: active ? 'rgba(0,255,153,0.1)' : 'transparent',
            color: active ? '#00ff99' : '#006644', fontSize: '12px', transition: 'all 0.2s'
        }),
        main: { flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' },
        card: { background: '#111', border: '1px solid #333', padding: '20px', borderRadius: '4px' },
        input: { background: '#000', border: '1px solid #333', color: '#00ff99', padding: '10px', width: '100%', marginBottom: '15px', outline: 'none' },
        btn: { background: '#00ff99', color: '#000', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' },
        synthLabel: { fontSize: '10px', display: 'block', marginBottom: '8px', opacity: 0.6 }
    };

    return React.createElement('div', { style: styles.container },
        React.createElement('div', { style: styles.sidebar },
            React.createElement('button', { 
                onClick: () => { setSelectedId(null); setEditMode('synthesis'); },
                style: { width: '100%', padding: '15px', background: '#00ff99', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }
            } as any, '🧪 SYNTHESIZE NEW'),
            React.createElement('div', { style: { padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #333', fontSize: '11px', letterSpacing: '2px', opacity: 0.5, marginTop: '10px' } }, 'MANIFESTED ORGANS'),
            apps.map(app => React.createElement('div', { 
                key: app.id, 
                style: styles.appItem(app.id === selectedId),
                onClick: () => { setSelectedId(app.id); setEditMode('info'); }
            } as any, 
                // Handle complex icons (react nodes) gracefully by not rendering them directly in text context if possible, 
                // or just rely on toString for objects which might be [object Object] but usually they are strings/emoji.
                `${typeof app.icon === 'string' ? app.icon : '📦'} ${app.name}`
            ))
        ),
        React.createElement('div', { style: styles.main },
            editMode === 'synthesis' ? React.createElement('div', { style: styles.card },
                React.createElement('h2', { style: { marginTop: 0, color: '#ff00ff' } }, '🧪 NEURAL SYNTHESIS ENGINE'),
                React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' } },
                    React.createElement('div', null,
                        React.createElement('label', { style: styles.synthLabel }, 'ORGAN IDENTITY (NAME):'),
                        React.createElement('input', { value: synthName, onChange: e => setSynthName(e.target.value), style: styles.input, placeholder: 'e.g., Weather Relay' } as any),
                        React.createElement('label', { style: styles.synthLabel }, 'ORGAN SYMBOL (ICON):'),
                        React.createElement('input', { value: synthIcon, onChange: e => setSynthIcon(e.target.value), style: styles.input, placeholder: 'e.g., 🧪' } as any)
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { style: styles.synthLabel }, 'BACKGROUND FREQUENCY (COLOR):'),
                        React.createElement('input', { type: 'color', value: synthBg, onChange: e => setSynthBg(e.target.value), style: { ...styles.input, padding: '2px', height: '40px' } } as any),
                        React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                            React.createElement('div', { style: { flex: 1 } },
                                React.createElement('label', { style: styles.synthLabel }, 'FONT SCALE:'),
                                React.createElement('select', { value: synthFontSize, onChange: e => setSynthFontSize(e.target.value), style: styles.input } as any,
                                    ['12px', '14px', '16px', '18px', '24px'].map(s => React.createElement('option', { key: s, value: s } as any, s))
                                )
                            ),
                            React.createElement('div', { style: { flex: 1 } },
                                React.createElement('label', { style: styles.synthLabel }, 'TEXT COLOR:'),
                                React.createElement('input', { type: 'color', value: synthTextCol, onChange: e => setSynthTextCol(e.target.value), style: { ...styles.input, padding: '2px', height: '40px' } } as any)
                            )
                        )
                    )
                ),
                React.createElement('label', { style: styles.synthLabel }, 'LOGIC DNA (INITIAL CONTENT):'),
                React.createElement('textarea', { value: synthContent, onChange: e => setSynthContent(e.target.value), style: { ...styles.input, height: '120px', resize: 'none' } } as any),
                React.createElement('button', { onClick: handleSynthesize, style: { ...styles.btn, background: '#ff00ff', width: '100%' } } as any, 'INITIATE SYNTHESIS')
            ) : selectedApp ? React.createElement(React.Fragment, null,
                React.createElement('div', { style: styles.header },
                    React.createElement('div', null,
                        React.createElement('h2', { style: { margin: 0 } }, selectedApp.name),
                        React.createElement('div', { style: { fontSize: '10px', opacity: 0.5 } }, `DNA-ID: ${selectedApp.id} // v1.2.0`)
                    ),
                    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                        React.createElement('button', { onClick: () => setEditMode('info'), style: { ...styles.btn, background: editMode === 'info' ? '#00ff99' : '#222', color: editMode === 'info' ? '#000' : '#00ff99' } } as any, 'METADATA'),
                        React.createElement('button', { onClick: () => setEditMode('code'), style: { ...styles.btn, background: editMode === 'code' ? '#00ff99' : '#222', color: editMode === 'code' ? '#000' : '#00ff99' } } as any, 'LOGIC DNA')
                    )
                ),
                editMode === 'info' ? React.createElement('div', { style: styles.card },
                    React.createElement('label', { style: styles.synthLabel }, 'ORGAN IDENTITY:'),
                    React.createElement('input', { value: metaName, onChange: e => setMetaName(e.target.value), style: styles.input } as any),
                    React.createElement('label', { style: styles.synthLabel }, 'ORGAN ICON (SYMBOL):'),
                    React.createElement('input', { value: metaIcon, onChange: e => setMetaIcon(e.target.value), style: styles.input } as any),
                    React.createElement('label', { style: styles.synthLabel }, 'CONSTRUCTION DESCRIPTION:'),
                    React.createElement('textarea', { value: metaDesc, onChange: e => setMetaDesc(e.target.value), style: { ...styles.input, height: '100px', resize: 'none' } } as any),
                    React.createElement('button', { onClick: handleSaveInfo, style: styles.btn } as any, 'SYNTHESIZE CHANGES')
                ) : React.createElement('div', { style: { ...styles.card, flex: 1, display: 'flex', flexDirection: 'column' } },
                    React.createElement('div', { style: { fontSize: '10px', opacity: 0.5, marginBottom: '10px' } }, 'QUINTESSENTIAL COMPONENT LOGIC:'),
                    React.createElement('textarea', { 
                        readOnly: true, 
                        value: selectedApp.dynamicContent || "// [PROTECTED CORE MODULE]\n// Source DNA is encrypted or static.\n// Only synthetic dynamic modules allow direct DNA mutation.",
                        style: { ...styles.input, flex: 1, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' } 
                    } as any),
                    selectedApp.isDynamic && React.createElement('div', { style: { marginTop: '15px', color: '#00bfff', fontSize: '11px' } }, "⚡ This module is in a Flux-State. Aiza can evolve its logic.")
                )
            ) : React.createElement('div', { style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 } },
                'SELECT AN ORGAN OR INITIATE SYNTHESIS'
            )
        )
    );
};

export const moduleArchitectApp: AppDef = {
    id: 'module-architect',
    name: 'Module Architect',
    component: ModuleArchitectComponent,
    icon: '🏗️',
    category: 'System',
    defaultSize: { width: 850, height: 600 },
    description: 'Neural IDE. Refactor metadata, inspect DNA logic, and synthesize custom organs with custom themes.'
};
