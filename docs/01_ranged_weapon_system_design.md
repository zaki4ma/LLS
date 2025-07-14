# 遠距離攻撃システム設計書 - ルミナス・ロスト・シグナル

## システム概要
基本は近接攻撃を維持しつつ、限定的な遠距離攻撃オプションを追加。電力消費型の消費アイテムとして実装し、戦略的な使用を促進する。

## 設計方針
- **基本戦闘**: 近接攻撃（1マス）がメイン
- **遠距離武器**: 消費型アイテム、射程は2-3マス程度
- **リソース管理**: 電力消費でバランス調整
- **戦略性**: 「今使うべきか温存すべきか」の判断

## 実装要件

### 武器種類とスペック

#### 1. プラズマカッター
```javascript
const plasmaCutter = {
  id: "plasma_cutter",
  name: "プラズマカッター",
  description: "工業用プラズマ切断装置。高威力だが電力消費が激しい",
  type: "ranged_consumable",
  range: 2,
  damage: 40,
  powerCost: 25, // 電力の1/4を消費
  usesPerGame: 8,
  rarity: "uncommon",
  foundIn: ["workshop", "engineering_bay"],
  icon: "🔥",
  soundEffect: "plasma_fire"
};
```

#### 2. スタンガン
```javascript
const stunGun = {
  id: "stun_gun",
  name: "スタンガン",
  description: "保安用装備。敵を麻痺させるが威力は控えめ",
  type: "ranged_consumable", 
  range: 2,
  damage: 15,
  powerCost: 15,
  usesPerGame: 12,
  specialEffect: "stun", // 1ターン麻痺
  rarity: "common",
  foundIn: ["security_office", "armory"],
  icon: "⚡",
  soundEffect: "electric_zap"
};
```

#### 3. 緊急用レーザー
```javascript
const emergencyLaser = {
  id: "emergency_laser",
  name: "緊急用レーザー",
  description: "非常用信号装置を武器転用。貫通攻撃可能",
  type: "ranged_consumable",
  range: 3,
  damage: 30,
  powerCost: 20,
  usesPerGame: 3, // 超希少
  specialEffect: "penetrate", // 直線上の敵を貫通
  rarity: "rare",
  foundIn: ["bridge", "emergency_locker"],
  icon: "🔴",
  soundEffect: "laser_beam"
};
```

### データ構造設計

#### 武器管理システム
```javascript
class RangedWeaponSystem {
  constructor() {
    this.weapons = new Map();
    this.activeWeapon = null;
    this.weaponInventory = {
      plasma_cutter: 0,
      stun_gun: 0,
      emergency_laser: 0
    };
  }
  
  // 武器の初期化
  initializeWeapons() {
    this.weapons.set('plasma_cutter', plasmaCutter);
    this.weapons.set('stun_gun', stunGun);
    this.weapons.set('emergency_laser', emergencyLaser);
  }
  
  // 武器の取得
  addWeapon(weaponId, quantity = 1) {
    if (this.weaponInventory.hasOwnProperty(weaponId)) {
      this.weaponInventory[weaponId] += quantity;
      this.updateWeaponUI();
      return true;
    }
    return false;
  }
  
  // 武器の使用可能性チェック
  canUseWeapon(weaponId) {
    const weapon = this.weapons.get(weaponId);
    return (
      this.weaponInventory[weaponId] > 0 &&
      player.power >= weapon.powerCost
    );
  }
  
  // 武器使用
  useWeapon(weaponId, targetX, targetY) {
    if (!this.canUseWeapon(weaponId)) {
      return { success: false, message: "使用できません" };
    }
    
    const weapon = this.weapons.get(weaponId);
    const result = this.executeRangedAttack(weapon, targetX, targetY);
    
    if (result.success) {
      // リソース消費
      this.weaponInventory[weaponId]--;
      player.power -= weapon.powerCost;
      this.updateWeaponUI();
    }
    
    return result;
  }
}
```

### 攻撃システム実装

#### 射程・命中判定
```javascript
// 射程内判定
function isInRange(weapon, playerX, playerY, targetX, targetY) {
  const distance = Math.abs(targetX - playerX) + Math.abs(targetY - playerY);
  return distance <= weapon.range && distance >= 1;
}

// 射線判定（障害物チェック）
function hasLineOfSight(startX, startY, endX, endY) {
  // ブレゼンハムライン算法で直線上の障害物をチェック
  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);
  const sx = startX < endX ? 1 : -1;
  const sy = startY < endY ? 1 : -1;
  let err = dx - dy;
  
  let x = startX;
  let y = startY;
  
  while (true) {
    // 壁があるかチェック（開始点と終了点は除く）
    if ((x !== startX || y !== startY) && 
        (x !== endX || y !== endY) && 
        gameMap[y][x] === WALL) {
      return false;
    }
    
    if (x === endX && y === endY) break;
    
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
  
  return true;
}
```

