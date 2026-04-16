
import React, { useState, useEffect } from 'react';
import { AppDef, store } from '../core/state.ts';
import { openApp, addNotification } from '../core/windowManager.ts';
import { Pomegranate } from '../services/pomegranate.ts';

const AizaLauncherComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [time, setTime] = useState(new Date());
    const [qState, setQState] = useState(store.getState().quinaryState);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        const u = store.subscribe(s => setQState(s.quinaryState));
        return () => { clearInterval(t); u(); };
    }, []);

    const apps = [
        { id: 'pomegranate', icon: '❤️', label: 'Heart' },
        { id: 'honeycone', icon: '🧠', label: 'Brain' },
        { id: 'spider-vault', icon: '🕸️', label: 'Vault' },
        { id: 'soul-chat', icon: '💬', label: 'Mesh' },
        { id: 'todo', icon: '✅', label: 'Tasks' },
        { id: 'camera', icon: '📷', label: 'Cam' } // Now links to 'camera' app
    ];

    return React.createElement('div', { 
        style: { 
            height: '100%', background: '#000', color: '#fff', 
            display: 'flex', flexDirection: 'column', 
            fontFamily: "'Inter', sans-serif",
            border: '8px solid #111', borderRadius: '30px', overflow: 'hidden',
            boxShadow: '0 0 0 2px #333, inset 0 0 20px rgba(0,0,0,0.8)'
        } 
    },
        // Notch / Status Bar
        React.createElement('div', { style: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 'bold' } },
            React.createElement('div', null, time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
            React.createElement('div', { style: { display: 'flex', gap: '5px' } },
                React.createElement('span', null, '5G'),
                React.createElement('span', null, '🔋 100%')
            )
        ),

        // Main Screen
        React.createElement('div', { style: { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(180deg, #050505 0%, #1a0505 100%)' } },
            
            // Widget: Heartbeat
            React.createElement('div', { 
                onClick: () => openApp('pomegranate'),
                style: { 
                    width: '100%', padding: '20px', borderRadius: '20px', 
                    background: 'rgba(255, 0, 85, 0.1)', border: '1px solid rgba(255, 0, 85, 0.3)',
                    marginBottom: '30px', cursor: 'pointer', textAlign: 'center'
                } 
            },
                React.createElement('div', { style: { fontSize: '40px', animation: 'pulse 1s infinite' } }, '❤️'),
                React.createElement('div', { style: { fontSize: '12px', fontWeight: 'bold', marginTop: '10px', color: '#ff0055' } }, 'POMEGRANATE LINK'),
                React.createElement('div', { style: { fontSize: '10px', opacity: 0.7 } }, `STATE: ${qState}`)
            ),

            // App Grid
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', width: '100%' } },
                apps.map(app => React.createElement('div', {
                    key: app.id,
                    onClick: () => openApp(app.id),
                    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }
                },
                    React.createElement('div', { style: { width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' } }, app.icon),
                    React.createElement('div', { style: { fontSize: '10px', fontWeight: '500' } }, app.label)
                ))
            )
        ),

        // Dock
        React.createElement('div', { style: { padding: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-around', backdropFilter: 'blur(10px)' } },
            React.createElement('div', { style: { fontSize: '24px', cursor: 'pointer' } }, '📞'),
            React.createElement('div', { style: { fontSize: '24px', cursor: 'pointer' } }, '🌐'),
            React.createElement('div', { style: { fontSize: '24px', cursor: 'pointer' } }, '💬'),
            React.createElement('div', { style: { fontSize: '24px', cursor: 'pointer' } }, '🎵')
        ),

        React.createElement('style', null, `
            @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        `)
    );
};

export const aizaLauncherApp: AppDef = {
    id: 'aiza-launcher',
    name: 'Jubaer-Link Mobile',
    component: AizaLauncherComponent,
    icon: '📱',
    category: 'System',
    defaultSize: { width: 340, height: 680 }, // Mobile Aspect Ratio
    description: 'Handheld interface for the Pomegranate Engine. "Phone Party" mode active.'
};
