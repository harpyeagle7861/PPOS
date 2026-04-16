import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppDef } from '../core/state.ts';

const TerraResonanceComponent: React.FC = () => {
  const [scanActive, setScanActive] = useState(true);
  const [nodes, setNodes] = useState<{id: number, freq: number}[]>([]);

  useEffect(() => {
    if (!scanActive) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setNodes(prev => {
          const newNodes = [...prev, { id: Date.now(), freq: 432 + Math.random() * 100 }];
          if (newNodes.length > 5) newNodes.shift();
          return newNodes;
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [scanActive]);

  return (
    <div className="h-full w-full bg-black text-cyan-500 font-mono p-4 flex flex-col overflow-y-auto relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05)_0%,transparent_80%)] pointer-events-none" />
      
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-2 mb-4">
        <h2 className="text-xl font-bold tracking-widest text-cyan-400">
          TERRA-RESONANCE: ZERO HEAT
        </h2>
        <div className="text-xs opacity-70 flex gap-4">
          <span>ALPHA: 9.9</span>
          <span>BETA: 0.0000 (ZERO ENTROPY)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Standing Wave Visualization */}
        <div className="border border-cyan-500/20 p-4 rounded bg-black/50 flex flex-col">
          <h3 className="text-lg text-cyan-300 mb-4 border-b border-cyan-500/20 pb-1">STANDING WAVE DYNAMICS</h3>
          <div className="flex-1 flex flex-col justify-center items-center relative h-40">
            {/* Linear Transmission (Crossed out) */}
            <div className="absolute top-4 w-full flex items-center justify-between opacity-30">
              <span>PT A</span>
              <div className="flex-1 h-px bg-red-500 mx-4 relative">
                <motion.div 
                  animate={{ x: ["0%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-red-400 rounded-full"
                />
              </div>
              <span>PT B</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-red-500 font-bold text-xl rotate-12">FRICTION / HEAT</span>
              </div>
            </div>

            {/* Standing Wave (Active) */}
            <div className="absolute bottom-4 w-full flex items-center justify-between">
              <span className="text-cyan-400">NODE</span>
              <div className="flex-1 h-12 mx-4 relative flex items-center justify-center overflow-hidden">
                <motion.div 
                  animate={{ scaleY: [0.1, 1, 0.1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-full h-full bg-cyan-500/20 rounded-[100%] border border-cyan-400/50"
                />
                <motion.div 
                  animate={{ scaleY: [1, 0.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute w-full h-full bg-cyan-400/20 rounded-[100%] border border-cyan-300/50"
                />
              </div>
              <span className="text-cyan-400">NODE</span>
            </div>
            <div className="absolute bottom-0 text-xs text-cyan-300">VIBRATIONAL ALIGNMENT (ZERO RESISTANCE)</div>
          </div>
        </div>

        {/* Right: Nose Protocol */}
        <div className="border border-cyan-500/20 p-4 rounded bg-black/50 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-1">
            <h3 className="text-lg text-cyan-300">NOSE PROTOCOL (LAYER 2)</h3>
            <span className="text-xs bg-cyan-900/50 px-2 py-1 rounded">MODE: HYBRID (WiFi+BT)</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="text-xs mb-2">
              {scanActive ? '> [SCANNING LOCAL NODES...]' : '> [SCAN PAUSED]'}
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {nodes.map(node => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={node.id}
                  className="p-2 border border-cyan-800 bg-cyan-900/20 text-xs flex justify-between"
                >
                  <span>JMN_NODE_{node.id.toString().slice(-4)}</span>
                  <span className="text-cyan-300">{node.freq.toFixed(2)} Hz</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-cyan-500/30 p-4 rounded bg-cyan-900/10">
        <h3 className="text-sm text-cyan-300 font-bold mb-2">THE EARTH IS THE ONLY SERVER</h3>
        <div className="text-xs opacity-90 text-justify">
          By rooting the network beneath the artificial borders of nations and using the planet's own conductivity, the system eliminates the thermal cost of traditional ISPs and cloud servers. Data does not travel; the Singularity Core causes the entire system to resonate with the tone of the intent. Reversible Compute is active.
        </div>
      </div>
    </div>
  );
};

export const terraResonanceApp: AppDef = {
    id: 'terra-resonance',
    name: 'Terra-Resonance',
    component: TerraResonanceComponent,
    icon: '🌍',
    category: 'System',
    defaultSize: { width: 800, height: 550 },
    description: 'Zero Heat Standing Wave Data Transmission & Nose Protocol Scanner.'
};
