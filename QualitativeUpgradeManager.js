// 質的アップグレード設定
const chainStrikeUpgrade = {
    id: "chain_strike",
    name: "チェインストライク",
    category: "combat_offensive",
    
    levels: [
        {
            level: 1,
            name: "連続攻撃 I",
            description: "敵のHP30%以下を撃破時、追加行動を獲得",
            cost: 100,
            unlockFloor: 1,
            effects: {
                triggerThreshold: 0.3, // HP30%以下
                maxChains: 1, // 最大1回連続
                bonusDamage: 0
            }
        },
        {
            level: 2,
            name: "連続攻撃 II", 
            description: "発動条件をHP50%以下に拡大、連続2回まで可能",
            cost: 200,
            unlockFloor: 5,
            effects: {
                triggerThreshold: 0.5, // HP50%以下
                maxChains: 2, // 最大2回連続
                bonusDamage: 5 // 連続攻撃時+5ダメージ
            }
        },
        {
            level: 3,
            name: "連続攻撃 III",
            description: "一撃撃破でも発動、無制限連続可能",
            cost: 350,
            unlockFloor: 10,
            effects: {
                triggerThreshold: 1.0, // 一撃撃破でも発動
                maxChains: 999, // 無制限
                bonusDamage: 10, // 連続攻撃時+10ダメージ
                perfectKillBonus: true // 一撃撃破で酸素+0.5回復
            }
        }
    ]
};

const counterAttackUpgrade = {
    id: "counter_attack",
    name: "カウンターアタック",
    category: "combat_defensive",
    
    levels: [
        {
            level: 1,
            name: "反撃 I",
            description: "被攻撃時50%の確率で自動反撃",
            cost: 120,
            unlockFloor: 3,
            effects: {
                triggerChance: 0.5, // 50%確率
                damageMultiplier: 0.7, // 通常攻撃の70%
                canCritical: false
            }
        },
        {
            level: 2,
            name: "反撃 II",
            description: "反撃確率75%、通常ダメージで反撃",
            cost: 250,
            unlockFloor: 7,
            effects: {
                triggerChance: 0.75, // 75%確率
                damageMultiplier: 1.0, // 通常攻撃と同等
                canCritical: true // クリティカル可能
            }
        },
        {
            level: 3,
            name: "反撃 III",
            description: "必ず反撃、クリティカル率2倍",
            cost: 400,
            unlockFloor: 12,
            effects: {
                triggerChance: 1.0, // 100%確率
                damageMultiplier: 1.2, // 通常攻撃の120%
                canCritical: true,
                criticalBonus: 2.0 // クリティカル率2倍
            }
        }
    ]
};

const autoRepairUpgrade = {
    id: "auto_repair",
    name: "オートリペア",
    category: "defense_utility",
    
    levels: [
        {
            level: 1,
            name: "自動修復 I",
            description: "フロア移動時にシールドが50%の確率で回復",
            cost: 150,
            unlockFloor: 4,
            effects: {
                floorRecoveryChance: 0.5, // 50%確率
                turnRecovery: false,
                maxShields: 1
            }
        },
        {
            level: 2,
            name: "自動修復 II",
            description: "フロア移動時に確実に回復、15ターンごとに回復判定",
            cost: 280,
            unlockFloor: 8,
            effects: {
                floorRecoveryChance: 1.0, // 100%確率
                turnRecovery: true,
                turnInterval: 15, // 15ターンごと
                turnRecoveryChance: 0.3, // 30%確率
                maxShields: 1
            }
        },
        {
            level: 3,
            name: "自動修復 III",
            description: "最大シールド2個、10ターンごとに確実に回復",
            cost: 450,
            unlockFloor: 13,
            effects: {
                floorRecoveryChance: 1.0,
                turnRecovery: true,
                turnInterval: 10, // 10ターンごと
                turnRecoveryChance: 1.0, // 100%確率
                maxShields: 2 // 最大2個
            }
        }
    ]
};

// 連続攻撃システム
class ChainStrikeSystem {
    constructor() {
        this.activeChains = 0;
        this.maxChains = 0;
        this.currentLevel = 0;
    }
    
