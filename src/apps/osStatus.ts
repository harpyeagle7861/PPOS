
import React, { useState, useEffect } from 'react';
import { AppDef, store } from '../core/state';

const Gauge: React.FC<{ value: number; label: string; color: string; unit: string }> = ({ value, label, color, unit }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' } },
        React.createElement('div', { style: { position: 'relative', width: '110px', height: '110px' } },
            React.createElement('svg', { width: '110', height: '110', viewBox: '0 0 110 110' },
                React.createElement('circle', { cx: '55', cy: '55', r: radius, fill: 'none', stroke: 'rgba(255,255,255,0.05)', strokeWidth: '6' }),
                React.createElement('circle', { 
                    cx: '55', cy: '55', r: radius, fill: 'none', stroke: color, strokeWidth: '6', 
                    strokeDasharray: circumference, strokeDashoffset: offset, strokeLinecap: 'round',
                    style: { transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)', filter: `drop-shadow(0 0 8px ${color}88)` }
                })
            ),
            React.createElement('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
                React.createElement('span', { style: { fontSize: '20px', fontWeight: 800, color: '#fff' } }, Math.round(value)),
                React.createElement('span', { style: { fontSize: '9px', opacity: 0.4, fontWeight: 900 } }, unit)
            )
        ),
        React.createElement('div', { style: { fontSize: '10px', fontWeight: 900, letterSpacing: '2px', color, opacity: 0.8 } }, label.toUpperCase())
    );
};

const OSStatusComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [vitals, setVitals] = useState({ cpu: 0, mem: 0, disk: 0 });
    const [heartRate, setHeartRate] = useState(store.getState().neuralHeartRate);

    useEffect(() => {
        const interval = setInterval(() => {
            setVitals({
                cpu: 15 + Math.random() * 20,
                mem: 40 + Math.random() * 5,
                disk: 22
            });
        }, 2000);
        const unsubscribe = store.subscribe(s => setHeartRate(s.neuralHeartRate));
        return () => { clearInterval(interval); unsubscribe(); };
    }, []);

    return React.createElement('div', { style: { height: '100%', background: 'linear-gradient(180deg, #050505 0%, #000 100%)', padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
            React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '10px', fontWeight: 900, color: '#00ffcc', letterSpacing: '4px', marginBottom: '8px' } }, 'BIOLOGICAL_ORGANISM_VITALS'),
                React.createElement('div', { style: { fontSize: '24px', fontWeight: 800, color: '#fff' } }, 'NOMINAL_STATE')
            ),
            React.createElement('div', { style: { textAlign: 'right' } },
                React.createElement('div', { style: { fontSize: '9px', opacity: 0.3, letterSpacing: '1px' } }, 'UPTIME_DNA'),
                React.createElement('div', { style: { fontSize: '14px', fontFamily: 'JetBrains Mono', fontWeight: 700 } }, '786:39:14:02')
            )
        ),

        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', padding: '20px 0' } },
            React.createElement(Gauge, { value: vitals.cpu, label: 'Neural Flux', color: '#00ffcc', unit: 'FLOPS' }),
            React.createElement(Gauge, { value: vitals.mem, label: 'Brain Load', color: '#ff00ff', unit: 'HONEYCOMB' }),
            React.createElement(Gauge, { value: vitals.disk, label: 'Core Integrity', color: '#00ccff', unit: 'STABLE' })
        ),

        React.createElement('div', { style: { flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' } },
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' } }, 'POMEGRANATE_HEART_PULSE'),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '25px' } },
                React.createElement('div', { style: { fontSize: '42px', fontWeight: 900, color: '#ff4d4d', textShadow: '0 0 20px rgba(255,77,77,0.3)' } }, heartRate),
                React.createElement('div', { style: { flex: 1 } },
                    React.createElement('div', { style: { height: '40px', display: 'flex', alignItems: 'flex-end', gap: '2px' } },
                        [...Array(30)].map((_, i) => React.createElement('div', { 
                            key: i, 
                            style: { 
                                width: '3px', 
                                height: `${20 + Math.sin(Date.now() / 500 + i) * 15}%`, 
                                background: '#ff4d4d', 
                                opacity: 0.3 + (i / 30) * 0.7,
                                borderRadius: '2px'
                            } 
                        }))
                    ),
                    React.createElement('div', { style: { fontSize: '8px', opacity: 0.3, marginTop: '8px', letterSpacing: '1px' } }, 'JUBAER_CYCLE_RESONANCE_ACTIVE')
                )
            )
        )
    );
};

export const osStatusApp: AppDef = {
    id: 'os-status', name: 'Organism Vitals', component: OSStatusComponent, icon: '📊', category: 'System', defaultSize: { width: 480, height: 550 },
    description: 'Real-time biological telemetry. Monitor Pomegranate Heart Rate and Honeycomb Brain stability.'
};
