# 酸素システムバランス調整

## 概要

酸素システムの生存性を向上させ、より戦略的なプレイを可能にするためのバランス調整を実装しました。

## 実装日

2024年12月14日

## 変更内容

### 1. 酸素消費量の緩和 (PlayerManager.js)

**変更前:**
```javascript
// デッキ1-4: 1消費, デッキ5-9: 1.5消費, デッキ10-14: 2消費, デッキ15-19: 2.5消費, デッキ20+: 3消費
let oxygenCost = 1;
if (gameInstance.floor >= 5) {
    oxygenCost = 1 + Math.floor((gameInstance.floor - 1) / 5) * 0.5;
}
```

**変更後:**
```javascript
// デッキ1-4: 1消費, デッキ5-10: 1.3消費, デッキ11-16: 1.6消費, デッキ17+: 1.9消費
let oxygenCost = 1;
if (gameInstance.floor >= 5) {
    oxygenCost = 1 + Math.floor((gameInstance.floor - 1) / 6) * 0.3;
}
```

**効果:**
- 高層階での酸素消費量が大幅に削減
- デッキ20での生存時間が33ターン → 52ターンに延長

### 2. 酸素回復アイテムの強化 (ItemManager.js)

**変更前:**
- デッキ1-9: 30-59回復
- デッキ10-14: 50-79回復
- デッキ15+: 70-99回復

**変更後:**
- デッキ1-9: 35-64回復 (+5回復)
- デッキ10-14: 55-84回復 (+5回復)
- デッキ15+: 75-104回復 (+5回復)

**効果:**
- 各段階で基本回復量が5ポイント増加
- より安定した酸素回復が可能

### 3. 酸素リサイクラーの改善 (constants.js)

**変更前:**
```javascript
oxygenRecycler: {
    cost: 300,
    minFloor: 3,
    // 65%削減効果
}
```

**変更後:**
```javascript
oxygenRecycler: {
    cost: 250, // 300から250に減額
    minFloor: 2, // 3から2に早期化
    // 65%削減効果は維持
}
```

**効果:**
- より早期に（デッキ2から）入手可能
- 価格が50Gold安くなり、入手しやすくなった

### 4. 通信システム酸素効率化の早期発動 (constants.js)

**変更前:**
```javascript
trigger: "floor_4_reached"
```

**変更後:**
```javascript
trigger: "floor_3_reached"
```

**効果:**
- デッキ3で酸素効率化（35%削減）が発動
- より早期に酸素効率化の恩恵を受けられる

## 新しいバランス効果

### 酸素消費量の比較

| デッキ | 変更前 | 変更後 | 改善率 |
|--------|--------|--------|--------|
| 1-4    | 1.0    | 1.0    | 0%     |
| 5-9    | 1.5    | 1.3    | 13%    |
| 10-14  | 2.0    | 1.3    | 35%    |
| 15-19  | 2.5    | 1.6    | 36%    |
| 20+    | 3.0    | 1.9    | 37%    |

### 最大効率時の酸素消費量

酸素リサイクラー + 通信システム効率化の両方を取得した場合:

**デッキ20の例:**
- 基本消費量: 1.9
- 酸素リサイクラー適用: 1.9 × 0.35 = 0.665 → 1 (切り上げ)
- 通信システム効率化適用: 1 × 0.65 = 0.65 → 1 (切り上げ)
- **最終消費量: 1酸素/ターン**

**生存時間:**
- アップグレードなし: 52ターン
- 両方のアップグレード: 100ターン

## 技術的な改善

### アップグレード入手の最適化

1. **デッキ2**: 酸素リサイクラーが入手可能（250Gold）
2. **デッキ3**: 通信システム酸素効率化が発動
3. **デッキ3以降**: 両方の効果で大幅な酸素消費削減

### ゲームプレイへの影響

