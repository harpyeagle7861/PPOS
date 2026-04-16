
const CACHE_NAME = 'aiza-os-shadow-mesh-v2.0';
const ASSETS = [
  './',
  'index.html',
  'index.tsx',
  'index.css',
];

// --- SHADOW PROTOCOL: MESH NODE INITIALIZATION ---
self.addEventListener('install', (event) => {
  console.log("[SHADOW_NODE] Installing JMN Router Logic...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // PROTOCOL: IMMEDIATE CONTROL
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log("[SHADOW_NODE] JMN V2.0 Active. Device is now a Silent Node.");
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// --- EAGLE 369 ENCRYPTED CHANNEL ---
// This allows the device to act as a routing node even when the tab is dormant.

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'eagle-369-heartbeat') {
    event.waitUntil(meshPulse());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHADOW_PING') {
    console.log("[SHADOW_NODE] Ping received. Triangulating Cognitive Twin...");
    meshPulse();
  }
});

async function meshPulse() {
  const timestamp = Date.now();
  // Simulate encrypted packet routing
  const packetId = `pkg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  
  // In a real JMN, this would P2P broadcast. 
  // Here we simulate the silent background activity.
  console.log(`[JMN_ROUTER] Routing Packet: ${packetId} [PROTOCOL: EAGLE_369]`);
  
  // Check for 'Ghost Data' (Instructions left by the Architect)
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'MESH_UPDATE',
        payload: {
          nodeId: 'SHADOW_UNIT_' + timestamp,
          status: 'RESONANT',
          packet: packetId
        }
      });
    });
  } catch (e) {
    // Silent fail is part of the protocol
  }
}
