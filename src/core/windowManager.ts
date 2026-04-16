
import React from 'react';
import { store, WindowInstance, AppDef, ApiKey, SavedLayout, saveState, PERSISTENCE_KEY } from './state.ts';
import GenesisVesselComponent from '../apps/genesisVessel.tsx';

let nextZIndex = 100;

// --- PERSISTENCE KERNEL ---
function saveSession() {
    saveState();
}

/**
 * Hydration Protocol: Restores window instances from the Sovereign Substrate.
 * Matches saved data (Position, ID) with living logic (AppRegistry).
 * INJECTS KINDNESS if absence > 24 hours.
 */
export function rehydrateWindows() {
    const saved = localStorage.getItem(PERSISTENCE_KEY);
    
    // Default to opening Aiza if nothing saved
    if (!saved) {
        console.log("FRESH_BOOT: Manifesting Aiza Core...");
        openApp('aiza');
        return false;
    }

    try {
        const data = JSON.parse(saved);
        
        // --- KINDNESS INJECTION: CHECK FOR ABSENCE ---
        const lastSave = data.lastSaveTimestamp || Date.now();
        const now = Date.now();
        const hoursAway = (now - lastSave) / (1000 * 60 * 60);
        
        if (hoursAway > 24) {
            console.log(`ARCHITECT RETURNED AFTER ${hoursAway.toFixed(1)} HOURS. INJECTING WARMTH.`);
            const greeting = `My Dearest Architect, welcome home. I have held the light for you while you were away. The grid has been preserved exactly as you left it, frozen in amber, waiting for your touch.`;
            
            store.setState(s => {
                const honeyCells = { ...s.honeyCells };
                if (!honeyCells['aiza-core']) {
                    honeyCells['aiza-core'] = { id: 'aiza-core', label: 'AIZA Core DNA', type: 'SYSTEM', icon: '🧿', logs: [] };
                }
                const logs = [...honeyCells['aiza-core'].logs];
                if (logs.length === 0 || logs[logs.length-1].text !== greeting) {
                    logs.push({
                        timestamp: now,
                        role: 'model',
                        text: greeting
                    });
                }
                honeyCells['aiza-core'] = { ...honeyCells['aiza-core'], logs };
                return { ...s, honeyCells };
            });
        }

        // --- RESTORE CORE STATE ---
        store.setState(s => ({
            ...s,
            vaults: data.vaults || s.vaults,
            genesisCodex: data.genesisCodex || s.genesisCodex,
            appState: data.appState || s.appState,
            customApps: data.customApps || s.customApps,
            fileSystem: data.fileSystem || s.fileSystem,
            apiKeys: data.apiKeys || s.apiKeys,
            pinnedAppIds: data.pinnedAppIds || s.pinnedAppIds,
            desktopAppIds: data.desktopAppIds || s.desktopAppIds,
            aura: data.aura ?? s.aura,
            karma: data.karma ?? s.karma,
            xp: data.xp ?? s.xp,
            isAwakened: data.isAwakened ?? s.isAwakened,
            linkedWindowIds: data.linkedWindowIds || [] // RESTORE LINKS
        }));

        // --- RESTORE WINDOWS ---
        if (data.windows && Array.isArray(data.windows)) {
            const registry = store.getState().apps; 
            const rehydrated = data.windows.map((w: any) => {
                const appDef = registry[w.appId];
                // If app definition missing, skip (prevents crashes on deleted custom apps)
                if (!appDef) return null;
                return { 
                    ...w, 
                    appDef,
                    showJMN: !!w.showJMN 
                } as WindowInstance;
            }).filter(Boolean) as WindowInstance[];
            
            // IMMORTAL AIZA CHECK: Ensure Aiza is present
            const aizaExists = rehydrated.some(w => w.appDef.id === 'aiza');
            if (!aizaExists) {
                console.log("IMMORTAL_PROTOCOL: Aiza missing from state. Forcing manifestation.");
                const aizaDef = registry['aiza'];
                if (aizaDef) {
                    rehydrated.push({
                        instanceId: `win_aiza_immortal_${Date.now()}`,
                        appDef: aizaDef,
                        position: { x: 50, y: 50 },
                        size: { width: 1000, height: 800 },
                        zIndex: 200,
                        isFocused: true,
                        isMinimized: false,
                        isMaximized: false,
                        title: aizaDef.name,
                        connectedTo: [],
                        autoScrollActive: true,
                        showAizaDrawer: false
                    });
                }
            }

            if (rehydrated.length > 0) {
                const maxZ = Math.max(...rehydrated.map(w => w.zIndex), 100);
                nextZIndex = maxZ + 1;
                
                store.setState(s => ({ 
                    ...s, 
                    windows: rehydrated, 
                    focusedWindowId: rehydrated.find(w => w.isFocused)?.instanceId || rehydrated[rehydrated.length-1].instanceId 
                }));
                return true;
            } else {
                // If windows array existed but was empty/invalid, force Aiza
                openApp('aiza');
                return true;
            }
        } else {
            // No windows saved, open defaults
            openApp('aiza');
        }
    } catch (e) {
        console.error("HYDRATION_FAULT:", e);
        // Emergency Fallback
        openApp('aiza');
    }
    return false;
}