- **探索時間の延長**: 高層階でもじっくりと戦略を練れる
- **リソース管理の改善**: 酸素切れによる即死の危険性を大幅に削減
- **アップグレードの価値**: 酸素関連アップグレードの重要性を維持しつつ、入手しやすさを向上

## 今後の拡張可能性

- 酸素効率化アップグレードの段階的効果
- 高層階での酸素ボーナス要素
- 酸素残量に応じた特殊効果
- 酸素消費量の視覚的フィードバック改善

## 結論

この調整により、ローグライクゲームとしての緊張感を保ちながら、より戦略的で楽しいゲームプレイを実現しました。プレイヤーは酸素管理の重要性を理解しつつ、適切な準備とアップグレードにより長期間の探索が可能になります。

---

## 以下は将来の拡張設計案
```javascript
const oxygenConsumption = {
  // 基本消費量（現在の階層に応じて増加）
  exploration: {
    base: 1,
    perFloor: 0.1, // フロア1なら1.1、フロア10なら2.0
    formula: (floor) => Math.max(1, 1 + (floor - 1) * 0.1)
  },
  
  // 戦闘時の消費量（大幅軽減）
  combat: {
    base: 0.5,
    perFloor: 0.05, // 探索時の半分
    formula: (floor) => Math.max(0.5, 0.5 + (floor - 1) * 0.05)
  },
  
  // 待機時の消費量（さらに軽減）
  idle: {
    base: 0.3,
    perFloor: 0.03,
    formula: (floor) => Math.max(0.3, 0.3 + (floor - 1) * 0.03)
  }
};
```

### 2. 戦闘効率ボーナスシステム
```javascript
const combatEfficiencyBonus = {
  // 連続撃破ボーナス
  killStreak: {
    threshold: 2, // 2体連続撃破で発動
    oxygenBonus: 1.0, // 酸素+1回復
    maxStreak: 5
  },
  
  // クリティカル撃破ボーナス
  criticalKill: {
    oxygenBonus: 0.5,
    message: "完璧な一撃！ 酸素効率向上"
  },
  
  // 一撃撃破ボーナス
  oneHitKill: {
    oxygenBonus: 0.3,
    message: "素早い処理！"
  },
  
  // 無傷クリアボーナス（フロア全敵撃破、ダメージなし）
  flawlessFloor: {
    oxygenBonus: 3.0,
    message: "完璧なフロア制圧！"
  }
};
```

### 3. 酸素回復システム拡充
```javascript
const oxygenRecovery = {
  // 既存の酸素コンテナ（強化）
  oxygenContainer: {
    recovery: 15, // 現在より増量
    guaranteed: 2, // フロアに確実に2個配置
    additional: 0.3 // 30%の確率で追加配置
  },
  
  // 新規：環境回復システム
  environmentalRecovery: {
    // 生命維持システム室
    lifeSupportRoom: {
      recovery: 5.0,
      message: "生命維持システムで酸素補給",
      spawnChance: 0.4 // 40%の確率で出現
    },
    
    // 換気口
    ventilationShaft: {
      recovery: 2.0,
      message: "換気口から新鮮な空気",
      spawnChance: 0.6, // 60%の確率で出現
      perFloor: 1 // フロアに1つまで
    },
    
    // 酸素漏れエリア（リスク・リターン）
    oxygenLeak: {
      recovery: 8.0,
      danger: "エイリアンが2体追加スポーン",
      message: "大量の酸素が漏れている...",
      spawnChance: 0.2 // 20%の確率で出現
    }
  },
  
  // 新規：アクション回復
  actionRecovery: {
    // システム修理で回復
    systemRepair: {
      recovery: 3.0,
      message: "システム修理完了。酸素効率向上",
      actionCost: 1 // 1ターン消費
    },
    
    // 瞑想/休息コマンド
    rest: {
      recovery: 1.5,
      message: "呼吸を整えて酸素効率向上",
      actionCost: 2, // 2ターン消費（リスクあり）
      condition: "no_enemies_nearby" // 近くに敵がいない時のみ
    }
  }
};
```

