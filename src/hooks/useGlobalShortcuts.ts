
import { useEffect } from 'react';
import { store } from '../core/state.ts';
import { openApp, closeWindow, focusWindow, togglePin } from '../core/windowManager.ts';

export const useGlobalShortcuts = () => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. Open Start Menu (Omni-Search): Ctrl + Space
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                const state = store.getState();
                const startAppId = 'hand-search';
                
                // Toggle Logic: If Omni-Search is focused, close it. Otherwise open/focus it.
                const existing = state.windows.find(w => w.appDef.id === startAppId);
                
                if (existing && existing.isFocused) {
                    closeWindow(existing.instanceId);
                } else {
                    openApp(startAppId);
                }
            }

            // 2. Close Active Window: Alt + Q
            if (e.altKey && e.code === 'KeyQ') {
                e.preventDefault();
                const state = store.getState();
                if (state.focusedWindowId) {
                    closeWindow(state.focusedWindowId);
                }
            }

            // 3. Switch Apps (Cycle): Alt + ` (Backtick)
            if (e.altKey && e.code === 'Backquote') {
                e.preventDefault();
                cycleWindows(e.shiftKey);
            }
            
            // 4. Pin/Unpin Focused Window: Alt + P
            if (e.altKey && e.code === 'KeyP') {
                e.preventDefault();
                const state = store.getState();
                if (state.focusedWindowId) {
                    const win = state.windows.find(w => w.instanceId === state.focusedWindowId);
                    if (win) togglePin(win.appDef.id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};

const cycleWindows = (reverse: boolean) => {
    const state = store.getState();
    if (state.windows.length < 2) return;

    // Sort by zIndex descending (Visual Stack Order: Top to Bottom)
    const sortedWindows = [...state.windows].sort((a, b) => b.zIndex - a.zIndex);
    
    // Find current focused index
    const currentIndex = sortedWindows.findIndex(w => w.instanceId === state.focusedWindowId);
    
    let nextIndex;
    if (currentIndex === -1) {
        nextIndex = 0;
    } else {
        if (reverse) {
            // Go up the stack
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) nextIndex = sortedWindows.length - 1;
        } else {
            // Go down the stack
            nextIndex = currentIndex + 1;
            if (nextIndex >= sortedWindows.length) nextIndex = 0;
        }
    }
    
    const target = sortedWindows[nextIndex];
    if (target) focusWindow(target.instanceId);
};