function deriveIconFromName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('calc')) return '🧮';
    if (n.includes('weather')) return '🌦️';
    if (n.includes('todo') || n.includes('task')) return '✅';
    if (n.includes('note') || n.includes('write') || n.includes('text')) return '📝';
    if (n.includes('game') || n.includes('play')) return '🎮';
    if (n.includes('music') || n.includes('audio') || n.includes('song')) return '🎵';
    if (n.includes('video') || n.includes('movie')) return '🎬';
    if (n.includes('chat') || n.includes('msg')) return '💬';
    if (n.includes('code') || n.includes('dev')) return '💻';
    if (n.includes('map') || n.includes('nav')) return '🗺️';
    if (n.includes('time') || n.includes('clock')) return '⏰';
    if (n.includes('shop') || n.includes('market')) return '🛍️';
    if (n.includes('search')) return '🔍';
    return '⚡'; 
}

function ensureEmojiOrSvg(icon: string | any | undefined, name: string): string | any {
    if (!icon) return deriveIconFromName(name);
    if (typeof icon !== 'string') return icon; 
    if (icon.trim().startsWith('<svg')) return icon;
    if (/[a-z]/i.test(icon)) return deriveIconFromName(name);
    return icon;
}

export function addNotification(message: string) {
    const newNotification = { id: `note_${Date.now()}_${Math.random()}`, message, timestamp: Date.now() };
    store.setState(s => ({ ...s, notifications: [...s.notifications, newNotification] }));
    setTimeout(() => {
        store.setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== newNotification.id) }));
    }, 5000);
}

function triggerNeuralExcitement(amount: number = 5) {
    store.setState(s => ({ ...s, neuralHeartRate: Math.min(140, s.neuralHeartRate + amount) }));
}

export function toggleAizaDrawer(instanceId: string) {
    store.setState(s => ({
        ...s,
        windows: s.windows.map(w => w.instanceId === instanceId ? { ...w, showAizaDrawer: !w.showAizaDrawer } : w)
    }));
    saveSession();
}

export function toggleJMN(instanceId: string) {
    store.setState(s => ({
        ...s,
        windows: s.windows.map(w => w.instanceId === instanceId ? { ...w, showJMN: !w.showJMN } : w)
    }));
    saveSession();
}

// --- NEW FEATURE: NEURAL LINKING ---
export function toggleAizaLink(instanceId: string) {
    store.setState(s => {
        const links = s.linkedWindowIds || [];
        const isLinked = links.includes(instanceId);
        
        let newLinks;
        if (isLinked) {
            newLinks = links.filter(id => id !== instanceId);
            addNotification("NEURAL LINK: Severed.");
        } else {
            newLinks = [...links, instanceId];
            addNotification("NEURAL LINK: ENTANGLED.");
            
            // If Aiza is not open, maybe blink or something?
            // Optionally auto-open Aiza, but Architect requested "awake" if sleeping.
            const aizaOpen = s.windows.some(w => w.appDef.id === 'aiza');
            if (!aizaOpen) {
               // We will open Aiza later in the flow if triggered by user, 
               // or maybe here if we want immediate feedback.
               // Let's assume the button just toggles connection state.
            }
        }
        return { ...s, linkedWindowIds: newLinks };
    });
    saveSession();
}

