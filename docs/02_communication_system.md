通信システム実装設計書 - ルミナス・ロスト・シグナル
システム概要
船内の他の生存者がセキュリティカメラや各種センサーを通じてプレイヤーを監視し、適切なタイミングで通信を送信するシステム。
実装要件
基本データ構造
javascript// 通信メッセージデータベース
const communicationDatabase = {
  messages: [
    {
      id: "msg_001",
      category: "functional",
      sender: "監視室・ケビン",
      content: "カメラで確認した。5階東側にエレベーターがある。",
      trigger: "floor_3_reached",
      effect: null,
      priority: "high",
      oneTime: true,
      displayDuration: 5000
    },
    // ... 他のメッセージ
  ],
  triggers: new Set(), // 発動済みトリガーの記録
  messageLog: [] // 受信済みメッセージのログ
};
UI設計
html<!-- 通信パネル -->
<div id="communication-system">
  <!-- 新着通信表示エリア -->
  <div id="message-popup" class="hidden">
    <div class="message-header">
      <span class="signal-icon">📡</span>
      <span class="sender-name"></span>
      <span class="timestamp"></span>
    </div>
    <div class="message-content"></div>
    <div class="message-close">×</div>
  </div>
  
  <!-- 通信ログボタン -->
  <button id="comm-log-btn">通信ログ</button>
  
  <!-- 通信ログウィンドウ -->
  <div id="communication-log" class="modal hidden">
    <div class="modal-content">
      <div class="modal-header">
        <h3>受信済み通信</h3>
        <span class="modal-close">×</span>
      </div>
      <div id="message-list"></div>
    </div>
  </div>
</div>
CSS設計
css/* 通信システムスタイル */
#message-popup {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 300px;
  background: rgba(0, 20, 40, 0.95);
  border: 2px solid #00ff88;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
  z-index: 1000;
  animation: slideIn 0.5s ease-out;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #00ff88;
}

