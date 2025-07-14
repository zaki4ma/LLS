class DodgeSystem {
    constructor() {
        this.playerConsecutiveDodges = 0;
        this.enemyConsecutiveDodges = new Map(); // 敵ごとの連続回避回数
    }
    
    // プレイヤー回避判定
    checkPlayerDodge(attacker, isCritical = false, gameInstance) {
        // クリティカルは必中
        if (isCritical && DODGE_SYSTEM.conditions.criticalIgnoresDodge) {
            return { dodged: false, reason: "critical_hit" };
        }
        
        let dodgeChance = this.calculatePlayerDodgeChance(gameInstance);
        
        // 連続回避制限
        let maxDodges = DODGE_SYSTEM.conditions.maxConsecutiveDodges;
        
        // 反射神経強化で連続回避制限を増加
        try {
            if (gameInstance.playerManager.player.abilities && 
                gameInstance.playerManager.player.abilities.reflexes?.unlocked) {
                maxDodges += 1;
            }
        } catch (error) {
            console.warn('Error checking reflexes ability:', error);
        }
        
        if (this.playerConsecutiveDodges >= maxDodges) {
            dodgeChance *= DODGE_SYSTEM.conditions.consecutivePenalty;
        }
        
        const roll = Math.random() * 100;
        const dodged = roll < dodgeChance;
        
        if (dodged) {
            this.playerConsecutiveDodges++;
            return { 
                dodged: true, 
                chance: dodgeChance.toFixed(1),
                roll: roll.toFixed(1)
            };
        } else {
            this.playerConsecutiveDodges = 0;
            return { 
                dodged: false, 
                chance: dodgeChance.toFixed(1),
                roll: roll.toFixed(1)
            };
        }
    }
    
    // 敵回避判定
    checkEnemyDodge(enemy, isCritical = false, gameInstance) {
        // クリティカルは必中
        if (isCritical && DODGE_SYSTEM.conditions.criticalIgnoresDodge) {
            return { dodged: false, reason: "critical_hit" };
        }
        
        let dodgeChance = this.calculateEnemyDodgeChance(enemy, gameInstance);
        
        // 連続回避制限（敵は基本値のまま）
        const consecutiveCount = this.enemyConsecutiveDodges.get(enemy.id) || 0;
        if (consecutiveCount >= DODGE_SYSTEM.conditions.maxConsecutiveDodges) {
            dodgeChance *= DODGE_SYSTEM.conditions.consecutivePenalty;
        }
        
        const roll = Math.random() * 100;
        const dodged = roll < dodgeChance;
        
        if (dodged) {
            this.enemyConsecutiveDodges.set(enemy.id, consecutiveCount + 1);
        } else {
            this.enemyConsecutiveDodges.set(enemy.id, 0);
        }
        
        return { 
            dodged: dodged,
            chance: dodgeChance.toFixed(1),
            roll: roll.toFixed(1)
        };
    }
    
    // プレイヤー回避率計算
    calculatePlayerDodgeChance(gameInstance) {
        if (!gameInstance.playerManager || !gameInstance.playerManager.player) {
            return DODGE_SYSTEM.player.baseChance;
        }
        
        const player = gameInstance.playerManager.player;
        let dodgeChance = DODGE_SYSTEM.player.baseChance;
        
        // レベルボーナス
        try {
            if (player.level && typeof player.level === 'number') {
                dodgeChance += (player.level - 1) * DODGE_SYSTEM.player.perLevelBonus;
            }
        } catch (error) {
            console.warn('Error calculating level bonus:', error);
        }
        
        // 包囲効果チェック
        try {
            const adjacentEnemies = this.countAdjacentEnemies(player, gameInstance);
            if (adjacentEnemies >= 2) {
                let surroundedPenalty = DODGE_SYSTEM.conditions.surroundedPenalty;
                
                // 戦闘感覚で包囲効果を軽減
                if (player.abilities && player.abilities.combatAwareness?.unlocked) {
                    surroundedPenalty *= 0.5; // 30% → 15%
                }
                
                dodgeChance *= (1 - surroundedPenalty);
            }
        } catch (error) {
            console.warn('Error calculating surrounded penalty:', error);
        }
        
        // 負傷効果
        try {
            const hpRatio = player.hp / player.maxHp;
            if (hpRatio <= 0.5) {
                dodgeChance *= (1 - DODGE_SYSTEM.conditions.injuredPenalty);
            }
        } catch (error) {
            console.warn('Error calculating injured penalty:', error);
        }
        
        // 装備ボーナス（将来の拡張用）
        try {
            if (gameInstance.playerManager && typeof gameInstance.playerManager.getDodgeBonus === 'function') {
                dodgeChance += gameInstance.playerManager.getDodgeBonus();
            }
        } catch (error) {
            console.warn('Error getting dodge bonus:', error);
        }
        
        return Math.min(dodgeChance, DODGE_SYSTEM.player.maxChance);
    }
    
    // 敵回避率計算
    calculateEnemyDodgeChance(enemy, gameInstance) {
        const baseChance = DODGE_SYSTEM.enemies[enemy.type]?.dodgeChance || 0;
        let dodgeChance = baseChance;
        
        // フロアによる難易度調整
        const floorBonus = Math.floor(gameInstance.floor / 5); // 5フロアごとに+1%
        dodgeChance += floorBonus;
        
        return dodgeChance;
    }
    
    // 隣接する敵の数をカウント
    countAdjacentEnemies(player, gameInstance) {
        if (!gameInstance.enemyManager || !player) {
            return 0;
        }
        
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const x = player.x + dx;
                const y = player.y + dy;
                try {
                    if (gameInstance.enemyManager.getEnemyAt(x, y)) {
                        count++;
                    }
                } catch (error) {
                    console.warn('Error checking enemy at', x, y, error);
                }
            }
        }
        return count;
    }
    
    // 敵が削除された時の処理
    removeEnemy(enemyId) {
        this.enemyConsecutiveDodges.delete(enemyId);
    }
    
    // ステージクリア時のリセット
    reset() {
        this.playerConsecutiveDodges = 0;
        this.enemyConsecutiveDodges.clear();
    }
}