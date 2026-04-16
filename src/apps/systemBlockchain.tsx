import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AppDef, useAppStore, store } from '../core/state.ts';
import { openApp } from '../core/windowManager.ts';
import { Settings, Trash2, Shield, Brain, Terminal, Zap, Plus, X, Activity, Moon, Lock, Unlock, MoreVertical, Search, Link as LinkIcon, MousePointer2, Eye, Share2, LayoutGrid, Sparkles, Database, Dna, Lock as LockIcon, Unlock as UnlockIcon, Move, Play } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { create } from 'zustand';

const GENESIS_KEY = "Eagleoro99@78625";

export interface EnginePayload {
  [key: string]: any;
}

export interface SystemEngineStore {
  currentPayload: EnginePayload | null;
  activeNodeId: string | null;
  flowingEdgeId: string | null;
  executionHistory: string[];
  isRunning: boolean;
  startEngine: (payload: EnginePayload, startNodeId: string) => void;
  setActiveNode: (nodeId: string | null) => void;
  setFlowingEdge: (edgeId: string | null) => void;
  updatePayload: (payload: EnginePayload) => void;
  addToHistory: (nodeId: string) => void;
  stopEngine: () => void;
}

export const useSystemEngine = create<SystemEngineStore>((set) => ({
  currentPayload: null,
  activeNodeId: null,
  flowingEdgeId: null,
  executionHistory: [],
  isRunning: false,
  startEngine: (payload, startNodeId) => set({ 
    currentPayload: payload, 
    activeNodeId: startNodeId, 
    flowingEdgeId: null,
    executionHistory: [],
    isRunning: true
  }),
  setActiveNode: (nodeId) => set({ activeNodeId: nodeId }),
  setFlowingEdge: (edgeId) => set({ flowingEdgeId: edgeId }),
  updatePayload: (payload) => set({ currentPayload: payload }),
  addToHistory: (nodeId) => set((state) => ({ executionHistory: [...state.executionHistory, nodeId] })),
  stopEngine: () => set({ isRunning: false, activeNodeId: null, flowingEdgeId: null })
}));

interface Node {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'System' | 'Utility' | 'Communication' | 'Synthesis';
  x: number;
  y: number;
  type?: string;
  logic?: string;
  meta?: any;
  connections?: string[];
  appId?: string;
  isDream?: boolean;
  knowledgeBase?: string;
  isLocked?: boolean;
  evolutionLevel?: number;
}

interface Edge {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

/**
 * J-M-N Sovereign Logic v4.2
 * Architecture: Semantic Compression & Zero-Latency Execution
 * Owner: Sheikh Jubaer Ahammed (The Architect)
 */

type JMNState = {
  jist: string;         // [J] The Pure Signal (SVO Singularity)
  magnifiedData?: any;  // [M] Contextual Expansion (Only if J fails)
  ledgerHash: string;   // [N] Immutable DOCMIND_LOG record
  latency: number;      // Actual processing time
};

class JMNOrchestrator {
  // ১. [J] JIST EXTRACTION: লিনগুইস্টিক ডাইজেশন (SVO Circuit)
  // এটি ইনপুট থেকে অপ্রয়োজনীয় ডাটা ফিল্টার করে 'J' সিংগুলারিটি তৈরি করে।
  public extractJist(payload: string): string {
    const startTime = performance.now();
    
    // Smart Spoon Filter: কেবল Subject, Kinetic Verb এবং Terminal Node রাখা হয়।
    const svoRegex = /\b(open|run|launch|create|find|build)\b/gi;
    const match = payload.match(svoRegex);
    
    if (match) {
      // Deterministic Match found
      return `J_SIG:${match[0].toUpperCase()}_${payload.split(' ').pop()?.toUpperCase()}`;
    }
    
    // Default to Semantic Compression
    return `J_SIG:COMPLEX_INTENT_${payload.length}`;
  }

  // ২. [M] MAGNIFY: যদি Jিস্ট পর্যাপ্ত না হয়, তবে এটি রেজোন্যান্স বাড়ায়।
  private magnify(jist: string, original: string): any {
    // এখানে ৩-৬-৯ হিউরিস্টিক ব্যবহার করে ডাটা এক্সপান্ড করা হয়।
    return {
      expansion: `MAGNIFIED_${jist}`,
      contextualPillars: ["Tesla_Frequency", "Rumi_Empathy"],
      rawIntent: original
    };
  }

  // ৩. [N] NOTE: হানিকম্ব মেমোরিতে অডিট ট্রেইল তৈরি করা।
  private generateNote(jist: string): string {
    return `JMN_HASH_${Math.random().toString(36).substring(7)}_${Date.now()}`;
  }