### 4. 酸素状態表示システム
```javascript
const oxygenStatusSystem = {
  // 詳細な状態表示
  statusLevels: {
    abundant: { threshold: 80, color: "#00ff00", message: "酸素充分" },
    good: { threshold: 60, color: "#80ff00", message: "酸素良好" },
    warning: { threshold: 40, color: "#ffff00", message: "酸素注意" },
    danger: { threshold: 20, color: "#ff8000", message: "酸素危険" },
    critical: { threshold: 10, color: "#ff0000", message: "酸素警告" }
  },
  
  // 消費予測表示
  prediction: {
    showNextTurnCost: true,
    showFloorSurvivalTime: true,
    formula: "現在の酸素量 ÷ ターン消費量 = 残りターン数"
  },
  
  // 効率ボーナス表示
  bonusIndicator: {
    showActiveBonus: true,
    showKillStreak: true,
    animateRecovery: true
  }
};
```

## 実装詳細

### PlayerManager.js の修正
```javascript
class PlayerManager {
  constructor() {
    // 既存のプロパティ...
    this.oxygenState = 'exploration'; // 'exploration', 'combat', 'idle'
    this.killStreak = 0;
    this.floorKills = 0;
    this.floorDamageTaken = 0;
  }
  
  // 酸素消費計算（状況別）
  calculateOxygenConsumption(gameInstance) {
    const floor = gameInstance.floor;
    const consumption = oxygenConsumption[this.oxygenState];
    return Math.round(consumption.formula(floor) * 10) / 10; // 小数点1桁
  }
  
  // 酸素消費実行
  consumeOxygen(gameInstance) {
    const consumption = this.calculateOxygenConsumption(gameInstance);
    this.oxygen = Math.max(0, this.oxygen - consumption);
    
    // 状態表示更新
    this.updateOxygenStatus();
    
    // 酸素切れチェック
    if (this.oxygen <= 0) {
      this.takeDamage(5, gameInstance); // 酸素切れダメージ
      gameInstance.addBattleLog("酸素不足でダメージ！");
    }
  }
  
  // 戦闘効率ボーナス処理
  handleCombatBonus(enemy, damageDealt, wasCritical, gameInstance) {
    let oxygenBonus = 0;
    
    // 一撃撃破ボーナス
    if (damageDealt >= enemy.maxHp) {
      oxygenBonus += combatEfficiencyBonus.oneHitKill.oxygenBonus;
      gameInstance.addBattleLog(combatEfficiencyBonus.oneHitKill.message);
    }
    
    // クリティカル撃破ボーナス
    if (wasCritical && enemy.hp <= 0) {
      oxygenBonus += combatEfficiencyBonus.criticalKill.oxygenBonus;
      gameInstance.addBattleLog(combatEfficiencyBonus.criticalKill.message);
    }
    
    // 撃破時の連続ボーナス
    if (enemy.hp <= 0) {
      this.killStreak++;
      this.floorKills++;
      
      if (this.killStreak >= combatEfficiencyBonus.killStreak.threshold) {
        const streakBonus = Math.min(this.killStreak - 1, combatEfficiencyBonus.killStreak.maxStreak) * 
                           combatEfficiencyBonus.killStreak.oxygenBonus;
        oxygenBonus += streakBonus;
        gameInstance.addBattleLog(`${this.killStreak}連撃破！ 酸素効率大幅向上！`);
      }
    } else {
      this.killStreak = 0; // 撃破失敗でリセット
    }
    
    // 酸素回復適用
    if (oxygenBonus > 0) {
      this.recoverOxygen(oxygenBonus, gameInstance);
    }
  }
  
  // 酸素回復メソッド
  recoverOxygen(amount, gameInstance, message = null) {
    const oldOxygen = this.oxygen;
    this.oxygen = Math.min(this.maxOxygen, this.oxygen + amount);
    const actualRecovery = this.oxygen - oldOxygen;
    
    if (actualRecovery > 0) {
      // 回復エフェクト表示
      gameInstance.renderManager.showFloatingText(
        this.x, this.y, `+${actualRecovery.toFixed(1)} O₂`, '#00ff88'
      );
      
      if (message) {
        gameInstance.addBattleLog(message);
      }
    }
  }
  
  // 状態切り替えメソッド
  setOxygenState(newState) {
    this.oxygenState = newState;
  }
}
```