    // 撃破時の連続攻撃判定
    checkChainTrigger(enemy, damageDealt, gameInstance) {
        if (this.currentLevel === 0) return false;
        
        const config = chainStrikeUpgrade.levels[this.currentLevel - 1];
        const hpRatio = enemy.hp / enemy.maxHp;
        
        // 発動条件チェック
        const shouldTrigger = 
            (hpRatio <= config.effects.triggerThreshold) ||
            (config.effects.perfectKillBonus && damageDealt >= enemy.maxHp);
        
        if (shouldTrigger && this.activeChains < config.effects.maxChains) {
            this.activeChains++;
            this.grantExtraAction(gameInstance, config);
            return true;
        }
        
        return false;
    }
    
    grantExtraAction(gameInstance, config) {
        // プレイヤーに追加行動を付与
        gameInstance.playerManager.hasExtraAction = true;
        gameInstance.playerManager.chainBonusDamage = config.effects.bonusDamage;
        
        // 視覚効果
        gameInstance.renderManager.showFloatingText(
            gameInstance.playerManager.x,
            gameInstance.playerManager.y,
            "CHAIN!", '#ffaa00'
        );
        
        gameInstance.addCombatLog(`連続攻撃発動！ (+${config.effects.bonusDamage}ダメージ)`);
        
        // 酸素回復ボーナス
        if (config.effects.perfectKillBonus && 
            gameInstance.playerManager.player.oxygen < gameInstance.playerManager.player.maxOxygen) {
            gameInstance.playerManager.player.oxygen += 0.5;
            gameInstance.addCombatLog('一撃撃破ボーナス：酸素+0.5');
        }
    }
    
    resetChains() {
        this.activeChains = 0;
    }
}

// 反撃システム
class CounterAttackSystem {
    constructor() {
        this.currentLevel = 0;
    }
    
    // 被攻撃時の反撃判定
    checkCounterTrigger(attacker, gameInstance) {
        if (this.currentLevel === 0) return false;
        
        const config = counterAttackUpgrade.levels[this.currentLevel - 1];
        const roll = Math.random();
        
        if (roll < config.effects.triggerChance) {
            this.executeCounter(attacker, gameInstance, config);
            return true;
        }
        
        return false;
    }
    
    executeCounter(target, gameInstance, config) {
        const player = gameInstance.playerManager.player;
        let damage = Math.floor(player.attack * config.effects.damageMultiplier);
        
        // クリティカル判定
        let isCritical = false;
        if (config.effects.canCritical) {
            let critChance = player.criticalChance;
            if (config.effects.criticalBonus) {
                critChance *= config.effects.criticalBonus;
            }
            
            isCritical = Math.random() < (critChance / 100);
            if (isCritical) {
                damage *= 2;
            }
        }
        
        // ダメージ適用
        target.hp -= damage;
        if (target.hp <= 0) {
            target.hp = 0;
        }
        
        // 視覚効果
        gameInstance.renderManager.showFloatingText(
            target.x, target.y, 
            isCritical ? `COUNTER! -${damage}` : `-${damage}`, 
            isCritical ? '#ff0088' : '#ff4444'
        );
        
        // 戦闘ログ
        const logMessage = isCritical ? 
            `反撃クリティカル！ ${damage}ダメージ` : 
            `反撃！ ${damage}ダメージ`;
        gameInstance.addCombatLog(logMessage);
        
        // 音響効果
        if (gameInstance.soundManager && gameInstance.soundManager.playSound) {
            gameInstance.soundManager.playSound('attack');
        }
        
        return damage;
    }
}

// シールド自動回復システム
class AutoRepairSystem {
    constructor() {
        this.currentLevel = 0;
        this.turnCounter = 0;
    }
    
    // フロア移動時の回復
    onFloorChange(gameInstance) {
        if (this.currentLevel === 0) return;
        
        const config = autoRepairUpgrade.levels[this.currentLevel - 1];
        const roll = Math.random();
        
        if (roll < config.effects.floorRecoveryChance) {
            this.repairShield(gameInstance, "フロア移動");
        }
    }
    
