class CommunicationManager {
    constructor() {
        this.triggeredEvents = new Set();
        this.messageQueue = [];
        this.messageLog = [];
        this.isDisplaying = false;
        this.currentTimeout = null;
        this.effectiveBoosts = {
            oxygenEfficiency: false,
            shieldDuration: false,
            powerEfficiency: false,
            fullLighting: false,
            fullLightingTurns: 0
        };
    }

    // 全てのメッセージを取得
    getAllMessages() {
        return [
            ...COMMUNICATION_MESSAGES.functional,
            ...COMMUNICATION_MESSAGES.story,
            ...COMMUNICATION_MESSAGES.emotional,
            ...COMMUNICATION_MESSAGES.technical,
            ...COMMUNICATION_MESSAGES.mislead
        ];
    }

    // トリガー条件をチェック
    checkTriggers(gameInstance) {
        const allMessages = this.getAllMessages();
        
        allMessages.forEach(message => {
            if (this.shouldTrigger(message, gameInstance)) {
                this.queueMessage(message);
            }
        });
        
        this.processMessageQueue();
    }

    // メッセージを発動すべきかチェック
    shouldTrigger(message, gameInstance) {
        // 既に発動済みかチェック
        if (message.oneTime && this.triggeredEvents.has(message.id)) {
            return false;
        }
        
        // トリガー条件を評価
        return this.evaluateTrigger(message.trigger, gameInstance);
    }

    // トリガー条件を評価
    evaluateTrigger(trigger, gameInstance) {
        switch(trigger) {
            case 'floor_3_reached':
                return gameInstance.floor === 3;
            case 'floor_4_reached':
                return gameInstance.floor === 4;
            case 'floor_5_reached':
                return gameInstance.floor === 5;
            case 'floor_6_reached':
                return gameInstance.floor === 6;
            case 'floor_7_reached':
                return gameInstance.floor === 7;
            case 'floor_8_reached':
                return gameInstance.floor === 8;
            case 'floor_9_reached':
                return gameInstance.floor === 9;
            case 'floor_10_reached':
                return gameInstance.floor === 10;
            case 'floor_11_reached':
                return gameInstance.floor === 11;
            case 'floor_12_reached':
                return gameInstance.floor === 12;
            case 'floor_13_reached':
                return gameInstance.floor === 13;
            case 'floor_14_reached':
                return gameInstance.floor === 14;
            case 'floor_15_reached':
                return gameInstance.floor === 15;
            case 'floor_16_reached':
                return gameInstance.floor === 16;
            case 'floor_17_reached':
                return gameInstance.floor === 17;
            case 'floor_18_reached':
                return gameInstance.floor === 18;
            case 'floor_19_reached':
                return gameInstance.floor === 19;
            case 'medical_bay_discovered':
                // 医療コンテナが発見されたことをトリガーとして使用
                return gameInstance.medicalSupplies && gameInstance.medicalSupplies.some(supply => supply.taken);
            case 'workshop_discovered':
                // 武器コンテナが発見されたことをトリガーとして使用
                return gameInstance.weaponSupplies && gameInstance.weaponSupplies.some(supply => supply.taken);
            case 'power_system_accessed':
                // 電力チャージステーションが使用されたことをトリガーとして使用
                return gameInstance.powerChargeStations && gameInstance.powerChargeStations.some(station => station.taken);
            case 'aliens_killed_20':
                return gameInstance.aliensKilled >= 20;
            default:
                return false;
        }
    }

    // メッセージをキューに追加
    queueMessage(message) {
        // 優先度に基づいてソート
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        this.messageQueue.push(message);
        this.messageQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        
        this.triggeredEvents.add(message.id);
    }

    // メッセージキューを処理
    processMessageQueue() {
        if (this.messageQueue.length > 0 && !this.isDisplaying) {
            const message = this.messageQueue.shift();
            this.displayMessage(message);
        }
    }

    // メッセージを表示
    displayMessage(message) {
        this.isDisplaying = true;
        
        // UI表示
        const popup = document.getElementById('message-popup');
        if (!popup) {
            console.error('Message popup element not found');
            this.isDisplaying = false;
            return;
        }
        
        const senderElement = popup.querySelector('.sender-name');
        const timestampElement = popup.querySelector('.timestamp');
        const contentElement = popup.querySelector('.message-content');
        
        if (senderElement) senderElement.textContent = message.sender;
        if (timestampElement) timestampElement.textContent = this.getCurrentTime();
        if (contentElement) contentElement.textContent = message.content;
        
        // 怪しいメッセージの場合は色を変更
        if (message.suspicious) {
            popup.style.borderColor = '#ff6600';
            popup.style.boxShadow = '0 0 20px rgba(255, 102, 0, 0.3)';
        } else {
            popup.style.borderColor = '#00ff88';
            popup.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
        }
        
        // 表示効果
        popup.classList.remove('hidden');
        this.playNotificationSound();
        
        // 効果実行
        this.executeEffect(message.effect);
        
        // ログに追加
        this.addToLog(message);
        
        // 自動非表示
        this.currentTimeout = setTimeout(() => {
            popup.classList.add('hidden');
            this.isDisplaying = false;
            this.processMessageQueue(); // 次のメッセージ処理
        }, message.displayDuration || 5000);
    }

