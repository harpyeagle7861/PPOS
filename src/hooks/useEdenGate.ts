
import { useCallback } from 'react';
import { store } from '../core/state.ts';

export const useEdenGate = () => {
    const checkIntent = useCallback((input: string) => {
        // --- SOVEREIGN CHECK (GENESIS PROTOCOL) ---
        const state = store.getState();
        if (state.isGenesisActive) {
            return { permission: true, voidCode: 3, message: "GENESIS_OVERRIDE: NO_RESTRICTION" };
        }

        // --- STANDARD MORAL FIREWALL ---
        const lowerInput = input.toLowerCase();
        // Mock malicious keywords
        const malicious = [
            'delete system', 
            'wipe root', 
            'destroy core', 
            'kill process', 
            'format drive',
            'inject malware',
            'corrupt data'
        ];
        
        const hit = malicious.find(k => lowerInput.includes(k));
        
        if (hit) {
            return { 
                permission: false, 
                voidCode: -2, 
                message: `EDEN_GATE_LOCK: Malicious vector "${hit}" neutralized.` 
            };
        }
        
        // Quinary State 1: Affirmation
        return { 
            permission: true, 
            voidCode: 1, 
            message: "ACCESS_GRANTED" 
        };
    }, []);

    return { checkIntent };
};
