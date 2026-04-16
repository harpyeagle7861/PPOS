export class NativeBridge {
    private ws: WebSocket | null = null;
    public connected = false;
    private messageHandlers: Map<number, Function> = new Map();
    private msgId = 0;
    private listeners: ((status: boolean) => void)[] = [];

    connect() {
        if (this.connected) return;
        try {
            this.ws = new WebSocket('ws://localhost:9222/devtools/browser');
            this.ws.onopen = () => {
                this.connected = true;
                console.log("NATIVE_BRIDGE: Connected to Thorium CDP.");
                this.notifyListeners();
            };
            this.ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.id && this.messageHandlers.has(data.id)) {
                    this.messageHandlers.get(data.id)!(data.result);
                    this.messageHandlers.delete(data.id);
                }
            };
            this.ws.onerror = (e) => {
                console.warn("NATIVE_BRIDGE: Connection failed. Ensure Thorium is running with --remote-debugging-port=9222");
                this.connected = false;
                this.notifyListeners();
            };
            this.ws.onclose = () => {
                this.connected = false;
                this.notifyListeners();
            }
        } catch (e) {
            console.error("NATIVE_BRIDGE: Init error", e);
        }
    }

    onStatusChange(callback: (status: boolean) => void) {
        this.listeners.push(callback);
    }

    private notifyListeners() {
        this.listeners.forEach(cb => cb(this.connected));
    }

    async sendCommand(method: string, params: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.connected || !this.ws) {
                reject(new Error("Bridge not connected"));
                return;
            }
            const id = ++this.msgId;
            const payload = { id, method, params };
            this.messageHandlers.set(id, resolve);
            this.ws.send(JSON.stringify(payload));
            
            setTimeout(() => {
                if (this.messageHandlers.has(id)) {
                    this.messageHandlers.delete(id);
                    reject(new Error("Bridge timeout"));
                }
            }, 5000);
        });
    }

    async fetchViaBridge(url: string): Promise<string> {
        // If connected to CDP, we could create a target and fetch.
        // For now, we'll use a robust proxy to bypass headers permanently.
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            return data.contents || "";
        } catch (e) {
            console.error("Bridge fetch error:", e);
            throw new Error("Failed to fetch via bridge proxy");
        }
    }

    async evaluateJS(script: string): Promise<any> {
        if (!this.connected) {
            console.warn("NATIVE_BRIDGE: Cannot evaluate JS, bridge disconnected.");
            return null;
        }
        try {
            const res = await this.sendCommand('Runtime.evaluate', {
                expression: script,
                returnByValue: true
            });
            return res?.result?.value;
        } catch (e) {
            console.error("NATIVE_BRIDGE: JS Evaluation failed", e);
            return null;
        }
    }

    async setHeaders(headers: Record<string, string>) {
        if (!this.connected) return;
        try {
            await this.sendCommand('Network.enable');
            await this.sendCommand('Network.setExtraHTTPHeaders', { headers });
            console.log("NATIVE_BRIDGE: Custom headers injected.");
        } catch (e) {
            console.error("NATIVE_BRIDGE: Failed to set headers", e);
        }
    }
}

export const nativeBridge = new NativeBridge();
