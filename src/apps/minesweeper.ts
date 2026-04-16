
import React, { useState, useEffect, useCallback } from 'react';
import { AppDef } from '../core/state';

const GRID_SIZE = 10;
const MINES_COUNT = 15;

const MinesweeperComponent: React.FC<{ instanceId: string; isFocused: boolean; }> = () => {
    const [grid, setGrid] = useState<any[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [win, setWin] = useState(false);

    const initGame = useCallback(() => {
        const newGrid = Array.from({ length: GRID_SIZE }, (_, r) => 
            Array.from({ length: GRID_SIZE }, (_, c) => ({
                r, c, isMine: false, revealed: false, flagged: false, neighborCount: 0
            }))
        );

        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < MINES_COUNT) {
            const r = Math.floor(Math.random() * GRID_SIZE);
            const c = Math.floor(Math.random() * GRID_SIZE);
            if (!newGrid[r][c].isMine) {
                newGrid[r][c].isMine = true;
                minesPlaced++;
            }
        }

        // Count neighbors
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (newGrid[r][c].isMine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && newGrid[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                newGrid[r][c].neighborCount = count;
            }
        }
        setGrid(newGrid);
        setGameOver(false);
        setWin(false);
    }, []);

    useEffect(() => { initGame(); }, [initGame]);

    const reveal = (r: number, c: number) => {
        if (gameOver || win || grid[r][c].revealed || grid[r][c].flagged) return;

        const newGrid = [...grid.map(row => [...row])];
        if (newGrid[r][c].isMine) {
            setGameOver(true);
            revealAll(newGrid);
            return;
        }

        const floodFill = (row: number, col: number) => {
            if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE || newGrid[row][col].revealed) return;
            newGrid[row][col].revealed = true;
            if (newGrid[row][col].neighborCount === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) floodFill(row + dr, col + dc);
                }
            }
        };

        floodFill(r, c);
        setGrid(newGrid);

        // Check win
        const unrevealedCount = newGrid.flat().filter(cell => !cell.revealed && !cell.isMine).length;
        if (unrevealedCount === 0) setWin(true);
    };

    const revealAll = (g: any[]) => {
        g.forEach(row => row.forEach((cell: any) => cell.revealed = true));
        setGrid(g);
    };

    const toggleFlag = (e: any, r: number, c: number) => {
        e.preventDefault();
        if (gameOver || win || grid[r][c].revealed) return;
        const newGrid = [...grid.map(row => [...row])];
        newGrid[r][c].flagged = !newGrid[r][c].flagged;
        setGrid(newGrid);
    };

    return React.createElement('div', { 
        style: { 
            height: '100%', background: '#c0c0c0', padding: '20px', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            userSelect: 'none', border: '2px solid #fff', borderRightColor: '#808080', borderBottomColor: '#808080' 
        } 
    },
        React.createElement('div', { 
            style: { 
                background: '#000', color: '#ff0000', fontFamily: "'Courier New', monospace", 
                padding: '5px 15px', fontSize: '24px', border: '2px inset #fff', marginBottom: '20px', 
                display: 'flex', gap: '20px' 
            } 
        },
            React.createElement('span', null, win ? 'WIN!' : (gameOver ? 'LOST' : 'MINE')),
            React.createElement('button', { 
                onClick: initGame,
                style: { background: 'transparent', border: 'none', color: '#ff0', cursor: 'pointer' }
            }, '😊')
        ),
        React.createElement('div', { 
            style: { 
                display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 30px)`, 
                border: '2px inset #fff', background: '#808080' 
            } 
        },
            grid.map((row, r) => row.map((cell, c) => 
                React.createElement('div', {
                    key: `${r}-${c}`,
                    onClick: () => reveal(r, c),
                    onContextMenu: (e) => toggleFlag(e, r, c),
                    style: {
                        width: '30px', height: '30px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
                        border: cell.revealed ? '1px solid #7b7b7b' : '3px outset #fff',
                        background: cell.revealed ? (cell.isMine ? '#ff4d4d' : '#bdbdbd') : '#c0c0c0',
                        color: ['transparent', 'blue', 'green', 'red', 'darkblue', 'brown', 'cyan', 'black', 'gray'][cell.neighborCount]
                    }
                }, 
                    cell.flagged && !cell.revealed ? '🚩' : 
                    (cell.revealed ? (cell.isMine ? '💣' : (cell.neighborCount || '')) : '')
                )
            ))
        )
    );
};

export const minesweeperApp: AppDef = {
    id: 'minesweeper',
    name: 'Minesweeper',
    component: MinesweeperComponent,
    icon: '💣',
    category: 'Entertainment',
    defaultSize: { width: 360, height: 480 },
    description: 'Tactical mine removal simulation. Calibrated for neural reflexes.'
};
