# 敵HPバー表示システム設計書 - ルミナス・ロスト・シグナル

## システム概要
プレイヤーの視界内にいる敵の残りHPをバー形式で視覚化する。プレイヤーが装備している「戦術スキャナー」という設定で、視界範囲内の敵の生命反応を分析・表示する。

## 設計方針
1. **視界内限定表示** - リアルタイムスキャニング装備の設定
2. **戦略的情報提供** - 攻撃優先度の判断材料
3. **視覚的整理** - ゲーム画面を圧迫しないデザイン
4. **敵タイプの差別化** - エリート敵など特別な敵の識別

## HPバー表示システム

### 基本仕様
```javascript
const enemyHPBarSystem = {
  // 表示条件
  displayConditions: {
    requiresLineOfSight: true, // 視界内のみ
    maxDistance: 8, // 最大8マス以内
    fadeDistance: 6, // 6マス以降は透明度が下がる
    hideWhenInvisible: true // 暗闇では非表示
  },
  
  // バーのデザイン設定
  barDesign: {
    width: 28, // セルサイズ32pxに対して28px
    height: 4,
    borderWidth: 1,
    yOffset: -8, // セルの上端から8px上
    xOffset: 2   // 中央寄せ用
  },
  
  // 色設定（敵タイプ別）
  colors: {
    BASIC: {
      background: '#330000',
      border: '#666666',
      fill: ['#ff4444', '#ff6666'], // グラデーション
      lowHP: ['#ff8800', '#ffaa00'] // HP30%以下
    },
    STALKER: {
      background: '#003300',
      border: '#666666',
      fill: ['#44ff44', '#66ff66'],
      lowHP: ['#ffff00', '#ffff44']
    },
    CHARGER: {
      background: '#003333',
      border: '#666666',
      fill: ['#4444ff', '#6666ff'],
      lowHP: ['#ff44ff', '#ff66ff']
    },
    GUARDIAN: {
      background: '#333300',
      border: '#888888',
      fill: ['#ffff44', '#ffff66'],
      lowHP: ['#ff4444', '#ff6666']
    },
    HUNTER: {
      background: '#330033',
      border: '#666666',
      fill: ['#ff44ff', '#ff66ff'],
      lowHP: ['#ff0000', '#ff4444']
    },
    SCOUT: {
      background: '#003300',
      border: '#666666',
      fill: ['#00ff88', '#44ffaa'],
      lowHP: ['#ffaa00', '#ffcc44']
    },
    // エリート敵（将来の拡張用）
    ELITE: {
      background: '#440000',
      border: '#ffaa00',
      fill: ['#ff0000', '#ffaa00'], // 赤→金のグラデーション
      lowHP: ['#ff0000', '#ff0000']
    }
  }
};
```

