
import { addNotification } from './windowManager.ts';

class TitaniumMask {
    public init() {
        this.cloakNavigator();
        this.disableBrowserShortcuts();
        console.log("TITANIUM_MASK: Browser signatures neutralized. reporting as Native Windows 11 Substrate.");
    }

    private cloakNavigator() {
        const overrides = {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            platform: "Win32",
            hardwareConcurrency: 16,
            deviceMemory: 32,
            webdriver: false
        };

        Object.entries(overrides).forEach(([key, value]) => {
            try {
                Object.defineProperty(navigator, key, {
                    get: () => value,
                    configurable: true
                });
            } catch (e) {
                console.warn(`SPOOF_FAULT: Could not override ${key}`);
            }
        });

        // Hide Automation
        if (Object.getOwnPropertyDescriptor(navigator, 'webdriver')) {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        }
    }

    private disableBrowserShortcuts() {
        // Disable Right-Click globally for custom OS menus
        window.addEventListener('contextmenu', (e) => {
            // Allow context menu in specific areas if needed, but default to block
            const target = e.target as HTMLElement;
            if (!target.closest('.allow-native-context')) {
                e.preventDefault();
            }
        });

        // Block specific browser shortcuts that give away the "Web" nature
        window.addEventListener('keydown', (e) => {
            // Block Ctrl+S, Ctrl+P, Ctrl+U, etc.
            if (e.ctrlKey && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            // Block F12 (Dev Tools) - optional, but user asked for indistinguishable
            if (e.key === 'F12') {
                // e.preventDefault(); 
            }
        });
    }

    public async lockIn() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                addNotification("SYSTEM: Fullscreen Lock Engaged. Native mode active.");
            }
        } catch (err) {
            console.error("LOCK_IN_FAILURE:", err);
            addNotification("ERROR: Fullscreen protocol rejected by host.");
        }
    }
}

export const System = new TitaniumMask();
