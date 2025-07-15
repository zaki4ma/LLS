# 質的アップグレードシステム設計書 - ルミナス・ロスト・シグナル

## システム概要
数値増加ではなく「戦闘スタイルを変える」質的な能力向上を提供するアップグレードシステム。3つの主力アップグレード（連続攻撃、反撃システム、シールド自動回復）を段階的に強化可能。

## 設計方針
1. **明確な実感** - 数値でなく行動の変化で強さを体感
2. **戦略的多様性** - 攻撃的・防御的・バランス型の選択肢
3. **段階的成長** - 同じアップグレードの複数レベル
4. **相乗効果** - 複数アップグレードの組み合わせによる戦術変化

## アップグレード詳細設計

### 1. 連続攻撃システム「チェインストライク」

#### 基本概念
弱った敵を素早く処理することで追加行動を獲得し、戦闘効率を大幅に向上させる攻撃的アップグレード。

```javascript
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
```

#### 実装詳細
```javascript
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
    
    gameInstance.addBattleLog(`連続攻撃発動！ (+${config.effects.bonusDamage}ダメージ)`);
  }
  
  resetChains() {
    this.activeChains = 0;
  }
}
```

### 2. 反撃システム「カウンターアタック」

#### 基本概念
攻撃を受けた際に自動的に反撃する防御的アップグレード。囲まれた状況での生存性を大幅に向上。

```javascript
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
```

#### 実装詳細
```javascript
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
    const player = gameInstance.playerManager;
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
    target.takeDamage(damage, gameInstance);
    
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
    gameInstance.addBattleLog(logMessage);
    
    // 音響効果
    gameInstance.soundManager.playSound('counter_attack');
  }
}
```

### 3. シールド自動回復「オートリペア」

#### 基本概念
シールドが時間経過や特定条件で自動回復する持続的防御アップグレード。長期戦での生存性を向上。

```javascript
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
```

#### 実装詳細
```javascript
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
    const player = gameInstance.playerManager;
    const config = autoRepairUpgrade.levels[this.currentLevel - 1];
    
    if (player.shields < config.effects.maxShields) {
      player.shields++;
      
      // 視覚効果
      gameInstance.renderManager.showFloatingText(
        player.x, player.y, "SHIELD+", '#00aaff'
      );
      
      gameInstance.addBattleLog(`${source}でシールド回復！`);
      
      // 音響効果
      gameInstance.soundManager.playSound('shield_repair');
    }
  }
}
```

## アップグレード管理システム

### 統合アップグレードマネージャー
```javascript
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
    const player = gameInstance.playerManager;
    
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
          canAfford: gameInstance.playerManager.gold >= nextLevel.cost,
          canUnlock: gameInstance.floor >= nextLevel.unlockFloor
        });
      }
    });
    
    return upgrades;
  }
}
```

## UI設計

### アップグレードメニューHTML
```html
<!-- 質的アップグレード専用セクション -->
<div id="qualitative-upgrades" class="upgrade-section">
  <h3>特殊能力</h3>
  <div class="upgrade-grid">
    
    <!-- 連続攻撃 -->
    <div class="upgrade-card" data-upgrade="chain_strike">
      <div class="upgrade-icon">⚡</div>
      <div class="upgrade-info">
        <h4 class="upgrade-name">チェインストライク</h4>
        <p class="upgrade-description">弱った敵を撃破時、追加行動を獲得</p>
        <div class="upgrade-level">レベル: <span class="current-level">0</span>/3</div>
        <div class="upgrade-cost">コスト: <span class="cost-value">100</span>G</div>
      </div>
      <button class="upgrade-btn">習得</button>
    </div>
    
    <!-- 反撃システム -->
    <div class="upgrade-card" data-upgrade="counter_attack">
      <div class="upgrade-icon">🛡️</div>
      <div class="upgrade-info">
        <h4 class="upgrade-name">カウンターアタック</h4>
        <p class="upgrade-description">被攻撃時に自動で反撃</p>
        <div class="upgrade-level">レベル: <span class="current-level">0</span>/3</div>
        <div class="upgrade-cost">コスト: <span class="cost-value">120</span>G</div>
      </div>
      <button class="upgrade-btn">習得</button>
    </div>
    
    <!-- シールド自動回復 -->
    <div class="upgrade-card" data-upgrade="auto_repair">
      <div class="upgrade-icon">🔧</div>
      <div class="upgrade-info">
        <h4 class="upgrade-name">オートリペア</h4>
        <p class="upgrade-description">シールドが自動的に回復</p>
        <div class="upgrade-level">レベル: <span class="current-level">0</span>/3</div>
        <div class="upgrade-cost">コスト: <span class="cost-value">150</span>G</div>
      </div>
      <button class="upgrade-btn">習得</button>
    </div>
    
  </div>
</div>
```

### CSS スタイル
```css
.upgrade-section {
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid #00ff88;
  border-radius: 8px;
}

.upgrade-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.upgrade-card {
  background: rgba(0, 40, 80, 0.6);
  border: 1px solid #004466;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
}

.upgrade-card:hover {
  border-color: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}

.upgrade-card.maxed {
  border-color: #ffaa00;
  background: rgba(80, 60, 0, 0.3);
}

.upgrade-card.locked {
  opacity: 0.5;
  border-color: #666;
}

.upgrade-icon {
  font-size: 24px;
  text-align: center;
  margin-bottom: 10px;
}

.upgrade-name {
  color: #00ff88;
  margin-bottom: 5px;
}

.upgrade-description {
  color: #cccccc;
  font-size: 12px;
  margin-bottom: 10px;
  line-height: 1.4;
}

.upgrade-level, .upgrade-cost {
  font-size: 11px;
  margin-bottom: 5px;
}

.upgrade-btn {
  width: 100%;
  padding: 8px;
  background: #00ff88;
  color: #000;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.upgrade-btn:hover {
  background: #44ffaa;
}

.upgrade-btn:disabled {
  background: #666;
  color: #999;
  cursor: not-allowed;
}
```

## 実装フェーズ

### Phase 1: 基本システム
- [ ] 3つのアップグレードクラスの実装
- [ ] QualitativeUpgradeManagerの作成
- [ ] 基本的な効果発動機能

### Phase 2: ゲーム統合
- [ ] 戦闘システムとの連携
- [ ] PlayerManagerとの統合
- [ ] 視覚・音響エフェクトの追加

### Phase 3: UI実装
- [ ] アップグレードメニューの作成
- [ ] 購入システムの実装
- [ ] 進行状況の表示

### Phase 4: バランス調整
- [ ] コストと効果の微調整
- [ ] プレイテストによる改善
- [ ] 相乗効果の検証

## 期待される効果
1. **明確な成長実感** - 数値でなく行動の変化で強さを体感
2. **戦略的多様性** - 攻撃型・防御型・バランス型の選択
3. **長期目標の提供** - 高コストアップグレードへの憧れ
4. **リプレイ性向上** - 異なるビルドでの再挑戦意欲
5. **戦闘の楽しさ向上** - 特殊能力による爽快感