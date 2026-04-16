
import { v4 as uuidv4 } from 'uuid';

// THE INFINITY COOKIE CONFIG
const TOWER_COOKIE_NAME = 'JMN_TOWER_KEY';
const STATION_DB_NAME = 'JMN_GIGA_STATION';
const SIGNAL_FREQ_HZ = 1000; // 1 second heartbeat

export class VirtualTower {
  private static instance: VirtualTower;
  private broadcastChannel: BroadcastChannel;
  private towerID: string;
  private isAlive: boolean = false;

  private constructor() {
    this.broadcastChannel = new BroadcastChannel('jmn_tower_frequency');
    this.towerID = this.getOrSetTowerID();
    this.initializeStation();
  }

  public static getInstance(): VirtualTower {
    if (!VirtualTower.instance) {
      VirtualTower.instance = new VirtualTower();
    }
    return VirtualTower.instance;
  }

  // 1. THE INFINITY COOKIE (Identity)
  private getOrSetTowerID(): string {
    // 1. Try LocalStorage (The Hard Drive)
    const localID = localStorage.getItem('JMN_PERMANENT_ID');
    if (localID) {
      console.log('🔒 IDENTITY LOCKED: Restored ' + localID);
      this.syncCookie(localID);
      return localID;
    }

    // 2. Try Cookie (The Browser Session)
    const cookieID = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${TOWER_COOKIE_NAME}=`));

    if (cookieID) {
      const id = cookieID.split('=')[1];
      localStorage.setItem('JMN_PERMANENT_ID', id); // Lock it to storage
      console.log('🔒 IDENTITY MIGRATED: Restored from Cookie ' + id);
      return id;
    }

    // 3. New Birth (Only happens once per device)
    const newID = 'NODE_ARCHITECT_' + Math.floor(Math.random() * 9000 + 1000);
    localStorage.setItem('JMN_PERMANENT_ID', newID);
    this.syncCookie(newID);
    console.log('🗼 VIRTUAL TOWER: Sovereign Identity Created: ' + newID);
    return newID;
  }

  private syncCookie(id: string) {
      const date = new Date();
      date.setTime(date.getTime() + (369 * 24 * 60 * 60 * 1000));
      document.cookie = `${TOWER_COOKIE_NAME}=${id}; expires=${date.toUTCString()}; path=/; SameSite=Strict; Secure`;
  }

  // 2. THE STATION BUILDER (Database)
  private async initializeStation() {
    console.log('🏗️ VIRTUAL TOWER: Constructing Giga Station (IndexedDB)...');
    
    const request = indexedDB.open(STATION_DB_NAME, 1);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      // Create stores for Giants, Chats, and System State
      if (!db.objectStoreNames.contains('pomegranate_memory')) {
        db.createObjectStore('pomegranate_memory', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('logos_vault')) {
        db.createObjectStore('logos_vault', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      console.log('✅ VIRTUAL TOWER: Station Operational. Memory Unlocked.');
      this.isAlive = true;
      this.startBroadcasting();
    };
  }

  // 3. THE SIGNAL EMITTER (Hardware Simulation)
  private startBroadcasting() {
    setInterval(() => {
      if (!this.isAlive) return;

      const signalPacket = {
        type: 'TOWER_BEACON',
        towerId: this.towerID,
        timestamp: Date.now(),
        status: 'ONLINE_STABLE'
      };

      // Broadcast to local tabs (The Mesh)
      this.broadcastChannel.postMessage(signalPacket);
      
      // Update the "Nose" or Radar if needed
      // console.log('📡 VIRTUAL TOWER: Emitting Signal...', signalPacket);
    }, SIGNAL_FREQ_HZ);

    // Listen for other Towers
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'TOWER_BEACON' && event.data.towerId !== this.towerID) {
        // console.log(`📡 VIRTUAL TOWER: Signal Detected from Node ${event.data.towerId}`);
        // Here we can trigger the "Connect" logic automatically
        window.dispatchEvent(new CustomEvent('JMN_TOWER_SIGNAL', { detail: event.data }));
      }
    };
  }

  // 4. THE ANYWHERE DOOR (State Teleportation)
  public async saveState(key: string, data: any) {
    // Saves data to the Station (IndexedDB) so it survives reload
    const dbRequest = indexedDB.open(STATION_DB_NAME);
    dbRequest.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction('pomegranate_memory', 'readwrite');
      const store = tx.objectStore('pomegranate_memory');
      store.put({ id: key, data: data, timestamp: Date.now() });
    };
  }

  public async loadState(key: string): Promise<any> {
    return new Promise((resolve) => {
      const dbRequest = indexedDB.open(STATION_DB_NAME);
      dbRequest.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('pomegranate_memory', 'readonly');
        const store = tx.objectStore('pomegranate_memory');
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result ? getReq.result.data : null);
      };
    });
  }
}

// Auto-start the Tower on import
export const Tower = VirtualTower.getInstance();