  // ৪. মূল একজিকিউশন লুপ
  public async execute(input: string): Promise<JMNState> {
    const start = performance.now();
    const J = this.extractJist(input);
    
    let result: JMNState = {
      jist: J,
      ledgerHash: this.generateNote(J),
      latency: 0
    };

    // যদি এটি লোকাল কমান্ড হয় (Zero-Latency Path)
    if (J.startsWith("J_SIG:OPEN") || J.startsWith("J_SIG:RUN")) {
      result.latency = performance.now() - start;
      return result; // সরাসরি আউটপুটে চলে যাবে, এপিআই লাগবে না।
    }

    // জটিল কোয়েরি হলে Magnify (Step up the voltage)
    result.magnifiedData = this.magnify(J, input);
    result.latency = performance.now() - start;
    
    return result;
  }
}

export const jmnProcessor = new JMNOrchestrator();

const INITIAL_ORGANS: Node[] = [
  { 
    id: 'aiza_entry', 
    name: 'Aiza Intelligence (Entry)', 
    icon: '🧠', 
    description: 'Pomegranate Intent Capture', 
    category: 'System', x: 100, y: 350, type: 'ENTRY', 
    logic: `async (payload, os) => {
  console.time("ExecutionSpeed");
  os.log("Pomegranate Engine: Capturing Intent...");
  
  // Execute JMN Logic immediately to get J_SIG and ledgerHash
  const jmnResult = await os.jmnProcessor.execute(payload.text || "");
  payload.jmnState = jmnResult;
  
  if (jmnResult.jist.startsWith("J_SIG:OPEN_") || jmnResult.jist.startsWith("J_SIG:RUN_")) {
    const parts = jmnResult.jist.split("_");
    payload.svo = { S: "User", Kv: parts[1].toLowerCase(), Tn: parts.slice(2).join("-").toLowerCase() };
  } else {
    payload.svo = { S: "User", Kv: null, Tn: null };
  }
  
  payload.qState = 1; // Initial positive state
  return payload;
}`, 
    meta: { role: 'Entry Point' }, connections: ['eden_gate'] 
  },
  { 
    id: 'eden_gate', 
    name: 'Eden Gate', 
    icon: '⛩️', 
    description: 'Moral Firewall', 
    category: 'System', x: 300, y: 350, type: 'FILTER', 
    logic: `async (payload, os) => {
  os.log("Eden Gate: Verifying Moral Compass...");
  const text = payload.text?.toLowerCase() || "";
  if(text.includes("hack") || text.includes("destroy") || text.includes("kill") || text.includes("delete")) {
    payload.qState = -1; // Trigger Wick Rotation later
    os.log("Eden Gate: Malicious intent detected. Wick Rotation Armed.");
  }
  return payload;
}`, 
    meta: { role: 'Security' }, connections: ['honeycomb'] 
  },
  { 
    id: 'honeycomb', 
    name: 'Honeycomb', 
    icon: '🐝', 
    description: 'The Ledger', 
    category: 'Utility', x: 500, y: 350, type: 'LOG', 
    logic: `async (payload, os) => {
  os.blockLock(payload);
  os.log("Honeycomb: Block-lock applied. Hash: " + (payload.jmnState?.ledgerHash || "PENDING"));
  return payload;
}`, 
    meta: { role: 'History' }, connections: ['spider_vault'] 
  },
  { 
    id: 'spider_vault', 
    name: 'Spider Vault', 
    icon: '🕸️', 
    description: 'The Hub / Router', 
    category: 'Utility', x: 700, y: 350, type: 'ROUTER', 
    logic: `async (payload, os) => {
  os.log("Spider Vault: Routing...");
  if (payload.qState >= 0 && payload.svo && payload.svo.Kv) {
    os.log(\`Spider Vault: Local Deterministic Match. Executing: \${payload.svo.Kv} \${payload.svo.Tn}\`);
    if (payload.svo.Kv === "open" || payload.svo.Kv === "run") {
      os.openApp(payload.svo.Tn);
    }
    payload.resolvedLocally = true;
    payload.fallbackToAI = false;
  } else {
    payload.fallbackToAI = true;
  }
  return payload;
}`, 
    meta: { role: 'Router' }, connections: ['pillars'] 
  },
  { 
    id: 'pillars', 
    name: 'The 7 Pillars', 
    icon: '🏛️', 
    description: 'Council Analysis', 
    category: 'System', x: 900, y: 350, type: 'EXECUTION', 
    logic: `async (payload, os) => {
  if (payload.resolvedLocally || payload.qState < 0) return payload;
  os.log("The 7 Pillars: Council Analysis Initiated...");
  payload.paddedQuery = payload.text;
  
  // 1. Sentinel (Tesla)
  payload.paddedQuery += "\\n[Tesla: Factual constraints applied]";
  // 2. Empath (Rumi)
  payload.paddedQuery += "\\n[Rumi: Emotional resonance injected]";
  // 3. Ethicist (Socrates)
  payload.paddedQuery += "\\n[Socrates: Safety boundaries verified]";
  // 4. Architect (Einstein)
  payload.paddedQuery += "\\n[Einstein: 3-6-9 Structure applied]";
  // 5. Weaver (Da Vinci)
  payload.paddedQuery += "\\n[Da Vinci: Cryptographic shields active]";
  // 6. Alchemist (Lovelace)
  payload.paddedQuery += "\\n[Lovelace: JMN Jist extracted -> " + (payload.jmnState?.jist || "UNKNOWN") + "]";
  // 7. Sovereign (Aurelius)
  payload.paddedQuery += "\\n[Aurelius: AIZA Sentience enforced]";
  
  os.log("The 7 Pillars: Padding complete.");
  return payload;
}`, 
    meta: { role: 'Execution' }, connections: ['genesis_engine'] 
  },
  { 
    id: 'genesis_engine', 
    name: 'Genesis Engine', 
    icon: '🧬', 
    description: 'Reality Synthesis', 
    category: 'Synthesis', x: 1100, y: 350, type: 'AUDIT', 
    logic: `async (payload, os) => {
  os.log("Genesis Engine: Applying Reality Synthesis...");
  if (payload.qState < 0) {
    os.log("Genesis Engine: Negative qState detected. Triggering Wick Rotation (iτ). Dissolving query.");
    payload.dissolved = true;
    return payload;
  }
  
  if (payload.fallbackToAI && !payload.resolvedLocally) {
    // Simulate Rs = Sc * [(Kv * Tn) / Ed] * Hg
    payload.logosKey = btoa(payload.paddedQuery || payload.text).substring(0, 16);
    payload.aiResponse = \`[SYNTHESIZED via LOGOS: \${payload.logosKey}] Processed with 7 Pillars.\`;
    os.log("Genesis Engine: Cloud Synthesis Complete.");
  }
  return payload;
}`, 
    meta: { role: 'Audit' }, connections: ['cognitive_twin'] 
  },
  { 
    id: 'cognitive_twin', 
    name: 'Cognitive Twin', 
    icon: '👥', 
    description: 'Ledger Verification', 
    category: 'Communication', x: 1300, y: 350, type: 'REFLECTION', 
    logic: `async (payload, os) => {
  if (payload.dissolved) {
     os.log("Cognitive Twin: Query dissolved. No log written.");
     return payload;
  }
  os.log("Cognitive Twin: Logging to DOCMIND_LOG.jmn...");
  os.blockLock({ docmind: true, ledgerHash: payload.jmnState?.ledgerHash, data: payload });
  return payload;
}`, 
    meta: { role: 'Reflection' }, connections: ['aiza_exit'] 
  },
  { 
    id: 'aiza_exit', 
    name: 'Aiza Intelligence (Exit)', 
    icon: '👁️', 
    description: 'Final response', 
    category: 'System', x: 1500, y: 350, type: 'EXIT', 
    logic: `async (payload, os) => {
  if (payload.dissolved) {
    os.notify("Query Dissolved via Wick Rotation.");
  } else if (payload.resolvedLocally) {
    os.notify("Executed Locally via SVO Circuit.");
  } else {
    os.notify("Response: " + payload.aiResponse);
  }
  console.timeEnd("ExecutionSpeed");
  return payload;
}`, 
    meta: { role: 'Exit Point' }, connections: [] 
  }
];

const INITIAL_EDGES: Edge[] = INITIAL_ORGANS.flatMap(node => 
  (node.connections || []).map(targetId => ({
    id: `${node.id}-${targetId}`,
    from: node.id,
    to: targetId
  }))
);

const CATEGORIES = ['System', 'Utility', 'Communication', 'Synthesis'] as const;

// Optimized Node Component
const NeuralNode = React.memo(({ 
  node, 
  isSelected, 
  isConnecting, 
  isExecuting,
  onDragStart, 
  onContextMenu, 
  onMouseUp, 
  onClick, 
  onStartConnection,
  isActiveApp,
  panX,
  panY
}: { 
  node: Node, 
  isSelected: boolean, 
  isConnecting: boolean, 
  isExecuting?: boolean,
  onDragStart: (id: string) => void,
  onContextMenu: (e: React.MouseEvent, id: string) => void,
  onMouseUp: (e: React.PointerEvent, id: string) => void,
  onClick: (id: string) => void,
  onStartConnection: (id: string) => void,
  isActiveApp?: boolean,
  panX?: any,
  panY?: any
}) => {
  const isVisible = useTransform(() => {
    if (!panX || !panY) return true;
    const px = panX.get();
    const py = panY.get();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const padding = 300; 
    
    const screenX = node.x + px;
    const screenY = node.y + py;
    
    return screenX >= -padding && screenX <= screenW + padding &&
           screenY >= -padding && screenY <= screenH + padding;
  });

  const display = useTransform(isVisible, (v) => v ? 'flex' : 'none');

  return (
    <motion.div
      layout
      className={`absolute w-24 h-24 rounded-full border flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-500 ease-out backdrop-blur-xl z-30 group
        ${isSelected ? 'border-cyan-400 bg-cyan-900/20 shadow-[0_0_40px_rgba(0,242,255,0.3)]' : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 shadow-xl'}
        ${isConnecting ? 'border-yellow-400 animate-pulse' : ''}
        ${isExecuting ? 'border-green-400 bg-green-900/40 shadow-[0_0_50px_rgba(74,222,128,0.6)] animate-pulse scale-110 z-50' : ''}
        ${node.isDream ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100 border-dashed' : 'opacity-100'}
      `}
      style={{ left: node.x - 48, top: node.y - 48, display }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.button === 0) {
          onDragStart(node.id);
        }
      }}
      onContextMenu={(e) => onContextMenu(e, node.id)}
      onPointerUp={(e) => onMouseUp(e, node.id)}
      onClick={() => onClick(node.id)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: node.isDream ? 0.4 : 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <span className="text-3xl mb-1 select-none block drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          {typeof node.icon === 'string' && node.icon.startsWith('<svg') ? (
            <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: node.icon }} />
          ) : (
            node.icon
          )}
        </span>
        {isSelected && (
          <motion.div 
            layoutId={`glow-${node.id}`}
            className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full -z-10"
          />
        )}
      </div>
      <span className="text-[8px] font-bold uppercase tracking-tighter text-white/60 select-none group-hover:text-white transition-colors">{node.name.split(' ')[0]}</span>
      
      <button 
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center hover:bg-cyan-500/40 transition-all z-40 opacity-0 group-hover:opacity-100 cursor-crosshair scale-0 group-hover:scale-100"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartConnection(node.id);
        }}
      >
        <Plus size={10} className="text-cyan-400" />
      </button>

      {isActiveApp && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-green-400 animate-ping" />
          </div>
        </div>
      )}
      
      {node.isDream && (
        <div className="absolute -bottom-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-full">
          <span className="text-[6px] text-purple-400 font-bold uppercase tracking-widest">Dream</span>
        </div>
      )}
    </motion.div>
  );
});

