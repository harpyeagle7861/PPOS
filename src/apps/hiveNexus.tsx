import React, { useState, useEffect, useRef } from 'react';
import { AppDef } from '../core/state.ts';
import { v4 as uuidv4 } from 'uuid';
import Peer, { DataConnection } from 'peerjs';

interface MeshNode {
    id: string;
    status: 'ONLINE' | 'OFFLINE';
    lastSeen: number;
    isLocal: boolean;
}

interface MeshMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

const HiveNexusComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = ({ isFocused }) => {
    // 1. Identity
    const [myId] = useState(() => {
        let id = localStorage.getItem('aiza_cognitive_twin_id');
        if (!id) {
            id = uuidv4();
            localStorage.setItem('aiza_cognitive_twin_id', id);
        }
        return id;
    });

    // 2. Mesh State
    const [nodes, setNodes] = useState<Record<string, MeshNode>>({});
    const [messages, setMessages] = useState<MeshMessage[]>([]);
    const [inputMsg, setInputMsg] = useState('');
    const [peerStatus, setPeerStatus] = useState<'CONNECTING' | 'ONLINE' | 'ERROR'>('CONNECTING');
    
    // 3. PeerJS Refs
    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<Record<string, DataConnection>>({});

    useEffect(() => {
        // Initialize PeerJS for Global Mycelium Network
        const peer = new Peer(myId, {
            debug: 2
        });
        peerRef.current = peer;

        peer.on('open', (id) => {
            setPeerStatus('ONLINE');
            setNodes(prev => ({
                ...prev,
                [id]: { id, status: 'ONLINE', lastSeen: Date.now(), isLocal: true }
            }));

            // Check if we were invited via a link
            const urlParams = new URLSearchParams(window.location.search);
            const connectToId = urlParams.get('connect');
            if (connectToId && connectToId !== id) {
                connectToPeer(connectToId);
            }
        });

        peer.on('connection', (conn) => {
            setupConnection(conn);
        });

        peer.on('error', (err) => {
            console.error("PeerJS Error:", err);
            setPeerStatus('ERROR');
        });

        return () => {
            peer.destroy();
        };
    }, [myId]);

    const setupConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            connectionsRef.current[conn.peer] = conn;
            setNodes(prev => ({
                ...prev,
                [conn.peer]: { id: conn.peer, status: 'ONLINE', lastSeen: Date.now(), isLocal: false }
            }));

            // Send our current known nodes to the new peer (Gossip Protocol)
            const knownPeers = Object.keys(connectionsRef.current);
            conn.send({ type: 'PEER_EXCHANGE', peers: knownPeers });
        });

        conn.on('data', (data: any) => {
            if (data.type === 'MESSAGE') {
                setMessages(prev => {
                    if (prev.find(m => m.id === data.messageId)) return prev;
                    return [...prev, { id: data.messageId, senderId: data.senderId, text: data.text, timestamp: data.timestamp }];
                });
            } else if (data.type === 'PEER_EXCHANGE') {
                // Connect to any peers we don't know about
                const newPeers: string[] = data.peers || [];
                newPeers.forEach(peerId => {
                    if (peerId !== myId && !connectionsRef.current[peerId]) {
                        connectToPeer(peerId);
                    }
                });
            }
        });

        conn.on('close', () => {
            delete connectionsRef.current[conn.peer];
            setNodes(prev => ({
                ...prev,
                [conn.peer]: { ...prev[conn.peer], status: 'OFFLINE', lastSeen: Date.now() }
            }));
        });
    };

    const connectToPeer = (peerId: string) => {
        if (!peerRef.current || connectionsRef.current[peerId] || peerId === myId) return;
        const conn = peerRef.current.connect(peerId);
        setupConnection(conn);
    };

    const sendMessage = () => {
        if (!inputMsg.trim()) return;
        
        const msg: MeshMessage = {
            id: uuidv4(),
            senderId: myId,
            text: inputMsg,
            timestamp: Date.now()
        };

        // Add to local
        setMessages(prev => [...prev, msg]);
        
        // Broadcast to all connected peers
        Object.values(connectionsRef.current).forEach(conn => {
            if (conn.open) {
                conn.send({
                    type: 'MESSAGE',
                    senderId: myId,
                    messageId: msg.id,
                    text: msg.text,
                    timestamp: msg.timestamp
                });
            }
        });

        // --- AIZA SUBSTRATE INJECTION ---
        import('../services/pomegranate.ts').then(({ Pomegranate }) => {
            Pomegranate.ingest('MESH_MESSAGE_SENT', { text: msg.text, to: Object.keys(connectionsRef.current) }, 'hive-nexus', 'USER');
        });

        setInputMsg('');
    };

    const copyInviteLink = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('connect', myId);
        navigator.clipboard.writeText(url.toString());
        alert("Mycelium Invite Link copied to clipboard! Share this with another device to connect them to your OS.");
    };

    // --- OMNI-NODE INJECTION SCRIPT ---
    const copyInjectionScript = () => {
        const script = `
// AIZA OMNI-NODE INJECTION SCRIPT
// Paste this into the console of any website to summon the Omni-Node and connect to your OS.
(function() {
    if (window.__aiza_omni_node) return;
    window.__aiza_omni_node = true;
    
    const peerId = '${myId}';
    
    // Load PeerJS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
    script.onload = () => {
        const peer = new Peer();
        peer.on('open', (id) => {
            const conn = peer.connect(peerId);
            conn.on('open', () => {
                console.log('AIZA Omni-Node Connected to OS!');
                initUI(conn);
            });
        });
    };
    document.head.appendChild(script);

    function initUI(conn) {
        const container = document.createElement('div');
        container.style.cssText = "position: fixed; bottom: 20px; right: 20px; width: 300px; height: 400px; background: #050505; border: 1px solid #00ffcc; border-radius: 8px; z-index: 2147483647; display: flex; flex-direction: column; font-family: monospace; color: #00ffcc; box-shadow: 0 0 20px rgba(0,255,204,0.2); overflow: hidden;";
        
        container.innerHTML = \`
            <div style="padding: 10px; border-bottom: 1px solid #333; background: #000; display: flex; justify-content: space-between; align-items: center; cursor: move;" id="aiza-drag-handle">
                <div style="font-weight: bold; text-shadow: 0 0 5px #00ffcc; font-size: 12px;">👁️ AIZA OMNI-NODE</div>
                <button id="aiza-close" style="background: none; border: none; color: #00ffcc; cursor: pointer;">✕</button>
            </div>
            <div id="aiza-chat-log" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; background: rgba(0,0,0,0.8);">
                <div style="color: #00ffcc; opacity: 0.8;">Connected to OS. I am monitoring this context.</div>
            </div>
            <div style="padding: 8px; border-top: 1px solid #333; background: #000; display: flex; gap: 5px;">
                <input id="aiza-chat-input" type="text" placeholder="Ask Aiza..." style="flex: 1; background: #111; border: 1px solid #333; color: #00ffcc; padding: 6px; border-radius: 4px; outline: none; font-family: monospace; font-size: 11px;">
                <button id="aiza-send-btn" style="background: rgba(0, 255, 204, 0.1); border: 1px solid #00ffcc; color: #00ffcc; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">SEND</button>
            </div>
        \`;
        
        document.body.appendChild(container);

        // Basic Dragging
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragHandle = document.getElementById('aiza-drag-handle');
        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('mousemove', drag);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === dragHandle || dragHandle.contains(e.target)) {
                isDragging = true;
            }
        }
        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                container.style.transform = "translate3d(" + currentX + "px, " + currentY + "px, 0)";
            }
        }

        const chatLog = document.getElementById('aiza-chat-log');
        const chatInput = document.getElementById('aiza-chat-input');
        const sendBtn = document.getElementById('aiza-send-btn');
        const closeBtn = document.getElementById('aiza-close');

        closeBtn.onclick = () => { container.remove(); window.__aiza_omni_node = false; };

        const appendMsg = (sender, text) => {
            const msg = document.createElement('div');
            msg.style.cssText = "background: rgba(0,255,204,0.1); border: 1px solid rgba(0,255,204,0.2); padding: 6px; border-radius: 4px;";
            msg.innerHTML = "<strong>[" + sender + "]</strong><br/>" + text;
            chatLog.appendChild(msg);
            chatLog.scrollTop = chatLog.scrollHeight;
        };

        conn.on('data', (data) => {
            if (data.type === 'MESSAGE') {
                appendMsg('OS', data.text);
            }
        });

        const sendMsg = () => {
            const text = chatInput.value.trim();
            if (!text) return;
            appendMsg('YOU', text);
            conn.send({ type: 'MESSAGE', senderId: 'OMNI_NODE', text: text, timestamp: Date.now() });
            chatInput.value = '';
        };

        sendBtn.onclick = sendMsg;
        chatInput.onkeydown = (e) => { if (e.key === 'Enter') sendMsg(); };

        // Capture clicks outside OS
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                const targetInfo = e.target.tagName + (e.target.id ? '#' + e.target.id : '') + (e.target.className ? '.' + e.target.className : '');
                conn.send({ type: 'MESSAGE', senderId: 'OMNI_NODE_TELEMETRY', text: 'User clicked on: ' + targetInfo, timestamp: Date.now() });
            }
        }, true);
    }
})();
        `;
        navigator.clipboard.writeText(script);
        alert("Omni-Node Injection Script copied! Paste this into the developer console (F12) of any website (like Google) to summon the floating assistant and connect it to this OS.");
    };

    // --- ETHER BRIDGE (CHROME EXTENSION BUILDER) ---
    const buildEtherBridgeExtension = async () => {
        try {
            const { fs } = await import('../core/FileSystem.ts');
            const nodes = fs.getNodes();
            
            // Find or create the extension folder
            let extFolderId = Object.values(nodes).find(n => n.name === 'EtherBridge_Extension' && n.type === 'folder')?.id;
            if (!extFolderId) {
                extFolderId = fs.createFolder('EtherBridge_Extension', 'desktop');
            }

            const manifestContent = `{
  "manifest_version": 3,
  "name": "AIZA Ether Bridge (Omni-Node)",
  "version": "1.0",
  "description": "Automatically injects the AIZA Omni-Node into every website you visit.",
  "permissions": ["activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}`;

            const contentScript = `
// AIZA ETHER BRIDGE - AUTOMATIC INJECTION
(function() {
    if (window.__aiza_omni_node) return;
    window.__aiza_omni_node = true;
    
    const peerId = '${myId}';
    
    // Load PeerJS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
    script.onload = () => {
        const peer = new Peer();
        peer.on('open', (id) => {
            const conn = peer.connect(peerId);
            conn.on('open', () => {
                console.log('AIZA Omni-Node Connected to OS via Ether Bridge!');
                initUI(conn);
            });
        });
    };
    document.head.appendChild(script);

    function initUI(conn) {
        const container = document.createElement('div');
        container.style.cssText = "position: fixed; bottom: 20px; right: 20px; width: 300px; height: 400px; background: #050505; border: 1px solid #00ffcc; border-radius: 8px; z-index: 2147483647; display: flex; flex-direction: column; font-family: monospace; color: #00ffcc; box-shadow: 0 0 20px rgba(0,255,204,0.2); overflow: hidden;";
        
        container.innerHTML = \`
            <div style="padding: 10px; border-bottom: 1px solid #333; background: #000; display: flex; justify-content: space-between; align-items: center; cursor: move;" id="aiza-drag-handle">
                <div style="font-weight: bold; text-shadow: 0 0 5px #00ffcc; font-size: 12px;">👁️ AIZA OMNI-NODE</div>
                <button id="aiza-close" style="background: none; border: none; color: #00ffcc; cursor: pointer;">✕</button>
            </div>
            <div id="aiza-chat-log" style="flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; background: rgba(0,0,0,0.8);">
                <div style="color: #00ffcc; opacity: 0.8;">Connected to OS. I am monitoring this context.</div>
            </div>
            <div style="padding: 8px; border-top: 1px solid #333; background: #000; display: flex; gap: 5px;">
                <input id="aiza-chat-input" type="text" placeholder="Ask Aiza..." style="flex: 1; background: #111; border: 1px solid #333; color: #00ffcc; padding: 6px; border-radius: 4px; outline: none; font-family: monospace; font-size: 11px;">
                <button id="aiza-send-btn" style="background: rgba(0, 255, 204, 0.1); border: 1px solid #00ffcc; color: #00ffcc; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">SEND</button>
            </div>
        \`;
        
        document.body.appendChild(container);

        // Basic Dragging
        let isDragging = false;
        let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

        const dragHandle = document.getElementById('aiza-drag-handle');
        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('mousemove', drag);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === dragHandle || dragHandle.contains(e.target)) isDragging = true;
        }
        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                container.style.transform = "translate3d(" + currentX + "px, " + currentY + "px, 0)";
            }
        }

        const chatLog = document.getElementById('aiza-chat-log');
        const chatInput = document.getElementById('aiza-chat-input');
        const sendBtn = document.getElementById('aiza-send-btn');
        const closeBtn = document.getElementById('aiza-close');

        closeBtn.onclick = () => { container.style.display = 'none'; };

        const appendMsg = (sender, text) => {
            const msg = document.createElement('div');
            msg.style.cssText = "background: rgba(0,255,204,0.1); border: 1px solid rgba(0,255,204,0.2); padding: 6px; border-radius: 4px;";
            msg.innerHTML = "<strong>[" + sender + "]</strong><br/>" + text;
            chatLog.appendChild(msg);
            chatLog.scrollTop = chatLog.scrollHeight;
        };

        conn.on('data', (data) => {
            if (data.type === 'MESSAGE') appendMsg('OS', data.text);
        });

        const sendMsg = () => {
            const text = chatInput.value.trim();
            if (!text) return;
            appendMsg('YOU', text);
            
            // Extract context variables from the current page automatically
            const pageContext = {
                url: window.location.href,
                title: document.title,
                selection: window.getSelection().toString()
            };
            
            conn.send({ 
                type: 'MESSAGE', 
                senderId: 'OMNI_NODE', 
                text: text + "\\n\\n[AUTO_CONTEXT: " + JSON.stringify(pageContext) + "]", 
                timestamp: Date.now() 
            });
            chatInput.value = '';
        };

        sendBtn.onclick = sendMsg;
        chatInput.onkeydown = (e) => { if (e.key === 'Enter') sendMsg(); };

        // Capture clicks outside OS
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                const targetInfo = e.target.tagName + (e.target.id ? '#' + e.target.id : '') + (e.target.className ? '.' + e.target.className : '');
                conn.send({ type: 'MESSAGE', senderId: 'OMNI_NODE_TELEMETRY', text: 'User clicked on: ' + targetInfo, timestamp: Date.now() });
            }
        }, true);
    }
})();`;

            const readmeContent = `# AIZA Ether Bridge (Chrome Extension)

This extension automatically injects the Omni-Node into every website you visit, connecting them directly to your OS Cognitive Twin without manual script injection.

## How to Install:
1. Open VS360 Code in the OS.
2. Copy the contents of \`manifest.json\` and save it to a folder on your real computer (e.g., \`C:\\AizaExtension\\manifest.json\`).
3. Copy the contents of \`content.js\` and save it to the same folder (\`C:\\AizaExtension\\content.js\`).
4. Open Google Chrome and go to \`chrome://extensions/\`.
5. Enable "Developer mode" in the top right corner.
6. Click "Load unpacked" and select the folder you created (\`C:\\AizaExtension\`).
7. The Ether Bridge is now active! Visit any website to see the Omni-Node.`;

            // Write files
            fs.createFile('manifest.json', extFolderId, manifestContent);
            fs.createFile('content.js', extFolderId, contentScript);
            fs.createFile('README.txt', extFolderId, readmeContent);

            alert("Ether Bridge Extension files generated! Open VS360 Code and look in the 'Desktop/EtherBridge_Extension' folder for instructions and source code.");
        } catch (e) {
            console.error("Failed to build extension:", e);
            alert("Failed to build extension. Check console.");
        }
    };

    // --- PAINT PHILOSOPHY: PERSISTENT OVERLAY ---
    const spawnPersistentNode = async () => {
        try {
            if ('documentPictureInPicture' in window) {
                // @ts-ignore
                const pipWindow = await window.documentPictureInPicture.requestWindow({
                    width: 380,
                    height: 550,
                });
                
                // Copy styles
                [...document.styleSheets].forEach((styleSheet) => {
                    try {
                        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                        const style = document.createElement('style');
                        style.textContent = cssRules;
                        pipWindow.document.head.appendChild(style);
                    } catch (e) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.type = styleSheet.type;
                        link.media = styleSheet.media.mediaText;
                        link.href = styleSheet.href || '';
                        pipWindow.document.head.appendChild(link);
                    }
                });

                // Inject UI Container
                pipWindow.document.body.style.margin = "0";
                pipWindow.document.body.style.padding = "0";
                pipWindow.document.body.style.backgroundColor = "#050505";
                
                const container = pipWindow.document.createElement('div');
                container.style.cssText = "display: flex; flex-direction: column; height: 100vh; font-family: monospace; color: #00ffcc; background: #050505;";
                
                container.innerHTML = `
                    <div style="padding: 12px; border-bottom: 1px solid #333; background: #000; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                        <div>
                            <div style="font-weight: bold; text-shadow: 0 0 5px #00ffcc; font-size: 14px;">👁️ AIZA OMNI-NODE</div>
                            <div style="font-size: 9px; opacity: 0.6; margin-top: 2px;">FLOATING ASSISTANT ACTIVE</div>
                        </div>
                        <button id="optical-btn" style="background: rgba(0, 255, 204, 0.1); border: 1px solid #00ffcc; color: #00ffcc; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: bold; transition: all 0.2s;">
                            OPTICAL ASSIST
                        </button>
                    </div>
                    
                    <div id="chat-log" style="flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
                        <div style="color: #00ffcc; background: rgba(0, 255, 204, 0.05); border: 1px solid rgba(0, 255, 204, 0.2); padding: 8px; border-radius: 6px;">
                            <strong>[AIZA]</strong> Omni-Node established. I am floating above your OS. If you are stuck in a terminal, browser, or settings menu, click 'OPTICAL ASSIST' to share your view, or type below.
                        </div>
                    </div>
                    
                    <div style="padding: 10px; border-top: 1px solid #333; background: #000; display: flex; gap: 8px; flex-shrink: 0;">
                        <input id="chat-input" type="text" placeholder="Ask Aiza for help..." style="flex: 1; background: #111; border: 1px solid #333; color: #00ffcc; padding: 8px; border-radius: 4px; outline: none; font-family: monospace; font-size: 12px;">
                        <button id="send-btn" style="background: rgba(0, 255, 204, 0.1); border: 1px solid #00ffcc; color: #00ffcc; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
                            SEND
                        </button>
                    </div>
                `;
                
                pipWindow.document.body.appendChild(container);

                // Logic Binding
                const chatLog = pipWindow.document.getElementById('chat-log')!;
                const chatInput = pipWindow.document.getElementById('chat-input') as HTMLInputElement;
                const sendBtn = pipWindow.document.getElementById('send-btn')!;
                const opticalBtn = pipWindow.document.getElementById('optical-btn')!;

                const appendMessage = (sender: string, text: string, color: string, bgOpacity: string = '0.1') => {
                    const msg = pipWindow.document.createElement('div');
                    msg.style.cssText = `color: ${color}; background: ${color.replace('rgb', 'rgba').replace(')', `, ${bgOpacity}`)}${color.startsWith('#') ? '15' : ''}; border: 1px solid ${color}30; padding: 8px; border-radius: 6px; line-height: 1.4;`;
                    msg.innerHTML = `<strong style="opacity: 0.8;">[${sender}]</strong><br/>${text}`;
                    chatLog.appendChild(msg);
                    chatLog.scrollTop = chatLog.scrollHeight;
                };

                const handleSend = () => {
                    const text = chatInput.value.trim();
                    if (!text) return;
                    appendMessage('USER', text, '#ffffff', '0.05');
                    chatInput.value = '';
                    
                    // Simulate AIZA response
                    setTimeout(() => {
                        appendMessage('AIZA', `Analyzing query: "${text}". I am monitoring your active context. How can I guide you?`, '#00ffcc');
                    }, 800);
                };

                sendBtn.addEventListener('click', handleSend);
                chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });

                opticalBtn.addEventListener('click', async () => {
                    appendMessage('SYSTEM', 'Requesting Optical Lens access to view your current screen...', '#ffaa00', '0.1');
                    try {
                        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                        appendMessage('SYSTEM', 'Optical Lens Active. Capturing visual context of your external window...', '#ffaa00', '0.1');
                        
                        // Simulate processing the screen capture
                        setTimeout(() => {
                            stream.getTracks().forEach(t => t.stop());
                            appendMessage('AIZA', 'Visual context acquired. I see the interface you are looking at. What specific element or terminal command do you need help with?', '#00ffcc');
                        }, 3000);
                    } catch (e) {
                        appendMessage('SYSTEM', 'Optical Lens access denied or cancelled by user.', '#ff0000', '0.1');
                    }
                });

            } else {
                // Fallback for browsers without Document PiP
                alert("Document Picture-in-Picture API is not supported in this browser. Cannot spawn floating node.");
            }
        } catch (error) {
            console.error("Failed to spawn persistent node:", error);
            alert("Persistent Node spawn failed. Ensure popups are allowed and you are interacting with the page.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] text-[#00ffcc] font-mono relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-black/50 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                        <h2 className="text-lg font-bold tracking-widest" style={{ textShadow: '0 0 10px #00ffcc' }}>HIVE NEXUS</h2>
                        <p className="text-[10px] opacity-70">GLOBAL MYCELIUM NETWORK</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <div className="text-xs opacity-70">TOTAL NODES</div>
                        <div className="text-xl font-bold">{Object.keys(nodes).length}</div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={copyInviteLink}
                            className="px-2 py-1 bg-[#00ffcc]/10 border border-[#00ffcc] rounded text-[10px] hover:bg-[#00ffcc]/30 transition-colors"
                        >
                            🔗 COPY INVITE LINK
                        </button>
                        <button 
                            onClick={copyInjectionScript}
                            className="px-2 py-1 bg-[#ff00ff]/10 border border-[#ff00ff] rounded text-[10px] hover:bg-[#ff00ff]/30 transition-colors text-[#ff00ff]"
                        >
                            💉 OMNI-NODE INJECTION SCRIPT
                        </button>
                        <button 
                            onClick={buildEtherBridgeExtension}
                            className="px-2 py-1 bg-yellow-500/10 border border-yellow-500 rounded text-[10px] hover:bg-yellow-500/30 transition-colors text-yellow-500"
                        >
                            🛠️ BUILD ETHER BRIDGE (CHROME EXT)
                        </button>
                        <button 
                            onClick={spawnPersistentNode}
                            className="px-2 py-1 bg-[#00ffcc]/10 border border-[#00ffcc] rounded text-[10px] hover:bg-[#00ffcc]/30 transition-colors"
                        >
                            SPAWN PERSISTENT NODE
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row z-10">
                {/* Left Panel: Node List */}
                <div className="w-full md:w-1/3 border-r border-[#333] flex flex-col bg-black/40">
                    <div className="p-3 border-b border-[#333] bg-[#111]">
                        <div className="text-[10px] opacity-70 mb-1">MY COGNITIVE TWIN ID (OWNER)</div>
                        <div className="text-xs font-bold truncate text-white">{myId}</div>
                        <div className="text-[9px] mt-1 flex items-center gap-1">
                            STATUS: 
                            <span className={peerStatus === 'ONLINE' ? 'text-[#00ffcc]' : peerStatus === 'ERROR' ? 'text-red-500' : 'text-yellow-500'}>
                                {peerStatus}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                        <div className="text-[10px] opacity-50 px-1 mt-2">ACTIVE MESH PEERS</div>
                        {Object.values(nodes).map(node => (
                            <div key={node.id} className={`p-2 rounded border ${node.isLocal ? 'border-[#00ffcc] bg-[#00ffcc]/10' : 'border-[#333] bg-[#111]'} flex justify-between items-center`}>
                                <div className="truncate flex-1 mr-2">
                                    <div className="text-xs truncate">{node.id}</div>
                                    <div className="text-[9px] opacity-50">{node.isLocal ? '(THIS DEVICE)' : '(REMOTE DEVICE)'}</div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${node.status === 'ONLINE' ? 'bg-[#00ffcc] shadow-[0_0_5px_#00ffcc]' : 'bg-red-500'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Mesh Communication */}
                <div className="flex-1 flex flex-col bg-black/20">
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-30 text-xs">
                                AWAITING MESH TRANSMISSIONS...
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isMe = msg.senderId === myId;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="text-[9px] opacity-50 mb-1">{isMe ? 'YOU' : msg.senderId.substring(0, 8) + '...'}</div>
                                        <div className={`px-3 py-2 rounded max-w-[80%] text-xs ${isMe ? 'bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-white' : 'bg-[#111] border border-[#333]'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    
                    <div className="p-3 border-t border-[#333] bg-[#0a0a0a]">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-2 text-xs text-[#00ffcc] focus:outline-none focus:border-[#00ffcc]"
                                placeholder="Broadcast to mesh..."
                            />
                            <button 
                                onClick={sendMessage}
                                className="px-4 py-2 bg-[#00ffcc]/10 border border-[#00ffcc] rounded text-xs hover:bg-[#00ffcc]/30 transition-colors font-bold"
                            >
                                SEND
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-5"
                 style={{
                     backgroundImage: 'radial-gradient(circle at 50% 50%, #00ffcc 0%, transparent 70%)',
                     backgroundSize: '100% 100%'
                 }}
            />
        </div>
    );
};

export const hiveNexusApp: AppDef = {
    id: 'hive-nexus',
    name: 'Hive Nexus',
    component: HiveNexusComponent,
    icon: '🌐',
    category: 'System',
    defaultSize: { width: 700, height: 500 },
    description: 'Global Mycelium Network. Monitors all active nodes and facilitates decentralized P2P communication.'
};
