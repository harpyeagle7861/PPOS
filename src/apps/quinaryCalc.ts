
import React, { useState, useEffect } from 'react';
import { AppDef } from '../core/state.ts';

const CALC_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;700&display=swap');

.q-calc-root {
    --neon-cyan: #00f3ff;
    --neon-magenta: #ff00ff;
    --deep-space: rgba(10, 11, 16, 0.95);
    --glass-border: 1px solid rgba(255, 255, 255, 0.1);
    
    height: 100%;
    background: var(--deep-space);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    display: flex;
    flex-direction: column;
    padding: 20px;
    box-sizing: border-box;
}

.q-display {
    background: rgba(0, 0, 0, 0.5);
    border: var(--glass-border);
    border-radius: 12px;
    padding: 20px;
    text-align: right;
    margin-bottom: 20px;
    box-shadow: inset 0 0 20px rgba(0, 243, 255, 0.05);
}

.q-prev {
    font-size: 12px;
    color: var(--neon-magenta);
    opacity: 0.7;
    min-height: 1.2em;
    letter-spacing: 1px;
}

.q-current {
    font-size: 32px;
    color: var(--neon-cyan);
    font-weight: 700;
    text-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
    word-break: break-all;
}

.q-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    flex: 1;
}

.q-btn {
    background: rgba(255, 255, 255, 0.03);
    border: var(--glass-border);
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.q-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.1);
    transform: translateY(-2px);
    border-color: var(--neon-cyan);
}

.q-btn:active {
    transform: scale(0.95);
}

.q-op {
    color: var(--neon-magenta);
    font-weight: 700;
    background: rgba(255, 0, 255, 0.05);
}

.q-eq {
    background: linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(255, 0, 255, 0.1));
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: 900;
    grid-column: span 2;
}

.q-eq:hover {
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
    border-color: var(--neon-magenta);
}

.q-clear {
    color: #ff3333;
    border-color: rgba(255, 51, 51, 0.2);
}
`;

const QuinaryCalcComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [current, setCurrent] = useState('0');
    const [previous, setPrevious] = useState('');
    const [operation, setOperation] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    const appendNumber = (num: string) => {
        if (num === '.' && current.includes('.')) return;
        setCurrent(current === '0' && num !== '.' ? num : current + num);
    };

    const chooseOperation = (op: string) => {
        if (current === '') return;
        if (previous !== '') {
            compute();
        }
        setOperation(op);
        setPrevious(current);
        setCurrent('');
    };

    const compute = () => {
        let computation;
        const prev = parseFloat(previous);
        const curr = parseFloat(current);
        if (isNaN(prev) || isNaN(curr)) return;

        switch (operation) {
            case '+': computation = prev + curr; break;
            case '-': computation = prev - curr; break;
            case '*': computation = prev * curr; break;
            case '/': computation = curr === 0 ? 0 : prev / curr; break;
            case '%': computation = prev % curr; break;
            default: return;
        }

        const result = computation.toString();
        setCurrent(result);
        setOperation(null);
        setPrevious('');
        setHistory(prevH => [`${prev} ${operation} ${curr} = ${result}`, ...prevH].slice(0, 5));
    };

    const clear = () => {
        setCurrent('0');
        setPrevious('');
        setOperation(null);
    };

    const deleteLast = () => {
        setCurrent(current.length === 1 ? '0' : current.slice(0, -1));
    };

    return React.createElement('div', { className: 'q-calc-root' },
        React.createElement('style', null, CALC_STYLES),
        
        React.createElement('div', { style: { marginBottom: '10px', fontSize: '10px', color: '#00f3ff', opacity: 0.5, letterSpacing: '2px' } }, 'ORGAN: quinary-calc-neon'),
        
        React.createElement('div', { className: 'q-display' },
            React.createElement('div', { className: 'q-prev' }, 
                `${previous} ${operation || ''}`
            ),
            React.createElement('div', { className: 'q-current' }, current)
        ),

        React.createElement('div', { className: 'q-grid' },
            React.createElement('button', { className: 'q-btn q-clear', onClick: clear }, 'AC'),
            React.createElement('button', { className: 'q-btn q-op', onClick: deleteLast }, '⌫'),
            React.createElement('button', { className: 'q-btn q-op', onClick: () => chooseOperation('%') }, '%'),
            React.createElement('button', { className: 'q-btn q-op', onClick: () => chooseOperation('/') }, '÷'),

            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('7') }, '7'),
            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('8') }, '8'),
            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('9') }, '9'),
            React.createElement('button', { className: 'q-btn q-op', onClick: () => chooseOperation('*') }, '×'),

            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('4') }, '4'),
            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('5') }, '5'),
            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('6') }, '6'),
            React.createElement('button', { className: 'q-btn q-op', onClick: () => chooseOperation('-') }, '-'),

            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('1') }, '1'),
            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('2') }, '2'),
            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('3') }, '3'),
            React.createElement('button', { className: 'q-btn q-op', onClick: () => chooseOperation('+') }, '+'),

            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('0') }, '0'),
            React.createElement('button', { className: 'q-btn', onClick: () => appendNumber('.') }, '.'),
            React.createElement('button', { className: 'q-btn q-eq', onClick: compute }, '=')
        ),

        React.createElement('div', { style: { marginTop: '15px', fontSize: '9px', color: '#666', textAlign: 'center' } },
            'QUINARY LOGIC PROCESSING UNIT'
        )
    );
};

export const quinaryCalcApp: AppDef = {
    id: 'quinary-calc-neon',
    name: 'Quinary Neon Calc',
    component: QuinaryCalcComponent,
    icon: '🧮',
    category: 'Utility',
    defaultSize: { width: 360, height: 550 },
    description: 'Neon-styled arithmetic processor for the Quinary grid.'
};
