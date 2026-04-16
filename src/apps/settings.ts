
import React, { useState } from 'react';
import { AppDef, store } from '../core/state';

const SettingsComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [settings, setSettings] = React.useState(store.getState().settings);
    const [search, setSearch] = useState('');

    React.useEffect(() => {
        const unsubscribe = store.subscribe(newState => setSettings(newState.settings));
        return () => { unsubscribe(); };
    }, []);

    const toggle = (key: keyof typeof settings) => {
        store.setState(s => ({ ...s, settings: { ...s.settings, [key]: !s.settings[key] } }));
    };

    const setTheme = (theme: 'dark' | 'light') => {
        store.setState(s => ({ ...s, settings: { ...s.settings, theme } }));
    };

    const options = [
        { label: 'Universal Smart Scroll', key: 'smartScroll' as const, category: 'Interface', desc: 'Enable smooth, automated scrolling for all digital organs.' },
        { label: 'Window Snapping Protocol', key: 'snapping' as const, category: 'Interface', desc: 'Allow windows to snap to edges with magnetic feedback.' },
        { label: 'Taskbar Grouping', key: 'taskbarGrouping' as const, category: 'Interface', desc: 'Cluster icons of the same application together.' },
        { label: 'Taskbar Labels', key: 'showTaskbarLabels' as const, category: 'Interface', desc: 'Display window titles in the dock.' },
        { label: 'Heartbeat Synchronization', key: 'heartbeatSync' as const, category: 'Metabolism', desc: 'Align system animations with Aiza\'s biological resonance.' },
        { label: 'Premium Status', key: 'isPremiumUser' as const, category: 'Account', desc: 'Verify Architect sovereign access tier.' },
    ];

    const filtered = options.filter(o => 
        o.label.toLowerCase().includes(search.toLowerCase()) || 
        o.category.toLowerCase().includes(search.toLowerCase())
    );

    const isDark = settings.theme === 'dark';

    return React.createElement('div', { 
        style: { 
            padding: 45, height: '100%', 
            background: isDark ? '#050505' : '#ffffff', 
            color: isDark ? '#eee' : '#111', 
            fontFamily: "'Inter', sans-serif", 
            display: 'flex', flexDirection: 'column',
            transition: 'background 0.4s, color 0.4s'
        } 
    },
        React.createElement('div', { style: { marginBottom: '45px' } },
            React.createElement('div', { style: { fontSize: '11px', color: '#00ffcc', letterSpacing: '5px', marginBottom: '18px', fontWeight: 900, textTransform: 'uppercase' } }, 'System Configuration'),
            React.createElement('input', {
                value: search, onChange: e => setSearch(e.target.value),
                placeholder: "FILTER CORE DIRECTIVES...",
                style: { width: '100%', background: isDark ? '#000' : '#f5f5f5', border: `1px solid ${isDark ? '#222' : '#ddd'}`, color: isDark ? '#00ffcc' : '#007755', padding: '18px 28px', borderRadius: '16px', fontSize: '16px', outline: 'none' }
            })
        ),

        React.createElement('div', { style: { marginBottom: '45px', padding: '28px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '20px', border: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` } },
            React.createElement('div', { style: { fontSize: '14px', fontWeight: 900, marginBottom: '22px', letterSpacing: '1.5px' } }, 'OS_THEME_RESONANCE'),
            React.createElement('div', { style: { display: 'flex', gap: '14px' } },
                React.createElement('button', { 
                    onClick: () => setTheme('dark'),
                    style: { flex: 1, padding: '16px', background: isDark ? '#00ffcc' : 'transparent', color: isDark ? '#000' : '#888', border: `1px solid ${isDark ? '#00ffcc' : '#ccc'}`, borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '12px' }
                }, 'VOID_DARK'),
                React.createElement('button', { 
                    onClick: () => setTheme('light'),
                    style: { flex: 1, padding: '16px', background: !isDark ? '#00ffcc' : 'transparent', color: !isDark ? '#000' : '#888', border: `1px solid ${!isDark ? '#00ffcc' : '#333'}`, borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '12px' }
                }, 'PURE_LIGHT')
            )
        ),
        
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', paddingRight: '12px' } },
            filtered.length === 0 ? React.createElement('div', { style: { opacity: 0.2, textAlign: 'center', marginTop: '100px', letterSpacing: '4px', fontWeight: 900 } }, 'NO DIRECTIVE MATCH') :
            filtered.map(opt => React.createElement('label', { 
                key: opt.key,
                style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${isDark ? '#111' : '#f2f2f2'}`, borderRadius: '18px', marginBottom: '20px', cursor: 'pointer', transition: '0.25s' } 
            },
                React.createElement('div', { style: { flex: 1 } },
                    React.createElement('div', { style: { fontSize: '18px', fontWeight: 800 } }, opt.label),
                    React.createElement('div', { style: { fontSize: '12px', opacity: 0.5, marginTop: '10px', lineHeight: '1.5' } }, `${opt.category.toUpperCase()} // ${opt.desc}`)
                ),
                React.createElement('input', {
                    type: 'checkbox',
                    checked: !!(settings as any)[opt.key],
                    onChange: () => toggle(opt.key),
                    style: { width: '28px', height: '28px', accentColor: '#00ffcc', cursor: 'pointer', marginLeft: '35px' }
                })
            ))
        )
    );
};

export const settingsApp: AppDef = {
    id: 'settings', name: 'Settings', component: SettingsComponent, icon: '⚙️', category: 'System', defaultSize: { width: 650, height: 850 },
    description: 'System Config Hub. Calibrate OS resonance, switch themes, and toggle universal smart scroll protocols.'
};
