
import { store, saveState, PomegranateSeed, PomegranateCell } from '../core/state.ts';
import { Eagle369Codec } from './eagle369.ts';
import { addNotification } from '../core/windowManager.ts';

/**
 * THE POMEGRANATE ENGINE
 * The Central Nervous System & Router of AIZA.
 * "Nothing happens without passing through the Pomegranate."
 */
class PomegranateEngineClass {
    private isBeating = false;

    constructor() {
        console.log("[POMEGRANATE] Heart is Online. Waiting for flux...");
        this.initializeGenesisClock();
    }

    private initializeGenesisClock() {
        // Check local storage for the Absolute Genesis Time
        const storedGenesis = localStorage.getItem('AIZA_GENESIS_TIME');
        let genesisTime: number;

        if (storedGenesis) {
            genesisTime = parseInt(storedGenesis);
        } else {
            // First Awakening
            genesisTime = Date.now();
            localStorage.setItem('AIZA_GENESIS_TIME', genesisTime.toString());
            console.log(`[GENESIS] System Born at ${new Date(genesisTime).toLocaleString()}`);
        }

        // Sync to Store
        store.setState(s => ({
            ...s,
            pomegranate: {
                ...s.pomegranate,
                systemGenesisTimestamp: genesisTime
            }
        }));
    }

    /**
     * Calculates the "Life Duration" string from a timestamp.
     * Format: 00y:00d:00h:00m:00s
     */
    public getAgeString(birthTime: number): string {
        const now = Date.now();
        let diff = Math.max(0, now - birthTime) / 1000; // Total seconds

        const days = Math.floor(diff / 86400);
        diff -= days * 86400;
        const hours = Math.floor(diff / 3600);
        diff -= hours * 3600;
        const minutes = Math.floor(diff / 60);
        diff -= minutes * 60;
        const seconds = Math.floor(diff);

        // Simple formatting
        const pad = (n: number) => n.toString().padStart(2, '0');
        
        if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
        return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }

    /**
     * CORE INGESTION FUNCTION
     * @param actionType The type of action (e.g., 'SEND_CHAT', 'SUMMON_GIANT')
     * @param payload The data associated with the action
     * @param entityId The ID of the entity performing the action (e.g., 'aiza', 'tesla')
     */
    public async ingest(actionType: string, payload: any, entityId: string, entityType: 'GIANT' | 'APP' | 'USER' | 'SYSTEM') {
        const timestamp = Date.now();
        
        // 1. VISUAL PULSE (Immediate Feedback)
        this.triggerPulse(actionType);

        // 2. BIRTH CERTIFICATE CHECK (The Seed)
        let seed = this.getSeed(entityId);
        if (!seed) {
            seed = this.birthEntity(entityId, entityType, payload.name || entityId);
        } else {
            // Update Life Timer
            store.setState(s => ({
                ...s,
                pomegranate: {
                    ...s.pomegranate,
                    seeds: {
                        ...s.pomegranate.seeds,
                        [entityId]: { ...seed!, lifeTimer: (seed!.lifeTimer || 0) + 1 }
                    }
                }
            }));
        }

        // 3. HONEYCOMB STORAGE (Raw Data - The Memory)
        // Note: Specific apps manage their own HoneyCells (like aiza-core), 
        // but Pomegranate ensures a backup trace in the cells structure.
        
        // 4. POMEGRANATE CELL (Eagle 369 Compression)
        // Convert the action payload into a Logos Key for fast retrieval/symbolism.
        try {
            const contentString = JSON.stringify(payload);
            const eaglePacket = await Eagle369Codec.transmuteFromContent(`${actionType}:${entityId}`, contentString);
            
            this.storeLogosKey(entityId, eaglePacket.symbolicDna);
        } catch (e) {
            console.error("[POMEGRANATE] Transmutation Fracture:", e);
        }

        // 5. ANCHOR STATE
        saveState();
    }

    /**
     * THE GATE: MANIFEST FORCE
     * The threshold where Information becomes Force.
     * Triggered by the Ω(Living Antidote) formula.
     */
    public manifestForce(source: string, magnitude: number) {
        console.log(`[POMEGRANATE] FORCE_MANIFESTED: ${source} (Magnitude: ${magnitude})`);
        addNotification(`THE GATE: Information -> Force [${source}]`);
        
        // Trigger a high-intensity pulse
        const event = new CustomEvent('POMEGRANATE_FORCE_PULSE', { detail: { source, magnitude, timestamp: Date.now() } });
        window.dispatchEvent(event);
        
        store.setState(s => ({
            ...s,
            pomegranate: {
                ...s.pomegranate,
                pulseHistory: [...s.pomegranate.pulseHistory, { timestamp: Date.now(), intensity: magnitude, source: `FORCE:${source}` }].slice(-50)
            }
        }));
    }

    private triggerPulse(source: string) {
        const event = new CustomEvent('POMEGRANATE_PULSE', { detail: { source, timestamp: Date.now() } });
        window.dispatchEvent(event);
        
        // Update Pulse History in Store
        store.setState(s => ({
            ...s,
            pomegranate: {
                ...s.pomegranate,
                pulseHistory: [...s.pomegranate.pulseHistory, { timestamp: Date.now(), intensity: 1, source }].slice(-50)
            }
        }));
    }

    private getSeed(id: string): PomegranateSeed | undefined {
        return store.getState().pomegranate.seeds[id];
    }

    private birthEntity(id: string, type: 'GIANT' | 'APP' | 'USER' | 'SYSTEM', name: string): PomegranateSeed {
        console.log(`[POMEGRANATE] NEW LIFE DETECTED: ${name} (${type})`);
        addNotification(`GENESIS: Birth Certificate Issued for ${name}`);
        
        const newSeed: PomegranateSeed = {
            seed_id: id,
            entityType: type,
            name: name,
            birthTimestamp: Date.now(),
            lifeTimer: 0,
            dnaHash: `E369-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };

        store.setState(s => ({
            ...s,
            pomegranate: {
                ...s.pomegranate,
                seeds: { ...s.pomegranate.seeds, [id]: newSeed }
            }
        }));

        return newSeed;
    }

    private storeLogosKey(entityId: string, key: string) {
        store.setState(s => {
            const currentCell = s.pomegranate.cells[entityId] || {
                cell_id: `cell_${entityId}`,
                seed_ref: entityId,
                logosKeys: [],
                lastPulse: 0
            };

            return {
                ...s,
                pomegranate: {
                    ...s.pomegranate,
                    cells: {
                        ...s.pomegranate.cells,
                        [entityId]: {
                            ...currentCell,
                            logosKeys: [...currentCell.logosKeys, key].slice(-100), // Keep last 100 compressed keys
                            lastPulse: Date.now()
                        }
                    }
                }
            };
        });
    }

    /**
     * Checks if a Giant exists in the Pomegranate. If so, they are "Awake".
     */
    public isEntityAwake(id: string): boolean {
        return !!this.getSeed(id);
    }
}

export const Pomegranate = new PomegranateEngineClass();
