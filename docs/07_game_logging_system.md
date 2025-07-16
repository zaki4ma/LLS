# ゲームログシステム設計書 - ルミナス・ロスト・シグナル

## システム概要
Claude Codeがゲームバランスの問題を特定し、改善提案を行えるよう、構造化されたログを出力するシステム。プレイヤーの行動、戦闘データ、進行状況を詳細に記録し、データドリブンな調整を可能にする。

## 設計方針
1. **構造化データ** - JSON形式で一貫性のあるログ出力
2. **分析しやすい形式** - Claude Codeが読み取りやすい明確な情報
3. **バランス改善直結** - 具体的な調整提案に繋がるデータ
4. **パフォーマンス監視** - 技術的問題の早期発見

## ログシステム実装

### 基本ログ管理クラス
```javascript
class GameLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.logBuffer = [];
    this.isEnabled = true;
  }
  
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // 基本ログメソッド
  log(level, category, event, data = {}) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      level: level,
      category: category,
      event: event,
      data: data,
      gameTime: Date.now() - this.startTime
    };
    
    console.log(`[${level}] [${category}] ${event}:`, JSON.stringify(logEntry, null, 2));
    this.logBuffer.push(logEntry);
    
    // バッファサイズ制限
    if (this.logBuffer.length > 1000) {
      this.logBuffer.shift();
    }
  }
  
  // レベル別ログメソッド
  info(category, event, data) { this.log('INFO', category, event, data); }
  warn(category, event, data) { this.log('WARN', category, event, data); }
  error(category, event, data) { this.log('ERROR', category, event, data); }
  debug(category, event, data) { this.log('DEBUG', category, event, data); }
  
  // セッション終了時のサマリー
  generateSessionSummary() {
    const summary = {
      sessionId: this.sessionId,
      totalDuration: Date.now() - this.startTime,
      totalLogs: this.logBuffer.length,
      categories: {},
      events: {}
    };
    
    this.logBuffer.forEach(log => {
      summary.categories[log.category] = (summary.categories[log.category] || 0) + 1;
      summary.events[log.event] = (summary.events[log.event] || 0) + 1;
    });
    
    console.log('[SESSION_SUMMARY]', JSON.stringify(summary, null, 2));
    return summary;
  }
}
```

## カテゴリ別ログ設計

### 1. 戦闘ログ（COMBAT）
```javascript
class CombatLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
  }
  
  // 戦闘開始
  logCombatStart(player, enemy) {
    this.logger.info('COMBAT', 'combat_start', {
      player: {
        level: player.level,
        hp: player.hp,
        maxHp: player.maxHp,
        attack: player.attack,
        defense: player.defense,
        shields: player.shields,
        oxygen: player.oxygen
      },
      enemy: {
        type: enemy.type,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        attack: enemy.attack,
        defense: enemy.defense
      },
      floor: player.gameInstance?.floor || 0,
      position: { x: player.x, y: player.y }
    });
  }
  
  // 攻撃ログ
  logAttack(attacker, target, damage, isCritical, dodged) {
    this.logger.info('COMBAT', 'attack', {
      attacker: attacker.type || 'player',
      target: target.type || 'player',
      damage: damage,
      isCritical: isCritical,
      dodged: dodged,
      targetHpAfter: target.hp,
      targetHpBefore: target.hp + damage
    });
  }
  
  // 特殊効果ログ
  logSpecialEffect(effectType, source, target, data) {
    this.logger.info('COMBAT', 'special_effect', {
      effectType: effectType, // 'chain_strike', 'counter_attack', 'shield_repair'
      source: source.type || 'player',
      target: target.type || 'player',
      additionalData: data
    });
  }
  
  // 戦闘終了
  logCombatEnd(player, enemy, result, turnsElapsed) {
    this.logger.info('COMBAT', 'combat_end', {
      result: result, // 'victory', 'defeat', 'flee'
      turnsElapsed: turnsElapsed,
      player: {
        hpRemaining: player.hp,
        oxygenRemaining: player.oxygen,
        shieldsRemaining: player.shields
      },
      enemy: {
        type: enemy.type,
        hpRemaining: enemy.hp
      },
      damageDealt: enemy.maxHp - enemy.hp,
      damageTaken: player.maxHp - player.hp
    });
  }
}
```