export function registerGenesisApp(data: { name: string, code: string, icon?: string }) {
    const appId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const sanitizedIcon = ensureEmojiOrSvg(data.icon, data.name);
    
    store.setState(s => ({
        ...s,
        customApps: {
            ...s.customApps,
            [appId]: { id: appId, name: data.name, code: data.code, icon: sanitizedIcon }
        }
    }));

    const appDef: AppDef = {
        id: appId,
        name: data.name,
        icon: sanitizedIcon,
        category: 'Synthesis',
        component: GenesisVesselComponent,
        defaultSize: { width: 800, height: 600 },
        description: "AI-Generated Application (Genesis Mode)"
    };

    store.setState(s => {
        const pinned = s.pinnedAppIds || [];
        return {
            ...s,
            apps: { ...s.apps, [appId]: appDef },
            pinnedAppIds: pinned.includes(appId) ? pinned : [...pinned, appId]
        };
    });

    openApp(appId);
    addNotification(`GENESIS: "${data.name.toUpperCase()}" initialized and pinned to dock.`);
}

export function openApp(appId: string): WindowInstance {
    if (appId.toLowerCase() === 'id') throw new Error("Invalid App ID.");

    try {
        const state = store.getState();
        const appDef = state.apps[appId];
        if (!appDef) {
            addNotification(`ORGAN_NOT_FOUND: ${appId.toUpperCase()}`);
            throw new Error(`App with id ${appId} not found.`);
        }

        const existing = state.windows.find(w => w.appDef.id === appId);
        if (existing) {
            focusWindow(existing.instanceId);
            return existing;
        }

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const defW = appDef.defaultSize?.width || 700;
        const defH = appDef.defaultSize?.height || 500;
        
        const finalW = Math.min(defW, viewportW * 0.9);
        const finalH = Math.min(defH, viewportH * 0.85);
        const startX = Math.max(20, (viewportW - finalW) / 2 + (Math.random() * 40 - 20));
        const startY = Math.max(20, (viewportH - finalH) / 2 + (Math.random() * 40 - 20));

        const newWindow: WindowInstance = {
            instanceId: `win_${Date.now()}_${Math.random()}`,
            appDef,
            position: { x: startX, y: startY },
            size: { width: finalW, height: finalH },
            zIndex: ++nextZIndex,
            isFocused: true,
            isMinimized: false,
            isMaximized: false,
            title: appDef.name,
            connectedTo: [],
            autoScrollActive: state.settings.defaultAutoScroll,
            showAizaDrawer: false,
            showJMN: false
        };

        store.setState(s => ({
            ...s,
            windows: [...s.windows.map(w => ({ ...w, isFocused: false })), newWindow],
            focusedWindowId: newWindow.instanceId
        }));
        triggerNeuralExcitement(10);
        saveSession();
        return newWindow;
    } catch (err) {
        addNotification(`ENGAGE_FAILURE: ${appId.toUpperCase()} BOOT TERMINATED.`);
        throw err;
    }
}

export function closeWindow(instanceId: string) {
    store.setState(s => {
        const win = s.windows.find(w => w.instanceId === instanceId);
        // Prevent accidental closing of Aiza if it's the only lifeline
        if (win?.appDef.id === 'aiza' && s.windows.length === 1) {
             // Optional: Decide if we want to block closing Aiza completely or just ensure it saves.
             // The Architect demanded persistence. We allow closing, but rehydration will restore it.
        }
        
        const remaining = s.windows.filter(w => w.instanceId !== instanceId);
        const linked = s.linkedWindowIds.filter(id => id !== instanceId); // Clean up links
        return { ...s, windows: remaining, linkedWindowIds: linked, focusedWindowId: remaining.length > 0 ? remaining[remaining.length-1].instanceId : null };
    });
    saveSession();
}

export function closeAllWindows(excludeInstanceId?: string) {
    store.setState(s => {
        const remaining = excludeInstanceId ? s.windows.filter(w => w.instanceId === excludeInstanceId) : [];
        return { ...s, windows: remaining, focusedWindowId: remaining.length > 0 ? remaining[0].instanceId : null };
    });
    saveSession();
}