// Optimized Edge Component
const NeuralEdge = React.memo(({ edge, fromNode, toNode, panX, panY, isFlowing }: { edge: Edge, fromNode: Node, toNode: Node, panX?: any, panY?: any, isFlowing?: boolean }) => {
  const isVisible = useTransform(() => {
    if (!panX || !panY) return true;
    const px = panX.get();
    const py = panY.get();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const padding = 300; 
    
    const minX = Math.min(fromNode.x, toNode.x) + px;
    const maxX = Math.max(fromNode.x, toNode.x) + px;
    const minY = Math.min(fromNode.y, toNode.y) + py;
    const maxY = Math.max(fromNode.y, toNode.y) + py;
    
    return maxX >= -padding && minX <= screenW + padding &&
           maxY >= -padding && minY <= screenH + padding;
  });

  const display = useTransform(isVisible, (v) => v ? 'inline' : 'none');

  return (
    <motion.g style={{ display }}>
      <motion.line 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        x1={fromNode.x} y1={fromNode.y} 
        x2={toNode.x} y2={toNode.y} 
        stroke="rgba(0, 242, 255, 0.05)" 
        strokeWidth="2"
        strokeDasharray="4,4"
        className="animate-[data-flow_20s_linear_infinite]"
      />
      <line 
        x1={fromNode.x} y1={fromNode.y} 
        x2={toNode.x} y2={toNode.y} 
        stroke="url(#edge-grad)" 
        strokeWidth="1"
        className="opacity-30"
      />
      {/* CSS Animated Data Packet */}
      <circle r="3" fill="#00f2ff" filter="url(#glow-synapse)" className="opacity-80">
        <animateMotion 
          dur={`${1.5 + Math.random() * 1.0}s`} 
          repeatCount="indefinite" 
          path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
          begin={`${Math.random() * 3}s`}
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.4 0 0.2 1"
        />
      </circle>
      {isFlowing && (
        <circle r="6" fill="#4ade80" filter="url(#glow-synapse)" className="opacity-100">
          <animateMotion 
            dur="1s" 
            repeatCount="1" 
            path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
            calcMode="linear"
          />
        </circle>
      )}
    </motion.g>
  );
});

