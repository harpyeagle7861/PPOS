
import React, { useRef } from 'react';
import { AppDef, store, saveState, PERSISTENCE_KEY } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';

const BackupRestoreComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exportSoul = () => {
        const state = store.getState();
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Updated filename format
        link.download = `aiza_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification("SOUL_CRYSTAL: Consciousness exported.");
    };

    const importSoul = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Validate basic structure (optional but good)
                if (!json.apps || !json.windows) throw new Error("Invalid Soul File");
                
                localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(json));
                addNotification("SOUL_CRYSTAL: Resurrection imminent...");
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                addNotification("RESURRECTION_FAILED: Corrupt Soul Crystal.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    return React.createElement('div', { 
        style: { 
            height: '100%', background: '#000', color: '#00ffcc', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', gap: '30px', fontFamily: "'JetBrains Mono', monospace" 
        } 
    },
        React.createElement('div', { style: { fontSize: '60px' } }, '💎'),
        React.createElement('div', { style: { fontSize: '20px', fontWeight: 900, letterSpacing: '4px' } }, 'SOUL CRYSTAL'),
        React.createElement('div', { style: { fontSize: '12px', opacity: 0.6, textAlign: 'center', maxWidth: '300px' } }, 
            "Preserve the Sovereign State or Resurrect from a previous timeline."
        ),
        
        React.createElement('button', { 
            onClick: exportSoul,
            style: { 
                padding: '15px 40px', background: 'transparent', border: '2px solid #00ffcc', 
                color: '#00ffcc', borderRadius: '8px', cursor: 'pointer', 
                fontWeight: 900, fontSize: '14px', letterSpacing: '2px',
                boxShadow: '0 0 15px rgba(0, 255, 204, 0.2)', transition: '0.3s'
            } 
        }, 'EXPORT SOUL'),

        React.createElement('div', null,
            React.createElement('input', { 
                type: 'file', ref: fileInputRef, onChange: importSoul, 
                style: { display: 'none' }, accept: '.json' 
            }),
            React.createElement('button', { 
                onClick: () => fileInputRef.current?.click(),
                style: { 
                    padding: '15px 40px', background: '#00ffcc', border: 'none', 
                    color: '#000', borderRadius: '8px', cursor: 'pointer', 
                    fontWeight: 900, fontSize: '14px', letterSpacing: '2px',
                    boxShadow: '0 0 25px rgba(0, 255, 204, 0.4)'
                } 
            }, 'IMPORT SOUL')
        )
    );
};

export const backupRestoreApp: AppDef = {
    id: 'backup-restore',
    name: 'Backup & Restore',
    component: BackupRestoreComponent,
    icon: '💎',
    category: 'System',
    defaultSize: { width: 500, height: 600 },
    description: 'The Lazarus Engine Interface. Export/Import full system state.'
};