    // ターン経過での回復判定
    onTurnEnd(gameInstance) {
        if (this.currentLevel === 0) return;
        
        const config = autoRepairUpgrade.levels[this.currentLevel - 1];
        
        if (!config.effects.turnRecovery) return;
        
        this.turnCounter++;
        
        if (this.turnCounter >= config.effects.turnInterval) {
            this.turnCounter = 0;
            
            const roll = Math.random();
            if (roll < config.effects.turnRecoveryChance) {
                this.repairShield(gameInstance, "自動修復");
            }
        }
    }
    
    repairShield(gameInstance, source) {
        const player = gameInstance.playerManager.player;
        const config = autoRepairUpgrade.levels[this.currentLevel - 1];
        
        if (player.shields < config.effects.maxShields) {
            player.shields++;
            
            // 視覚効果
            gameInstance.renderManager.showFloatingText(
                gameInstance.playerManager.x, 
                gameInstance.playerManager.y, 
                "SHIELD+", '#00aaff'
            );
            
            gameInstance.addCombatLog(`${source}でシールド回復！`);
            
            // 音響効果
            if (gameInstance.soundManager && gameInstance.soundManager.playSound) {
                gameInstance.soundManager.playSound('shield');
            }
        }
    }
    
    // 最大シールド数取得
    getMaxShields() {
        if (this.currentLevel === 0) return 1;
        
        const config = autoRepairUpgrade.levels[this.currentLevel - 1];
        return config.effects.maxShields;
    }
}

// 統合アップグレードマネージャー
class QualitativeUpgradeManager {
    constructor() {
        this.chainStrike = new ChainStrikeSystem();
        this.counterAttack = new CounterAttackSystem();
        this.autoRepair = new AutoRepairSystem();
        
        this.purchasedUpgrades = {
            chain_strike: 0,
            counter_attack: 0,
            auto_repair: 0
        };
    }
    
    // アップグレード購入
    purchaseUpgrade(upgradeId, gameInstance) {
        const currentLevel = this.purchasedUpgrades[upgradeId];
        const upgrade = this.getUpgradeConfig(upgradeId);
        
        if (currentLevel >= upgrade.levels.length) {
            return { success: false, message: "最大レベルに達しています" };
        }
        
        const nextLevel = upgrade.levels[currentLevel];
        const player = gameInstance.playerManager.player;
        
        // コストチェック
        if (player.gold < nextLevel.cost) {
            return { success: false, message: "資金が不足しています" };
        }
        
        // フロア制限チェック
        if (gameInstance.floor < nextLevel.unlockFloor) {
            return { 
                success: false, 
                message: `デッキ${nextLevel.unlockFloor}以降で解放されます` 
            };
        }
        
        // 購入実行
        player.gold -= nextLevel.cost;
        this.purchasedUpgrades[upgradeId]++;
        this.applyUpgrade(upgradeId, currentLevel + 1);
        
        return { 
            success: true, 
            message: `${nextLevel.name}を習得しました！`,
            level: currentLevel + 1
        };
    }
    
    // アップグレード効果適用
    applyUpgrade(upgradeId, level) {
        switch(upgradeId) {
            case 'chain_strike':
                this.chainStrike.currentLevel = level;
                break;
            case 'counter_attack':
                this.counterAttack.currentLevel = level;
                break;
            case 'auto_repair':
                this.autoRepair.currentLevel = level;
                break;
        }
    }
    
    // 設定取得
    getUpgradeConfig(upgradeId) {
        const configs = {
            'chain_strike': chainStrikeUpgrade,
            'counter_attack': counterAttackUpgrade,
            'auto_repair': autoRepairUpgrade
        };
        return configs[upgradeId];
    }
    
    // アップグレード一覧取得（UI用）
    getAvailableUpgrades(gameInstance) {
        const upgrades = [];
        
        ['chain_strike', 'counter_attack', 'auto_repair'].forEach(id => {
            const config = this.getUpgradeConfig(id);
            const currentLevel = this.purchasedUpgrades[id];
            
            if (currentLevel < config.levels.length) {
                const nextLevel = config.levels[currentLevel];
                upgrades.push({
                    id: id,
                    config: config,
                    level: nextLevel,
                    currentLevel: currentLevel,
                    canAfford: gameInstance.playerManager.player.gold >= nextLevel.cost,
                    canUnlock: gameInstance.floor >= nextLevel.unlockFloor
                });
            }
        });
        
        return upgrades;
    }
    
