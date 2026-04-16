
import { addNotification } from './windowManager.ts';

class PermissionVault {
    private dbName = 'AIZA_PERMISSIONS_CORE';
    private storeName = 'consent_tokens';

    private async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(this.storeName)) {
                    request.result.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Protocol 2: Bypasses redundant prompts by checking local OS consent registry.
     */
    public async requestMediaAccess(constraints: MediaStreamConstraints): Promise<MediaStream> {
        const type = constraints.video ? 'optic' : 'acoustic';
        
        // 1. Check local vault for lifetime consent token
        const hasStoredConsent = await this.checkVault(type);
        
        if (hasStoredConsent) {
            console.log(`[VAULT] Permission token found for ${type}. Activating hardware link...`);
        } else {
            console.log(`[VAULT] No local token for ${type}. Requesting Architect authorization.`);
        }

        try {
            // 2. Request from browser (will only popup if browser doesn't have its own "Always allow" flag)
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // 3. Store the consent token locally if it's the first successful link
            if (!hasStoredConsent) {
                await this.storeVault(type, true);
                addNotification(`SYSTEM: ${type.toUpperCase()} hardware link permanently authorized in registry.`);
            }
            
            return stream;
        } catch (err) {
            console.error(`[VAULT] ACCESS_DENIED_${type.toUpperCase()}:`, err);
            addNotification(`ERROR: ${type.toUpperCase()} hardware link refused by host.`);
            throw err;
        }
    }

    private async checkVault(key: string): Promise<boolean> {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const request = tx.objectStore(this.storeName).get(key);
                request.onsuccess = () => resolve(!!request.result);
                request.onerror = () => resolve(false);
            });
        } catch {
            return false;
        }
    }

    private async storeVault(key: string, value: any): Promise<void> {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).put(value, key);
                tx.oncomplete = () => resolve();
            });
        } catch (e) {
            console.error("VAULT_WRITE_ERROR:", e);
        }
    }
}

export const PermissionHandler = new PermissionVault();
