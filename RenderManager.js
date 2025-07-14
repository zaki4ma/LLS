class RenderManager {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.lightRadius = 4;
    }

    calculateVisibility(gameInstance) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                gameInstance.visibleCells[y][x] = false;
            }
        }
        
        const playerX = gameInstance.playerManager.player.x;
        const playerY = gameInstance.playerManager.player.y;
        
        gameInstance.visibleCells[playerY][playerX] = true;
        
        for (let y = Math.max(0, playerY - this.lightRadius); y <= Math.min(this.gridSize - 1, playerY + this.lightRadius); y++) {
            for (let x = Math.max(0, playerX - this.lightRadius); x <= Math.min(this.gridSize - 1, playerX + this.lightRadius); x++) {
                const distance = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);
                
                if (distance <= this.lightRadius && this.hasLineOfSight(playerX, playerY, x, y, gameInstance)) {
                    gameInstance.visibleCells[y][x] = true;
                    
                    if (gameInstance.grid[y][x] !== null) {
                        gameInstance.exploredCells[y][x] = {
                            terrain: gameInstance.grid[y][x]
                        };
                    }
                }
            }
        }
    }

    hasLineOfSight(x1, y1, x2, y2, gameInstance) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            if (x === x2 && y === y2) return true;
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return false;
            if (gameInstance.grid[y][x] === 'bulkhead') return false;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    render(gameInstance) {
        this.calculateVisibility(gameInstance);
        
        const gridElement = document.getElementById('game-grid');
        if (!gridElement) return;
        
        gridElement.innerHTML = '';
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                const cellType = gameInstance.grid[y][x];
                const isVisible = gameInstance.visibleCells[y][x];
                const isExplored = gameInstance.exploredCells[y][x] !== null;
                
                if (!isVisible && !isExplored) {
                    cell.classList.add('hidden');
                    gridElement.appendChild(cell);
                    continue;
                }
                
                if (cellType === 'player') {
                    cell.textContent = '@';
                    cell.classList.add('player');
                    cell.classList.add('lit');
                } else {
                    const livingAlien = gameInstance.aliens.find(a => a.x === x && a.y === y && a.alive);
                    if (livingAlien && isVisible) {
                        cell.textContent = livingAlien.typeData.symbol;
                        cell.style.color = livingAlien.typeData.color;
                        cell.style.textShadow = `0 0 10px ${livingAlien.typeData.color}`;
                        cell.classList.add('alien');
                        
                        // 敵タイプ別アニメーション
                        this.addEnemyAnimation(cell, livingAlien.type);
                    } else if (isVisible) {
                        this.renderCell(cell, cellType);
                    } else if (isExplored) {
                        this.renderCell(cell, gameInstance.exploredCells[y][x].terrain);
                        cell.classList.add('explored');
                    }
                }
                
                if (!isVisible) {
                    cell.classList.add('dark');
                } else {
                    cell.classList.add('lit');
                }
                
                gridElement.appendChild(cell);
            }
        }
    }

    addEnemyAnimation(cell, alienType) {
        const animationMap = {
            'ASSASSIN': 'assassinFlicker 1s infinite',
            'BERSERKER': 'berserkerRage 0.8s infinite',
            'PSYCHIC': 'psychicWave 2s infinite',
            'PHANTOM': 'phantomPhase 1.5s infinite',
            'OVERLORD': 'overlordCommand 1.2s infinite',
            'NIGHTMARE': 'nightmareHorror 2.5s infinite',
            'APEX': 'apexUltimate 1.8s infinite'
        };
        
        if (animationMap[alienType]) {
            cell.style.animation = animationMap[alienType];
        }
    }

    renderCell(cell, cellType) {
        switch (cellType) {
            case 'floor':
                cell.classList.add('floor');
                break;
            case 'bulkhead':
                cell.textContent = '#';
                cell.classList.add('bulkhead');
                break;
            case 'supply':
                cell.textContent = '$';
                cell.classList.add('supply');
                break;
            case 'oxygen-supply':
                cell.textContent = 'O';
                cell.classList.add('oxygen-supply');
                break;
            case 'medical-supply':
                cell.textContent = '+';
                cell.classList.add('medical-supply');
                break;
            case 'weapon-supply':
                cell.textContent = 'W';
                cell.classList.add('weapon-supply');
                break;
            case 'elevator':
                cell.textContent = '>';
                cell.classList.add('elevator');
                break;
        }
    }

    showFloatingText(x, y, text, color) {
        const gameGrid = document.getElementById('game-grid');
        if (!gameGrid) return;
        
        // グリッドの位置を取得
        const gridRect = gameGrid.getBoundingClientRect();
        const cellSize = gridRect.width / this.gridSize;
        
        const floatingDiv = document.createElement('div');
        floatingDiv.textContent = text;
        floatingDiv.style.cssText = `
            position: fixed;
            color: ${color};
            font-weight: bold;
            font-size: 16px;
            pointer-events: none;
            z-index: 1000;
            left: ${gridRect.left + x * cellSize + cellSize / 2}px;
            top: ${gridRect.top + y * cellSize + cellSize / 2}px;
            animation: damageFloat 1s ease-out forwards;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            transform: translateX(-50%) translateY(-50%);
        `;
        
        document.body.appendChild(floatingDiv);
        
        // 複数のエフェクトが重ならないよう、少しずらす
        const existingEffects = document.querySelectorAll('div[style*="damageFloat"]');
        if (existingEffects.length > 1) {
            floatingDiv.style.left = (gridRect.left + x * cellSize + cellSize / 2 + (existingEffects.length * 10)) + 'px';
        }
        
        setTimeout(() => {
            if (floatingDiv.parentNode) {
                floatingDiv.parentNode.removeChild(floatingDiv);
            }
        }, 1000);
    }

    showAttackFlash(x, y) {
        const gameGrid = document.getElementById('game-grid');
        if (!gameGrid) return;
        
        const cellIndex = y * this.gridSize + x;
        const cell = gameGrid.children[cellIndex];
        
        if (cell) {
            cell.classList.add('attack-flash');
            setTimeout(() => {
                cell.classList.remove('attack-flash');
            }, 300);
        }
    }

    showPlayerDamageFlash(gameInstance) {
        const gameGrid = document.getElementById('game-grid');
        if (!gameGrid) return;
        
        const cellIndex = gameInstance.playerManager.player.y * this.gridSize + gameInstance.playerManager.player.x;
        const cell = gameGrid.children[cellIndex];
        
        if (cell) {
            cell.classList.add('player-flash');
            setTimeout(() => {
                cell.classList.remove('player-flash');
            }, 300);
        }
    }
}