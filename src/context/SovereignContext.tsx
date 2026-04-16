
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { store, saveState, PERSISTENCE_KEY } from '../core/state.ts';
import { rehydrateWindows } from '../core/windowManager.ts';

// THE BRAIN (Sovereign Context)
// Governs the Eternal Core and Hydration logic.

interface SovereignContextType {
    lastSave: number;
    forceSave: () => void;
}

const SovereignContext = createContext<SovereignContextType | null>(null);

export const useSovereign = () => {
    const ctx = useContext(SovereignContext);
    if (!ctx) throw new Error("SovereignContext missing. System Cortex disconnected.");
    return ctx;
};

export const SovereignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const saveTimeout = useRef<any>(null);
    const [lastSave, setLastSave] = React.useState(Date.now());

    // --- LAZARUS PROTOCOL: ON BOOT ---
    // The Awakening: When the system boots, we check the Honeycomb.
    useEffect(() => {
        console.log("LAZARUS_PROTOCOL: Initiating System Resurrection...");
        
        // 1. Hydrate Windows & Core State (The Resurrection)
        // This function reads the 'AIZA_ETERNAL_CORE' from LocalStorage and rebuilds the visual interface.
        const restored = rehydrateWindows();
        if (restored) {
            console.log("LAZARUS_PROTOCOL: Reality Restored from Eternal Core.");
        } else {
            console.log("LAZARUS_PROTOCOL: No previous reality found. Genesis Mode active.");
        }

        // 2. The Watcher (Event Listener)
        // We subscribe to every heartbeat of the store. If anything changes, we trigger a save.
        const unsubscribe = store.subscribe(() => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            
            // Debounce: Wait for 2 seconds of silence before sealing the wax to prevent lag.
            saveTimeout.current = setTimeout(() => {
                saveState(); // <--- THE SNAPSHOT
                setLastSave(Date.now());
                // console.log("SOVEREIGN_CONTEXT: State Crystallized into Honeycomb.");
            }, 2000); 
        });

        return () => {
            unsubscribe();
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, []);

    // Force Save Function (Manual Anchor)
    // Used when critical events happen (like sending a message) to ensure immediate persistence.
    const forceSave = () => {
        saveState();
        setLastSave(Date.now());
    };

    return React.createElement(SovereignContext.Provider, { value: { lastSave, forceSave } }, children);
};
