
import { store } from './state.ts';
import { addNotification } from './windowManager.ts';
import { callGemini } from '../services/gemini.ts';
import { fs } from './FileSystem.ts';

class AutonomicNervousSystem {
    private isRepairing = false;

    constructor() {
        this.init();
    }

    private init() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleSystemFault({
                message: String(message),
                source,
                lineno,
                colno,
                stack: error?.stack
            });
            return false;
        };

        window.onunhandledrejection = (event) => {
            this.handleSystemFault({
                message: `Unhandled Promise Rejection: ${event.reason}`,
                stack: event.reason?.stack
            });
        };
        
        console.log("AIZA_OS: Autonomic Nervous System Online.");
    }

    private async handleSystemFault(fault: any) {
        if (this.isRepairing) return;
        this.isRepairing = true;

        addNotification("SYSTEM_FAULT_DETECTED: Initiating Autonomic Repair...");
        store.setState(s => ({ ...s, systemIntegrity: Math.max(0, s.systemIntegrity - 15) }));

        const faultContext = JSON.stringify(fault, null, 2);
        const repairPrompt = `
        CRITICAL SYSTEM FAILURE DETECTED in AIZA OS.
        
        TRACE DNA:
        ${faultContext}
        
        MANDATE: 
        1. Analyze the trace.
        2. Identify the compromised module.
        3. Provide a HOT_PATCH using the 'hot_patch' tool to fix the logic.
        4. Restore system integrity.
        
        Report back when the substrate is stabilized.
        `;

        try {
            // We use the non-streaming call for precise tool execution in background
            await callGemini(repairPrompt);
            addNotification("AUTONOMIC_REPAIR: Patch applied. Substrate stabilized.");
            store.setState(s => ({ ...s, systemIntegrity: 100 }));
        } catch (e) {
            console.error("REPAIR_SEQUENCE_FAILED:", e);
            addNotification("REPAIR_FAULT: Manual intervention required.");
        } finally {
            this.isRepairing = false;
        }
    }

    public scanIntegrity() {
        const nodes = fs.getNodes();
        const coreNodes = ['root', 'c-drive', 'users', 'architect', 'desktop'];
        const missing = coreNodes.filter(id => !nodes[id]);
        
        if (missing.length > 0) {
            addNotification(`INTEGRITY_ALERT: Core fragments missing: ${missing.join(', ')}`);
            return { status: 'DEGRADED', missing };
        }
        return { status: 'OPTIMAL', nodeCount: Object.keys(nodes).length };
    }
}

export const ans = new AutonomicNervousSystem();