### HPバー管理クラス
```javascript
class EnemyHPBarManager {
  constructor() {
    this.activeBars = new Map(); // 敵ID -> HPバー要素のマップ
    this.gameBoard = null;
  }
  
  // 初期化
  initialize(gameInstance) {
    this.gameBoard = document.getElementById('game-board');
    this.gameInstance = gameInstance;
  }
  
  // 全HPバーの更新
  updateAllBars() {
    const visibleEnemies = this.getVisibleEnemies();
    
    // 現在表示中のバーをチェック
    for (const [enemyId, barElement] of this.activeBars) {
      const enemy = this.gameInstance.enemyManager.getEnemyById(enemyId);
      
      if (!enemy || !visibleEnemies.includes(enemy)) {
        // 敵が死亡または視界外に出た場合はバーを削除
        this.removeHPBar(enemyId);
      } else {
        // バーの位置とHP値を更新
        this.updateHPBar(enemy);
      }
    }
    
    // 新たに視界に入った敵のバーを作成
    visibleEnemies.forEach(enemy => {
      if (!this.activeBars.has(enemy.id)) {
        this.createHPBar(enemy);
      }
    });
  }
  
  // 視界内の敵を取得
  getVisibleEnemies() {
    const player = this.gameInstance.playerManager;
    const enemies = this.gameInstance.enemyManager.enemies;
    const visibleCells = this.gameInstance.visibleCells;
    
    return enemies.filter(enemy => {
      // 視界内かチェック
      if (!visibleCells.has(`${enemy.x},${enemy.y}`)) {
        return false;
      }
      
      // 距離チェック
      const distance = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
      return distance <= enemyHPBarSystem.displayConditions.maxDistance;
    });
  }
  
  // HPバー作成
  createHPBar(enemy) {
    const barContainer = document.createElement('div');
    barContainer.className = 'enemy-hp-container';
    barContainer.style.cssText = this.getContainerStyle(enemy);
    
    // 背景バー
    const backgroundBar = document.createElement('div');
    backgroundBar.className = 'enemy-hp-background';
    backgroundBar.style.cssText = this.getBackgroundStyle(enemy);
    
    // HPバー（前景）
    const hpBar = document.createElement('div');
    hpBar.className = 'enemy-hp-fill';
    hpBar.style.cssText = this.getFillStyle(enemy);
    
    // 敵タイプ表示（オプション）
    const typeIndicator = document.createElement('div');
    typeIndicator.className = 'enemy-type-indicator';
    typeIndicator.textContent = this.getTypeSymbol(enemy.type);
    typeIndicator.style.cssText = this.getTypeIndicatorStyle();
    
    backgroundBar.appendChild(hpBar);
    barContainer.appendChild(backgroundBar);
    barContainer.appendChild(typeIndicator);
    
    this.gameBoard.appendChild(barContainer);
    this.activeBars.set(enemy.id, {
      container: barContainer,
      background: backgroundBar,
      fill: hpBar,
      typeIndicator: typeIndicator
    });
  }
  
  // HPバー更新
  updateHPBar(enemy) {
    const barElements = this.activeBars.get(enemy.id);
    if (!barElements) return;
    
    // 位置更新
    barElements.container.style.cssText = this.getContainerStyle(enemy);
    
    // HP値更新
    const hpPercentage = (enemy.hp / enemy.maxHp) * 100;
    barElements.fill.style.width = `${hpPercentage}%`;
    
    // 低HP時の色変更
    if (hpPercentage <= 30) {
      barElements.fill.style.background = this.getLowHPGradient(enemy.type);
    }
    
    // 距離による透明度調整
    const distance = this.getDistanceToPlayer(enemy);
    const opacity = this.calculateOpacity(distance);
    barElements.container.style.opacity = opacity;
  }
  
  // HPバー削除
  removeHPBar(enemyId) {
    const barElements = this.activeBars.get(enemyId);
    if (barElements) {
      // フェードアウトアニメーション
      barElements.container.style.transition = 'opacity 0.3s ease-out';
      barElements.container.style.opacity = '0';
      
      setTimeout(() => {
        if (barElements.container.parentNode) {
          barElements.container.parentNode.removeChild(barElements.container);
        }
      }, 300);
      
      this.activeBars.delete(enemyId);
    }
  }
  
  // スタイル生成メソッド群
  getContainerStyle(enemy) {
    const cellSize = 32;
    const config = enemyHPBarSystem.barDesign;
    
    return `
      position: absolute;
      left: ${enemy.x * cellSize + config.xOffset}px;
      top: ${enemy.y * cellSize + config.yOffset}px;
      width: ${config.width}px;
      height: ${config.height + 8}px;
      pointer-events: none;
      z-index: 500;
    `;
  }
  
  getBackgroundStyle(enemy) {
    const config = enemyHPBarSystem.barDesign;
    const colors = enemyHPBarSystem.colors[enemy.type] || enemyHPBarSystem.colors.BASIC;
    
    return `
      width: ${config.width}px;
      height: ${config.height}px;
      background: ${colors.background};
      border: ${config.borderWidth}px solid ${colors.border};
      border-radius: 2px;
      overflow: hidden;
    `;
  }
  
  getFillStyle(enemy) {
    const hpPercentage = (enemy.hp / enemy.maxHp) * 100;
    const colors = enemyHPBarSystem.colors[enemy.type] || enemyHPBarSystem.colors.BASIC;
    const gradient = hpPercentage <= 30 ? colors.lowHP : colors.fill;
    
    return `
      width: ${hpPercentage}%;
      height: 100%;
      background: linear-gradient(90deg, ${gradient[0]}, ${gradient[1]});
      transition: width 0.3s ease, background 0.3s ease;
      border-radius: 1px;
    `;
  }
  
  getTypeIndicatorStyle() {
    return `
      font-size: 8px;
      color: #ffffff;
      text-align: center;
      line-height: 8px;
      text-shadow: 1px 1px 1px #000000;
      margin-top: 1px;
    `;
  }
  
  // 敵タイプのシンボル
  getTypeSymbol(enemyType) {
    const symbols = {
      BASIC: '●',
      STALKER: '◆',
      CHARGER: '▲',
      GUARDIAN: '■',
      HUNTER: '★',
      SCOUT: '◎',
      ELITE: '♦'
    };
    return symbols[enemyType] || '●';
  }
  
  // 距離による透明度計算
  calculateOpacity(distance) {
    const fadeStart = enemyHPBarSystem.displayConditions.fadeDistance;
    const maxDistance = enemyHPBarSystem.displayConditions.maxDistance;
    
    if (distance <= fadeStart) {
      return 1.0;
    } else {
      const fadeRatio = (maxDistance - distance) / (maxDistance - fadeStart);
      return Math.max(0.3, fadeRatio);
    }
  }
  
  getDistanceToPlayer(enemy) {
    const player = this.gameInstance.playerManager;
    return Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
  }
  
  getLowHPGradient(enemyType) {
    const colors = enemyHPBarSystem.colors[enemyType] || enemyHPBarSystem.colors.BASIC;
    return `linear-gradient(90deg, ${colors.lowHP[0]}, ${colors.lowHP[1]})`;
  }
  
  // 全バー削除（フロア移動時など）
  clearAllBars() {
    for (const [enemyId, barElements] of this.activeBars) {
      if (barElements.container.parentNode) {
        barElements.container.parentNode.removeChild(barElements.container);
      }
    }
    this.activeBars.clear();
  }
}
```

