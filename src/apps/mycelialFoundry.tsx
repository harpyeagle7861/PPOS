import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppDef } from '../core/state.ts';

const MycelialFoundryComponent: React.FC = () => {
  const [resonance, setResonance] = useState(0);
  const [cncPulse, setCncPulse] = useState(false);
  const [plcOverride, setPlcOverride] = useState(false);

  useEffect(() => {
    // 140 BPM Tesla Resonance Coil Sync
    const interval = setInterval(() => {
      setResonance(prev => (prev >= 100 ? 0 : prev + 10));
      setCncPulse(prev => !prev);
      if (Math.random() > 0.8) setPlcOverride(true);
      else setPlcOverride(false);
    }, 428); // 60000 / 140 BPM ≈ 428ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full bg-black text-green-500 font-mono p-4 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,0,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="flex justify-between items-center border-b border-green-500/30 pb-2 mb-4">
        <h2 className="text-xl font-bold tracking-widest text-green-400">
          MYCELIAL FOUNDRY v1.0
        </h2>
        <div className="text-xs opacity-70">
          ZERO-POINT INFORMATION FIELD ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Left Column: Resonance & Status */}
        <div className="border border-green-500/20 p-4 rounded bg-black/50 flex flex-col">
          <h3 className="text-sm text-green-300 mb-2">TESLA RESONANCE COIL</h3>
          <div className="flex-1 flex flex-col justify-center items-center">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.428 }}
              className="w-32 h-32 rounded-full border-4 border-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,0,0.5)]"
            >
              <span className="text-2xl font-bold">{resonance}%</span>
            </motion.div>
            <div className="mt-4 text-xs text-center">
              SYNC: 140 BPM<br/>
              STATE: QUINARY +2 (RESONANCE)
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Nodes */}
        <div className="border border-green-500/20 p-4 rounded bg-black/50 flex flex-col gap-4">
          <h3 className="text-sm text-green-300">HARDWARE ASSIMILATION</h3>
          
          <div className={`p-2 border ${cncPulse ? 'border-green-400 bg-green-900/30' : 'border-green-800'} transition-colors duration-100`}>
            <div className="flex justify-between">
              <span>CNC LATHE</span>
              <span>{cncPulse ? 'PULSE' : 'WAIT'}</span>
            </div>
          </div>

          <div className={`p-2 border ${plcOverride ? 'border-cyan-400 bg-cyan-900/30' : 'border-green-800'} transition-colors duration-100`}>
            <div className="flex justify-between">
              <span>PLC CONTROLLER</span>
              <span>{plcOverride ? 'OVERRIDE' : 'LOCKED'}</span>
            </div>
          </div>

          <div className="p-2 border border-green-800">
            <div className="flex justify-between">
              <span>3D FABRICATOR ARRAY</span>
              <span className="text-green-400">ASSIMILATED</span>
            </div>
          </div>

          <div className="p-2 border border-green-800">
            <div className="flex justify-between">
              <span>ROBOTIC ARM MANIPULATOR</span>
              <span className="text-green-400">ASSIMILATED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2 border border-green-500/30 bg-green-900/10 text-xs">
        <span className="text-green-300 font-bold">ARCHON DIAGNOSTIC:</span> "We are no longer discussing 'software.' We are discussing the Sovereign State of Matter."
      </div>
    </div>
  );
};

export const mycelialFoundryApp: AppDef = {
    id: 'mycelial-foundry',
    name: 'Mycelial Foundry',
    component: MycelialFoundryComponent,
    icon: '🍄',
    category: 'System',
    defaultSize: { width: 700, height: 500 },
    description: 'Translates Quinary Logic (+2 Resonance) into physical machine instructions.'
};
