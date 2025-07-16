# ゲームログシステム使用ガイド

## 概要

ルミナス・ロスト・シグナルには、ゲームプレイデータを自動的に収集・保存・分析するログシステムが実装されています。このシステムにより、ゲームバランスの調整やプレイヤー体験の改善に必要なデータを効率的に収集できます。

## 自動ログ保存機能

### LocalStorage自動保存
- **保存間隔**: 30秒ごとに自動保存
- **即座保存**: 戦闘、エラー、ゲームオーバー時に即座に保存
- **容量制限**: 5MB上限、超過時は古いログを自動削除
- **保存期間**: 1週間（古いログは自動削除）

### 保存されるデータ
- セッション情報（開始時間、セッションID）
- 戦闘ログ（攻撃、ダメージ、回避、クリティカル）
- 進行ログ（フロア移動、レベルアップ、アイテム取得）
- 経済ログ（ゴールド取得、アップグレード購入）
- システムログ（エラー、パフォーマンス情報）

## 使用方法

### 基本的なログアクセス
```javascript
// 現在のセッションのログを表示
console.log(gameInstance.logManager.gameLogger.logBuffer);

// 特定イベントのログを取得
gameInstance.logManager.gameLogger.getLogsByEvent('combat_start');

// セッションサマリーを表示
gameInstance.logManager.gameLogger.generateSessionSummary();
```

### ログのエクスポート

#### 現在のセッションをJSONで保存
```javascript
gameInstance.logManager.gameLogger.exportLogsAsJSON();
```

#### 現在のセッションをCSVで保存
```javascript
gameInstance.logManager.gameLogger.exportLogsAsCSV();
```

#### 全セッションのログを一括エクスポート
```javascript
gameInstance.logManager.gameLogger.exportAllLogsAsJSON();
```

### 保存されたログの確認
```javascript
// 保存されている全セッションの情報を表示
const sessions = JSON.parse(localStorage.getItem('gameLogSessions') || '[]');
console.log('保存されているセッション:', sessions);

// 全セッションのログを取得
const allLogs = gameInstance.logManager.gameLogger.getAllStoredLogs();
console.log('全ログデータ:', allLogs);
```

## 自動エクスポート機能

### ゲームオーバー時の自動エクスポート
- 100件以上のログがある場合、ゲームオーバー時に自動的にJSONファイルがダウンロード
- LocalStorageにも自動保存

### ページ離脱時の自動保存
- ブラウザを閉じる際やページを離れる際に自動保存
- データの消失を防止

## ログ分析機能

### 分析レポート生成
```javascript
// 包括的な分析レポートを生成
const report = gameInstance.logManager.generateAnalysisReport();
console.log('分析レポート:', report);
```

### バランス問題の特定
```javascript
// 酸素切れ死亡率をチェック
const oxygenDeaths = gameInstance.logManager.gameLogger.getLogsByEvent('game_over')
  .filter(log => log.data.cause === 'oxygen_depleted');
console.log('酸素切れ死亡:', oxygenDeaths.length);
```

## ログ管理機能

### 手動でのログ保存
```javascript
// 手動でLocalStorageに保存
gameInstance.logManager.gameLogger.saveToLocalStorage();
```

### 古いログの削除
```javascript
// 古いログを手動で削除
gameInstance.logManager.gameLogger.cleanupOldLogs();
```

### ログ設定の変更
```javascript
// 自動保存を無効化
gameInstance.logManager.gameLogger.autoSaveEnabled = false;

// 保存間隔を変更（ミリ秒）
gameInstance.logManager.gameLogger.autoSaveInterval = 60000; // 1分間隔
```

## ログの構造

### 基本ログエントリ
```javascript
{
  "timestamp": "2025-07-16T10:56:06.023Z",
  "sessionId": "session_1752663366023_fu2bn0c3r",
  "level": "INFO",
  "category": "COMBAT",
  "event": "combat_start",
  "data": {
    "player": { /* プレイヤー情報 */ },
    "enemy": { /* 敵情報 */ },
    "floor": 1
  },
  "gameTime": 1234567
}
```

### 戦闘ログの例
```javascript
{
  "category": "COMBAT",
  "event": "attack",
  "data": {
    "attacker": "player",
    "target": "BASIC",
    "damage": 25,
    "isCritical": false,
    "dodged": false,
    "targetHpAfter": 75
  }
}
```

## トラブルシューティング

### LocalStorageの容量不足
- 自動的に古いログが削除されます
- 手動で`cleanupOldLogs()`を実行可能

### エクスポートが失敗する場合
- ブラウザのポップアップブロッカーを無効化
- 十分なディスク容量があることを確認

### ログが保存されない場合
- ブラウザのLocalStorageが有効か確認
- プライベートモードでないことを確認

## 開発者向け情報

### 新しいログカテゴリの追加
```javascript
// 新しいカテゴリでログを記録
gameInstance.logManager.gameLogger.info('NEW_CATEGORY', 'custom_event', {
  customData: 'value'
});
```

### ログの監視
```javascript
// ログが追加されるたびに処理を実行
const originalLog = gameInstance.logManager.gameLogger.log;
gameInstance.logManager.gameLogger.log = function(...args) {
  originalLog.apply(this, args);
  // カスタム処理
  console.log('新しいログが追加されました:', args);
};
```

## データ活用例

### バランス調整の指標
1. **戦闘時間の分析**: 敵を倒すのに要するターン数
2. **死亡原因の分析**: HP不足 vs 酸素不足
3. **アイテム使用率**: どのアップグレードが人気か
4. **進行速度**: フロアあたりの所要時間

### プレイヤー体験の改善
1. **詰まりポイントの特定**: 特定のフロアでの死亡率
2. **UI改善**: よく使用される機能の分析
3. **チュートリアル改善**: 初心者の行動パターン分析

このログシステムにより、データドリブンなゲーム開発が可能になり、より良いプレイヤー体験を提供できます。