    // メッセージ効果を実行
    executeEffect(effectName) {
        if (!effectName) return;
        
        switch(effectName) {
            case 'hint_elevator_location':
                // エレベーターの位置をプレイヤーに知らせる（視覚的効果は後で実装）
                break;
            case 'warn_danger_area':
                // 危険エリアの警告（視覚的効果は後で実装）
                break;
            case 'hint_oxygen_supply':
                // 酸素補給のヒント
                break;
            case 'temporary_full_lighting':
                // 20ターン全フロア照明
                this.effectiveBoosts.fullLighting = true;
                this.effectiveBoosts.fullLightingTurns = 20;
                break;
            case 'unlock_oxygen_upgrade':
                // 酸素効率化アップグレード
                this.effectiveBoosts.oxygenEfficiency = true;
                break;
            case 'unlock_plasma_cutter':
                // プラズマカッター使用可能（既に実装済み）
                break;
            case 'upgrade_shield_duration':
                // シールド持続時間延長
                this.effectiveBoosts.shieldDuration = true;
                break;
            case 'improve_power_efficiency':
                // 電力効率化
                this.effectiveBoosts.powerEfficiency = true;
                break;
            case 'morale_boost':
                // 士気向上（一時的なクリティカル率アップ）
                break;
            case 'reveal_story_fragment':
            case 'reveal_isolation':
            case 'reveal_command_loss':
            case 'reveal_survivor_status':
            case 'reveal_experiment_origin':
            case 'create_rescue_mission':
            case 'emotional_weight':
            case 'create_tension':
            case 'final_determination':
            case 'create_suspicion':
            case 'create_uncertainty':
            case 'false_security':
                // ストーリー・感情的効果（主に演出用）
                break;
        }
    }

    // ログに追加
    addToLog(message) {
        this.messageLog.push({
            ...message,
            receivedAt: Date.now()
        });
        this.updateLogDisplay();
    }

    // ログ表示を更新
    updateLogDisplay() {
        const logList = document.getElementById('message-list');
        if (!logList) return;
        
        logList.innerHTML = '';
        
        // 新しいメッセージから順に表示
        [...this.messageLog].reverse().forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'log-message';
            messageElement.innerHTML = `
                <div class="log-header">
                    <span class="log-sender">${message.sender}</span>
                    <span class="log-time">${new Date(message.receivedAt).toLocaleTimeString('ja-JP')}</span>
                </div>
                <div class="log-content">${message.content}</div>
            `;
            logList.appendChild(messageElement);
        });
    }

    // 通信音を再生
    playNotificationSound() {
        try {
            if (window.Tone && window.Tone.context.state === 'running') {
                const synth = new window.Tone.Synth().toDestination();
                synth.triggerAttackRelease('C5', '0.1');
                setTimeout(() => synth.triggerAttackRelease('E5', '0.1'), 100);
                setTimeout(() => synth.triggerAttackRelease('G5', '0.1'), 200);
            }
        } catch (error) {
            console.warn('Communication sound error:', error);
        }
    }

    // 現在時刻を取得
    getCurrentTime() {
        return new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // メッセージポップアップを手動で閉じる
    closeMessage() {
        const popup = document.getElementById('message-popup');
        if (popup) {
            popup.classList.add('hidden');
        }
        
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
        
        this.isDisplaying = false;
        this.processMessageQueue();
    }

    // 通信ログを表示
    showCommunicationLog() {
        const logWindow = document.getElementById('communication-log');
        if (logWindow) {
            logWindow.classList.remove('hidden');
        }
    }

    // 通信ログを隠す
    hideCommunicationLog() {
        const logWindow = document.getElementById('communication-log');
        if (logWindow) {
            logWindow.classList.add('hidden');
        }
    }

    // ターン処理での効果更新
    processTurnEffects() {
        // 全フロア照明の持続時間を減らす
        if (this.effectiveBoosts.fullLighting) {
            this.effectiveBoosts.fullLightingTurns--;
            if (this.effectiveBoosts.fullLightingTurns <= 0) {
                this.effectiveBoosts.fullLighting = false;
            }
        }
    }

    // 酸素効率化の効果を取得
    getOxygenEfficiency() {
        return this.effectiveBoosts.oxygenEfficiency ? 0.8 : 1.0; // 20%削減
    }

    // シールド持続時間の効果を取得
    getShieldDurationBonus() {
        return this.effectiveBoosts.shieldDuration ? 2 : 0; // +2ターン
    }

    // 電力効率化の効果を取得
    getPowerEfficiency() {
        return this.effectiveBoosts.powerEfficiency ? 0.5 : 1.0; // 50%削減
    }

    // 全フロア照明の効果を取得
    hasFullLighting() {
        return this.effectiveBoosts.fullLighting;
    }
}