### 2. 進行ログ（PROGRESSION）
```javascript
class ProgressionLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
  }
  
  // フロア進行
  logFloorProgress(floor, player, timeSpent) {
    this.logger.info('PROGRESSION', 'floor_complete', {
      floor: floor,
      timeSpent: timeSpent,
      player: {
        level: player.level,
        hp: player.hp,
        oxygen: player.oxygen,
        gold: player.gold
      },
      enemiesDefeated: player.enemiesDefeatedThisFloor || 0,
      itemsCollected: player.itemsCollectedThisFloor || 0
    });
  }
  
  // レベルアップ
  logLevelUp(player, oldLevel, newLevel) {
    this.logger.info('PROGRESSION', 'level_up', {
      oldLevel: oldLevel,
      newLevel: newLevel,
      floor: player.gameInstance?.floor || 0,
      experience: player.experience || 0,
      statsIncrease: {
        hp: player.maxHp - (player.maxHp - 10), // 前回との差分
        attack: player.attack - (player.attack - 2),
        defense: player.defense - (player.defense - 1)
      }
    });
  }
  
  // ゲームオーバー
  logGameOver(player, cause, floor, totalTime) {
    this.logger.info('PROGRESSION', 'game_over', {
      cause: cause, // 'hp_depleted', 'oxygen_depleted', 'quit'
      floor: floor,
      totalTime: totalTime,
      finalStats: {
        level: player.level,
        gold: player.gold,
        enemiesDefeated: player.totalEnemiesDefeated || 0,
        itemsCollected: player.totalItemsCollected || 0
      },
      survivalMetrics: {
        averageHpPerFloor: player.averageHpPerFloor || 0,
        oxygenEfficiency: player.oxygenEfficiency || 0
      }
    });
  }
}
```

### 3. 経済ログ（ECONOMY）
```javascript
class EconomyLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
  }
  
  // アップグレード購入
  logUpgradePurchase(upgradeId, level, cost, player) {
    this.logger.info('ECONOMY', 'upgrade_purchase', {
      upgradeId: upgradeId,
      level: level,
      cost: cost,
      goldBefore: player.gold + cost,
      goldAfter: player.gold,
      floor: player.gameInstance?.floor || 0,
      playerLevel: player.level
    });
  }
  
  // アイテム取得
  logItemCollection(itemType, value, player) {
    this.logger.info('ECONOMY', 'item_collected', {
      itemType: itemType, // 'gold', 'health', 'oxygen', 'weapon'
      value: value,
      floor: player.gameInstance?.floor || 0,
      playerState: {
        hp: player.hp,
        oxygen: player.oxygen,
        gold: player.gold
      }
    });
  }
  
  // 金銭収支分析
  logGoldAnalysis(player, source, amount) {
    this.logger.info('ECONOMY', 'gold_change', {
      source: source, // 'enemy_defeat', 'container', 'upgrade_purchase'
      amount: amount,
      goldBefore: player.gold - amount,
      goldAfter: player.gold,
      floor: player.gameInstance?.floor || 0
    });
  }
}
```

### 4. パフォーマンスログ（PERFORMANCE）
```javascript
class PerformanceLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
    this.frameTime = 0;
    this.frameCount = 0;
    this.lastFpsCheck = Date.now();
  }
  
  // フレームレート監視
  logFrameRate() {
    this.frameCount++;
    const now = Date.now();
    
    if (now - this.lastFpsCheck >= 5000) { // 5秒ごと
      const fps = this.frameCount / ((now - this.lastFpsCheck) / 1000);
      
      this.logger.info('PERFORMANCE', 'fps_check', {
        fps: Math.round(fps),
        frameCount: this.frameCount,
        duration: now - this.lastFpsCheck
      });
      
      if (fps < 30) {
        this.logger.warn('PERFORMANCE', 'low_fps', {
          fps: Math.round(fps),
          possibleCause: 'heavy_processing_or_memory_leak'
        });
      }
      
      this.frameCount = 0;
      this.lastFpsCheck = now;
    }
  }
  
  // メモリ使用量監視
  logMemoryUsage() {
    if (performance.memory) {
      const memInfo = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
      
      this.logger.info('PERFORMANCE', 'memory_usage', memInfo);
      
      if (memInfo.used > memInfo.limit * 0.8) {
        this.logger.warn('PERFORMANCE', 'high_memory_usage', memInfo);
      }
    }
  }
  
  // 描画時間測定
  logRenderTime(renderTime) {
    this.logger.debug('PERFORMANCE', 'render_time', {
      renderTime: renderTime,
      isSlowRender: renderTime > 16.67 // 60fps基準
    });
  }
}
```

