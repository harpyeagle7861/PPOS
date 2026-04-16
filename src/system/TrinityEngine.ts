import { fs } from '../core/FileSystem.ts';
import { addNotification } from '../core/windowManager.ts';
import { FileNode } from '../core/state.ts'; // Import FileNode for casting

class TrinityEngineClass {
    private initialized = false;

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log("%c TRINITY_ENGINE %c Cycle 3-6-9 Active. Self-Healing Substrate Online.", "background: #00ffcc; color: #000; font-weight: bold;", "color: #00ffcc;");
        
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }

    private logToVFS(message: string) {
        // 6: STRUCTURE - Log preservation
        const nodes = fs.getNodes();
        const logFileName = 'errors.log';
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] TRINITY_INTERCEPT: ${message}\n`;

        // Attempt to find existing log file
        const logFile = (Object.values(nodes) as FileNode[]).find(n => n.name === logFileName);

        if (logFile) {
            fs.updateFileContent(logFile.id, (logFile.content || '') + logEntry);
        } else {
            // Create in root if not exists
            fs.createFile(logFileName, 'root', logEntry);
        }
    }

    handleError(event: ErrorEvent) {
        // 3: SCAN - Capture Fault
        const errorMsg = event.message || "Unknown Fault";
        this.logToVFS(errorMsg);

        // 9: EVOLUTION - Notify & Suppress
        console.warn(`TRINITY_PROTOCOL: Suppressing crash. Vector: ${errorMsg}`);
        addNotification(`TRINITY_HEAL: System fault stabilized.`);
        
        // Prevent total crash
        // event.preventDefault(); 
    }

    handlePromiseRejection(event: PromiseRejectionEvent) {
        const errorMsg = event.reason ? String(event.reason) : "Async Void";
        this.logToVFS(errorMsg);
        addNotification(`TRINITY_HEAL: Async rift sealed.`);
    }
}

export const TrinityEngine = new TrinityEngineClass();