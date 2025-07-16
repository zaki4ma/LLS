class GameLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.logBuffer = [];
    this.isEnabled = true;
    this.autoSaveEnabled = true;
    this.maxLocalStorageSize = 5 * 1024 * 1024; // 5MB制限
    this.autoSaveInterval = 30000; // 30秒間隔
    
    // 既存のログを読み込み
    this.loadFromLocalStorage();
    
    // 自動保存タイマーを開始
    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }
  }
  
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
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
    
    // 重要なログは即座に保存
    if (level === 'ERROR' || category === 'COMBAT' || event === 'game_over') {
      this.saveToLocalStorage();
    }
  }
  
  // LocalStorageへの保存
  saveToLocalStorage() {
    try {
      const logData = {
        sessionId: this.sessionId,
        startTime: this.startTime,
        logs: this.logBuffer,
        lastSaved: Date.now()
      };
      
      const dataString = JSON.stringify(logData);
      
      // サイズチェック
      if (dataString.length > this.maxLocalStorageSize) {
        console.warn('ログデータが大きすぎます。古いログを削除します。');
        this.cleanupOldLogs();
        return;
      }
      
      localStorage.setItem(`gameLog_${this.sessionId}`, dataString);
      
      // 全セッションのリストを更新
      this.updateSessionList();
      
    } catch (error) {
      console.error('ログ保存エラー:', error);
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldLogs();
      }
    }
  }
  
  // LocalStorageからの読み込み
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(`gameLog_${this.sessionId}`);
      if (savedData) {
        const logData = JSON.parse(savedData);
        this.logBuffer = logData.logs || [];
        console.log(`過去のログを読み込みました: ${this.logBuffer.length}件`);
      }
    } catch (error) {
      console.error('ログ読み込みエラー:', error);
    }
  }
  
  // セッションリストの更新
  updateSessionList() {
    try {
      const sessions = JSON.parse(localStorage.getItem('gameLogSessions') || '[]');
      const sessionInfo = {
        sessionId: this.sessionId,
        startTime: this.startTime,
        lastSaved: Date.now(),
        logCount: this.logBuffer.length
      };
      
      // 既存のセッション情報を更新または新規追加
      const existingIndex = sessions.findIndex(s => s.sessionId === this.sessionId);
      if (existingIndex >= 0) {
        sessions[existingIndex] = sessionInfo;
      } else {
        sessions.push(sessionInfo);
      }
      
      localStorage.setItem('gameLogSessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('セッションリスト更新エラー:', error);
    }
  }
  
  // 古いログの削除
  cleanupOldLogs() {
    try {
      const sessions = JSON.parse(localStorage.getItem('gameLogSessions') || '[]');
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000); // 1週間前
      
      // 古いセッションを削除
      const validSessions = sessions.filter(session => {
        if (session.lastSaved < oneWeekAgo) {
          localStorage.removeItem(`gameLog_${session.sessionId}`);
          console.log(`古いログセッションを削除: ${session.sessionId}`);
          return false;
        }
        return true;
      });
      
      localStorage.setItem('gameLogSessions', JSON.stringify(validSessions));
      
      // 現在のバッファも半分に削減
      const halfSize = Math.floor(this.logBuffer.length / 2);
      this.logBuffer = this.logBuffer.slice(-halfSize);
      
    } catch (error) {
      console.error('ログクリーンアップエラー:', error);
    }
  }
  
  // 自動保存の開始
  startAutoSave() {
    setInterval(() => {
      this.saveToLocalStorage();
    }, this.autoSaveInterval);
  }
  
  info(category, event, data) { this.log('INFO', category, event, data); }
  warn(category, event, data) { this.log('WARN', category, event, data); }
  error(category, event, data) { this.log('ERROR', category, event, data); }
  debug(category, event, data) { this.log('DEBUG', category, event, data); }
  
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
  
  // ログをJSONファイルとしてダウンロード
  exportLogsAsJSON() {
    try {
      const exportData = {
        sessionId: this.sessionId,
        startTime: this.startTime,
        endTime: Date.now(),
        summary: this.generateSessionSummary(),
        logs: this.logBuffer
      };
      
      const dataString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `game_logs_${this.sessionId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('ログをJSONファイルでエクスポートしました');
      return true;
    } catch (error) {
      console.error('JSONエクスポートエラー:', error);
      return false;
    }
  }
  
  // ログをCSVファイルとしてダウンロード
  exportLogsAsCSV() {
    try {
      const headers = ['timestamp', 'sessionId', 'level', 'category', 'event', 'gameTime', 'data'];
      const csvContent = [
        headers.join(','),
        ...this.logBuffer.map(log => [
          log.timestamp,
          log.sessionId,
          log.level,
          log.category,
          log.event,
          log.gameTime,
          '"' + JSON.stringify(log.data).replace(/"/g, '""') + '"'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `game_logs_${this.sessionId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('ログをCSVファイルでエクスポートしました');
      return true;
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      return false;
    }
  }
  
  // 全セッションのログを取得
  getAllStoredLogs() {
    try {
      const sessions = JSON.parse(localStorage.getItem('gameLogSessions') || '[]');
      const allLogs = [];
      
      sessions.forEach(session => {
        const logData = localStorage.getItem(`gameLog_${session.sessionId}`);
        if (logData) {
          const parsed = JSON.parse(logData);
          allLogs.push({
            sessionInfo: session,
            logs: parsed.logs || []
          });
        }
      });
      
      return allLogs;
    } catch (error) {
      console.error('全ログ取得エラー:', error);
      return [];
    }
  }
  
  // 全セッションのログをエクスポート
  exportAllLogsAsJSON() {
    try {
      const allLogs = this.getAllStoredLogs();
      const exportData = {
        exportDate: new Date().toISOString(),
        totalSessions: allLogs.length,
        sessions: allLogs
      };
      
      const dataString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_game_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('全セッションのログをエクスポートしました');
      return true;
    } catch (error) {
      console.error('全ログエクスポートエラー:', error);
      return false;
    }
  }
  
  getLogsByEvent(eventType) {
    return this.logBuffer.filter(log => log.event === eventType);
  }
}

class CombatLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
  }
  
  logCombatStart(player, enemy) {
    this.logger.info('COMBAT', 'combat_start', {
      player: {
        level: player.level,
        hp: player.hp,
        maxHp: player.maxHp,
        attack: player.attack,
        defense: player.defense,
        shields: player.shields || 0,
        oxygen: player.oxygen
      },
      enemy: {
        type: enemy.type,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        attack: enemy.attack,
        defense: enemy.defense || 0
      },
      floor: player.gameInstance?.floor || 0,
      position: { x: player.x, y: player.y }
    });
  }
  
  logAttack(attacker, target, damage, isCritical, dodged) {
    this.logger.info('COMBAT', 'attack', {
      attacker: attacker.type || 'player',
      target: target.type || 'player',
      damage: damage,
      isCritical: isCritical,
      dodged: dodged,
      targetHpAfter: target.hp,
      targetHpBefore: target.hp + (dodged ? 0 : damage)
    });
  }
  
  logSpecialEffect(effectType, source, target, data) {
    this.logger.info('COMBAT', 'special_effect', {
      effectType: effectType,
      source: source.type || 'player',
      target: target.type || 'player',
      additionalData: data
    });
  }
  
  logCombatEnd(player, enemy, result, turnsElapsed) {
    this.logger.info('COMBAT', 'combat_end', {
      result: result,
      turnsElapsed: turnsElapsed,
      player: {
        hpRemaining: player.hp,
        oxygenRemaining: player.oxygen,
        shieldsRemaining: player.shields || 0
      },
      enemy: {
        type: enemy.type,
        hpRemaining: enemy.hp
      },
      damageDealt: enemy.maxHp - enemy.hp,
      damageTaken: (player.maxHp - player.hp) - (player.hpAtCombatStart || 0)
    });
  }
}

class ProgressionLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
  }
  
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
  
  logLevelUp(player, oldLevel, newLevel) {
    this.logger.info('PROGRESSION', 'level_up', {
      oldLevel: oldLevel,
      newLevel: newLevel,
      floor: player.gameInstance?.floor || 0,
      experience: player.experience || 0,
      statsIncrease: {
        hp: 10,
        attack: 2,
        defense: 1
      }
    });
  }
  
  logGameOver(player, cause, floor, totalTime) {
    this.logger.info('PROGRESSION', 'game_over', {
      cause: cause,
      floor: floor,
      totalTime: totalTime,
      finalStats: {
        level: player.level,
        gold: player.gold,
        enemiesDefeated: player.totalEnemiesDefeated || 0,
        itemsCollected: player.totalItemsCollected || 0
      },
      survivalMetrics: {
        averageHpPerFloor: player.hp / floor,
        oxygenEfficiency: player.oxygen / 100
      }
    });
  }
}

class EconomyLogger {
  constructor(gameLogger) {
    this.logger = gameLogger;
  }
  
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
  
  logItemCollection(itemType, value, player) {
    this.logger.info('ECONOMY', 'item_collected', {
      itemType: itemType,
      value: value,
      floor: player.gameInstance?.floor || 0,
      playerState: {
        hp: player.hp,
        oxygen: player.oxygen,
        gold: player.gold
      }
    });
  }
  
  logGoldChange(player, source, amount) {
    this.logger.info('ECONOMY', 'gold_change', {
      source: source,
      amount: amount,
      goldBefore: player.gold - amount,
      goldAfter: player.gold,
      floor: player.gameInstance?.floor || 0
    });
  }
}

class GameLogManager {
  constructor() {
    this.gameLogger = new GameLogger();
    this.combatLogger = new CombatLogger(this.gameLogger);
    this.progressionLogger = new ProgressionLogger(this.gameLogger);
    this.economyLogger = new EconomyLogger(this.gameLogger);
    
    this.gameLogger.info('SYSTEM', 'log_system_initialized', {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    
    // ゲーム終了時の自動エクスポート設定
    this.setupAutoExport();
  }
  
  // 自動エクスポートの設定
  setupAutoExport() {
    // ページ離脱時に自動保存
    window.addEventListener('beforeunload', () => {
      this.gameLogger.saveToLocalStorage();
    });
    
    // ゲームオーバー時に自動エクスポート
    const originalGameOver = window.gameOver;
    window.gameOver = () => {
      this.gameLogger.saveToLocalStorage();
      // 長時間プレイの場合は自動でJSONエクスポート
      if (this.gameLogger.logBuffer.length > 100) {
        setTimeout(() => {
          this.gameLogger.exportLogsAsJSON();
        }, 1000);
      }
      if (typeof originalGameOver === 'function') {
        originalGameOver();
      }
    };
  }
  
  generateAnalysisReport() {
    const report = {
      sessionSummary: this.gameLogger.generateSessionSummary(),
      balanceIssues: this.identifyBalanceIssues(),
      recommendations: this.generateRecommendations()
    };
    
    console.log('[ANALYSIS_REPORT]', JSON.stringify(report, null, 2));
    return report;
  }
  
  identifyBalanceIssues() {
    const issues = [];
    
    const oxygenDeaths = this.gameLogger.getLogsByEvent('game_over')
      .filter(log => log.data.cause === 'oxygen_depleted');
    
    const totalDeaths = this.gameLogger.getLogsByEvent('game_over').length;
    
    if (totalDeaths > 0 && oxygenDeaths.length / totalDeaths > 0.6) {
      issues.push({
        type: 'OXYGEN_BALANCE',
        severity: 'HIGH',
        description: 'Too many players dying from oxygen depletion',
        recommendation: 'Reduce oxygen consumption or increase oxygen sources'
      });
    }
    
    return issues;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    const combatLogs = this.gameLogger.getLogsByEvent('combat_end');
    const victories = combatLogs.filter(log => log.data.result === 'victory');
    
    if (victories.length > 0) {
      const avgTurns = victories.reduce((sum, log) => sum + log.data.turnsElapsed, 0) / victories.length;
      
      if (avgTurns > 5) {
        recommendations.push({
          type: 'COMBAT_BALANCE',
          suggestion: 'Combat is taking too long on average. Consider increasing player attack power or reducing enemy HP.'
        });
      }
    }
    
    return recommendations;
  }
}