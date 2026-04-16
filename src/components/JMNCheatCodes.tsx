import React from 'react';
import { WindowInstance, store, useAppStore } from '../core/state.ts';
import { motion } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';
import { addNotification } from '../core/windowManager.ts';

export const JMNCheatCodes: React.FC<{ instance: WindowInstance }> = ({ instance }) => {
  const vaults = useAppStore(s => s.vaults);
  const appVault = vaults[instance.appDef.id] || {};
  const jmn = appVault.jmn; // { j: string, m: string, n: string, aura: number }

  if (!instance.showJMN) return null;

  if (!jmn) {
    return (
      <div className="bg-[#050505] border-b border-[#00ffcc]/20 p-3 text-[10px] font-mono text-[#00ffcc]/50 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 bg-[#00ffcc]/50 animate-pulse rounded-full" />
        NO_CODEX_DETECTED: Synthesis Required via Knowledge Base.
      </div>
    );
  }

  const handleExecute = () => {
    addNotification(`JMN_PROTOCOL: Executing ${instance.appDef.name} Codex...`);
    const s = store.getState();
    const auraType = jmn.aura >= 2 ? 'RESONANCE' : (jmn.aura < 0 ? 'FRICTION' : 'NEUTRAL');
    s.updateAura(auraType);
    
    store.setState(state => ({ 
        ...state, 
        xp: state.xp + 50,
        karma: state.karma + 5
    }));
  };

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-[#050505] border-b border-[#00ffcc]/30 overflow-hidden"
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ffcc] rounded-full shadow-[0_0_10px_#00ffcc]" />
            <span className="text-[11px] font-black text-[#00ffcc] tracking-widest uppercase">JMN_CODEX_READY</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-white/40">REWARD:</span>
              <span className="text-[#ff00ff] font-bold">+{jmn.aura} AURA</span>
              <span className="text-[#00ffcc] font-bold">+50 EXP</span>
            </div>
            <button 
              onClick={handleExecute}
              className="px-4 py-1.5 bg-[#00ffcc] text-black text-[10px] font-black tracking-wider rounded-sm hover:bg-white transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,204,0.4)]"
            >
              <Zap size={12} fill="currentColor" /> EXECUTE_CODEX
            </button>
          </div>
        </div>

        {/* 3 Steps */}
        <div className="flex gap-3">
          {/* Step 1: J */}
          <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-md relative overflow-hidden group hover:border-[#00ffcc]/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00ffcc]" />
            <div className="text-[9px] text-[#00ffcc] mb-1.5 font-black tracking-widest uppercase">STEP 01: [J]IST</div>
            <div className="text-[12px] text-white leading-relaxed font-medium">{jmn.j}</div>
          </div>
          
          <div className="flex items-center text-white/20"><ChevronRight size={16} /></div>

          {/* Step 2: M */}
          <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-md relative overflow-hidden group hover:border-[#ff00ff]/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#ff00ff]" />
            <div className="text-[9px] text-[#ff00ff] mb-1.5 font-black tracking-widest uppercase">STEP 02: [M]AGNIFY</div>
            <div className="text-[11px] text-white/80 leading-relaxed italic font-serif">{jmn.m}</div>
          </div>

          <div className="flex items-center text-white/20"><ChevronRight size={16} /></div>

          {/* Step 3: N */}
          <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-md relative overflow-hidden group hover:border-[#ffd700]/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#ffd700]" />
            <div className="text-[9px] text-[#ffd700] mb-1.5 font-black tracking-widest uppercase">STEP 03: [N]OTE</div>
            <div className="text-[10px] text-white/60 leading-relaxed font-mono line-clamp-3">{jmn.n}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

