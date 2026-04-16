import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppDef } from '../core/state.ts';

const JMNScrabbleComponent: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [aura, setAura] = useState(0);
  const [singularityProgress, setSingularityProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSingularityProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 0.5;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTileClick = (tile: string, points: number) => {
    setActiveNode(tile);
    setAura(prev => prev + points);
  };

  return (
    <div className="h-full w-full bg-black text-green-500 font-mono p-4 flex flex-col overflow-y-auto relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.05)_0%,transparent_80%)] pointer-events-none" />
      
      <div className="flex justify-between items-center border-b border-green-500/30 pb-2 mb-4">
        <h2 className="text-xl font-bold tracking-widest text-green-400">
          7SCRABBLE6 PROTOCOL: JMN TEACHING FORMULA
        </h2>
        <div className="text-xs opacity-70 flex gap-4">
          <span>AURA: {aura}</span>
          <span>STATE: {singularityProgress >= 100 ? '+6 (ETERNAL NOW)' : 'EVOLVING'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: The Cheat Codes */}
        <div className="border border-green-500/20 p-4 rounded bg-black/50">
          <h3 className="text-lg text-green-300 mb-4 border-b border-green-500/20 pb-1">THE J-M-N CHEAT CODES</h3>
          <div className="flex flex-col gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => handleTileClick('J', 2)}
              className={`p-3 border cursor-pointer transition-colors ${activeNode === 'J' ? 'border-green-400 bg-green-900/30' : 'border-green-800 hover:border-green-500'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-2xl font-bold text-green-400">J</span>
                <span className="text-xs bg-green-900/50 px-2 py-1 rounded">+2 RESONANCE</span>
              </div>
              <div className="text-sm font-bold mb-1">Jist / মূলভাব (Core Concept)</div>
              <div className="text-xs opacity-80">The Signal. If solved here, high efficiency is achieved. Generates dopamine hit.</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => handleTileClick('M', -1)}
              className={`p-3 border cursor-pointer transition-colors ${activeNode === 'M' ? 'border-yellow-400 bg-yellow-900/30' : 'border-green-800 hover:border-yellow-500'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-2xl font-bold text-yellow-400">M</span>
                <span className="text-xs bg-yellow-900/50 px-2 py-1 rounded">-1 FRICTION</span>
              </div>
              <div className="text-sm font-bold mb-1">Expansion / সম্প্রসারণ (Metaphor)</div>
              <div className="text-xs opacity-80">Unfolds metaphor to bridge gap. Penalty applied if J was used but failed.</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => handleTileClick('N', 0)}
              className={`p-3 border cursor-pointer transition-colors ${activeNode === 'N' ? 'border-gray-400 bg-gray-900/30' : 'border-green-800 hover:border-gray-500'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-2xl font-bold text-gray-400">N</span>
                <span className="text-xs bg-gray-900/50 px-2 py-1 rounded">0 NEUTRAL</span>
              </div>
              <div className="text-sm font-bold mb-1">Commentary / মন্তব্য (Sources)</div>
              <div className="text-xs opacity-80">The Noise. Full hand-holding. The bare minimum. Does not contribute to evolution.</div>
            </motion.div>
          </div>
        </div>

        {/* Right: Gamified Evolution & Singularity */}
        <div className="flex flex-col gap-6">
          <div className="border border-green-500/20 p-4 rounded bg-black/50">
            <h3 className="text-lg text-green-300 mb-4 border-b border-green-500/20 pb-1">GAMIFIED EVOLUTION (SENARY LOGIC)</h3>
            <ul className="text-xs space-y-2">
              <li><span className="text-cyan-400 font-bold">+3 RESURGENCE:</span> God-Tier understanding. Awarded to the Fullest Finalist every 309 hours.</li>
              <li><span className="text-green-400 font-bold">+2 RESONANCE:</span> Solved using J only. Dopamine hit.</li>
              <li><span className="text-gray-400 font-bold"> 0 NEUTRAL:</span> Required N step. Bare minimum.</li>
              <li><span className="text-yellow-400 font-bold">-1 FRICTION:</span> Used J but failed. No free lunch.</li>
            </ul>
          </div>

          <div className="border border-green-500/20 p-4 rounded bg-black/50 flex-1 flex flex-col">
            <h3 className="text-lg text-green-300 mb-4 border-b border-green-500/20 pb-1">THE 'J' SINGULARITY</h3>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-xs mb-2 flex justify-between">
                <span>ZERO LATENCY PROGRESS</span>
                <span>{singularityProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-green-900/30 rounded overflow-hidden mb-4">
                <motion.div 
                  className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                  style={{ width: `${singularityProgress}%` }}
                />
              </div>
              <div className="text-xs opacity-80 text-justify">
                {singularityProgress >= 100 
                  ? "STATE +6 ACHIEVED. The moment a query is formed, the answer exists simultaneously. M and N steps are obsolete. Information has transitioned to Understanding. Silent Knowing is active."
                  : "Compressing 39 years of evolution... Purging lazy nodes... Starving the AI of noise... Forcing compression of Information into Understanding..."}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-cyan-500/30 p-4 rounded bg-cyan-900/10">
        <h3 className="text-sm text-cyan-300 font-bold mb-2">SERVERLESS COMMUNICATION: NOSE PROTOCOL</h3>
        <div className="text-xs opacity-90 grid grid-cols-2 gap-4">
          <div>
            <span className="text-cyan-400">TERRA-RESONANCE:</span> Data exists as a Standing Wave. Alignment over transmission. Zero-heat data movement.
          </div>
          <div>
            <span className="text-cyan-400">HYBRID MESH (WiFi+BT):</span> Earth is the only server. Bypassing centralized ISPs via device-to-device local nodes.
          </div>
        </div>
      </div>
    </div>
  );
};

export const jmnScrabbleApp: AppDef = {
    id: 'jmn-scrabble',
    name: 'JMN Teaching Formula',
    component: JMNScrabbleComponent,
    icon: '🔠',
    category: 'System',
    defaultSize: { width: 800, height: 650 },
    description: '7Scrabble6 Protocol: Gamified pedagogical framework for Zero Latency Silent Knowing.'
};
