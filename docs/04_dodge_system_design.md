# 回避システム設計書 - ルミナス・ロスト・シグナル

## システム概要
プレイヤーと敵の双方に回避能力を追加し、戦闘により戦略性と緊張感を加える。運要素を適度に含みつつ、スキルとアップグレードで影響できるバランスを目指す。

## 設計方針
1. **適度な運要素** - 戦闘の予測不可能性を向上
2. **戦略的深み** - 回避率を考慮した戦術判断
3. **成長実感** - アップグレードによる明確な向上
4. **視覚的フィードバック** - 回避の成功/失敗を分かりやすく表示

## 基本回避システム

### 回避確率設定
```javascript
const dodgeSystem = {
  // プレイヤー基本回避率
  player: {
    baseChance: 15, // 基本15%
    maxChance: 45,  // 最大45%まで
    perLevelBonus: 2, // レベルアップで+2%
    criticalImmune: false, // クリティカルでも回避可能
  },
  
  // 敵タイプ別回避率
  enemies: {
    BASIC: { dodgeChance: 5 },      // 基本敵：5%
    STALKER: { dodgeChance: 15 },   // 徘徊型：15%（素早い）
    CHARGER: { dodgeChance: 0 },    // 突進型：0%（鈍重）
    GUARDIAN: { dodgeChance: 8 },   // 守護型：8%（重装甲）
    HUNTER: { dodgeChance: 20 },    // 巡回型：20%（非常に素早い）
    SCOUT: { dodgeChance: 25 }      // 偵察型：25%（最高回避）
  },
  
  // 特殊条件
  conditions: {
    // クリティカル攻撃の扱い
    criticalIgnoresDodge: true, // クリティカルは必中
    
    // 連続回避制限（連続で回避されるフラストレーション対策）
    maxConsecutiveDodges: 2, // 最大2回連続まで
    consecutivePenalty: 0.5, // 3回目以降は回避率半減
    
    // 包囲効果
    surroundedPenalty: 0.3, // 複数敵に囲まれると回避率30%減
    
    // 負傷効果
    injuredPenalty: 0.2 // HP50%以下で回避率20%減
  }
};
```

### 回避判定システム
```javascript
class DodgeSystem {
  constructor() {
    this.playerConsecutiveDodges = 0;
    this.enemyConsecutiveDodges = new Map(); // 敵ごとの連続回避回数
  }
  
  // プレイヤー回避判定
  checkPlayerDodge(attacker, isCritical = false, gameInstance) {
    // クリティカルは必中
    if (isCritical && dodgeSystem.conditions.criticalIgnoresDodge) {
      return { dodged: false, reason: "critical_hit" };
    }
    
    let dodgeChance = this.calculatePlayerDodgeChance(gameInstance);
    
    // 連続回避制限
    if (this.playerConsecutiveDodges >= dodgeSystem.conditions.maxConsecutiveDodges) {
      dodgeChance *= dodgeSystem.conditions.consecutivePenalty;
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
    if (isCritical && dodgeSystem.conditions.criticalIgnoresDodge) {
      return { dodged: false, reason: "critical_hit" };
    }
    
    let dodgeChance = this.calculateEnemyDodgeChance(enemy, gameInstance);
    
    // 連続回避制限
    const consecutiveCount = this.enemyConsecutiveDodges.get(enemy.id) || 0;
    if (consecutiveCount >= dodgeSystem.conditions.maxConsecutiveDodges) {
      dodgeChance *= dodgeSystem.conditions.consecutivePenalty;
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
    const player = gameInstance.playerManager;
    let dodgeChance = dodgeSystem.player.baseChance;
    
    // レベルボーナス
    dodgeChance += (player.level - 1) * dodgeSystem.player.perLevelBonus;
    
    // 包囲効果チェック
    const adjacentEnemies = this.countAdjacentEnemies(player, gameInstance);
    if (adjacentEnemies >= 2) {
      dodgeChance *= (1 - dodgeSystem.conditions.surroundedPenalty);
    }
    
    // 負傷効果
    const hpRatio = player.hp / player.maxHp;
    if (hpRatio <= 0.5) {
      dodgeChance *= (1 - dodgeSystem.conditions.injuredPenalty);
    }
    
    // 装備ボーナス（将来の拡張用）
    dodgeChance += player.getDodgeBonus();
    
    return Math.min(dodgeChance, dodgeSystem.player.maxChance);
  }
  
  // 敵回避率計算
  calculateEnemyDodgeChance(enemy, gameInstance) {
    const baseChance = dodgeSystem.enemies[enemy.type]?.dodgeChance || 0;
    let dodgeChance = baseChance;
    
    // フロアによる難易度調整
    const floorBonus = Math.floor(gameInstance.floor / 5); // 5フロアごとに+1%
    dodgeChance += floorBonus;
    
    return dodgeChance;
  }
  
  // 隣接する敵の数をカウント
  countAdjacentEnemies(player, gameInstance) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = player.x + dx;
        const y = player.y + dy;
        if (gameInstance.enemyManager.getEnemyAt(x, y)) {
          count++;
        }
      }
    }
    return count;
  }
}
```

