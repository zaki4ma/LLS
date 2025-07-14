class EnemyManager {
    constructor() {
        this.aliens = [];
    }

    placeAliens(gameInstance) {
        this.aliens = [];
        const numAliens = 3 + Math.floor(Math.random() * 4) + Math.floor(gameInstance.floor / 2);
        
        for (let i = 0; i < numAliens; i++) {
            let x, y;
            let attempts = 0;
            
            do {
                x = Math.floor(Math.random() * gameInstance.gridSize);
                y = Math.floor(Math.random() * gameInstance.gridSize);
                attempts++;
            } while (gameInstance.grid[y][x] !== 'floor' && attempts < 50);
            
            if (attempts < 50) {
                const alienType = this.selectAlienType(gameInstance.floor);
                const level = gameInstance.floor + Math.floor(Math.random() * 2);
                
                const alien = { 
                    id: `alien_${Date.now()}_${i}`, // 回避システム用の一意ID
                    x, y, 
                    hp: ENEMY_SCALING.baseHp + level * ENEMY_SCALING.hpPerLevel, 
                    maxHp: ENEMY_SCALING.baseHp + level * ENEMY_SCALING.hpPerLevel,
                    attack: ENEMY_SCALING.baseAttack + level * ENEMY_SCALING.attackPerLevel, 
                    defense: ENEMY_SCALING.baseDefense + level * ENEMY_SCALING.defensePerLevel,
                    alive: true, 
                    level, 
                    expReward: ENEMY_SCALING.expReward + level * ENEMY_SCALING.expPerLevel,
                    goldReward: ENEMY_SCALING.goldReward + level * ENEMY_SCALING.goldPerLevel,
                    type: alienType,
                    typeData: ALIEN_TYPES[alienType]
                };
                
                this.aliens.push(alien);
                gameInstance.grid[y][x] = 'alien';
            }
        }
        
        gameInstance.aliens = this.aliens;
    }

    selectAlienType(floor) {
        const weights = ENEMY_SPAWN_WEIGHTS[Math.min(floor, 20)] || ENEMY_SPAWN_WEIGHTS[20];
        const availableTypes = Object.keys(weights);
        
        let totalWeight = 0;
        Object.values(weights).forEach(weight => totalWeight += weight);
        
        let random = Math.random() * totalWeight;
        for (let type of availableTypes) {
            random -= weights[type];
            if (random <= 0) {
                return type;
            }
        }
        
        return 'BASIC';
    }

    moveAliens(gameInstance) {
        for (const alien of this.aliens) {
            if (!alien.alive) continue;
            
            // スタン状態をチェック
            if (alien.stunned) {
                // スタン持続時間を減らす
                alien.stunDuration--;
                if (alien.stunDuration <= 0) {
                    alien.stunned = false;
                    gameInstance.addCombatLog(`${alien.typeData.name}の麻痺が解けた`);
                } else {
                    gameInstance.addCombatLog(`${alien.typeData.name}は麻痺している`);
                }
                continue; // スタン中は行動しない
            }
            
            // プレイヤーとの距離を計算
            const distance = Math.abs(alien.x - gameInstance.playerManager.player.x) + 
                           Math.abs(alien.y - gameInstance.playerManager.player.y);
            
            // 隣接している場合は攻撃
            if (distance === 1) {
                this.alienAttackPlayer(alien, gameInstance);
                continue;
            }
            
            // 敵タイプ別の行動パターン
            if (alien.type === 'BASIC') {
                // ベーシックエイリアンは検知範囲内でのみ追跡、それ以外はランダムに移動
                if (distance <= alien.typeData.detectionRange) {
                    this.moveAlienTowardsPlayer(alien, gameInstance);
                } else {
                    this.moveAlienRandomly(alien, gameInstance);
                }
            } else {
                // 他の敵は従来の追跡行動
                if (distance <= alien.typeData.detectionRange) {
                    this.moveAlienTowardsPlayer(alien, gameInstance);
                }
            }
        }
    }

    moveAlienTowardsPlayer(alien, gameInstance) {
        const player = gameInstance.playerManager.player;
        const dx = player.x - alien.x;
        const dy = player.y - alien.y;
        
        let moveX = 0, moveY = 0;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else {
            moveY = dy > 0 ? 1 : -1;
        }
        
        const newX = alien.x + moveX;
        const newY = alien.y + moveY;
        
        // 移動先が有効かチェック
        if (newX >= 0 && newX < gameInstance.gridSize && newY >= 0 && newY < gameInstance.gridSize) {
            const cellType = gameInstance.grid[newY][newX];
            
            // ファントムは隔壁を通り抜けられる
            const canMove = cellType === 'floor' || 
                           (alien.typeData.phaseThrough && cellType === 'bulkhead');
            
            if (canMove) {
                gameInstance.grid[alien.y][alien.x] = 'floor';
                alien.x = newX;
                alien.y = newY;
                gameInstance.grid[alien.y][alien.x] = 'alien';
            }
        }
    }

    moveAlienRandomly(alien, gameInstance) {
        // ランダムな方向を選択（8方向 + 待機）
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1],
            [0, 0] // 待機
        ];
        
        const [moveX, moveY] = directions[Math.floor(Math.random() * directions.length)];
        
        // 待機の場合は何もしない
        if (moveX === 0 && moveY === 0) return;
        
        const newX = alien.x + moveX;
        const newY = alien.y + moveY;
        
        // 移動先が有効かチェック
        if (newX >= 0 && newX < gameInstance.gridSize && newY >= 0 && newY < gameInstance.gridSize) {
            const cellType = gameInstance.grid[newY][newX];
            
            if (cellType === 'floor') {
                gameInstance.grid[alien.y][alien.x] = 'floor';
                alien.x = newX;
                alien.y = newY;
                gameInstance.grid[alien.y][alien.x] = 'alien';
            }
        }
    }

    alienAttackPlayer(alien, gameInstance) {
        const player = gameInstance.playerManager.player;
        
        // 敵のクリティカル判定（基本10%、一部の敵は高い）
        let criticalChance = 0.1;
        if (alien.type === 'ASSASSIN') criticalChance = 0.25;
        else if (alien.type === 'HUNTER') criticalChance = 0.15;
        else if (alien.type === 'APEX') criticalChance = 0.2;
        
        const isCritical = Math.random() < criticalChance;
        
        // 基本ダメージ計算
        let damage = Math.max(1, alien.attack - player.defense);
        
        // クリティカル時のダメージ倍率
        if (isCritical) {
            damage = Math.floor(damage * 1.5);
        }
        
        // 特殊攻撃処理
        if (alien.typeData.oxygenDrain) {
            // サイキック・エイリアンの酸素攻撃
            const oxygenDamage = 15;
            player.oxygen = Math.max(0, player.oxygen - oxygenDamage);
            
            if (isCritical) {
                gameInstance.addCombatLog(`💥 ${alien.typeData.name}のクリティカル精神攻撃！ 酸素-${oxygenDamage}, HP-${damage}`);
            } else {
                gameInstance.addCombatLog(`${alien.typeData.name}が精神攻撃！ 酸素-${oxygenDamage}, HP-${damage}`);
            }
            
            // 酸素ダメージエフェクト
            gameInstance.renderManager.showFloatingText(player.x, player.y, `-15 O₂`, '#00aaff');
        } else {
            if (isCritical) {
                gameInstance.addCombatLog(`💥 ${alien.typeData.name}のクリティカル攻撃！ ${damage}ダメージ！`);
            } else {
                gameInstance.addCombatLog(`${alien.typeData.name}の攻撃！ ${damage}ダメージ！`);
            }
        }
        
        // プレイヤーにダメージを与える（クリティカル情報を渡す）
        gameInstance.playerManager.takeDamage(damage, gameInstance, isCritical);
    }

    getAliveAliens() {
        return this.aliens.filter(a => a.alive);
    }

    getAlienAt(x, y) {
        return this.aliens.find(a => a.x === x && a.y === y && a.alive);
    }
}