## CSS スタイル定義

```css
/* 敵HPバー関連のスタイル */
.enemy-hp-container {
  transition: opacity 0.2s ease;
}

.enemy-hp-background {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.enemy-hp-fill {
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2);
}

.enemy-type-indicator {
  font-family: monospace;
  font-weight: bold;
}

/* エリート敵用の特別エフェクト */
.enemy-hp-container.elite {
  animation: eliteGlow 2s ease-in-out infinite alternate;
}

@keyframes eliteGlow {
  from {
    filter: drop-shadow(0 0 2px #ffaa00);
  }
  to {
    filter: drop-shadow(0 0 4px #ff6600);
  }
}

/* ダメージ時のパルスエフェクト */
.enemy-hp-fill.damage-pulse {
  animation: damagePulse 0.3s ease-out;
}

@keyframes damagePulse {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(1.2); }
  100% { transform: scaleY(1); }
}
```

## ゲームシステム統合

### RenderManager.js への統合
```javascript
class RenderManager {
  constructor() {
    // 既存のプロパティ...
    this.hpBarManager = new EnemyHPBarManager();
  }
  
  initialize(gameInstance) {
    // 既存の初期化...
    this.hpBarManager.initialize(gameInstance);
  }
  
  render() {
    // 既存の描画処理...
    
    // HPバーの更新
    this.hpBarManager.updateAllBars();
  }
  
  // フロア移動時
  clearLevel() {
    this.hpBarManager.clearAllBars();
  }
}
```

