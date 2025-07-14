class RenderManager {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.lightRadius = 4;
        this.floatingTextQueue = new Map(); // 位置別のエフェクトキュー
    }

    calculateVisibility(gameInstance) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                gameInstance.visibleCells[y][x] = false;
            }
        }
        
        const playerX = gameInstance.playerManager.player.x;
        const playerY = gameInstance.playerManager.player.y;
        const facing = gameInstance.playerManager.player.facing;
        
        gameInstance.visibleCells[playerY][playerX] = true;
        
        // 通信システムの全フロア照明効果をチェック
        if (gameInstance.communicationManager && gameInstance.communicationManager.hasFullLighting()) {
            // 全フロア照明時は全てのセルを可視化
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    gameInstance.visibleCells[y][x] = true;
                    if (gameInstance.grid[y][x] !== null) {
                        gameInstance.exploredCells[y][x] = {
                            terrain: gameInstance.grid[y][x]
                        };
                    }
                }
            }
            return;
        }
        
        for (let y = Math.max(0, playerY - this.lightRadius); y <= Math.min(this.gridSize - 1, playerY + this.lightRadius); y++) {
            for (let x = Math.max(0, playerX - this.lightRadius); x <= Math.min(this.gridSize - 1, playerX + this.lightRadius); x++) {
                const distance = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);
                const effectiveRange = this.getEffectiveRange(playerX, playerY, x, y, facing);
                
                if (distance <= effectiveRange && this.hasLineOfSight(playerX, playerY, x, y, gameInstance)) {
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
    
    getEffectiveRange(playerX, playerY, targetX, targetY, facing) {
        const dx = targetX - playerX;
        const dy = targetY - playerY;
        
        // 向いている方向を判定
        let isFacingDirection = false;
        let isBackDirection = false;
        
        switch (facing) {
            case 'up':
                isFacingDirection = dy < 0;
                isBackDirection = dy > 0;
                break;
            case 'down':
                isFacingDirection = dy > 0;
                isBackDirection = dy < 0;
                break;
            case 'left':
                isFacingDirection = dx < 0;
                isBackDirection = dx > 0;
                break;
            case 'right':
                isFacingDirection = dx > 0;
                isBackDirection = dx < 0;
                break;
        }
        
        // 背後方向は照明範囲を2マスに制限
        if (isBackDirection) {
            return 2;
        }
        
        // 向いている方向は通常の照明範囲を維持
        return this.lightRadius;
    }

    isInAttackRange(x, y, gameInstance) {
        const playerX = gameInstance.playerManager.player.x;
        const playerY = gameInstance.playerManager.player.y;
        const weaponData = gameInstance.rangedWeaponManager.getWeaponData(gameInstance.selectedRangedWeapon);
        
        if (!weaponData) return false;
        
        // マンハッタン距離で射程をチェック
        const distance = Math.abs(x - playerX) + Math.abs(y - playerY);
        if (distance > weaponData.range || distance < 1) return false;
        
        // 射線チェック
        return gameInstance.rangedWeaponManager.hasLineOfSight(playerX, playerY, x, y, gameInstance);
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
                
                // 遠距離攻撃の射程範囲を表示
                if (gameInstance.isRangedAttackMode && gameInstance.selectedRangedWeapon) {
                    const isInRange = this.isInAttackRange(x, y, gameInstance);
                    if (isInRange) {
                        cell.classList.add('attack-range');
                    }
                }
                
                if (!isVisible && !isExplored) {
                    cell.classList.add('hidden');
                    gridElement.appendChild(cell);
                    continue;
                }
                
                if (cellType === 'player') {
                    cell.textContent = '@';
                    cell.classList.add('player');
                    cell.classList.add('lit');
                    
                    // シールドが有効な場合の視覚的表示
                    if (gameInstance.playerManager.player.shieldActive) {
                        cell.classList.add('shielded');
                        cell.style.boxShadow = '0 0 15px #00ffff';
                        cell.style.animation = 'shieldPulse 1s infinite';
                    }
                } else {
                    const livingAlien = gameInstance.aliens.find(a => a.x === x && a.y === y && a.alive);
                    if (livingAlien && isVisible) {
                        cell.textContent = livingAlien.typeData.symbol;
                        
                        // スタン状態の視覚的表示
                        if (livingAlien.stunned) {
                            cell.style.color = '#ffff00';
                            cell.style.textShadow = `0 0 15px #ffff00`;
                            cell.classList.add('alien', 'stunned');
                            cell.style.animation = 'stunPulse 0.5s infinite';
                        } else {
                            cell.style.color = livingAlien.typeData.color;
                            cell.style.textShadow = `0 0 10px ${livingAlien.typeData.color}`;
                            cell.classList.add('alien');
                            
                            // 敵タイプ別アニメーション
                            this.addEnemyAnimation(cell, livingAlien.type);
                        }
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
            case 'power-charge-station':
                cell.textContent = '⚡';
                cell.classList.add('power-charge-station');
                break;
            case 'ranged-weapon-container':
                cell.textContent = '🔫';
                cell.classList.add('ranged-weapon-container');
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
        
        // 位置のキーを生成
        const positionKey = `${x},${y}`;
        
        // この位置のエフェクトキューを取得または作成
        if (!this.floatingTextQueue.has(positionKey)) {
            this.floatingTextQueue.set(positionKey, []);
        }
        
        const queue = this.floatingTextQueue.get(positionKey);
        const effectIndex = queue.length;
        
        // エフェクトの種類を判定
        const effectType = this.getEffectType(text, color);
        
        // エフェクトデータを作成
        const effectData = {
            text: text,
            color: color,
            index: effectIndex,
            timestamp: Date.now(),
            type: effectType
        };
        
        queue.push(effectData);
        
        // エフェクトの種類に応じて時間差を調整
        const delay = this.getEffectDelay(effectType, effectIndex);
        
        setTimeout(() => {
            this.displayFloatingText(x, y, effectData, delay);
        }, delay);
    }
    
    getEffectType(text, color) {
        // テキストと色からエフェクトの種類を判定
        if (text.includes('CRIT') || text.startsWith('-')) {
            return 'damage';
        } else if (text.includes('HP') || text.includes('O₂') || text.includes('⚡')) {
            return 'healing';
        } else if (text.includes('EXP')) {
            return 'exp';
        } else if (text.includes('Gold') || text.includes('G')) {
            return 'gold';
        } else if (text.includes('ATK') || text.includes('DEF')) {
            return 'upgrade';
        }
        return 'other';
    }
    
    getEffectDelay(effectType, effectIndex) {
        // エフェクトの種類に応じて遅延時間を調整
        const baseDelay = effectIndex * 100;
        
        switch (effectType) {
            case 'damage':
                return baseDelay; // ダメージは即座に表示
            case 'healing':
                return baseDelay + 200; // 回復は少し遅れて表示
            case 'exp':
                return baseDelay + 400; // 経験値はさらに遅れて表示
            case 'gold':
                return baseDelay + 600; // ゴールドは最後に表示
            case 'upgrade':
                return baseDelay + 300; // アップグレードは中間
            default:
                return baseDelay + 100;
        }
    }
    
    displayFloatingText(x, y, effectData, delay) {
        const gameGrid = document.getElementById('game-grid');
        if (!gameGrid) return;
        
        const positionKey = `${x},${y}`;
        const queue = this.floatingTextQueue.get(positionKey);
        if (!queue) return;
        
        // グリッドの位置を取得
        const gridRect = gameGrid.getBoundingClientRect();
        const cellSize = gridRect.width / this.gridSize;
        
        const floatingDiv = document.createElement('div');
        floatingDiv.textContent = effectData.text;
        floatingDiv.className = 'floating-text';
        
        // 複数のエフェクトが重ならないよう位置を調整
        const baseX = gridRect.left + x * cellSize + cellSize / 2;
        const baseY = gridRect.top + y * cellSize + cellSize / 2;
        
        // エフェクトの種類に応じて位置をずらす
        let offsetX = 0;
        let offsetY = 0;
        
        if (effectData.index > 0) {
            // エフェクトの種類に応じて位置をずらす
            switch (effectData.type) {
                case 'damage':
                    // ダメージは中央から少し上
                    offsetY = -20 - (effectData.index * 15);
                    offsetX = (effectData.index % 2 === 0 ? 1 : -1) * (effectData.index * 8);
                    break;
                case 'healing':
                    // 回復は右上方向
                    offsetX = 20 + (effectData.index * 10);
                    offsetY = -15 - (effectData.index * 10);
                    break;
                case 'exp':
                    // 経験値は左上方向
                    offsetX = -20 - (effectData.index * 10);
                    offsetY = -15 - (effectData.index * 10);
                    break;
                case 'gold':
                    // ゴールドは右下方向
                    offsetX = 20 + (effectData.index * 10);
                    offsetY = 15 + (effectData.index * 10);
                    break;
                case 'upgrade':
                    // アップグレードは左下方向
                    offsetX = -20 - (effectData.index * 10);
                    offsetY = 15 + (effectData.index * 10);
                    break;
                default:
                    // その他は螺旋状に配置
                    const angle = (effectData.index * Math.PI * 0.8) + (Math.PI / 4);
                    const radius = 15 + (effectData.index * 8);
                    offsetX = Math.cos(angle) * radius;
                    offsetY = Math.sin(angle) * radius;
            }
        }
        
        // エフェクトの種類に応じてアニメーションを調整
        let animationName = 'damageFloat';
        let fontSize = '16px';
        
        switch (effectData.type) {
            case 'damage':
                animationName = 'damageFloat';
                fontSize = '18px';
                break;
            case 'healing':
                animationName = 'healFloat';
                fontSize = '15px';
                break;
            case 'exp':
                animationName = 'expFloat';
                fontSize = '14px';
                break;
            case 'gold':
                animationName = 'goldFloat';
                fontSize = '14px';
                break;
            case 'upgrade':
                animationName = 'upgradeFloat';
                fontSize = '13px';
                break;
        }
        
        floatingDiv.style.cssText = `
            position: fixed;
            color: ${effectData.color};
            font-weight: bold;
            font-size: ${fontSize};
            pointer-events: none;
            z-index: ${1000 + effectData.index};
            left: ${baseX + offsetX}px;
            top: ${baseY + offsetY}px;
            animation: ${animationName} 1s ease-out forwards;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            transform: translateX(-50%) translateY(-50%);
            opacity: 0;
            animation-delay: 0s;
        `;
        
        document.body.appendChild(floatingDiv);
        
        // アニメーション開始
        setTimeout(() => {
            floatingDiv.style.opacity = '1';
        }, 10);
        
        // 1秒後にエフェクトを削除
        setTimeout(() => {
            if (floatingDiv.parentNode) {
                floatingDiv.parentNode.removeChild(floatingDiv);
            }
            
            // キューからエフェクトを削除
            const currentQueue = this.floatingTextQueue.get(positionKey);
            if (currentQueue) {
                const index = currentQueue.findIndex(effect => effect.timestamp === effectData.timestamp);
                if (index !== -1) {
                    currentQueue.splice(index, 1);
                }
                
                // キューが空になったら削除
                if (currentQueue.length === 0) {
                    this.floatingTextQueue.delete(positionKey);
                }
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