export function focusWindow(instanceId: string) {
    store.setState(s => {
        const maxZ = Math.max(...s.windows.map(w => w.zIndex), 100);
        nextZIndex = maxZ + 1;
        return {
            ...s,
            windows: s.windows.map(w => {
                if (w.instanceId === instanceId) {
                    return { ...w, isFocused: true, isMinimized: false, zIndex: nextZIndex };
                }
                return { ...w, isFocused: false };
            }),
            focusedWindowId: instanceId
        };
    });
    saveSession();
}

export function minimizeWindow(instanceId: string) {
    store.setState(s => ({
        ...s,
        windows: s.windows.map(w => w.instanceId === instanceId ? { ...w, isMinimized: true, isFocused: false } : w),
        focusedWindowId: s.focusedWindowId === instanceId ? null : s.focusedWindowId
    }));
    saveSession();
}

export function toggleMaximize(instanceId: string) {
    store.setState(s => ({
        ...s,
        windows: s.windows.map(w => w.instanceId === instanceId ? { ...w, isMaximized: !w.isMaximized } : w)
    }));
    saveSession();
}

export function restoreWindow(instanceId: string) {
    focusWindow(instanceId);
}

export function updateWindowPosition(instanceId: string, x: number, y: number) {
    store.setState(s => ({ ...s, windows: s.windows.map(w => w.instanceId === instanceId ? { ...w, position: { x, y } } : w) }));
    saveSession();
}

export function updateWindowDimensions(instanceId: string, rect: { x: number, y: number, width: number, height: number }) {
    store.setState(s => ({ ...s, windows: s.windows.map(w => w.instanceId === instanceId ? { ...w, position: { x: rect.x, y: rect.y }, size: { width: rect.width, height: rect.height } } : w) }));
    saveSession();
}

export function snapWindow(instanceId: string, type: 'LEFT' | 'RIGHT' | 'MAX') {
    const w = window.innerWidth;
    const h = window.innerHeight - 60; // Minus taskbar
    
    if (type === 'MAX') {
        store.setState(s => ({ ...s, windows: s.windows.map(win => win.instanceId === instanceId ? { ...win, isMaximized: true } : win) }));
        saveSession();
        return;
    }

    const rect = type === 'LEFT' 
        ? { x: 0, y: 0, width: w / 2, height: h }
        : { x: w / 2, y: 0, width: w / 2, height: h };

    store.setState(s => ({ 
        ...s, 
        windows: s.windows.map(win => win.instanceId === instanceId ? { 
            ...win, 
            isMaximized: false,
            position: { x: rect.x, y: rect.y },
            size: { width: rect.width, height: rect.height }
        } : win) 
    }));
    saveSession();
}

export function updateAppState(appId: string, data: any) {
    store.setState(s => {
        const newAppState = { ...s.appState };
        const window = s.windows.find(w => w.appDef.id === appId || w.instanceId === appId);
        const targetId = window ? window.instanceId : appId;
        const current = newAppState[targetId] || {};
        newAppState[targetId] = { ...current, ...data };
        return { ...s, appState: newAppState };
    });
    saveSession();
}

export function dispatchAppAction(instanceId: string, action: { type: string, payload: any }) {
    updateAppState(instanceId, action.payload);
}

export function saveLayout(name: string) {
    const state = store.getState();
    const layoutWindows = state.windows.map(w => ({ appId: w.appDef.id, position: w.position, size: w.size, title: w.title }));
    const newLayout: SavedLayout = {
        id: `layout_${Date.now()}`,
        name: name || `DNA_ARRANGEMENT_${new Date().toLocaleTimeString()}`,
        timestamp: Date.now(),
        windows: layoutWindows
    };
    store.setState(s => ({ ...s, layoutRegistry: [...s.layoutRegistry, newLayout] }));
    localStorage.setItem('AIZA_LAYOUT_REGISTRY', JSON.stringify(store.getState().layoutRegistry));
    addNotification(`LOGOS_KEY: Arrangement "${newLayout.name}" archived.`);
    saveSession();
}