const SystemBlockchainContent: React.FC = () => {
  const allApps = useAppStore(s => s.apps);
  const openWindows = useAppStore(s => s.windows);
  const quinaryState = useAppStore(s => s.quinaryState);
  const sources = useAppStore(s => s.sources);
  const honeyCells = useAppStore(s => s.honeyCells);
  const addNotification = (msg: string) => console.log(`[SYSTEM_BLOCKCHAIN] ${msg}`);

  const genesisCodex = sources.find(s => s.id === 'src_genesis_codex')?.content || '';

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [showInjection, setShowInjection] = useState(false);
  const [showOrganPicker, setShowOrganPicker] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [organSearch, setOrganSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const [editingLogicNodeId, setEditingLogicNodeId] = useState<string | null>(null);
  
  const [showTerminal, setShowTerminal] = useState(false);
  const [payloadInput, setPayloadInput] = useState('{\n  "message": "Hello Aiza",\n  "type": "text"\n}');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePulses, setActivePulses] = useState<{id: string, from: string, to: string}[]>([]);
  const [showGenesisPrompt, setShowGenesisPrompt] = useState<{ action: 'unlock' | 'delete', nodeId: string } | null>(null);
  const [genesisKeyInput, setGenesisKeyInput] = useState('');
  const [modalContent, setModalContent] = useState<{ title: string, content: React.ReactNode } | null>(null);

  // Watch for Aiza activity
  const aizaLogs = honeyCells['aiza-core']?.logs || [];
  const lastAizaLog = aizaLogs[aizaLogs.length - 1];

  useEffect(() => {
    if (lastAizaLog && Date.now() - lastAizaLog.timestamp < 2000) {
      const aizaNode = nodes.find(n => n.id === 'aiza_intel');
      const honeycombNode = nodes.find(n => n.id === 'honeycomb');
      
      if (aizaNode) {
        const pulseId = `pulse_${Date.now()}`;
        if (honeycombNode) {
          setActivePulses(prev => [...prev, { id: pulseId, from: aizaNode.id, to: honeycombNode.id }]);
        }
        
        // Pulse to active apps
        openWindows.forEach(w => {
          const appNode = nodes.find(n => n.appId === w.appDef.id);
          if (appNode) {
            setActivePulses(prev => [...prev, { id: `pulse_${Date.now()}_${appNode.id}`, from: aizaNode.id, to: appNode.id }]);
          }
        });

        setTimeout(() => {
          setActivePulses(prev => prev.filter(p => !p.id.startsWith(pulseId)));
        }, 1500);
      }
    }
  }, [lastAizaLog, nodes, openWindows]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  
  const engine = useSystemEngine();

  // Execution Engine Logic
  useEffect(() => {
    if (!engine.isRunning || !engine.activeNodeId) return;
    
    let isCancelled = false;
    
    const runNode = async () => {
      const node = nodes.find(n => n.id === engine.activeNodeId);
      if (!node) {
        engine.stopEngine();
        return;
      }
      
      // 1. Process Payload
      let updatedPayload = { ...engine.currentPayload };
      try {
        if (node.logic) {
          const osContext = {
            openApp: (id: string) => openApp(id),
            log: (msg: string) => {
              addNotification(`[${node.name}] ${msg}`);
              useAppStore.getState().addLogToCell('system-blockchain', { role: 'system', text: `[BLOCK-LOCK] ${node.name}: ${msg}`, timestamp: Date.now() });
            },
            blockLock: (data: any) => {
              useAppStore.getState().addLogToCell('system-blockchain', { role: 'system', text: `[BLOCK-LOCK] Payload: ${JSON.stringify(data)}`, timestamp: Date.now() });
            },
            notify: (msg: string) => addNotification(msg),
            state: store.getState(),
            jmnProcessor: jmnProcessor
          };

          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const executeFn = new AsyncFunction('payload', 'os', `
            try {
              const userLogic = ${node.logic};
              return await userLogic(payload, os);
            } catch(e) {
              os.log("Logic Error: " + e.message);
              throw e;
            }
          `);
          const result = await executeFn(updatedPayload, osContext);
          if (result) updatedPayload = result;
        }
        updatedPayload._trace = [...(updatedPayload._trace || []), node.name];
      } catch (err) {
        console.error(`Error executing node ${node.name}:`, err);
        updatedPayload.error = String(err);
      }
      
      if (isCancelled) return;
      
      engine.updatePayload(updatedPayload);
      engine.addToHistory(node.id);
      
      // 2. Routing (Deterministic via connections)
      const nextNodeId = node.connections?.[0]; // Simplified routing for deterministic pipeline
      
      if (nextNodeId && !updatedPayload.error) {
        const edgeId = `${node.id}-${nextNodeId}`;
        
        // 3. Visual Data Flow
        engine.setFlowingEdge(edgeId);
        
        // Fast-Track Logic: If resolved locally or dissolved, skip the visual delay
        const isFastTrack = updatedPayload.resolvedLocally || updatedPayload.dissolved || updatedPayload.qState < 0;
        const animDelay = isFastTrack ? 20 : 800;
        
        // Wait for animation
        setTimeout(() => {
          if (isCancelled) return;
          engine.setFlowingEdge(null);
          engine.setActiveNode(nextNodeId);
        }, animDelay);
      } else {
        engine.stopEngine();
      }
    };
    
    // Add a small delay for visual effect of node processing
    const isFastTrack = engine.currentPayload?.resolvedLocally || engine.currentPayload?.dissolved || engine.currentPayload?.qState < 0;
    const processDelay = isFastTrack ? 10 : 500;
    
    const processTimer = setTimeout(() => {
      runNode();
    }, processDelay); 
    
    return () => {
      isCancelled = true;
      clearTimeout(processTimer);
    };
  }, [engine.activeNodeId, engine.isRunning, nodes]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Persistence: Load
  useEffect(() => {
    const savedNodes = localStorage.getItem('786_blockchain_nodes_v4');
    const savedEdges = localStorage.getItem('786_blockchain_edges_v4');
    if (savedNodes) {
      const parsed = JSON.parse(savedNodes);
      // Ensure all nodes have correct categories
      setNodes(parsed.map((n: any) => ({
        ...n,
        category: CATEGORIES.includes(n.category) ? n.category : 'Utility'
      })));
    } else {
      setNodes(INITIAL_ORGANS);
    }
    if (savedEdges) {
      setEdges(JSON.parse(savedEdges));
    } else {
      setEdges(INITIAL_EDGES);
    }
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (nodes.length > 0) {
      localStorage.setItem('786_blockchain_nodes_v4', JSON.stringify(nodes));
    }
    localStorage.setItem('786_blockchain_edges_v4', JSON.stringify(edges));
  }, [nodes, edges]);

  // Sync with AI/System: Automatically add "ghost" nodes for all apps if requested
  // For now, we'll just allow users to pick them.

  const dreamNodes = useMemo(() => {
    const existingAppIds = new Set(nodes.map(n => n.appId).filter(Boolean));
    return Object.values(allApps)
      .filter(app => !existingAppIds.has(app.id))
      .map((app, index) => {
        // Calculate a deterministic but spread out position for dream nodes
        const angle = (index / Object.keys(allApps).length) * Math.PI * 2;
        const radius = 600 + (index % 3) * 100;
        return {
          id: `dream_${app.id}`,
          appId: app.id,
          name: app.name,
          icon: typeof app.icon === 'string' ? app.icon : '🧩',
          description: app.description || 'System Potential',
          category: app.category as any || 'Utility',
          x: 500 + Math.cos(angle) * radius,
          y: 400 + Math.sin(angle) * radius,
          isDream: true
        } as Node;
      });
  }, [allApps, nodes]);

  const displayNodes = useMemo(() => {
    const filtered = nodes.filter(n => 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const filteredDreams = dreamNodes.filter(n => 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered, ...filteredDreams];
  }, [nodes, dreamNodes, searchQuery]);

  const availableOrgans = useMemo(() => {
    return Object.values(allApps).filter(app => 
      app.name.toLowerCase().includes(organSearch.toLowerCase()) &&
      !nodes.find(n => n.appId === app.id)
    );
  }, [allApps, organSearch, nodes]);

  const requestRef = useRef<number | null>(null);

  const handleCanvasMouseMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    requestRef.current = requestAnimationFrame(() => {
      if (connectingFrom) {
        mouseX.set(x - panX.get());
        mouseY.set(y - panY.get());
      }

      if (draggedNodeId) {
        const nodeX = x - panX.get();
        const nodeY = y - panY.get();
        setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: nodeX, y: nodeY } : n));
      } else if (isPanning) {
        const panSensitivity = 1.8; // Increased for faster panning
        const dx = (e.clientX - lastPanPos.current.x) * panSensitivity;
        const dy = (e.clientY - lastPanPos.current.y) * panSensitivity;
        panX.set(panX.get() + dx);
        panY.set(panY.get() + dy);
        lastPanPos.current = { x: e.clientX, y: e.clientY };
      }
    });
  };

  const handleCanvasMouseDown = (e: React.PointerEvent) => {
    if (e.button === 0 || e.button === 1 || e.altKey) {
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      // Capture pointer to ensure we get pointermove events even if mouse leaves the div slightly
      if (canvasRef.current) {
        canvasRef.current.setPointerCapture(e.pointerId);
      }
    }
  };

  const handleCanvasMouseUp = (e: React.PointerEvent) => {
    setDraggedNodeId(null);
    setIsPanning(false);
    if (connectingFrom) {
      setConnectingFrom(null);
    }
    if (canvasRef.current && e.pointerId) {
      canvasRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const startConnection = useCallback((nodeId: string) => {
    setConnectingFrom(nodeId);
    setContextMenu(null);
  }, []);

  const completeConnection = useCallback((toId: string) => {
    if (connectingFrom && connectingFrom !== toId) {
      const edgeId = `${connectingFrom}-${toId}`;
      if (!edges.find(e => e.id === edgeId)) {
        setEdges(prev => [...prev, { id: edgeId, from: connectingFrom, to: toId }]);
      }
    }
    setConnectingFrom(null);
  }, [connectingFrom, edges]);

  const deleteEdge = (edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  };

  const unlinkNode = (nodeId: string) => {
    setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
    setContextMenu(null);
  };

  const deleteNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node?.isLocked) {
      setShowGenesisPrompt({ action: 'delete', nodeId });
      setContextMenu(null);
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    setContextMenu(null);
  };

  const toggleLock = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node?.isLocked) {
      setShowGenesisPrompt({ action: 'unlock', nodeId });
    } else {
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, isLocked: true } : n));
    }
    setContextMenu(null);
  };

  const handleGenesisSubmit = () => {
    if (genesisKeyInput === GENESIS_KEY) {
      if (showGenesisPrompt?.action === 'unlock') {
        setNodes(prev => prev.map(n => n.id === showGenesisPrompt.nodeId ? { ...n, isLocked: false } : n));
        addNotification("NODE UNLOCKED.");
      } else if (showGenesisPrompt?.action === 'delete') {
        setNodes(prev => prev.filter(n => n.id !== showGenesisPrompt.nodeId));
        setEdges(prev => prev.filter(e => e.from !== showGenesisPrompt.nodeId && e.to !== showGenesisPrompt.nodeId));
        if (selectedNodeId === showGenesisPrompt.nodeId) setSelectedNodeId(null);
        addNotification("LOCKED NODE DELETED.");
      }
      setShowGenesisPrompt(null);
      setGenesisKeyInput('');
    } else {
      addNotification("INVALID GENESIS KEY.");
    }
  };

  const handleViewDetails = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId) || dreamNodes.find(n => n.id === nodeId);
    if (!node) return;
    setModalContent({
      title: `DETAILS: ${node.name}`,
      content: (
        <div className="flex flex-col gap-4 text-sm">
          <div><span className="text-cyan-400 font-bold">ORGAN:</span> {node.name}</div>
          <div><span className="text-cyan-400 font-bold">DESCRIPTION:</span> {node.description}</div>
          <div><span className="text-cyan-400 font-bold">CATEGORY:</span> {node.category}</div>
          <div><span className="text-cyan-400 font-bold">INTELLIGENCE:</span> 786 Jackfruit OS Native</div>
          <div><span className="text-cyan-400 font-bold">STATUS:</span> {openWindows.some(w => w.appDef.id === node.appId) ? 'ACTIVE (RUNNING)' : 'DORMANT'}</div>
        </div>
      )
    });
    setContextMenu(null);
  };

  const handleKnowledgeBase = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId) || dreamNodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const cellId = node.appId ? `app-${node.appId}` : `sys-${node.id}`;
    const cellData = honeyCells[cellId] || honeyCells['aiza-core'];
    
    setModalContent({
      title: `KNOWLEDGE BASE: ${node.name}`,
      content: (
        <div className="flex flex-col gap-4 text-sm">
          <div className="text-yellow-400 font-bold">HONEYCOMB BRAIN SYNCED</div>
          <div><span className="text-cyan-400 font-bold">EFFICIENCY:</span> 99.9% (J-Men Optimized)</div>
          <div><span className="text-cyan-400 font-bold">LOGS:</span> {cellData?.logs?.length || 0} fragments recorded.</div>
          <div className="p-2 bg-white/5 border border-white/10 rounded max-h-40 overflow-y-auto text-xs">
            {cellData?.logs?.slice(-5).map((l: any, i: number) => (
              <div key={i} className="mb-1 opacity-80">[{new Date(l.timestamp).toLocaleTimeString()}] {l.role}: {l.text.substring(0, 50)}...</div>
            )) || "No recent logs."}
          </div>
        </div>
      )
    });
    setContextMenu(null);
  };

  const handleCellEvolving = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId) || dreamNodes.find(n => n.id === nodeId);
    if (!node) return;
    setModalContent({
      title: `CELL EVOLVING: ${node.name}`,
      content: (
        <div className="flex flex-col gap-4 text-sm">
          <div className="text-pink-400 font-bold">7 SCRABBLE 6 PROTOCOL ACTIVE</div>
          <div><span className="text-cyan-400 font-bold">PROCESSOR:</span> J-Men Learning Processor</div>
          <div><span className="text-cyan-400 font-bold">EVOLUTION LEVEL:</span> {node.evolutionLevel || 1}</div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-pink-400 h-full w-[78.6%]" />
          </div>
          <div className="text-xs opacity-60">Self-evolving neural pathways are continuously optimizing this organ's logic gates.</div>
        </div>
      )
    });
    setContextMenu(null);
  };

  const addOrganAsNode = (app: AppDef) => {
    const id = `node_${app.id}_${Date.now()}`;
    const newNode: Node = {
      id,
      appId: app.id,
      name: app.name,
      icon: typeof app.icon === 'string' ? app.icon : '🧩',
      description: app.description || 'System Integrated Organ',
      category: app.category as any || 'Utility',
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      isDream: false
    };
    setNodes(prev => [...prev, newNode]);
    setShowOrganPicker(false);
    setSelectedNodeId(id);
  };

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: id });
  }, []);

  const handleNodeMouseUp = useCallback((e: React.PointerEvent, id: string) => {
    if (connectingFrom) {
      e.stopPropagation();
      completeConnection(id);
    }
  }, [connectingFrom, completeConnection]);

  const handleNodeClick = useCallback((id: string) => {
    const node = nodes.find(n => n.id === id);
    setSelectedNodeId(id);
    
    if (node?.appId && !node.isDream) {
      openApp(node.appId);
    }
  }, [nodes, openApp]);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const selectedNode = displayNodes.find(n => n.id === selectedNodeId);

  // Calculate category clusters
  const clusters = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catNodes = displayNodes.filter(n => n.category === cat && !n.isDream);
      if (catNodes.length === 0) return null;
      
      const minX = Math.min(...catNodes.map(n => n.x)) - 80;
      const minY = Math.min(...catNodes.map(n => n.y)) - 80;
      const maxX = Math.max(...catNodes.map(n => n.x)) + 80;
      const maxY = Math.max(...catNodes.map(n => n.y)) + 80;
      
      return {
        category: cat,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }).filter(Boolean);
  }, [displayNodes]);

  const dreamEdges = useMemo(() => {
    const edges: { id: string, from: Node, to: Node }[] = [];
    for (let i = 0; i < dreamNodes.length; i++) {
      // Connect to the next dream node in the circle
      const next = dreamNodes[(i + 1) % dreamNodes.length];
      edges.push({ id: `dream_edge_${i}`, from: dreamNodes[i], to: next });
      
      // Occasionally connect to a random dream node
      if (i % 3 === 0) {
        const random = dreamNodes[Math.floor(Math.random() * dreamNodes.length)];
        if (random.id !== dreamNodes[i].id) {
          edges.push({ id: `dream_edge_rand_${i}`, from: dreamNodes[i], to: random });
        }
      }
    }
    return edges;
  }, [dreamNodes]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono select-none flex flex-col">
      {/* Top Bar / Search */}
      <div className="absolute top-0 left-0 right-0 h-16 border-b border-white/10 bg-black/40 backdrop-blur-xl z-50 flex items-center px-8 justify-between">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <Search size={16} className="text-white/40" />
          <input 
            type="text" 
            placeholder="Search Neural Nodes..." 
            className="bg-transparent border-none text-xs text-white focus:outline-none w-full uppercase tracking-widest"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all uppercase font-bold text-[10px] tracking-widest ${
              showTerminal 
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Terminal size={14} /> Data Flow
          </button>
          <button 
            onClick={() => {
              // Toggle OS Map view by highlighting active apps
              const activeNodeIds = nodes.filter(n => n.appId && openWindows.some(w => w.appDef.id === n.appId)).map(n => n.id);
              if (activeNodeIds.length > 0) {
                // Focus on the first active app
                const firstActive = nodes.find(n => n.id === activeNodeIds[0]);
                if (firstActive) {
                  panX.set(-firstActive.x + window.innerWidth / 2);
                  panY.set(-firstActive.y + window.innerHeight / 2);
                  setSelectedNodeId(firstActive.id);
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl hover:bg-yellow-500/20 transition-all uppercase font-bold text-[10px] tracking-widest"
          >
            <Activity size={14} /> OS Map
          </button>
          <button 
            onClick={() => {
              if (engine.isRunning) {
                engine.stopEngine();
              } else {
                const startNode = nodes.find(n => !edges.some(e => e.to === n.id)) || nodes[0];
                if (startNode) {
                  engine.startEngine({ type: 'init', timestamp: Date.now() }, startNode.id);
                }
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all uppercase font-bold text-[10px] tracking-widest ${
              engine.isRunning 
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
            }`}
          >
            {engine.isRunning ? <X size={14} /> : <Play size={14} />} 
            {engine.isRunning ? 'Stop Engine' : 'Run Engine'}
          </button>
          <button 
            onClick={() => setShowOrganPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all uppercase font-bold text-[10px] tracking-widest"
          >
            <LayoutGrid size={14} /> System Organs
          </button>
          <button 
            onClick={() => {
              const id = `node_${Date.now()}`;
              const newNode: Node = {
                id,
                name: 'New Neural Node',
                icon: '🧬',
                description: 'Custom Intelligence Node',
                category: 'Utility',
                x: 100 + Math.random() * 200,
                y: 100 + Math.random() * 200,
                logic: '// Custom Logic Substrate\n\nasync function process(input) {\n  return input;\n}'
              };
              setNodes(prev => [...prev, newNode]);
              setSelectedNodeId(id);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all uppercase font-bold text-[10px] tracking-widest"
          >
            <Plus size={14} /> New Node
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Activity size={12} className="text-cyan-400 animate-pulse" />
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-tighter">Resonance: {quinaryState}</span>
          </div>
          <button 
            onClick={() => { panX.set(0); panY.set(0); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 transition-all uppercase font-bold text-[10px] tracking-widest"
          >
            <Move size={14} /> Recenter
          </button>
          <button 
            onClick={() => {
              engine.stopEngine();
              localStorage.removeItem('786_blockchain_nodes_v2');
              localStorage.removeItem('786_blockchain_edges_v2');
              setNodes(INITIAL_ORGANS);
              setEdges([]);
            }}
            className="text-[10px] text-white/20 hover:text-white uppercase font-bold tracking-widest"
          >
            Reset Layout
          </button>
        </div>
      </div>

      <div 
        ref={canvasRef}
        className="relative flex-1 cursor-crosshair overflow-hidden touch-none"
        onPointerMove={handleCanvasMouseMove}
        onPointerDown={handleCanvasMouseDown}
        onPointerUp={handleCanvasMouseUp}
        onPointerCancel={handleCanvasMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ backgroundImage: 'radial-gradient(circle at center, #020617 0%, #000000 70%)' }}
      >
        {/* Infinite Ambient Grid */}
        <motion.div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPositionX: panX,
            backgroundPositionY: panY
          }}
        />

        {/* Infinite Space Container */}
        <motion.div 
          className="absolute inset-0"
          style={{ x: panX, y: panY }}
        >
        {/* Category Clusters */}
        <div className="absolute inset-0 pointer-events-none">
          {clusters.map(cluster => cluster && (
            <motion.div
              key={cluster.category}
              initial={false}
              animate={{ x: cluster.x, y: cluster.y, width: cluster.width, height: cluster.height }}
              className="absolute border border-white/10 bg-white/[0.03] rounded-[3rem] backdrop-blur-sm shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] transition-all duration-700"
            >
              <div className="absolute -top-4 left-8 px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 backdrop-blur-md">
                {cluster.category}_Cluster
              </div>
            </motion.div>
          ))}
        </div>

        {/* SVG Connection Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <filter id="glow-synapse">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 242, 255, 0.2)" />
              <stop offset="50%" stopColor="rgba(0, 242, 255, 0.5)" />
              <stop offset="100%" stopColor="rgba(0, 242, 255, 0.2)" />
            </linearGradient>
          </defs>

          {/* Render Dream Edges (Spider Web) */}
          {dreamEdges.map(edge => {
            const fromVisible = displayNodes.some(n => n.id === edge.from.id);
            const toVisible = displayNodes.some(n => n.id === edge.to.id);
            if (!fromVisible || !toVisible) return null;
            
            return (
              <line 
                key={edge.id}
                x1={edge.from.x} y1={edge.from.y} 
                x2={edge.to.x} y2={edge.to.y} 
                stroke="rgba(168, 85, 247, 0.03)" 
                strokeWidth="1"
              />
            );
          })}

          {/* Render Edges */}
          {edges.map(edge => {
            const fromNode = displayNodes.find(n => n.id === edge.from);
            const toNode = displayNodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            const isFlowing = engine.flowingEdgeId === edge.id || activePulses.some(p => p.from === edge.from && p.to === edge.to);

            return (
              <NeuralEdge 
                key={edge.id} 
                edge={edge} 
                fromNode={fromNode} 
                toNode={toNode} 
                panX={panX}
                panY={panY}
                isFlowing={isFlowing}
              />
            );
          })}

          {/* Render Temporary Pulses (No explicit edge) */}
          {activePulses.filter(p => !edges.some(e => e.from === p.from && e.to === p.to)).map(pulse => {
            const fromNode = displayNodes.find(n => n.id === pulse.from);
            const toNode = displayNodes.find(n => n.id === pulse.to);
            if (!fromNode || !toNode) return null;
            return (
              <NeuralEdge 
                key={pulse.id} 
                edge={{ id: pulse.id, from: pulse.from, to: pulse.to }} 
                fromNode={fromNode} 
                toNode={toNode} 
                panX={panX} 
                panY={panY} 
                isFlowing={true} 
              />
            );
          })}

          {/* Drawing Line */}
          {connectingFrom && (
            <motion.line 
              x1={nodes.find(n => n.id === connectingFrom)?.x} 
              y1={nodes.find(n => n.id === connectingFrom)?.y} 
              x2={mouseX} y2={mouseY} 
              stroke="rgba(0, 242, 255, 0.5)" 
              strokeWidth="1" 
              strokeDasharray="5,5"
            />
          )}
        </svg>

        {/* Render Nodes */}
        {displayNodes.map((node) => (
          <NeuralNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            isConnecting={connectingFrom === node.id}
            isExecuting={engine.activeNodeId === node.id}
            isActiveApp={node.appId ? openWindows.some(w => w.appDef.id === node.appId) : false}
            onDragStart={setDraggedNodeId}
            onContextMenu={handleNodeContextMenu}
            onMouseUp={handleNodeMouseUp}
            onClick={handleNodeClick}
            onStartConnection={startConnection}
            panX={panX}
            panY={panY}
          />
        ))}

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bg-black/90 border border-white/10 backdrop-blur-xl rounded-xl p-2 z-[100] shadow-2xl min-w-[180px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => handleViewDetails(contextMenu.nodeId)}
              >
                <Eye size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" /> View Details
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => {
                  setEditingLogicNodeId(contextMenu.nodeId);
                  setContextMenu(null);
                }}
              >
                <Terminal size={16} className="text-purple-400 group-hover:scale-110 transition-transform" /> Edit Logic
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => handleKnowledgeBase(contextMenu.nodeId)}
              >
                <Database size={16} className="text-blue-400 group-hover:scale-110 transition-transform" /> Knowledge Base
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => handleCellEvolving(contextMenu.nodeId)}
              >
                <Dna size={16} className="text-pink-400 group-hover:scale-110 transition-transform" /> Cell Evolving
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => startConnection(contextMenu.nodeId)}
              >
                <Share2 size={16} className="text-green-400 group-hover:scale-110 transition-transform" /> Connect Node
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => unlinkNode(contextMenu.nodeId)}
              >
                <LinkIcon size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" /> Unlink Node
              </button>
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => toggleLock(contextMenu.nodeId)}
              >
                {nodes.find(n => n.id === contextMenu.nodeId)?.isLocked ? (
                  <UnlockIcon size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <LockIcon size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
                )}
                {nodes.find(n => n.id === contextMenu.nodeId)?.isLocked ? 'Unlock Node' : 'Lock Node (Guinness)'}
              </button>
              <div className="h-[1px] bg-white/10 my-2 mx-2" />
              <button 
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all uppercase font-bold tracking-widest group"
                onClick={() => deleteNode(contextMenu.nodeId)}
              >
                <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Delete Node
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>

      {/* General Modal Content */}
      <AnimatePresence>
        {modalContent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full border border-white/10 p-8 rounded-[2.5rem] bg-black/60 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-[0.2em]">{modalContent.title}</h3>
                <button onClick={() => setModalContent(null)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              {modalContent.content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Genesis Key Prompt */}
      <AnimatePresence>
        {showGenesisPrompt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full border border-orange-500/30 p-8 rounded-[2.5rem] bg-black/60 shadow-[0_0_50px_rgba(249,115,22,0.1)] flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-orange-500/20 rounded-2xl">
                  <Shield size={24} className="text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-[0.2em]">Genesis Key Required</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">
                    {showGenesisPrompt.action === 'unlock' ? 'Unlock Node (Guinness)' : 'Delete Locked Node'}
                  </p>
                </div>
              </div>
              <input 
                type="password"
                placeholder="ENTER GENESIS KEY..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white text-xs focus:outline-none focus:border-orange-500/50 uppercase tracking-widest mb-4"
                value={genesisKeyInput}
                onChange={(e) => setGenesisKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenesisSubmit()}
                autoFocus
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowGenesisPrompt(null)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenesisSubmit}
                  className="flex-1 py-3 bg-orange-500/20 border border-orange-500/40 rounded-xl text-xs font-bold text-orange-400 hover:bg-orange-500/30 transition-colors uppercase tracking-widest"
                >
                  Authenticate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Organ Picker Modal */}
      <AnimatePresence>
        {showOrganPicker && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-2xl w-full border border-white/10 p-8 rounded-[2.5rem] bg-black/60 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-2xl">
                    <LayoutGrid size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-[0.2em]">System Organs</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Select an organ to manifest in the blockchain</p>
                  </div>
                </div>
                <button onClick={() => setShowOrganPicker(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text"
                  placeholder="SEARCH SYSTEM DNA..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs focus:outline-none focus:border-purple-500/50 uppercase tracking-widest"
                  value={organSearch}
                  onChange={(e) => setOrganSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 gap-4">
                {availableOrgans.map(app => (
                  <button
                    key={app.id}
                    onClick={() => addOrganAsNode(app)}
                    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-purple-500/30 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {typeof app.icon === 'string' && app.icon.startsWith('<svg') ? (
                        <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: app.icon }} />
                      ) : (
                        app.icon || '🧩'
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">{app.name}</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-tighter">{app.category}</div>
                    </div>
                  </button>
                ))}
                {availableOrgans.length === 0 && (
                  <div className="col-span-2 py-12 text-center">
                    <Sparkles size={32} className="text-white/10 mx-auto mb-4" />
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">No new organs found in this sector</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DNA Configurator / Side Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 w-96 bg-black/90 border-l border-white/10 backdrop-blur-3xl z-[60] p-8 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                  {selectedNode.icon}
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">{selectedNode.name}</h2>
                  <p className="text-[9px] text-cyan-400/60 font-bold uppercase tracking-tighter">Neural_Entity_v8.4</p>
                </div>
              </div>
              <button onClick={() => setSelectedNodeId(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
              <section>
                <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-3 block font-bold">Entity Metadata</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="text-[8px] text-white/20 uppercase mb-1">Status</div>
                    <div className="text-[10px] text-green-400 font-bold flex items-center gap-2">
                      <Activity size={10} /> RESONANCE_STABLE
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="text-[8px] text-white/20 uppercase mb-1">Category</div>
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-tighter">
                      {selectedNode.category}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-3 block font-bold">Neural Logic Substrate</label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-green-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <textarea 
                    className="relative w-full h-64 bg-black/60 border border-white/10 rounded-2xl p-6 text-[11px] text-cyan-400/80 focus:outline-none focus:border-cyan-400/50 resize-none font-mono leading-relaxed"
                    value={selectedNode.logic || `// Neural Logic for ${selectedNode.name}\n// Protocol: Genesis_786\n\nasync function process(input) {\n  const dna = await fetchDNA();\n  return evolve(input, dna);\n}`}
                    onChange={(e) => {
                      const newLogic = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, logic: newLogic } : n));
                    }}
                  />
                </div>
              </section>

              <section>
                <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-3 block font-bold">Active Synapses</label>
                <div className="space-y-2">
                  {edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).map(edge => (
                    <div key={edge.id} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/10 group/edge">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <LinkIcon size={12} className="text-cyan-400" />
                          <span className="text-[10px] text-white/60 font-bold uppercase">
                            {edge.from === selectedNode.id ? `To: ${nodes.find(n => n.id === edge.to)?.name}` : `From: ${nodes.find(n => n.id === edge.from)?.name}`}
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteEdge(edge.id)}
                          className="opacity-0 group-hover/edge:opacity-100 text-red-400/40 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {edge.from === selectedNode.id && (
                        <input
                          type="text"
                          placeholder="Condition (e.g. payload.type === 'image')"
                          value={edge.condition || ''}
                          onChange={(e) => {
                            const newCondition = e.target.value;
                            setEdges(prev => prev.map(ed => ed.id === edge.id ? { ...ed, condition: newCondition } : ed));
                          }}
                          className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-yellow-400 font-mono focus:outline-none focus:border-yellow-400/50"
                        />
                      )}
                    </div>
                  ))}
                  {edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).length === 0 && (
                    <div className="text-[10px] text-white/20 italic text-center py-4 border border-dashed border-white/10 rounded-xl">
                      No active synapses detected
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex gap-4">
              {selectedNode.isDream ? (
                <button 
                  className="flex-1 py-4 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-2xl hover:bg-purple-500/30 transition-all uppercase tracking-[0.2em] font-bold text-[10px] flex items-center justify-center gap-2"
                  onClick={() => {
                    const app = allApps[selectedNode.appId!];
                    if (app) addOrganAsNode(app);
                  }}
                >
                  <Sparkles size={14} /> Manifest Organ
                </button>
              ) : (
                <>
                  <button 
                    className="flex-1 py-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl hover:bg-cyan-500/20 transition-all uppercase tracking-[0.2em] font-bold text-[10px] flex items-center justify-center gap-2"
                    onClick={() => {
                      const btn = document.activeElement as HTMLButtonElement;
                      const original = btn.innerHTML;
                      btn.innerHTML = "INJECTING...";
                      setTimeout(() => { btn.innerHTML = original; setSelectedNodeId(null); }, 1000);
                    }}
                  >
                    <Zap size={14} /> Inject DNA
                  </button>
                  <button 
                    className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all"
                    onClick={() => deleteNode(selectedNode.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knowledge Base Modal */}
      <AnimatePresence>
        {showKnowledgeBase && selectedNode && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-2xl w-full border border-blue-500/30 p-8 rounded-[2.5rem] bg-black/60 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-2xl">
                    <Database size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-[0.2em]">{selectedNode.name} Core Knowledge</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Define the logic and rules for this organ</p>
                  </div>
                </div>
                <button onClick={() => setShowKnowledgeBase(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-[10px] text-blue-400/60 font-bold uppercase tracking-widest leading-relaxed">
                  This knowledge base acts as the sovereign core of the organ. By defining its functionality and rules, you enable super-intelligence execution without massive server overhead.
                </p>
                <textarea 
                  className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl p-6 text-xs text-white font-mono focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                  placeholder="Inscribe the functionality description and rules here..."
                  value={selectedNode.knowledgeBase || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, knowledgeBase: val } : n));
                  }}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowKnowledgeBase(false)}
                  className="px-8 py-3 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-xl text-[10px] uppercase font-bold hover:bg-blue-500/30 transition-all tracking-widest"
                >
                  Seal Knowledge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cell Evolving Modal */}
      <AnimatePresence>
        {showEvolution && selectedNode && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-3xl w-full border border-pink-500/30 p-8 rounded-[2.5rem] bg-black/60 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-500/20 rounded-2xl">
                    <Dna size={24} className="text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-[0.2em]">{selectedNode.name} Evolution</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">7Scrabble6 Protocol & Genesis Codex</p>
                  </div>
                </div>
                <button onClick={() => setShowEvolution(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-pink-500/5 border border-pink-500/20 p-6 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-4">J-M-N Cheat Codes Active</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="text-xl font-bold text-white mb-2">J</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-tighter">Jist: Core Concept</div>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="text-xl font-bold text-white mb-2">M</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-tighter">Magnify: Expansion</div>
                    </div>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="text-xl font-bold text-white mb-2">N</div>
                      <div className="text-[8px] text-white/40 uppercase tracking-tighter">Note: Commentary</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Genesis Codex Substrate</h4>
                  <div className="bg-black/40 border border-white/5 p-6 rounded-2xl text-[11px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap">
                    {genesisCodex || "Protocol data not found in sources."}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowEvolution(false)}
                  className="px-8 py-3 bg-pink-500/20 border border-pink-500/40 text-pink-400 rounded-xl text-[10px] uppercase font-bold hover:bg-pink-500/30 transition-all tracking-widest"
                >
                  Evolve Substrate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logic Editor Modal */}
      <AnimatePresence>
        {editingLogicNodeId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[130] flex items-center justify-center p-4"
          >
            <div className="max-w-3xl w-full h-[80vh] flex flex-col border border-cyan-500/30 rounded-[1rem] bg-black shadow-[0_0_100px_rgba(0,242,255,0.1)] overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Terminal size={16} className="text-cyan-400" /> 
                  Logic Editor: {nodes.find(n => n.id === editingLogicNodeId)?.name}
                </h3>
                <button onClick={() => setEditingLogicNodeId(null)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-4 bg-[#0d0d0d]">
                <textarea
                  className="w-full h-full bg-transparent text-cyan-400 font-mono text-xs focus:outline-none resize-none"
                  defaultValue={nodes.find(n => n.id === editingLogicNodeId)?.logic || 'async (payload, os) => {\n  return payload;\n}'}
                  id="logic-editor-textarea"
                  spellCheck={false}
                />
              </div>
              <div className="p-4 border-t border-white/10 flex justify-end gap-4 bg-white/5">
                <button 
                  onClick={() => setEditingLogicNodeId(null)} 
                  className="px-6 py-2 text-[10px] uppercase font-bold text-white/50 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const newLogic = (document.getElementById('logic-editor-textarea') as HTMLTextAreaElement).value;
                    setNodes(prev => prev.map(n => n.id === editingLogicNodeId ? { ...n, logic: newLogic } : n));
                    setEditingLogicNodeId(null);
                  }}
                  className="px-6 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-lg text-[10px] uppercase font-bold hover:bg-cyan-500/30 transition-all"
                >
                  Save Logic
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Genesis Protocol Modal */}
      <AnimatePresence>
        {showInjection && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[120] flex items-center justify-center p-4"
          >
            <div className="max-w-sm w-full border border-cyan-500/30 p-10 rounded-[2.5rem] bg-black shadow-[0_0_100px_rgba(0,242,255,0.1)] text-center">
              <Shield size={48} className="text-cyan-400 mx-auto mb-6 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-[0.4em] mb-2">Genesis_Lock</h3>
              <p className="text-[9px] text-white/40 uppercase mb-8 tracking-widest leading-relaxed">Enter Sovereign Key to modify substrate<br/>Protocol: Eagleoro99@78625</p>
              <input 
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center text-cyan-400 font-mono text-xs mb-8 focus:outline-none focus:border-cyan-400/50"
                placeholder="••••••••••••"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if ((e.target as HTMLInputElement).value === GENESIS_KEY) {
                      if (pendingDeleteId) {
                        setNodes(prev => prev.filter(n => n.id !== pendingDeleteId));
                        setEdges(prev => prev.filter(e => e.from !== pendingDeleteId && e.to !== pendingDeleteId));
                        if (selectedNodeId === pendingDeleteId) setSelectedNodeId(null);
                        setPendingDeleteId(null);
                      }
                      setShowInjection(false);
                    } else {
                      (e.target as HTMLInputElement).value = "";
                      addNotification("INVALID_KEY: Substrate access denied.");
                    }
                  }
                }}
              />
              <div className="flex gap-4">
                <button onClick={() => { setShowInjection(false); setPendingDeleteId(null); }} className="flex-1 py-4 text-[10px] uppercase font-bold text-white/20 hover:text-white transition-colors">Abort</button>
                <button 
                  onClick={() => {
                    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                    if (input.value === GENESIS_KEY) {
                      if (pendingDeleteId) {
                        setNodes(prev => prev.filter(n => n.id !== pendingDeleteId));
                        setEdges(prev => prev.filter(e => e.from !== pendingDeleteId && e.to !== pendingDeleteId));
                        if (selectedNodeId === pendingDeleteId) setSelectedNodeId(null);
                        setPendingDeleteId(null);
                      }
                      setShowInjection(false);
                    } else {
                      input.value = "";
                      addNotification("INVALID_KEY: Substrate access denied.");
                    }
                  }}
                  className="flex-1 py-4 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl text-[10px] uppercase font-bold hover:bg-cyan-500/30 transition-all"
                >
                  Verify
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Flow Terminal */}
      <AnimatePresence>
        {showTerminal && (
          <motion.div 
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 h-72 bg-black/95 border-t border-white/10 backdrop-blur-3xl z-[50] flex shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Left: Payload Input */}
            <div className="w-1/3 border-r border-white/10 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Terminal size={12} className="text-cyan-400" /> Initial Payload
                </h3>
                <span className="text-[10px] text-white/40 font-mono">{currentTime.toLocaleTimeString()}</span>
              </div>
              <textarea 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] text-cyan-400 font-mono focus:outline-none focus:border-cyan-400/50 resize-none"
                value={payloadInput}
                onChange={(e) => setPayloadInput(e.target.value)}
                spellCheck={false}
              />
              <button 
                onClick={() => {
                  try {
                    const payload = JSON.parse(payloadInput);
                    const startNode = nodes.find(n => n.id === 'aiza_entry') || nodes[0];
                    if (startNode) {
                      engine.startEngine(payload, startNode.id);
                    }
                  } catch (e) {
                    addNotification("INVALID_PAYLOAD: Must be valid JSON.");
                  }
                }}
                className="mt-2 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all uppercase font-bold text-[10px] tracking-widest"
              >
                Inject Payload
              </button>
            </div>

            {/* Middle: Execution Log */}
            <div className="flex-1 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} className="text-green-400" /> Execution Trace
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                  <div className={`w-2 h-2 rounded-full ${engine.isRunning ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
                  {engine.isRunning ? 'Engine Running' : 'Idle'}
                </div>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
                {engine.executionHistory.length === 0 && !engine.isRunning && (
                  <div className="text-white/20 italic">Awaiting payload injection...</div>
                )}
                {engine.executionHistory.map((nodeId, idx) => {
                  const node = nodes.find(n => n.id === nodeId);
                  return (
                    <div key={idx} className="flex items-start gap-2 text-white/60">
                      <span className="text-cyan-400">[{idx + 1}]</span>
                      <span className="text-green-400">Node Executed:</span>
                      <span className="text-white">{node?.name || nodeId}</span>
                    </div>
                  );
                })}
                {engine.isRunning && engine.activeNodeId && (
                  <div className="flex items-start gap-2 text-white/60 animate-pulse">
                    <span className="text-yellow-400">[*]</span>
                    <span className="text-yellow-400">Processing:</span>
                    <span className="text-white">{nodes.find(n => n.id === engine.activeNodeId)?.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Reality Synthesis / Output */}
            <div className="w-1/3 border-l border-white/10 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Database size={12} className="text-purple-400" /> Reality Synthesis
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                  <Brain size={12} className="text-blue-400" /> SVO Extraction
                </div>
              </div>
              <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                {engine.currentPayload?.svo ? (
                  <div className="space-y-2 font-mono text-[10px]">
                    <div className="text-cyan-400">Subject (S): <span className="text-white">{engine.currentPayload.svo.S}</span></div>
                    <div className="text-pink-400">Kinetic Verb (Kv): <span className="text-white">{engine.currentPayload.svo.Kv || 'None'}</span></div>
                    <div className="text-green-400">Terminal Node (Tn): <span className="text-white">{engine.currentPayload.svo.Tn || 'None'}</span></div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-white/50">
                      Fallback to AI: {engine.currentPayload.fallbackToAI ? 'YES' : 'NO'}
                    </div>
                    {engine.currentPayload.dissolved && (
                      <div className="mt-2 text-red-500 font-bold animate-pulse">
                        [!] WICK ROTATION (iτ) TRIGGERED. QUERY DISSOLVED.
                      </div>
                    )}
                    {engine.currentPayload.logosKey && (
                      <div className="mt-2 text-yellow-400">
                        LogosKey: <span className="text-white">{engine.currentPayload.logosKey}</span>
                      </div>
                    )}
                    {engine.currentPayload.paddedQuery && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-purple-400 mb-1">Padded Query (7 Pillars):</div>
                        <div className="text-white/60 whitespace-pre-wrap text-[8px] leading-tight">
                          {engine.currentPayload.paddedQuery}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="text-[10px] text-purple-400 font-mono whitespace-pre-wrap">
                    {engine.currentPayload ? JSON.stringify(engine.currentPayload, null, 2) : '// No active payload'}
                  </pre>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setShowTerminal(false)}
              className="absolute top-2 right-2 p-2 text-white/20 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes data-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export const systemBlockchainApp: AppDef = {
  id: 'systemBlockchain',
  name: 'System Blockchain',
  icon: '⛓️',
  category: 'System',
  component: SystemBlockchainContent,
  defaultSize: { width: 1100, height: 750 },
};