## 戦闘システム統合

### PlayerManager.js の修正
```javascript
class PlayerManager {
  constructor() {
    // 既存のプロパティ...
    this.dodgeBonus = 0; // 装備やアップグレードによるボーナス
  }
  
  // 攻撃処理に回避判定を統合
  attackEnemy(enemy, gameInstance) {
    const damage = this.calculateDamage();
    const isCritical = this.checkCriticalHit();
    
    // 敵の回避判定
    const dodgeResult = gameInstance.dodgeSystem.checkEnemyDodge(enemy, isCritical, gameInstance);
    
    if (dodgeResult.dodged) {
      // 回避成功
      gameInstance.addBattleLog(
        `${enemy.type}が攻撃を回避した！ (${dodgeResult.chance}%)`
      );
      
      // 回避エフェクト表示
      gameInstance.renderManager.showFloatingText(
        enemy.x, enemy.y, "MISS", '#ffff00'
      );
      
      // 音響効果
      gameInstance.soundManager.playSound('dodge');
      
      return { hit: false, damage: 0, critical: false, dodged: true };
    }
    
    // 通常のダメージ処理
    enemy.takeDamage(damage, gameInstance);
    
    // 戦闘ログ
    const logMessage = isCritical ? 
      `クリティカル攻撃！ ${damage}ダメージ` : 
      `${damage}ダメージを与えた`;
    gameInstance.addBattleLog(logMessage);
    
    return { hit: true, damage: damage, critical: isCritical, dodged: false };
  }
  
  // ダメージ受ける処理に回避判定を統合
  takeDamage(damage, gameInstance, isCritical = false) {
    // プレイヤーの回避判定
    const dodgeResult = gameInstance.dodgeSystem.checkPlayerDodge(null, isCritical, gameInstance);
    
    if (dodgeResult.dodged) {
      // 回避成功
      gameInstance.addBattleLog(
        `攻撃を回避した！ (${dodgeResult.chance}%)`
      );
      
      // 回避エフェクト表示
      gameInstance.renderManager.showFloatingText(
        this.x, this.y, "DODGE", '#00ff88'
      );
      
      // 音響効果
      gameInstance.soundManager.playSound('player_dodge');
      
      return { damaged: false, finalDamage: 0, dodged: true };
    }
    
    // 通常のダメージ処理
    const finalDamage = Math.max(1, damage - this.defense);
    this.hp = Math.max(0, this.hp - finalDamage);
    
    // ダメージエフェクト
    gameInstance.renderManager.showFloatingText(
      this.x, this.y, `-${finalDamage}`, '#ff4444'
    );
    
    return { damaged: true, finalDamage: finalDamage, dodged: false };
  }
  
  // 回避ボーナス取得（アップグレードシステム用）
  getDodgeBonus() {
    return this.dodgeBonus;
  }
}
```

## 視覚効果システム

### 回避エフェクトの実装
```javascript
// RenderManager.js に追加
class RenderManager {
  // 回避エフェクト表示
  showDodgeEffect(x, y, isPlayer = false) {
    const cellSize = 32;
    const effect = document.createElement('div');
    effect.className = 'dodge-effect';
    
    const color = isPlayer ? '#00ff88' : '#ffff00';
    effect.style.cssText = `
      position: absolute;
      left: ${x * cellSize}px;
      top: ${y * cellSize}px;
      width: ${cellSize}px;
      height: ${cellSize}px;
      border: 3px solid ${color};
      border-radius: 50%;
      animation: dodgeEffect 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `;
    
    document.getElementById('game-board').appendChild(effect);
    
    setTimeout(() => {
      effect.remove();
    }, 600);
  }
  
  // 回避確率表示（デバッグ用）
  showDodgeChance(x, y, chance, duration = 2000) {
    if (!this.debugMode) return;
    
    this.showFloatingText(x, y, `${chance}%`, '#888888', duration);
  }
}
```

### CSS アニメーション
```css
/* style.css に追加 */
@keyframes dodgeEffect {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.dodge-effect {
  box-shadow: 0 0 10px currentColor;
}

/* 回避テキストのスタイル */
.floating-text.dodge {
  color: #00ff88;
  font-weight: bold;
  text-shadow: 0 0 5px #00ff88;
}

.floating-text.miss {
  color: #ffff00;
  font-weight: bold;
  text-shadow: 0 0 5px #ffff00;
}
```