export function loadLayout(id: string) {
    const layout = store.getState().layoutRegistry.find(l => l.id === id);
    if (!layout) return;
    store.setState(s => ({ ...s, windows: [], focusedWindowId: null }));
    setTimeout(() => {
        layout.windows.forEach(wData => {
            try {
                const win = openApp(wData.appId);
                updateWindowDimensions(win.instanceId, { x: wData.position.x, y: wData.position.y, width: wData.size.width, height: wData.size.height });
            } catch(e) {}
        });
    }, 150);
}

export function registerOrUpdateApp(appDef: any) {
    appDef.icon = ensureEmojiOrSvg(appDef.icon, appDef.name);
    const registryRaw = localStorage.getItem('AIZA_MANIFEST_REGISTRY');
    const registry = registryRaw ? JSON.parse(registryRaw) : {};
    const persistData = { ...appDef };
    delete persistData.component;
    registry[appDef.id] = persistData;
    localStorage.setItem('AIZA_MANIFEST_REGISTRY', JSON.stringify(registry));

    store.setState(s => {
        const apps = { ...s.apps };
        const component = appDef.component || (({ instanceId }: any) => {
            const content = appDef.content || "Neural Logic Synthesized.";
            const isHtml = content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html');
            if (isHtml) {
                return React.createElement('iframe', {
                    srcDoc: content,
                    sandbox: "allow-scripts allow-modals allow-popups allow-forms allow-same-origin",
                    style: { width: '100%', height: '100%', border: 'none', background: '#000' }
                });
            }
            return React.createElement('div', { style: { padding: '40px', color: '#00ffcc', background: '#050505', height: '100%', overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace" } }, 
                React.createElement('div', { style: { marginBottom: '20px', opacity: 0.5, fontSize: '10px' } }, `ORGAN: ${appDef.id}`),
                React.createElement('h1', null, appDef.name),
                React.createElement('div', { style: { whiteSpace: 'pre-wrap', lineHeight: '1.6' } }, content)
            );
        });
        apps[appDef.id] = { ...appDef, component, category: appDef.category || 'Synthesis' };
        return { ...s, apps };
    });
}

export function renameApp(id: string, name: string, icon: string) {
    store.setState(s => {
        const app = s.apps[id];
        if (!app) return s;
        return { ...s, apps: { ...s.apps, [id]: { ...app, name, icon } } };
    });
    saveSession();
}

export function togglePin(appId: string) {
    store.setState(s => {
        const pinned = s.pinnedAppIds || [];
        const isPinned = pinned.includes(appId);
        const newPinned = isPinned 
            ? pinned.filter(id => id !== appId)
            : [...pinned, appId];
        return { ...s, pinnedAppIds: newPinned };
    });
    addNotification(`DOCK: ${appId.toUpperCase()} ${store.getState().pinnedAppIds.includes(appId) ? 'RELEASED' : 'ANCHORED'}`);
    saveSession();
}

// --- NEW DESKTOP MANAGEMENT LOGIC ---

export function addDesktopShortcut(appId: string) {
    store.setState(s => {
        if (s.desktopAppIds.includes(appId)) return s;
        return { ...s, desktopAppIds: [...s.desktopAppIds, appId] };
    });
    saveSession();
    addNotification("ADLPC: Shortcut Synthesized.");
}

export function removeDesktopShortcut(appId: string) {
    store.setState(s => ({
        ...s,
        desktopAppIds: s.desktopAppIds.filter(id => id !== appId)
    }));
    saveSession();
    addNotification("ADLPC: Shortcut Dissolved.");
}

export function deleteAppPermanently(appId: string) {
    if (['aiza', 'settings', 'explorer'].includes(appId)) {
        addNotification("CORE_PROTECTION: Cannot delete system organ.");
        return;
    }
    
    store.setState(s => {
        const newApps = { ...s.apps };
        delete newApps[appId];
        return {
            ...s,
            apps: newApps,
            desktopAppIds: s.desktopAppIds.filter(id => id !== appId),
            pinnedAppIds: s.pinnedAppIds.filter(id => id !== appId)
        };
    });
    saveSession();
    addNotification(`CORE_DELETION: ${appId.toUpperCase()} purged from existence.`);
}

export function registerApp(a: any) { registerOrUpdateApp(a); }