#### 攻撃実行システム
```javascript
function executeRangedAttack(weapon, targetX, targetY) {
  const playerX = player.x;
  const playerY = player.y;
  
  // 射程チェック
  if (!isInRange(weapon, playerX, playerY, targetX, targetY)) {
    return { success: false, message: "射程外です" };
  }
  
  // 射線チェック
  if (!hasLineOfSight(playerX, playerY, targetX, targetY)) {
    return { success: false, message: "障害物があります" };
  }
  
  // 特殊効果に応じた処理
  let targets = [];
  
  if (weapon.specialEffect === "penetrate") {
    // 貫通攻撃：直線上の全ての敵
    targets = findEnemiesInLine(playerX, playerY, targetX, targetY);
  } else {
    // 通常攻撃：指定位置の敵のみ
    const enemy = getEnemyAt(targetX, targetY);
    if (enemy) targets.push(enemy);
  }
  
  if (targets.length === 0) {
    return { success: false, message: "敵がいません" };
  }
  
  // ダメージ適用
  let results = [];
  targets.forEach(enemy => {
    const damage = weapon.damage;
    enemy.hp -= damage;
    
    // 特殊効果適用
    if (weapon.specialEffect === "stun") {
      enemy.stunned = true;
      enemy.stunDuration = 1;
    }
    
    results.push({
      enemyId: enemy.id,
      damage: damage,
      killed: enemy.hp <= 0
    });
    
    // 敵撃破処理
    if (enemy.hp <= 0) {
      removeEnemy(enemy);
    }
  });
  
  // 攻撃アニメーション
  playRangedAttackAnimation(weapon, playerX, playerY, targetX, targetY);
  
  return { 
    success: true, 
    results: results,
    weaponUsed: weapon.name
  };
}
```

### UI設計

#### 武器選択インターフェース
```html
<!-- 遠距離武器パネル -->
<div id="ranged-weapons-panel">
  <h3>遠距離武器</h3>
  <div class="weapon-slots">
    <div class="weapon-slot" data-weapon="plasma_cutter">
      <div class="weapon-icon">🔥</div>
      <div class="weapon-name">プラズマカッター</div>
      <div class="weapon-count">×<span id="plasma-count">0</span></div>
      <div class="weapon-power">⚡<span>25</span></div>
    </div>
    
    <div class="weapon-slot" data-weapon="stun_gun">
      <div class="weapon-icon">⚡</div>
      <div class="weapon-name">スタンガン</div>
      <div class="weapon-count">×<span id="stun-count">0</span></div>
      <div class="weapon-power">⚡<span>15</span></div>
    </div>
    
    <div class="weapon-slot" data-weapon="emergency_laser">
      <div class="weapon-icon">🔴</div>
      <div class="weapon-name">緊急レーザー</div>
      <div class="weapon-count">×<span id="laser-count">0</span></div>
      <div class="weapon-power">⚡<span>20</span></div>
    </div>
  </div>
  
  <div id="selected-weapon">
    <p>選択中: <span id="current-weapon">なし</span></p>
    <button id="cancel-ranged">キャンセル</button>
  </div>
</div>
```

#### 攻撃対象選択システム
```javascript
class RangedTargetingSystem {
  constructor(weaponSystem) {
    this.weaponSystem = weaponSystem;
    this.isTargeting = false;
    this.selectedWeapon = null;
    this.validTargets = [];
  }
  
  startTargeting(weaponId) {
    this.selectedWeapon = weaponId;
    this.isTargeting = true;
    this.highlightValidTargets();
    this.showTargetingCursor();
  }
  
  highlightValidTargets() {
    const weapon = this.weaponSystem.weapons.get(this.selectedWeapon);
    this.validTargets = [];
    
    // プレイヤー周囲の射程内位置を計算
    for (let dy = -weapon.range; dy <= weapon.range; dy++) {
      for (let dx = -weapon.range; dx <= weapon.range; dx++) {
        const targetX = player.x + dx;
        const targetY = player.y + dy;
        const distance = Math.abs(dx) + Math.abs(dy);
        
        if (distance > 0 && distance <= weapon.range &&
            isInRange(weapon, player.x, player.y, targetX, targetY) &&
            hasLineOfSight(player.x, player.y, targetX, targetY)) {
          
          this.validTargets.push({ x: targetX, y: targetY });
          this.highlightCell(targetX, targetY, 'valid-target');
        }
      }
    }
  }
  
  handleTargetClick(x, y) {
    if (!this.isTargeting) return false;
    
    const isValidTarget = this.validTargets.some(target => 
      target.x === x && target.y === y
    );
    
    if (isValidTarget) {
      const result = this.weaponSystem.useWeapon(this.selectedWeapon, x, y);
      this.endTargeting();
      this.showAttackResult(result);
      return true;
    }
    
    return false;
  }
  
  endTargeting() {
    this.isTargeting = false;
    this.selectedWeapon = null;
    this.clearHighlights();
    this.hideTargetingCursor();
  }
}
```