    // 現在のレベル取得
    getCurrentLevel(upgradeId) {
        return this.purchasedUpgrades[upgradeId] || 0;
    }
    
    // セーブデータ取得
    getSaveData() {
        return {
            purchasedUpgrades: { ...this.purchasedUpgrades },
            turnCounter: this.autoRepair.turnCounter
        };
    }
    
    // セーブデータ読み込み
    loadSaveData(data) {
        if (data && data.purchasedUpgrades) {
            this.purchasedUpgrades = { ...data.purchasedUpgrades };
            
            // 各システムにレベルを適用
            Object.keys(this.purchasedUpgrades).forEach(upgradeId => {
                const level = this.purchasedUpgrades[upgradeId];
                if (level > 0) {
                    this.applyUpgrade(upgradeId, level);
                }
            });
            
            // ターンカウンターの復元
            if (data.turnCounter !== undefined) {
                this.autoRepair.turnCounter = data.turnCounter;
            }
        }
    }
    
    // 敵撃破時の処理
    onEnemyKilled(enemy, damageDealt, gameInstance) {
        // 連続攻撃判定
        this.chainStrike.checkChainTrigger(enemy, damageDealt, gameInstance);
    }
    
    // 被攻撃時の処理
    onPlayerAttacked(attacker, gameInstance) {
        // 反撃判定
        return this.counterAttack.checkCounterTrigger(attacker, gameInstance);
    }
    
    // ターン終了時の処理
    onTurnEnd(gameInstance) {
        // シールド自動回復判定
        this.autoRepair.onTurnEnd(gameInstance);
        
        // 連続攻撃のリセット
        this.chainStrike.resetChains();
    }
    
    // フロア移動時の処理
    onFloorChange(gameInstance) {
        // シールド自動回復
        this.autoRepair.onFloorChange(gameInstance);
    }
    
    // プレイヤーの最大シールド数取得
    getPlayerMaxShields() {
        return this.autoRepair.getMaxShields();
    }
    
    // UIManager用：現在のレベル取得
    getCurrentLevels() {
        return {
            chainStrike: this.purchasedUpgrades.chain_strike,
            counterAttack: this.purchasedUpgrades.counter_attack,
            autoRepair: this.purchasedUpgrades.auto_repair
        };
    }
    
    // 相乗効果ボーナス取得
    getSynergyBonus(gameInstance) {
        const levels = this.getCurrentLevels();
        let bonus = {
            goldMultiplier: 1.0,
            name: null,
            description: null
        };
        
        // 全てレベル1以上
        if (levels.chainStrike >= 1 && levels.counterAttack >= 1 && levels.autoRepair >= 1) {
            bonus.goldMultiplier = 1.25;
            bonus.name = "アドバンスドコンバット";
            bonus.description = "ゴールド獲得+25%";
        }
        
        // 全てレベル2以上
        if (levels.chainStrike >= 2 && levels.counterAttack >= 2 && levels.autoRepair >= 2) {
            bonus.goldMultiplier = 1.5;
            bonus.name = "マスターコンバット";
            bonus.description = "ゴールド獲得+50%";
        }
        
        return bonus;
    }
    
    // アップグレード進行状況取得
    getUpgradeProgress() {
        const levels = this.getCurrentLevels();
        const total = levels.chainStrike + levels.counterAttack + levels.autoRepair;
        const maxTotal = 9; // 3つ×レベル3
        
        return {
            current: total,
            max: maxTotal,
            percentage: Math.floor((total / maxTotal) * 100),
            nextSynergyTarget: this.getNextSynergyTarget(levels)
        };
    }
    
    // 次の相乗効果目標を取得
    getNextSynergyTarget(levels) {
        const allAtLeastLevel1 = levels.chainStrike >= 1 && levels.counterAttack >= 1 && levels.autoRepair >= 1;
        const allAtLeastLevel2 = levels.chainStrike >= 2 && levels.counterAttack >= 2 && levels.autoRepair >= 2;
        
        if (!allAtLeastLevel1) {
            return "全アップグレードをレベル1以上にしてアドバンスドコンバット解放";
        } else if (!allAtLeastLevel2) {
            return "全アップグレードをレベル2以上にしてマスターコンバット解放";
        } else {
            return "全アップグレード最大レベル達成！";
        }
    }
}