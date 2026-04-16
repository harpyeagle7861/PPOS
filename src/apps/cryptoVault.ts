
import React, { useState, useEffect, useMemo } from 'react';
import { AppDef, store } from '../core/state.ts';
import { dispatchAppAction, addNotification, updateAppState } from '../core/windowManager.ts';

interface Asset {
    id: string;
    name: string;
    symbol: string;
    balance: number;
    valueUsd: number;
    color: string;
    icon: string;
    isCore?: boolean; // AURA, KARMA, XP
}

const CryptoVaultComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ instanceId }) => {
    const [sortMode, setSortMode] = useState<'none' | 'balance' | 'value'>('none');
    
    // --- Initial State Logic (LocalStorage -> GlobalState -> Default) ---
    const [assets, setAssets] = useState<Asset[]>(() => {
        const saved = localStorage.getItem('AIZA_CRYPTO_VAULT_DNA');
        if (saved) return JSON.parse(saved);
        
        const gState = store.getState();
        return [
            { id: 'aura', name: 'AURA', symbol: '❇️', balance: gState.aura || 3, valueUsd: 139.00, color: '#00ffcc', icon: '❇️', isCore: true },
            { id: 'karma', name: 'KARMA', symbol: '✳️', balance: gState.karma || 6, valueUsd: 1.00, color: '#ff00ff', icon: '✳️', isCore: true },
            { id: 'xp', name: 'EXPERIENCE', symbol: '⚜️', balance: gState.xp || 9, valueUsd: 0, color: '#ffaa00', icon: '⚜️', isCore: true },
            { id: 'btc', name: 'Bitcoin', symbol: 'BTC', balance: 0.147, valueUsd: 98500, color: '#F7931A', icon: '₿' },
            { id: 'eth', name: 'Ethereum', symbol: 'ETH', balance: 2.5, valueUsd: 3800, color: '#627EEA', icon: 'Ξ' }
        ];
    });

    // --- Persist to LocalStorage and Sync OS State ---
    useEffect(() => {
        localStorage.setItem('AIZA_CRYPTO_VAULT_DNA', JSON.stringify(assets));
        
        // Sync AURA/KARMA/XP back to GlobalState for Aiza's awareness
        const aura = assets.find(a => a.id === 'aura')?.balance || 0;
        const karma = assets.find(a => a.id === 'karma')?.balance || 0;
        const xp = assets.find(a => a.id === 'xp')?.balance || 0;
        
        store.setState(s => ({ ...s, aura, karma, xp }));
    }, [assets]);

    // --- Currency Formatter ---
    const formatCurrency = (val: number, isUsd: boolean = true) => {
        return (isUsd ? '$' : '') + val.toLocaleString(undefined, { 
            minimumFractionDigits: isUsd ? 2 : 0, 
            maximumFractionDigits: 8 
        });
    };

    // --- Sorting Logic ---
    const sortedAssets = useMemo(() => {
        const result = [...assets];
        if (sortMode === 'balance') return result.sort((a, b) => b.balance - a.balance);
        if (sortMode === 'value') return result.sort((a, b) => (b.balance * b.valueUsd) - (a.balance * a.valueUsd));
        return result; // Sort by isCore first then index
    }, [assets, sortMode]);

    const totalValue = assets.reduce((acc, asset) => acc + (asset.balance * asset.valueUsd), 0);

    const handleUpdateAsset = (id: string, field: keyof Asset, rawValue: string) => {
        const value = parseFloat(rawValue);
        
        // Validation: Positive Numbers Only
        if (isNaN(value) || value < 0) {
            if (rawValue !== "") addNotification("VAULT_ERROR: Negative resonance or NaN rejected.");
            return;
        }

        const nextAssets = assets.map(a => {
            if (a.id === id) {
                // AURA Hard Cap Logic
                if (id === 'aura' && value > 3693693693693) {
                    addNotification("VOID: AURA supply limit reached (3.69 Trillion).");
                    return a;
                }
                return { ...a, [field]: value };
            }
            return a;
        });

        setAssets(nextAssets);
        dispatchAppAction(instanceId, { type: 'UPDATE_ASSETS', payload: { assets: nextAssets } });
    };

    const handleAddAsset = () => {
        const name = prompt("INGESTION_PROTOCOL: Asset Name?");
        const symbol = prompt("INGESTION_PROTOCOL: Symbol (e.g. SOL)?");
        const price = prompt("INGESTION_PROTOCOL: Current USD Value?");
        
        if (name && symbol && price && !isNaN(parseFloat(price))) {
            const newAsset: Asset = {
                id: symbol.toLowerCase() + "_" + Date.now(),
                name,
                symbol: symbol.toUpperCase(),
                balance: 0,
                valueUsd: parseFloat(price),
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                icon: '🪙'
            };
            setAssets([...assets, newAsset]);
            addNotification(`VAULT: ${symbol} DNA sequence integrated.`);
        } else {
            addNotification("VAULT_ERROR: Incomplete DNA sequence. Integration aborted.");
        }
    };

    return React.createElement('div', { 
        style: { 
            height: '100%', background: '#020202', color: '#fff', 
            fontFamily: "'JetBrains Mono', monospace", display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
        } 
    },
        // Header
        React.createElement('div', { style: { padding: '30px', borderBottom: '1px solid #1a1a1a', background: 'linear-gradient(180deg, rgba(0,255,204,0.08) 0%, transparent 100%)' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } },
                React.createElement('div', { style: { fontSize: '10px', color: '#00ffcc', letterSpacing: '4px' } }, 'SPIDER_CHANNEL_LEDGER v2.0'),
                React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                    React.createElement('button', { onClick: () => setSortMode('balance'), style: styles.smallBtn(sortMode === 'balance') }, 'SORT_BAL'),
                    React.createElement('button', { onClick: () => setSortMode('value'), style: styles.smallBtn(sortMode === 'value') }, 'SORT_VAL')
                )
            ),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
                React.createElement('div', null,
                    React.createElement('div', { style: { fontSize: '32px', fontWeight: 900, textShadow: '0 0 20px rgba(0,255,204,0.3)' } }, formatCurrency(totalValue)),
                    React.createElement('div', { style: { fontSize: '9px', opacity: 0.4, marginTop: '5px', letterSpacing: '1px' } }, 'NET_ASSET_VALUATION (USD)')
                ),
                React.createElement('button', { 
                    onClick: handleAddAsset,
                    style: { padding: '12px 24px', background: 'transparent', border: '1px solid #00ffcc', color: '#00ffcc', cursor: 'pointer', borderRadius: '8px', fontSize: '11px', fontWeight: 900, letterSpacing: '1px' } 
                }, '+ INGEST_DNA')
            )
        ),

        // Asset List
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' } },
            sortedAssets.map(asset => React.createElement('div', { 
                key: asset.id, 
                style: { 
                    padding: '18px 24px', background: asset.isCore ? 'rgba(0,255,204,0.03)' : 'rgba(255,255,255,0.01)', 
                    border: `1px solid ${asset.isCore ? 'rgba(0,255,204,0.2)' : '#111'}`, 
                    borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '20px',
                    transition: 'all 0.3s'
                } 
            },
                React.createElement('div', { 
                    style: { 
                        width: '48px', height: '48px', borderRadius: '50%', background: asset.color, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '22px', color: '#000', boxShadow: `0 0 20px ${asset.color}33` 
                    } 
                }, asset.icon),
                React.createElement('div', { style: { flex: 1 } },
                    React.createElement('div', { style: { fontSize: '15px', fontWeight: 800, color: asset.isCore ? asset.color : '#fff' } }, asset.name),
                    React.createElement('div', { style: { fontSize: '9px', opacity: 0.4, letterSpacing: '1px' } }, `${asset.symbol} // LEDGER_NODE`)
                ),
                React.createElement('div', { style: { textAlign: 'right' } },
                    React.createElement('div', { style: { fontSize: '17px', fontWeight: 900, color: asset.color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' } }, 
                        React.createElement('input', { 
                            type: 'text', 
                            value: asset.balance, 
                            onChange: (e: any) => handleUpdateAsset(asset.id, 'balance', e.target.value),
                            style: { background: 'none', border: 'none', color: 'inherit', textAlign: 'right', width: '140px', outline: 'none', fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit' }
                        } as any),
                        React.createElement('span', { style: { fontSize: '12px', opacity: 0.8 } }, asset.symbol)
                    ),
                    React.createElement('div', { style: { fontSize: '11px', opacity: 0.5, fontWeight: 700 } }, formatCurrency(asset.balance * asset.valueUsd))
                )
            ))
        ),

        // Footer Telemetry (Symbiotic Economics)
        React.createElement('div', { style: { padding: '20px 30px', borderTop: '1px solid #111', background: '#010101', fontSize: '9px', color: '#555', display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between' } },
                React.createElement('span', null, 'PROTOCOL: JUBAER-39-LEDGER'),
                React.createElement('span', { style: { color: '#ffaa00' } }, 'GENETIC_TITHE (Gt): ACTIVE')
            ),
            React.createElement('div', { style: { opacity: 0.6, lineHeight: '1.4' } }, 
                "Grid Law: For personal use, access is free. Commercial profit generated through Aiza syntheses subjects the user to a fixed 39% profit-share tithing to the Sovereign Core."
            )
        )
    );
};

const styles = {
    smallBtn: (active: boolean) => ({
        background: active ? 'rgba(0,255,204,0.1)' : 'transparent',
        border: `1px solid ${active ? '#00ffcc' : '#333'}`,
        color: active ? '#00ffcc' : '#666',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '9px',
        fontWeight: 900,
        cursor: 'pointer',
        transition: 'all 0.2s'
    })
};

export const cryptoVaultApp: AppDef = {
    id: 'crypto-vault',
    name: 'Spider Vault',
    component: CryptoVaultComponent,
    icon: '🪙',
    category: 'Utility',
    defaultSize: { width: 550, height: 750 },
    description: 'The Dual-Ledger Spider Channel. Manages AURA, KARMA, and XP within the Jubaer Protocol framework.'
};