### アニメーション設計

#### 攻撃エフェクト
```javascript
function playRangedAttackAnimation(weapon, startX, startY, endX, endY) {
  switch(weapon.id) {
    case 'plasma_cutter':
      createPlasmaBeamEffect(startX, startY, endX, endY);
      break;
    case 'stun_gun':
      createElectricArcEffect(startX, startY, endX, endY);
      break;
    case 'emergency_laser':
      createLaserBeamEffect(startX, startY, endX, endY);
      break;
  }
  
  // 音響効果
  if (weapon.soundEffect && window.Tone) {
    playWeaponSound(weapon.soundEffect);
  }
}

function createPlasmaBeamEffect(startX, startY, endX, endY) {
  const beam = document.createElement('div');
  beam.className = 'plasma-beam';
  beam.style.cssText = `
    position: absolute;
    background: linear-gradient(90deg, #ff4400, #ffaa00);
    height: 4px;
    transform-origin: left center;
    box-shadow: 0 0 10px #ff4400;
    z-index: 100;
  `;
  
  // 位置とサイズの計算
  const cellSize = 32; // セルサイズ
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy) * cellSize;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  beam.style.left = `${startX * cellSize + cellSize/2}px`;
  beam.style.top = `${startY * cellSize + cellSize/2}px`;
  beam.style.width = `${length}px`;
  beam.style.transform = `rotate(${angle}deg)`;
  
  document.getElementById('game-board').appendChild(beam);
  
  // アニメーション後に削除
  setTimeout(() => {
    beam.remove();
  }, 300);
}
```

### 音響効果

#### 武器音の実装
```javascript
function playWeaponSound(soundType) {
  if (!window.Tone) return;
  
  const synth = new Tone.Synth().toDestination();
  
  switch(soundType) {
    case 'plasma_fire':
      // プラズマ音：低音から高音へのスイープ
      synth.triggerAttackRelease('C2', '0.3');
      setTimeout(() => synth.triggerAttackRelease('C4', '0.1'), 100);
      break;
      
    case 'electric_zap':
      // 電撃音：短いパルス音
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          synth.triggerAttackRelease('G5', '0.05');
        }, i * 50);
      }
      break;
      
    case 'laser_beam':
      // レーザー音：高音の持続音
      synth.triggerAttackRelease('A5', '0.2');
      break;
  }
}
```

## 実装フェーズ

### Phase 1: 基本システム
- [ ] 武器データ構造の実装
- [ ] 射程・射線判定システム
- [ ] 基本的な遠距離攻撃機能

### Phase 2: UI統合
- [ ] 武器選択インターフェース
- [ ] 対象選択システム
- [ ] 武器在庫表示

### Phase 3: エフェクト追加
- [ ] 攻撃アニメーション
- [ ] 音響効果
- [ ] ヒットエフェクト

### Phase 4: バランス調整
- [ ] 消費リソースの調整
- [ ] 威力・射程のバランス
- [ ] 希少度・入手頻度の調整

## テスト項目
- [ ] 各武器の射程が正しく動作する
- [ ] 電力消費が適切に行われる
- [ ] 射線判定が壁を正しく認識する
- [ ] 特殊効果（麻痺、貫通）が正常に動作する
- [ ] アニメーションと音響効果が再生される
- [ ] UI表示が正確に更新される

## バランス設計の考慮点
- 近接攻撃の緊張感を損なわない程度の性能
- 電力との兼ね合いで戦略的な使用を促進
- 希少性により「ここぞ」という場面での使用を演出
- 各武器の特徴を活かした使い分けの必要性