### 5. バランス分析ログ（BALANCE）
```javascript
class BalanceLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
  }
  
  // 敵の強さ分析
  logEnemyBalance(enemyType, floor, avgTurnsToDefeat, avgDamageDealt) {
    this.logger.info('BALANCE', 'enemy_balance', {
      enemyType: enemyType,
      floor: floor,
      avgTurnsToDefeat: avgTurnsToDefeat,
      avgDamageDealt: avgDamageDealt,
      balanceFlag: this.evaluateEnemyBalance(avgTurnsToDefeat, avgDamageDealt)
    });
  }
  
  evaluateEnemyBalance(turns, damage) {
    if (turns > 5) return 'TOO_STRONG';
    if (turns < 2) return 'TOO_WEAK';
    if (damage > 50) return 'TOO_DAMAGING';
    return 'BALANCED';
  }
  
  // アップグレード使用率
  logUpgradeUsage(upgradeStats) {
    this.logger.info('BALANCE', 'upgrade_usage', {
      upgradeStats: upgradeStats,
      recommendations: this.generateUpgradeRecommendations(upgradeStats)
    });
  }
  
  generateUpgradeRecommendations(stats) {
    const recommendations = [];
    
    Object.entries(stats).forEach(([upgradeId, usage]) => {
      if (usage.purchaseRate < 0.2) {
        recommendations.push({
          upgrade: upgradeId,
          issue: 'LOW_USAGE',
          suggestion: 'Consider reducing cost or increasing effectiveness'
        });
      }
      if (usage.purchaseRate > 0.8) {
        recommendations.push({
          upgrade: upgradeId,
          issue: 'TOO_POPULAR',
          suggestion: 'May be overpowered, consider balancing'
        });
      }
    });
    
    return recommendations;
  }
}
```

## 統合ログシステム

### メインログマネージャー
```javascript
class GameLogManager {
  constructor() {
    this.gameLogger = new GameLogger();
    this.combatLogger = new CombatLogger(this.gameLogger);
    this.progressionLogger = new ProgressionLogger(this.gameLogger);
    this.economyLogger = new EconomyLogger(this.gameLogger);
    this.performanceLogger = new PerformanceLogger(this.gameLogger);
    this.balanceLogger = new BalanceLogger(this.gameLogger);
    
    // 定期的な監視開始
    this.startPeriodicLogging();
  }
  
  startPeriodicLogging() {
    // 5秒ごとのパフォーマンス監視
    setInterval(() => {
      this.performanceLogger.logFrameRate();
      this.performanceLogger.logMemoryUsage();
    }, 5000);
    
    // 1分ごとのバランス分析
    setInterval(() => {
      this.analyzeGameBalance();
    }, 60000);
  }
  
  analyzeGameBalance() {
    // 敵の倒し方の統計
    const enemyStats = this.calculateEnemyStats();
    Object.entries(enemyStats).forEach(([type, stats]) => {
      this.balanceLogger.logEnemyBalance(
        type, 
        stats.avgFloor, 
        stats.avgTurnsToDefeat, 
        stats.avgDamageDealt
      );
    });
    
    // アップグレード使用率の分析
    const upgradeStats = this.calculateUpgradeStats();
    this.balanceLogger.logUpgradeUsage(upgradeStats);
  }
  
  // Claude Code用の分析レポート生成
  generateAnalysisReport() {
    const report = {
      sessionSummary: this.gameLogger.generateSessionSummary(),
      balanceIssues: this.identifyBalanceIssues(),
      performanceIssues: this.identifyPerformanceIssues(),
      recommendations: this.generateRecommendations()
    };
    
    console.log('[ANALYSIS_REPORT]', JSON.stringify(report, null, 2));
    return report;
  }
  
  identifyBalanceIssues() {
    const issues = [];
    
    // 酸素切れ死亡率が高い場合
    const oxygenDeaths = this.getLogsByEvent('game_over')
      .filter(log => log.data.cause === 'oxygen_depleted');
    
    if (oxygenDeaths.length > 0.6) {
      issues.push({
        type: 'OXYGEN_BALANCE',
        severity: 'HIGH',
        description: 'Too many players dying from oxygen depletion',
        recommendation: 'Reduce oxygen consumption or increase oxygen sources'
      });
    }
    
    return issues;
  }
  
  getLogsByEvent(eventType) {
    return this.gameLogger.logBuffer.filter(log => log.event === eventType);
  }
}
```