### GameCore.js の修正
```javascript
class RoguelikeGame {
  // 戦闘開始時
  startCombat() {
    this.playerManager.setOxygenState('combat');
  }
  
  // 戦闘終了時
  endCombat() {
    this.playerManager.setOxygenState('exploration');
    this.checkFloorClearBonus();
  }
  
  // フロアクリアボーナスチェック
  checkFloorClearBonus() {
    const enemies = this.enemyManager.enemies;
    if (enemies.length === 0 && this.playerManager.floorDamageTaken === 0) {
      // 無傷フロアクリアボーナス
      this.playerManager.recoverOxygen(
        combatEfficiencyBonus.flawlessFloor.oxygenBonus,
        this,
        combatEfficiencyBonus.flawlessFloor.message
      );
    }
  }
  
  // フロア移動時
  moveToNextFloor() {
    // フロア統計リセット
    this.playerManager.floorKills = 0;
    this.playerManager.floorDamageTaken = 0;
    this.playerManager.killStreak = 0;
    
    // 既存のフロア移動処理...
  }
}
```

### 環境回復システムの実装
```javascript
// LevelGenerator.js に追加
class LevelGenerator {
  // 特殊部屋生成
  generateSpecialRooms(gameInstance) {
    const rooms = this.rooms;
    
    rooms.forEach(room => {
      const rand = Math.random();
      
      // 生命維持システム室
      if (rand < oxygenRecovery.environmentalRecovery.lifeSupportRoom.spawnChance) {
        this.addLifeSupportSystem(room, gameInstance);
      }
      // 換気口
      else if (rand < oxygenRecovery.environmentalRecovery.ventilationShaft.spawnChance) {
        this.addVentilationShaft(room, gameInstance);
      }
      // 酸素漏れエリア（危険）
      else if (rand < oxygenRecovery.environmentalRecovery.oxygenLeak.spawnChance) {
        this.addOxygenLeakArea(room, gameInstance);
      }
    });
  }
  
  addLifeSupportSystem(room, gameInstance) {
    const x = room.x + Math.floor(room.width / 2);
    const y = room.y + Math.floor(room.height / 2);
    
    gameInstance.grid[y][x] = {
      type: 'life_support',
      symbol: '🔧',
      color: '#00ffff',
      interactive: true,
      used: false
    };
  }
}
```

## 実装フェーズ

### Phase 1: 基本調整
- [ ] 状況別酸素消費量の実装
- [ ] 戦闘時消費軽減の適用
- [ ] 酸素状態表示の改善

### Phase 2: ボーナスシステム
- [ ] 戦闘効率ボーナスの実装
- [ ] 連続撃破システムの追加
- [ ] 回復エフェクトの表示

### Phase 3: 環境システム
- [ ] 特殊部屋の実装
- [ ] インタラクティブ回復の追加
- [ ] リスク・リターン要素の実装

### Phase 4: バランス調整
- [ ] 数値の微調整
- [ ] プレイテストによる調整
- [ ] フィードバック反映

## 期待される効果
1. **戦闘へのためらいを軽減** - 酸素を気にせず戦える
2. **スキルプレイの報酬化** - 効率的な戦闘で酸素回復
3. **探索の快適性向上** - じっくり探索できる余裕
4. **戦略的リソース管理** - 回復手段の選択肢増加
5. **ゲーム体験の向上** - ストレスより楽しさを重視