## 音響効果

### 回避音の追加
```javascript
// audio.js の SoundManager に追加
class SoundManager {
  // 回避音の追加
  createDodgeSounds() {
    if (!this.tonejsLoaded) return;
    
    // プレイヤー回避音
    this.sounds.player_dodge = () => {
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination();
      
      // 上昇音階で「かわした」感を演出
      synth.triggerAttackRelease('C5', '0.05');
      setTimeout(() => synth.triggerAttackRelease('E5', '0.05'), 50);
      setTimeout(() => synth.triggerAttackRelease('G5', '0.05'), 100);
    };
    
    // 敵回避音
    this.sounds.dodge = () => {
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 }
      }).toDestination();
      
      // 短い「シュッ」という音
      synth.triggerAttackRelease('A4', '0.08');
    };
  }
}
```

## アップグレードシステム統合

### 回避関連アップグレード
```javascript
// UpgradeManager.js に追加
const dodgeUpgrades = {
  agility_training: {
    name: "敏捷性訓練",
    description: "回避率 +5%",
    cost: 80,
    maxLevel: 3,
    effect: (level, playerManager) => {
      playerManager.dodgeBonus += 5;
    }
  },
  
  reflexes: {
    name: "反射神経強化",
    description: "連続回避制限 +1回",
    cost: 120,
    maxLevel: 2,
    effect: (level, playerManager) => {
      dodgeSystem.conditions.maxConsecutiveDodges++;
    }
  },
  
  combat_awareness: {
    name: "戦闘感覚",
    description: "包囲時の回避率減少を軽減",
    cost: 100,
    maxLevel: 1,
    effect: (level, playerManager) => {
      dodgeSystem.conditions.surroundedPenalty *= 0.5; // 30% → 15%
    }
  }
};
```

## UIシステム統合

### 回避率表示
```html
<!-- index.html の戦闘情報に追加 -->
<div id="combat-stats">
  <div class="stat-row">
    <span>回避率:</span>
    <span id="dodge-chance">15%</span>
  </div>
  <div class="stat-row">
    <span>連続回避:</span>
    <span id="consecutive-dodges">0回</span>
  </div>
</div>
```

```javascript
// UIManager.js に追加
updateCombatStats(gameInstance) {
  const dodgeChance = gameInstance.dodgeSystem.calculatePlayerDodgeChance(gameInstance);
  const consecutiveDodges = gameInstance.dodgeSystem.playerConsecutiveDodges;
  
  document.getElementById('dodge-chance').textContent = `${dodgeChance.toFixed(1)}%`;
  document.getElementById('consecutive-dodges').textContent = `${consecutiveDodges}回`;
  
  // 連続回避が制限に近づいたら警告色
  const dodgeElement = document.getElementById('consecutive-dodges');
  if (consecutiveDodges >= dodgeSystem.conditions.maxConsecutiveDodges) {
    dodgeElement.style.color = '#ff8888';
  } else {
    dodgeElement.style.color = '#ffffff';
  }
}
```

## 実装フェーズ

### Phase 1: 基本回避システム
- [ ] DodgeSystemクラスの実装
- [ ] 基本回避判定の統合
- [ ] 簡単な視覚フィードバック

### Phase 2: 高度な機能
- [ ] 連続回避制限の実装
- [ ] 状況的修正（包囲、負傷）の追加
- [ ] 敵タイプ別回避率の設定

### Phase 3: 視覚・音響効果
- [ ] 回避エフェクトアニメーション
- [ ] 専用音響効果の追加
- [ ] UI統合（回避率表示）

### Phase 4: アップグレード統合
- [ ] 回避関連アップグレードの追加
- [ ] バランス調整
- [ ] プレイテストとフィードバック

## バランス考慮点

### プレイヤー体験
- **フラストレーション対策**: 連続回避制限で理不尽感を軽減
- **成長実感**: レベルアップによる明確な向上
- **戦略性**: 包囲されないポジショニングの重要性

### ゲームバランス
- **運要素の適度化**: 高すぎず低すぎない回避率
- **敵タイプの差別化**: 回避率で個性を演出
- **難易度曲線**: フロア進行に応じた調整

## 期待される効果
1. **戦闘の予測不可能性向上** - 同じ戦術でも結果が変わる
2. **ポジショニングの重要性** - 包囲を避ける戦術的思考
3. **成長の実感** - レベルアップによる生存率向上
4. **緊張感の演出** - 「今度こそ当たってくれ」という祈り
5. **敵の個性化** - 回避率による敵タイプの差別化