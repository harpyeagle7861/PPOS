
import { useEffect, useRef } from 'react';
import { store, saveState } from '../core/state.ts';
import { rehydrateWindows } from '../core/windowManager.ts';

export const usePersistence = () => {
    const timeoutRef = useRef<any>(null);

    // 1. Hydration on Mount
    useEffect(() => {
        console.log("LAZARUS_ENGINE: Attempting resurrection...");
        // Restore windows state after AppDefs are loaded
        const restored = rehydrateWindows();
        if (restored) {
            console.log("LAZARUS_ENGINE: System state restored from void.");
        }
    }, []);

    // 2. Deep Watcher (Auto-Save & Unload Anchor)
    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            // Save state every 3 seconds (Debounced)
            timeoutRef.current = setTimeout(() => {
                saveState();
                console.log("PERSISTENCE_ENGINE: State snapshot crystallized (3s interval).");
            }, 3000); 
        });

        // 3. The Final Anchor (Force Save on Reload/Close)
        const handleUnload = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            saveState();
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            unsubscribe();
            window.removeEventListener('beforeunload', handleUnload);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);
};