## ゲームコードへの統合

### GameCore.js への統合
```javascript
class RoguelikeGame {
  constructor() {
    // 既存の初期化...
    this.logManager = new GameLogManager();
    
    // ゲーム開始ログ
    this.logManager.gameLogger.info('GAME', 'game_start', {
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
  
  // 既存メソッドにログ追加
  processPlayerAttack(enemy) {
    this.logManager.combatLogger.logCombatStart(this.playerManager, enemy);
    
    // 既存の攻撃処理...
    const result = this.playerManager.attackEnemy(enemy, this);
    
    this.logManager.combatLogger.logAttack(
      this.playerManager, 
      enemy, 
      result.damage, 
      result.critical, 
      result.dodged
    );
    
    if (enemy.hp <= 0) {
      this.logManager.combatLogger.logCombatEnd(
        this.playerManager, 
        enemy, 
        'victory', 
        this.combatTurns
      );
    }
  }
  
  moveToNextFloor() {
    const floorStartTime = this.floorStartTime;
    const timeSpent = Date.now() - floorStartTime;
    
    this.logManager.progressionLogger.logFloorProgress(
      this.floor, 
      this.playerManager, 
      timeSpent
    );
    
    // 既存のフロア移動処理...
  }
}
```

## Claude Code向けの分析例

### 例1: バランス問題の特定
```javascript
// ログ出力例
[INFO] [BALANCE] enemy_balance: {
  "enemyType": "HUNTER",
  "floor": 8,
  "avgTurnsToDefeat": 6.2,
  "avgDamageDealt": 45,
  "balanceFlag": "TOO_STRONG"
}

// Claude Codeの分析結果
// "HUNTER敵が8階で平均6.2ターンかかっている。HPを20%減らすか、
//  プレイヤーの攻撃力を8階以降で強化することを推奨します。"
```

### 例2: 酸素システムの問題
```javascript
// ログ出力例
[INFO] [PROGRESSION] game_over: {
  "cause": "oxygen_depleted",
  "floor": 6,
  "oxygenEfficiency": 0.3
}

// Claude Codeの分析結果
// "6階での酸素切れ死亡が頻発。酸素効率0.3は低すぎます。
//  戦闘時の酸素消費を50%削減することを推奨します。"
```

## 実装フェーズ

### Phase 1: 基本ログシステム
- [ ] GameLoggerクラスの実装
- [ ] 基本的なログ出力機能
- [ ] 戦闘ログの統合

### Phase 2: カテゴリ別ログ
- [ ] 進行ログの実装
- [ ] 経済ログの実装
- [ ] パフォーマンスログの実装

### Phase 3: 分析システム
- [ ] バランス分析ログの実装
- [ ] 自動分析レポート生成
- [ ] 問題特定アルゴリズム

### Phase 4: 最適化
- [ ] ログ出力の最適化
- [ ] Claude Code向けフォーマット調整
- [ ] 継続的な改善システム

## 期待される効果
1. **データドリブンな調整** - 感覚でなく数値に基づく改善
2. **問題の早期発見** - プレイヤーが困る前に課題を特定
3. **効率的な開発** - Claude Codeによる自動分析と提案
4. **継続的な改善** - 長期的なバランス調整の指針
5. **パフォーマンス最適化** - 技術的問題の迅速な解決