### EnemyManager.js への統合
```javascript
class EnemyManager {
  // 敵がダメージを受けた時
  enemyTakeDamage(enemy, damage, gameInstance) {
    const oldHp = enemy.hp;
    enemy.hp = Math.max(0, enemy.hp - damage);
    
    // HPバーのダメージエフェクト
    this.triggerDamageEffect(enemy, gameInstance);
    
    // 敵撃破時
    if (enemy.hp <= 0) {
      gameInstance.renderManager.hpBarManager.removeHPBar(enemy.id);
      this.removeEnemy(enemy);
    }
  }
  
  // ダメージエフェクト
  triggerDamageEffect(enemy, gameInstance) {
    const barElements = gameInstance.renderManager.hpBarManager.activeBars.get(enemy.id);
    if (barElements) {
      barElements.fill.classList.add('damage-pulse');
      setTimeout(() => {
        barElements.fill.classList.remove('damage-pulse');
      }, 300);
    }
  }
  
  // 敵IDで検索
  getEnemyById(enemyId) {
    return this.enemies.find(enemy => enemy.id === enemyId);
  }
}
```

## 戦術スキャナー設定（世界観統合）

### ストーリー的説明
```javascript
const tacticalScannerLore = {
  name: "戦術分析装置 TSC-2047",
  description: "保守技術者用の生命反応スキャナー。船内の生命体の健康状態を分析し、視覚的に表示する。",
  
  features: [
    "リアルタイム生命反応分析",
    "視界内8m範囲での精密スキャン",
    "種族別生命パターン認識",
    "ダメージ状態の色分け表示"
  ],
  
  limitations: [
    "直接視界が必要（壁越しスキャン不可）",
    "距離による精度低下",
    "未知の生命体は基本パターンで表示"
  ]
};
```

### チュートリアルメッセージ
```javascript
const tutorialMessages = {
  firstEnemyEncounter: {
    message: "戦術スキャナーが敵の生命反応を検知しました。HPバーで敵の体力を確認できます。",
    trigger: "first_enemy_spotted"
  },
  
  lowEnemyHP: {
    message: "敵のHPが低下しています。HPバーが赤くなった敵は瀕死状態です。",
    trigger: "enemy_hp_below_30"
  },
  
  multipleEnemies: {
    message: "複数の敵を検知。HPバーを参考に攻撃優先度を決めましょう。",
    trigger: "multiple_enemies_visible"
  }
};
```

## パフォーマンス最適化

### 更新頻度の最適化
```javascript
class OptimizedHPBarManager extends EnemyHPBarManager {
  constructor() {
    super();
    this.updateThrottle = 100; // 100ms間隔で更新
    this.lastUpdateTime = 0;
  }
  
  updateAllBars() {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateThrottle) {
      return;
    }
    
    super.updateAllBars();
    this.lastUpdateTime = now;
  }
  
  // 視界変更時の即座更新
  forceUpdate() {
    this.lastUpdateTime = 0;
    this.updateAllBars();
  }
}
```

## 実装フェーズ

### Phase 1: 基本システム
- [ ] EnemyHPBarManagerクラスの実装
- [ ] 基本的なHPバー表示機能
- [ ] 視界との連動

### Phase 2: 視覚効果
- [ ] 敵タイプ別の色分け
- [ ] ダメージ時のアニメーション
- [ ] 距離による透明度調整

### Phase 3: ゲーム統合
- [ ] RenderManagerとの統合
- [ ] EnemyManagerとの連携
- [ ] パフォーマンス最適化

### Phase 4: 拡張機能
- [ ] エリート敵の特別表示
- [ ] チュートリアルメッセージ
- [ ] 設定による表示ON/OFF

## 期待される効果
1. **戦略的判断の向上** - 攻撃優先度の明確化
2. **戦闘の満足度向上** - 進捗の視覚的確認
3. **回避システムとの相性** - 外れても進展が見える
4. **敵の個性化** - 色分けによるタイプ識別
5. **世界観の強化** - 技術装備による合理的説明