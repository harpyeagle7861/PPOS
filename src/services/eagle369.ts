
import { store } from '../core/state.ts';
import { updateAppState, addNotification } from '../core/windowManager.ts';

export interface Eagle369Packet {
    id: string;
    type: 'EAGLE_369';
    payload: string; 
    symbolicDna: string; // The "Base-369" representation
    meta: {
        originalName: string;
        size: number;
        timestamp: number;
    }
}

// The "Base-369" Symbolic Glyph Set (Sacred Geometry & Logic Symbols)
const GLYPHS = "∆∇∑∏∜∞≈≠≡≤≥⊂⊃⊆⊇⊕⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯⊰⊱⊲⊳⊴⊵⊶⊷⊸⊹⊺⊻⊼⊽⊾⊿⋀⋁⋂⋃⋄⋅⋆ΩΨΦΞΠ";

export const Eagle369Codec = {
    /**
     * Transmutes raw content string (DataURL or Text) into an Eagle 369 Packet.
     */
    transmuteFromContent: async (name: string, content: string, onProgress?: (percent: number) => void): Promise<Eagle369Packet> => {
        console.log(`[EAGLE_369] Initiating Transmutation for: ${name}`);
        
        // 1. Simulation of High-Load Processing (Breaking Matter)
        const totalSteps = 40;
        for(let i=0; i<=totalSteps; i++) {
            if(onProgress) onProgress((i/totalSteps) * 100);
            // Non-linear delay to simulate "crunching"
            await new Promise(r => setTimeout(r, 30 + Math.random() * 50)); 
        }

        // 2. Generate Symbolic DNA (Simulation of Base-369 Encoding)
        let dna = "";
        // We generate a deterministic-looking hash based on length, just for visuals
        const len = 64; 
        for(let i=0; i<len; i++) {
            dna += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        }
        // Add checksum-like tail
        dna += `::E369::${content.length}B`;

        const packet: Eagle369Packet = {
            id: `LOGO_KEY_${Date.now()}_${Math.floor(Math.random()*9999).toString(16).toUpperCase()}`,
            type: 'EAGLE_369',
            payload: content, // We retain the actual content for functional restoration
            symbolicDna: dna,
            meta: {
                originalName: name,
                size: content.length,
                timestamp: Date.now()
            }
        };

        // 3. Register to Logos Key Registry (The Shadow Inventory)
        try {
            const currentRegistry = store.getState().appState['logos-key']?.registry || [];
            const newSnapshot = {
                id: packet.id,
                label: `SYM: ${name}`,
                timestamp: Date.now(),
                type: 'E369_PACKET',
                payload: packet,
                preview: null // No visual preview for data packets
            };
            updateAppState('logos-key', { registry: [newSnapshot, ...currentRegistry] });
            addNotification(`LOGOS_KEY: ${packet.id} Minted.`);
        } catch (e) {
            console.warn("[EAGLE_369] Failed to auto-register to Logos Key app.");
        }

        return packet;
    }
};