.message-content {
  color: #ffffff;
  line-height: 1.4;
  font-size: 14px;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
メッセージパターンとトリガー設計
1. 機能的通信（ゲームプレイ支援）
javascriptconst functionalMessages = [
  {
    id: "elevator_location",
    sender: "監視室・ケビン",
    content: "カメラで確認した。5階東側にエレベーターがある。",
    trigger: "floor_3_reached",
    effect: "hint_elevator_location",
    priority: "high"
  },
  {
    id: "danger_warning", 
    sender: "セキュリティ・アレックス",
    content: "警告！3階西翼にライトキラー型を3体確認。迂回ルートを推奨。",
    trigger: "floor_2_reached",
    effect: "warn_danger_area",
    priority: "high"
  },
  {
    id: "item_location",
    sender: "医療班・サラ",
    content: "医務室のブルーロッカーに酸素ボンベを確保している。",
    trigger: "medbay_discovered",
    effect: "hint_oxygen_supply",
    priority: "medium"
  },
  {
    id: "system_assistance",
    sender: "エンジニア・トム",
    content: "照明システムを一時復旧する。3分間だけ全フロア照明が点灯する。",
    trigger: "power_system_accessed",
    effect: "temporary_full_lighting",
    priority: "high"
  }
];
2. 世界観通信（ストーリー構築）
javascriptconst storyMessages = [
  {
    id: "incident_revelation",
    sender: "研究主任・ドクター",
    content: "実験体X-47が収容違反を起こした。これは我々の責任だ...",
    trigger: "floor_4_reached",
    effect: "reveal_story_fragment",
    priority: "medium"
  },
  {
    id: "earth_contact_lost",
    sender: "通信士・リナ",
    content: "地球本部への通信が72時間途絶。救助は期待できない。",
    trigger: "communication_room_found",
    effect: "reveal_isolation",
    priority: "medium"
  },
  {
    id: "command_structure_collapse",
    sender: "副船長・マーカス",
    content: "船長は最初の犠牲者だった。指揮系統は既に崩壊している。",
    trigger: "bridge_accessed",
    effect: "reveal_command_loss",
    priority: "medium"
  },
  {
    id: "survivor_count",
    sender: "医療班・サラ",
    content: "生存者確認：現在7名。うち3名が重傷、2名が行方不明。",
    trigger: "halfway_point",
    effect: "reveal_survivor_status",
    priority: "low"
  }
];
3. 感情的通信（人間ドラマ）
javascriptconst emotionalMessages = [
  {
    id: "rescue_plea",
    sender: "クルー・ジェン",
    content: "7階で負傷...動けない。誰か...助けて...",
    trigger: "floor_6_reached",
    effect: "create_rescue_mission",
    priority: "medium"
  },
  {
    id: "family_message",
    sender: "パイロット・デイブ",
    content: "もし君が脱出できたら...妻のエミリーに愛していると伝えてくれ。",
    trigger: "near_ending",
    effect: "emotional_weight",
    priority: "low"
  },
  {
    id: "hope_message",
    sender: "エンジニア・トム",
    content: "君がいれば必ず脱出できる。一緒に生き延びよう！",
    trigger: "mid_game_achievement",
    effect: "morale_boost",
    priority: "low"
  },
  {
    id: "desperation",
    sender: "不明",
    content: "もう限界だ...誰かいるなら...応答して...",
    trigger: "terminal_activated",
    effect: "create_tension",
    priority: "low"
  }
];
4. 技術通信（アップグレード・システム）
javascriptconst technicalMessages = [
  {
    id: "upgrade_schematic",
    sender: "技術者・マイク",
    content: "酸素効率化の回路図を送信する。技術部品があれば実装可能だ。",
    trigger: "tech_parts_found",
    effect: "unlock_oxygen_upgrade",
    priority: "high"
  },
  {
    id: "weapon_access",
    sender: "保安責任者・ジャック",
    content: "工作室のプラズマカッター、認証コード：Alpha-2847",
    trigger: "workshop_discovered",
    effect: "unlock_plasma_cutter",
    priority: "medium"
  },
  {
    id: "system_override",
    sender: "主任エンジニア・チーフ",
    content: "緊急時：エンジンルームの赤いレバーで自爆システム起動可能。",
    trigger: "engine_room_discovered",
    effect: "unlock_self_destruct",
    priority: "high"
  }
];
5. ミスリード通信（疑心暗鬼）
javascriptconst misleadMessages = [
  {
    id: "suspicious_captain",
    sender: "船長？",
    content: "こちら船長...状況は...制御下にある...心配...ない...",
    trigger: "captain_quarters_found",
    effect: "create_suspicion",
    priority: "medium",
    suspicious: true
  },
  {
    id: "fragmented_help",
    sender: "不明",
    content: "た...すけ...て...7か...い...zzz...ノイズ...",
    trigger: "random_late_game",
    effect: "create_uncertainty",
    priority: "low",
    suspicious: true
  },
  {
    id: "false_all_clear",
    sender: "掃討班",
    content: "全エイリアン掃討完了。船内は安全だ。通常業務に戻れ。",
    trigger: "floor_10_reached",
    effect: "false_security",
    priority: "medium",
    suspicious: true
  }
];
効果システム設計
実装する効果タイプ
javascriptconst messageEffects = {
  // 機能的効果
  hint_elevator_location: () => {
    // フロアマップにエレベーター位置をハイライト
    highlightElevatorLocation(5, 'east');
  },
  
  temporary_full_lighting: () => {
    // 20ターン全フロア照明
  },
  
  unlock_plasma_cutter: () => {
    // プラズマカッター使用可能
    player.unlockedWeapons.plasmaCutter = true;
  },
  
  // ストーリー効果
  reveal_story_fragment: () => {
    // ストーリー進行フラグ
    gameState.story.experimentRevealed = true;
  },
  
  // 感情的効果
  morale_boost: () => {
    // 一時的なボーナス効果
    player.moraleBonus = true;
    setTimeout(() => player.moraleBonus = false, 300000); // 5分
  }
};
システム実装コード
通信システムクラス
javascriptclass CommunicationSystem {
  constructor() {
    this.messageDatabase = communicationDatabase;
    this.triggeredEvents = new Set();
    this.messageQueue = [];
    this.isDisplaying = false;
  }
  
  // トリガー条件チェック
  checkTriggers(gameState) {
    const allMessages = [
      ...functionalMessages,
      ...storyMessages, 
      ...emotionalMessages,
      ...technicalMessages,
      ...misleadMessages
    ];
    
    allMessages.forEach(message => {
      if (this.shouldTrigger(message, gameState)) {
        this.queueMessage(message);
      }
    });
    
    this.processMessageQueue();
  }
  
  shouldTrigger(message, gameState) {
    // 既に発動済みかチェック
    if (message.oneTime && this.triggeredEvents.has(message.id)) {
      return false;
    }
    
    // トリガー条件を評価
    return this.evaluateTrigger(message.trigger, gameState);
  }
  
  evaluateTrigger(trigger, gameState) {
    switch(trigger) {
      case 'floor_3_reached':
        return gameState.currentFloor === 3;
      case 'medbay_discovered':
        return gameState.currentRoom === 'medical_bay';
      case 'power_system_accessed':
        return gameState.powerSystemAccessed;
      // 他のトリガー条件...
      default:
        return false;
    }
  }
  
  queueMessage(message) {
    this.messageQueue.push(message);
    this.triggeredEvents.add(message.id);
  }
  
  processMessageQueue() {
    if (this.messageQueue.length > 0 && !this.isDisplaying) {
      const message = this.messageQueue.shift();
      this.displayMessage(message);
    }
  }
  
  displayMessage(message) {
    this.isDisplaying = true;
    
    // UI表示
    const popup = document.getElementById('message-popup');
    popup.querySelector('.sender-name').textContent = message.sender;
    popup.querySelector('.timestamp').textContent = this.getCurrentTime();
    popup.querySelector('.message-content').textContent = message.content;
    
    // 表示効果
    popup.classList.remove('hidden');
    this.playNotificationSound();
    
    // 効果実行
    if (message.effect && messageEffects[message.effect]) {
      messageEffects[message.effect]();
    }
    
    // ログに追加
    this.addToLog(message);
    
    // 自動非表示
    setTimeout(() => {
      popup.classList.add('hidden');
      this.isDisplaying = false;
      this.processMessageQueue(); // 次のメッセージ処理
    }, message.displayDuration || 5000);
  }
  
  addToLog(message) {
    this.messageDatabase.messageLog.push({
      ...message,
      receivedAt: Date.now()
    });
    this.updateLogDisplay();
  }
  
  updateLogDisplay() {
    const logList = document.getElementById('message-list');
    logList.innerHTML = '';
    
    this.messageDatabase.messageLog.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'log-message';
      messageElement.innerHTML = `
        <div class="log-header">
          <span class="log-sender">${message.sender}</span>
          <span class="log-time">${new Date(message.receivedAt).toLocaleTimeString()}</span>
        </div>
        <div class="log-content">${message.content}</div>
      `;
      logList.appendChild(messageElement);
    });
  }
  
  playNotificationSound() {
    // Tone.jsで通信音を再生
    if (window.Tone) {
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease('C5', '0.1');
      setTimeout(() => synth.triggerAttackRelease('E5', '0.1'), 100);
    }
  }
  
  getCurrentTime() {
    return new Date().toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
ゲームループ統合
javascript// メインゲームループに追加
function gameLoop() {
  // 既存のゲームロジック...
  
  // 通信システム更新
  communicationSystem.checkTriggers(gameState);
  
  // 他の更新処理...
}

// 初期化
const communicationSystem = new CommunicationSystem();

// イベントリスナー
document.getElementById('comm-log-btn').addEventListener('click', () => {
  document.getElementById('communication-log').classList.remove('hidden');
});
実装優先度

Phase 1: 基本システム（メッセージ表示、ログ機能）
Phase 2: トリガーシステム（条件判定、自動発生）
Phase 3: 効果システム（メッセージによるゲーム状態変化）
Phase 4: 演出強化（音響効果、アニメーション）

テスト項目

 メッセージが適切なタイミングで表示される
 同じメッセージが重複表示されない
 ログ機能が正常に動作する
 メッセージ効果が正しく適用される
 UI表示が他の要素と干渉しない