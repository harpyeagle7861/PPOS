
import React, { useEffect, useRef } from 'react';
import { store } from '../core/state.ts';

export const AmbientSound: React.FC<{ enabled: boolean }> = ({ enabled }) => {
    const ctxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const oscRefs = useRef<OscillatorNode[]>([]);
    const lfoRef = useRef<OscillatorNode | null>(null);
    const filterRef = useRef<BiquadFilterNode | null>(null);

    useEffect(() => {
        if (enabled) {
            initAudio();
        } else {
            stopAudio();
        }
        return () => stopAudio();
    }, [enabled]);

    const initAudio = () => {
        if (ctxRef.current) return;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0; 
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Fade in
        masterGain.gain.setTargetAtTime(0.15, ctx.currentTime, 2);

        // Filter (Tone control)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.connect(masterGain);
        filterRef.current = filter;

        // LFO for texture (Breathing)
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.1; // Slow breath
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 50; // Modulate filter cutoff
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        lfoRef.current = lfo;

        // Drones (Harmonic Series)
        const freqs = [55, 110, 165]; // Base A1
        freqs.forEach(f => {
            const osc = ctx.createOscillator();
            osc.frequency.value = f;
            osc.type = 'sine'; // Default
            osc.connect(filter);
            osc.start();
            oscRefs.current.push(osc);
        });
    };

    const stopAudio = () => {
        if (ctxRef.current) {
            // Fade out before close?
            if (masterGainRef.current) {
                masterGainRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.5);
            }
            setTimeout(() => {
                ctxRef.current?.close();
                ctxRef.current = null;
                oscRefs.current = [];
            }, 600);
        }
    };

    // React to State Changes
    useEffect(() => {
        const unsub = store.subscribe((state) => {
            if (!ctxRef.current || !filterRef.current || !lfoRef.current) return;
            const now = ctxRef.current.currentTime;
            
            // 1. Theme -> Waveform
            const isDark = state.settings.theme === 'dark';
            const type = isDark ? 'triangle' : 'sine';
            oscRefs.current.forEach(osc => {
                if (osc.type !== type) osc.type = type;
            });

            // 2. Logic State -> Frequency/Tension
            // State: -2 to +3
            // Base Freq: 55Hz
            // Shift: +5Hz per state
            const base = 55 + (state.quinaryState * 5);
            oscRefs.current.forEach((osc, i) => {
                const harmonic = i + 1;
                // Add some detuning based on state (Negative states = more dissonance)
                const detune = state.quinaryState < 0 ? Math.random() * 15 : 0;
                osc.frequency.setTargetAtTime((base * harmonic), now, 1);
                osc.detune.setTargetAtTime(detune, now, 1);
            });

            // 3. Heartrate -> LFO Speed
            const lfoSpeed = 0.1 + ((state.neuralHeartRate - 60) / 60) * 0.2;
            lfoRef.current.frequency.setTargetAtTime(lfoSpeed, now, 2);

            // 4. State -> Filter Brightness
            // Higher state = brighter
            const cutoff = 200 + ((state.quinaryState + 2) * 100);
            filterRef.current.frequency.setTargetAtTime(cutoff, now, 2);

        });
        return () => unsub();
    }, []);

    return null;
};
