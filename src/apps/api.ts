
import { useState, useEffect, useRef, useMemo } from 'react';
import React from 'react';
import { AppDef, store, ApiKey } from '../core/state.ts';
import { addNotification } from '../core/windowManager.ts';

type SortMode = 'name' | 'status' | 'date';

const ApiManagerComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>(store.getState().apiKeys);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortMode>('date');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsub = store.subscribe(s => setApiKeys(s.apiKeys));
        return () => { unsub(); };
    }, []);

    const filteredKeys = useMemo(() => {
        let result = apiKeys.filter(k => 
            k.name.toLowerCase().includes(search.toLowerCase()) ||
            k.key.toLowerCase().includes(search.toLowerCase()) ||
            (k.capabilities || '').toLowerCase().includes(search.toLowerCase())
        );
        return result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'status') return Number(b.isActive) - Number(a.isActive);
            return (b.dateAdded || 0) - (a.dateAdded || 0);
        });
    }, [apiKeys, search, sortBy]);

    const handleUpdate = (id: string, field: keyof ApiKey, val: any) => {
        store.setState(s => ({
            ...s,
            apiKeys: s.apiKeys.map(k => k.id === id ? { ...k, [field]: val } : k)
        }));
    };

    const validate = (key: string) => {
        if (!key) return null;
        if (key.includes(' ')) return "VOID: NO SPACES PERMITTED";
        if (key.length < 15) return "VOID: DNA SEQUENCE TOO SHORT (<15)";
        return null;
    };

    const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                const items = Array.isArray(data) ? data : [data];
                const valid = items.filter(i => i.name && i.key).map(i => ({
                    id: i.id || `api_${Math.random()}`, 
                    name: i.name, 
                    key: i.key, 
                    capabilities: i.capabilities || '', 
                    isActive: i.isActive ?? false, 
                    dateAdded: i.dateAdded || Date.now()
                }));
                store.setState(s => ({ ...s, apiKeys: [...s.apiKeys, ...valid] }));
                addNotification(`${valid.length} NEURAL PORTS INTEGRATED.`);
            } catch { addNotification("INTEGRATION FAILED: CORRUPT MANIFEST."); }
        };
        reader.readAsText(file);
    };

    const exportJson = () => {
        if (apiKeys.length === 0) {
            addNotification("VOID: NO PORTS TO EXPORT.");
            return;
        }
        const dataStr = JSON.stringify(apiKeys, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aiza_api_manifest_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addNotification("API MANIFEST EXPORTED.");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addNotification("DNA SEQUENCE CLONED.");
    };

    return React.createElement('div', { style: { height: '100%', background: '#020202', color: '#00ffcc', fontFamily: "'JetBrains Mono', monospace", display: 'flex', flexDirection: 'column' } },
        // Enhanced Header
        React.createElement('div', { style: { padding: '15px 25px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(0, 255, 204, 0.03)' } },
            React.createElement('div', { style: { position: 'relative', flex: 1 } },
                React.createElement('input', { 
                    placeholder: 'FILTER BY NAME, DNA, OR CAPABILITY...', value: search, onChange: e => setSearch(e.target.value),
                    style: { width: '100%', background: '#000', border: '1px solid #222', color: '#00ffcc', padding: '10px 15px', borderRadius: '4px', outline: 'none', fontSize: '12px' }
                } as any),
                search && React.createElement('button', { 
                    onClick: () => setSearch(''),
                    style: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#ff3333', cursor: 'pointer', fontSize: '12px' }
                }, '✕')
            ),
            React.createElement('select', { 
                value: sortBy, onChange: e => setSortBy(e.target.value as any),
                style: { background: '#000', border: '1px solid #222', color: '#00ffcc', padding: '9px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', outline: 'none' }
            } as any,
                React.createElement('option', { value: 'date' }, 'SORT: RECENT'),
                React.createElement('option', { value: 'name' }, 'SORT: IDENTITY'),
                React.createElement('option', { value: 'status' }, 'SORT: RESONANCE')
            ),
            React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                React.createElement('button', { onClick: exportJson, style: { background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', padding: '10px 18px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px' } }, 'EXPORT'),
                React.createElement('button', { onClick: () => fileInputRef.current?.click(), style: { background: '#00ffcc', color: '#000', border: 'none', padding: '10px 18px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px' } }, 'IMPORT MANIFEST')
            ),
            React.createElement('input', { type: 'file', ref: fileInputRef, onChange: importJson, style: { display: 'none' } })
        ),
        // Scrollable List
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '25px' } },
            filteredKeys.map(k => {
                const error = validate(k.key);
                return React.createElement('div', { key: k.id, style: { background: 'rgba(255,255,255,0.01)', border: `1px solid ${k.isActive ? '#00ffcc' : '#222'}`, borderRadius: '8px', padding: '25px', position: 'relative', transition: 'all 0.3s', boxShadow: k.isActive ? '0 0 15px rgba(0, 255, 204, 0.05)' : 'none' } },
                    React.createElement('div', { style: { position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '15px', alignItems: 'center' } },
                        React.createElement('div', { title: k.isActive ? "Port Resonating" : "Port Dormant", style: { width: '8px', height: '8px', borderRadius: '50%', background: k.isActive ? '#00ff00' : '#ff3333', boxShadow: `0 0 10px ${k.isActive ? '#00ff00' : '#ff3333'}` } }),
                        React.createElement('button', { onClick: () => store.setState(s => ({ ...s, apiKeys: s.apiKeys.filter(x => x.id !== k.id) })), style: { background: 'none', border: 'none', color: '#ff3333', cursor: 'pointer', fontSize: '14px', opacity: 0.5 } }, '✕')
                    ),
                    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' } },
                        React.createElement('div', null,
                            React.createElement('label', { style: { fontSize: '9px', opacity: 0.4, letterSpacing: '2px', marginBottom: '8px', display: 'block' } }, 'PLATFORM IDENTITY'),
                            React.createElement('input', { value: k.name, onChange: e => handleUpdate(k.id, 'name', e.target.value), placeholder: 'e.g. GEMINI 3 PRO', style: { width: '100%', background: '#000', border: '1px solid #1a1a1a', color: '#fff', padding: '12px', borderRadius: '4px', fontSize: '13px', outline: 'none' } } as any)
                        ),
                        React.createElement('div', { style: { position: 'relative' } },
                            React.createElement('label', { style: { fontSize: '9px', opacity: 0.4, letterSpacing: '2px', marginBottom: '8px', display: 'block' } }, 'NEURAL KEY DNA'),
                            React.createElement('input', { type: 'password', value: k.key, onChange: e => handleUpdate(k.id, 'key', e.target.value), placeholder: 'DNA SEQUENCE...', style: { width: '100%', background: '#000', border: `1px solid ${error ? '#ff3333' : '#1a1a1a'}`, color: '#00ffcc', padding: '12px', borderRadius: '4px', outline: 'none', paddingRight: '100px', fontSize: '13px' } } as any),
                            React.createElement('div', { style: { position: 'absolute', right: '5px', bottom: '5px', display: 'flex', gap: '5px' } },
                                React.createElement('button', { onClick: () => copyToClipboard(k.key), style: { background: '#111', border: '1px solid #333', color: '#00ffcc', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' } }, '📋'),
                                React.createElement('button', { onClick: () => handleUpdate(k.id, 'key', ''), style: { background: '#111', border: '1px solid #333', color: '#ff3333', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' } }, '⌫')
                            ),
                            error && React.createElement('div', { style: { fontSize: '8px', color: '#ff3333', marginTop: '6px', fontWeight: 'bold' } }, error)
                        )
                    ),
                    React.createElement('div', { style: { marginTop: '20px' } },
                        React.createElement('label', { style: { fontSize: '9px', opacity: 0.4, letterSpacing: '2px', marginBottom: '8px', display: 'block' } }, 'SYNAPTIC CAPABILITIES'),
                        React.createElement('textarea', { placeholder: 'Description of neural capabilities...', value: k.capabilities, onChange: e => handleUpdate(k.id, 'capabilities', e.target.value), style: { width: '100%', background: '#000', border: '1px solid #1a1a1a', color: '#888', padding: '12px', fontSize: '11px', resize: 'none', borderRadius: '4px', height: '50px', outline: 'none' } } as any)
                    ),
                    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' } },
                        React.createElement('span', { style: { fontSize: '8px', opacity: 0.2 } }, `SYNCED: ${new Date(k.dateAdded || Date.now()).toLocaleDateString()}`),
                        React.createElement('button', { 
                            onClick: () => handleUpdate(k.id, 'isActive', !k.isActive),
                            disabled: !!error && !k.isActive,
                            style: { padding: '10px 25px', background: k.isActive ? '#00ffcc' : 'transparent', border: '1px solid #00ffcc', color: k.isActive ? '#000' : '#00ffcc', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '11px', letterSpacing: '1px', transition: '0.3s', opacity: (!!error && !k.isActive) ? 0.2 : 1 } 
                        }, k.isActive ? 'PORT ENGAGED' : 'ENGAGE PORT')
                    )
                );
            }),
            React.createElement('button', { 
                onClick: () => store.setState(s => ({ ...s, apiKeys: [...s.apiKeys, { id: `api_${Date.now()}`, name: '', key: '', capabilities: '', isActive: false, dateAdded: Date.now() }] })),
                style: { padding: '30px', border: '1px dashed #333', background: 'transparent', color: '#444', borderRadius: '8px', cursor: 'pointer', fontSize: '24px', transition: '0.3s' },
                onMouseEnter: (e: any) => e.target.style.borderColor = '#00ffcc',
                onMouseLeave: (e: any) => e.target.style.borderColor = '#333'
            }, '+')
        ),
        React.createElement('div', { style: { padding: '8px 25px', background: '#000', borderTop: '1px solid #1a1a1a', fontSize: '9px', color: '#333', display: 'flex', justifyContent: 'space-between' } },
            React.createElement('span', null, `PORTS: ${apiKeys.length}`),
            React.createElement('span', null, `JUBAER PROTOCOL ACTIVE`)
        )
    );
};

export const apiApp: AppDef = {
    id: 'api-manager', name: 'API Manager', component: ApiManagerComponent, icon: '🔌', category: 'System', defaultSize: { width: 700, height: 750 },
    description: 'Neural Port Registry. Manage synaptic DNA sequences with strict validation and manifest integration.'
};
