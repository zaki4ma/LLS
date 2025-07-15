class RoguelikeGame {
    constructor() {
        this.gridSize = 20;
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        this.visibleCells = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        this.exploredCells = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        
        this.turnCount = 0;
        this.aliens = [];
        this.supplies = [];
        this.oxygenSupplies = [];
        this.medicalSupplies = [];
        this.weaponSupplies = [];
        this.gameOver = false;
        this.floor = 1;
        this.elevatorPlaced = false;
        this.inUpgradeMenu = false;
        this.keyPressed = {};
        this.selectedRangedWeapon = null;
        this.isRangedAttackMode = false;
        
        // チートモード（デバッグ用）
        this.cheatMode = false;
        
        // スコア統計
        this.aliensKilled = 0;
        this.totalGoldCollected = 0;
        this.maxFloorReached = 1;
        this.currentScore = 0;
        
        // 敵図鑑システム
        this.encounteredEnemies = new Set();
        
        // コンポーネントの初期化（音声を最後に初期化）
        this.rankingManager = new RankingManager();
        this.playerManager = new PlayerManager();
        this.levelGenerator = new LevelGenerator(this.gridSize);
        this.enemyManager = new EnemyManager();
        this.itemManager = new ItemManager();
        this.renderManager = new RenderManager(this.gridSize);
        this.uiManager = new UIManager();
        this.upgradeManager = new UpgradeManager();
        this.rangedWeaponManager = new RangedWeaponManager();
        this.dodgeSystem = new DodgeSystem(); // 回避システムの初期化
        this.qualitativeUpgradeManager = new QualitativeUpgradeManager(); // 質的アップグレードシステム
        
        // 通信システムを再度有効化
        this.communicationManager = new CommunicationManager();
        
        this.uiManager.init(this);
        this.init();
        
        // 音声システムは最後に初期化（エラーがあってもゲーム本体には影響しない）
        try {
            this.soundManager = new SoundManager();
            this.initSound();
        } catch (error) {
            console.warn('Sound system initialization failed, continuing without sound:', error);
            this.soundManager = null;
        }
        
        // 通信システムをグローバルに設定
        window.communicationManager = this.communicationManager;
        
        // 質的アップグレードアイコンのクリックイベントを設定
        this.setupUpgradeClickEvents();
    }

    // 初期化とサウンド関連のメソッド
    async initSound() {
        if (!this.soundManager) {
            console.warn('Sound manager not available');
            return;
        }
        
        // サウンドコントロールの設定
        const soundToggle = document.getElementById('sound-toggle');
        const bgmVolumeSlider = document.getElementById('bgm-volume-slider');
        const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
        
        if (!soundToggle || !bgmVolumeSlider || !sfxVolumeSlider) {
            console.warn('Sound control elements not found');
            return;
        }
        
        // 初回クリックで音声を初期化
        let soundInitialized = false;
        
        const initializeSound = async () => {
            if (!soundInitialized) {
                this.addCombatLog('サウンドシステムを初期化中...');
                soundToggle.textContent = '初期化中...';
                
                try {
                    // AudioContextの状態をチェック
                    if (Tone.context.state === 'suspended') {
                        await Tone.start();
                    }
                    
                    await this.soundManager.init();
                    this.soundManager.start();
                    this.addCombatLog('サウンドシステムが有効になりました！');
                    soundToggle.textContent = 'ON';
                    soundToggle.style.background = '#00aaff';
                    soundToggle.style.color = '#000';
                    soundInitialized = true;
                } catch (error) {
                    console.error('Sound initialization error:', error);
                    this.addCombatLog('サウンドシステムの初期化に失敗しました');
                    soundToggle.textContent = 'エラー';
                    soundToggle.style.background = '#ff4444';
                }
            }
        };
        
        // 最初のキー入力またはクリックで音声を初期化
        const firstInteraction = async () => {
            await initializeSound();
            document.removeEventListener('keydown', firstInteraction);
            document.removeEventListener('click', firstInteraction);
        };
        
        document.addEventListener('keydown', firstInteraction);
        document.addEventListener('click', firstInteraction);
    }

    init() {
        try {
            console.log('Starting game initialization...');
            
            this.levelGenerator.generateLevel(this);
            console.log('Level generated successfully');
            
            this.renderManager.render(this);
            console.log('Render completed');
            
            this.setupEventListeners();
            this.setupCommunicationEventListeners();
            
            this.uiManager.updateStatus(this);
            console.log('Game initialization completed');
            
            // 初期状態でバーの表示を強制更新
            setTimeout(() => {
                console.log('Force updating UI after initialization');
                this.uiManager.updateStatus(this);
            }, 100);
            
        } catch (error) {
            console.error('Game initialization error:', error);
            console.error('Error stack:', error.stack);
        }
    }

    addCombatLog(message) {
        this.uiManager.addCombatLog(message);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key, 'GameOver:', this.gameOver, 'InUpgradeMenu:', this.inUpgradeMenu);
            if (this.gameOver || this.inUpgradeMenu) {
                console.log('Key event blocked by game state');
                return;
            }
            
            // ゲーム関連のキーでブラウザのデフォルト動作を無効化
            const gameKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', 't', 'T', 'e', 'E', 'q', 'Q', 'h', 'H', '1', '2', '3', 'r', 'R', '=', '-', 'c', 'C', 'f', 'F', 'g', 'G'];
            if (gameKeys.includes(e.key)) {
                e.preventDefault();
            }
            
            // ESCキーでターゲットモードを終了
            if (e.key === 'Escape' && this.isRangedAttackMode) {
                this.isRangedAttackMode = false;
                this.addCombatLog('ターゲットモードを終了しました');
                this.updateGameStatus();
                this.renderManager.render(this);
                return;
            }
            
            let dx = 0, dy = 0;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    dy = -1;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    dy = 1;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    dx = -1;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    dx = 1;
                    break;
                case ' ':
                    // 待機
                    this.addCombatLog('その場で待機...');
                    this.processTurn();
                    return;
                case 't':
                case 'T':
                    if (this.playerManager.useAbility('teleport', this)) {
                        this.processTurn();
                    }
                    return;
                case 'e':
                case 'E':
                    if (this.playerManager.useAbility('shield', this)) {
                        this.processTurn();
                    }
                    return;
                case 'q':
                case 'Q':
                    if (this.playerManager.useAbility('blast', this)) {
                        this.processTurn();
                    }
                    return;
                case 'h':
                case 'H':
                    if (this.playerManager.useAbility('hack', this)) {
                        this.processTurn();
                    }
                    return;
                case '1':
                case '2':
                case '3':
                    this.selectRangedWeapon(parseInt(e.key) - 1);
                    return;
                case 'r':
                case 'R':
                    this.toggleRangedAttackMode();
                    return;
                case '=':
                case '+':
                    // BGM音量アップ
                    if (this.soundManager) {
                        const newVolume = this.soundManager.increaseBGMVolume();
                        this.addCombatLog(`BGM音量: ${Math.round(newVolume * 100)}%`);
                    }
                    return;
                case '-':
                    // BGM音量ダウン
                    if (this.soundManager) {
                        const newVolume = this.soundManager.decreaseBGMVolume();
                        this.addCombatLog(`BGM音量: ${Math.round(newVolume * 100)}%`);
                    }
                    return;
                case 'c':
                case 'C':
                    // チートモード切り替え（Cキー）
                    this.toggleCheatMode();
                    return;
                case 'f':
                case 'F':
                    // チートモード時：デッキ20へ直接移動（Fキー）
                    if (this.cheatMode) {
                        this.cheatJumpToFloor20();
                    }
                    return;
                case 'g':
                case 'G':
                    // チートモード時：無敵モード切り替え（Gキー）
                    if (this.cheatMode) {
                        this.toggleGodMode();
                    }
                    return;
            }
            
            if (dx !== 0 || dy !== 0) {
                console.log('Movement attempted:', dx, dy);
                const moveResult = this.playerManager.movePlayer(dx, dy, this);
                console.log('Move result:', moveResult);
                if (moveResult) {
                    console.log('Calling processTurn due to movement');
                    this.processTurn();
                } else {
                    console.log('Movement failed, no turn processing');
                    // 移動失敗でもUIは更新
                    this.uiManager.updateStatus(this);
                }
            }
        });
        
        // マウスクリック処理（遠距離武器のターゲット指定）
        document.addEventListener('click', (e) => {
            if (this.gameOver || this.inUpgradeMenu || !this.isRangedAttackMode) return;
            
            const gameGrid = document.getElementById('game-grid');
            if (!gameGrid) return;
            
            const rect = gameGrid.getBoundingClientRect();
            const cellSize = rect.width / this.gridSize;
            
            const x = Math.floor((e.clientX - rect.left) / cellSize);
            const y = Math.floor((e.clientY - rect.top) / cellSize);
            
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                this.handleRangedAttack(x, y);
            }
        });
    }

    processTurn() {
        console.log('=== GameCore.processTurn called ===');
        console.log('Turn count:', this.turnCount, '->', this.turnCount + 1);
        this.turnCount++;
        
        // プレイヤーのターン処理
        console.log('Calling playerManager.processTurn...');
        this.playerManager.processTurn(this);
        
        if (this.gameOver) return;
        
        // エイリアンの行動
        this.enemyManager.moveAliens(this);
        
        // 通信システムのチェック
        this.communicationManager.checkTriggers(this);
        this.communicationManager.processTurnEffects();
        
        this.renderManager.render(this);
        this.uiManager.updateStatus(this);
    }

    // UIメソッド（モーダル表示）
    showBestiary() {
        this.uiManager.showBestiary(this);
    }

    showRanking() {
        this.uiManager.showRanking(this);
    }

    showUpgradeGuide() {
        this.uiManager.showUpgradeGuide();
    }

    selectRangedWeapon(weaponIndex) {
        console.log('Selecting ranged weapon index:', weaponIndex);
        const weaponIds = Object.keys(this.rangedWeaponManager.weaponInventory);
        console.log('Available weapon IDs:', weaponIds);
        const selectedWeaponId = weaponIds[weaponIndex];
        console.log('Selected weapon ID:', selectedWeaponId);
        
        if (!selectedWeaponId) {
            this.addCombatLog('その武器スロットは空です');
            return;
        }
        
        const inventory = this.rangedWeaponManager.getWeaponInventory();
        console.log('Weapon inventory:', inventory);
        console.log('Selected weapon count:', inventory[selectedWeaponId]);
        if (inventory[selectedWeaponId] <= 0) {
            this.addCombatLog('その武器の残弾がありません');
            return;
        }
        
        const weaponData = this.rangedWeaponManager.getWeaponData(selectedWeaponId);
        if (!weaponData) {
            this.addCombatLog('無効な武器です');
            return;
        }
        
        this.selectedRangedWeapon = selectedWeaponId;
        this.addCombatLog(`${weaponData.icon} ${weaponData.name} を選択しました`);
        
        // 自動的にターゲットモードに入る
        this.isRangedAttackMode = true;
        this.addCombatLog('ターゲットモードON - 敵をクリックして攻撃');
        this.updateGameStatus();
        
        // 射程範囲を表示するため画面を更新
        this.renderManager.render(this);
    }

    toggleRangedAttackMode() {
        if (!this.selectedRangedWeapon) {
            this.addCombatLog('まず遠距離武器を選択してください（1-3キー）');
            return;
        }
        
        this.isRangedAttackMode = !this.isRangedAttackMode;
        
        if (this.isRangedAttackMode) {
            this.addCombatLog('ターゲットモードON - 敵をクリックして攻撃');
        } else {
            this.addCombatLog('ターゲットモードOFF');
        }
        
        this.updateGameStatus();
        
        // 射程範囲の表示を更新
        this.renderManager.render(this);
    }
    
    updateGameStatus() {
        const statusElement = document.getElementById('game-status');
        if (!statusElement) return;
        
        if (this.isRangedAttackMode && this.selectedRangedWeapon) {
            const weaponData = this.rangedWeaponManager.getWeaponData(this.selectedRangedWeapon);
            statusElement.textContent = `🎯 ${weaponData.icon} ${weaponData.name} - 敵をクリック`;
        } else {
            statusElement.textContent = '探索中...';
        }
    }
    
    setupCommunicationEventListeners() {
        // 通信ログボタンのイベントリスナー
        const commLogBtn = document.getElementById('comm-log-btn');
        if (commLogBtn) {
            commLogBtn.addEventListener('click', () => {
                this.communicationManager.showCommunicationLog();
            });
        }
    }
    
    handleRangedAttack(targetX, targetY) {
        if (!this.selectedRangedWeapon) {
            this.addCombatLog('武器が選択されていません');
            return;
        }
        
        const result = this.rangedWeaponManager.useWeapon(this.selectedRangedWeapon, targetX, targetY, this);
        
        if (result.success) {
            this.addCombatLog(`${result.weaponUsed}で攻撃！`);
            
            // 攻撃成功後の処理
            result.results.forEach(res => {
                if (res.killed) {
                    if (this.soundManager) this.soundManager.playAttack();
                } else if (res.critical) {
                    if (this.soundManager) this.soundManager.playCriticalHit();
                }
            });
            
            // ターゲットモードを終了
            this.isRangedAttackMode = false;
            this.updateGameStatus();
            
            // ターン処理を実行
            this.processTurn();
        } else {
            this.addCombatLog(`攻撃失敗: ${result.message}`);
        }
    }
    
    setupUpgradeClickEvents() {
        // 質的アップグレードアイコンにクリックイベントを設定
        const upgradeIcons = ['chain-strike-status', 'counter-attack-status', 'auto-repair-status'];
        upgradeIcons.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', () => {
                    this.uiManager.openUpgradeModal(this);
                });
            }
        });
    }
    
    // ターン処理（既存のprocessTurnをQualitativeUpgradeManagerと統合）
    processTurn() {
        if (this.gameOver) return;
        
        this.turnCount++;
        
        // プレイヤーのターン処理
        this.playerManager.processTurn(this);
        
        // 質的アップグレードのターン終了処理
        this.qualitativeUpgradeManager.onTurnEnd(this);
        
        // 敵のターン処理
        this.enemyManager.moveAliens(this);
        
        // 描画更新
        this.renderManager.render(this);
        
        // UI状態更新
        this.uiManager.updateStatus(this);
        
        // ゲームオーバー確認
        if (this.playerManager.player.hp <= 0) {
            this.gameOver = true;
            
            // ゲームオーバーBGMを再生
            if (this.soundManager) {
                this.soundManager.playGameOverBGM();
            }
            
            this.uiManager.showGameOverModal(this);
        }
    }
    
    // フロア移動時の処理
    moveToNextFloor() {
        if (this.floor >= 20) {
            this.handleGameComplete();
            return;
        }
        
        // フロア移動前の処理
        this.qualitativeUpgradeManager.onFloorChange(this);
        
        this.floor++;
        this.maxFloorReached = Math.max(this.maxFloorReached, this.floor);
        
        // 新しいフロアの生成
        this.init();
        
        // プレイヤーの配置
        this.playerManager.placePlayer(this);
        
        // 敵の配置
        this.enemyManager.placeAliens(this);
        
        // アイテムの配置
        this.itemManager.placeSupplies(this);
        this.itemManager.placeSpecialSupplies(this);
        
        // 描画更新
        this.renderManager.render(this);
        
        // 通信イベントのチェック
        if (this.communicationManager) {
            this.communicationManager.checkForFloorEvent(this.floor, this);
        }
        
        // BGM更新
        if (this.soundManager) {
            this.soundManager.updateBGMForDeck(this.floor);
        }
        
        this.addCombatLog(`=== デッキ ${this.floor} ===`);
    }
    
    // 敵撃破時の処理（質的アップグレードとの統合）
    onEnemyKilled(enemy, damageDealt) {
        // 統計更新
        this.aliensKilled++;
        this.encounteredEnemies.add(enemy.type);
        
        // 質的アップグレードの敵撃破処理
        this.qualitativeUpgradeManager.onEnemyKilled(enemy, damageDealt, this);
        
        // ゴールドドロップ
        const goldDropped = Math.floor(Math.random() * 15) + 5;
        this.playerManager.player.gold += goldDropped;
        this.totalGoldCollected += goldDropped;
        
        this.addCombatLog(`${enemy.name}を撃破！ ゴールド+${goldDropped}`);
        
        // 音響効果
        if (this.soundManager) {
            this.soundManager.playEnemyDeath();
        }
    }
    
    // プレイヤー被攻撃時の処理（質的アップグレードとの統合）
    onPlayerAttacked(attacker, damage) {
        // 質的アップグレード（反撃）の処理
        const counterAttackTriggered = this.qualitativeUpgradeManager.onPlayerAttacked(attacker, this);
        
        if (counterAttackTriggered) {
            // 反撃が発動した場合、敵が死亡していれば削除
            if (attacker.hp <= 0) {
                const index = this.aliens.indexOf(attacker);
                if (index > -1) {
                    this.aliens.splice(index, 1);
                    this.onEnemyKilled(attacker, 0); // 反撃による撃破
                }
            }
        }
    }
    
    // ゲーム完了時の処理
    handleGameComplete() {
        this.gameOver = true;
        this.addCombatLog('=== ミッション完了！ ===');
        this.addCombatLog('エンジンルームに到達しました！');
        
        // エンディングBGMを再生
        if (this.soundManager) {
            this.soundManager.playEndingBGM();
        }
        
        // 最終スコア計算
        this.calculateFinalScore();
        
        // ランキング保存
        this.rankingManager.addScore('PLR', this.currentScore, this.floor);
        
        // 完了モーダル表示
        this.uiManager.showGameCompleteModal(this);
    }
    
    // セーブデータの統合
    getSaveData() {
        return {
            floor: this.floor,
            turnCount: this.turnCount,
            playerData: this.playerManager.getSaveData(),
            qualitativeUpgrades: this.qualitativeUpgradeManager.getSaveData(),
            // 他のセーブデータ...
        };
    }
    
    // ロードデータの統合
    loadSaveData(data) {
        if (data.qualitativeUpgrades) {
            this.qualitativeUpgradeManager.loadSaveData(data.qualitativeUpgrades);
        }
        // 他のロード処理...
    }
    
    // エンジンコア選択モーダル表示
    showEngineChoiceModal() {
        this.addCombatLog('🔧 エンジンコアに到達しました...');
        this.addCombatLog('最後の選択を行ってください。');
        
        // エンディングBGMを再生開始
        if (this.soundManager) {
            this.soundManager.playEndingBGM();
        }
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 5000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #0a1420 0%, #1a2540 100%);
            border: 3px solid #ff8800;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 0 50px rgba(255, 136, 0, 0.6);
            color: #ffffff;
        `;
        
        content.innerHTML = `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #ff8800; font-size: 28px; margin-bottom: 20px; text-shadow: 0 0 20px #ff8800;">
                    ⚙️ エンジンシステム制御
                </h2>
                <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                    ルミナス号のメインエンジンが目の前にある。<br>
                    損傷は激しいが、まだ修理できそうだ。
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #ffaa88;">
                    しかし...爆破装置を設置することも可能だ。<br>
                    君の決断が、すべての運命を決める。
                </p>
            </div>
            
            <div style="display: flex; gap: 20px; justify-content: center;">
                <button id="repair-engine" style="
                    background: linear-gradient(135deg, #00aa44 0%, #44cc88 100%);
                    color: #ffffff;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 0 20px rgba(0, 170, 68, 0.4);
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    🔧 エンジンを修理する<br>
                    <small style="opacity: 0.8;">(地球帰還)</small>
                </button>
                
                <button id="destroy-engine" style="
                    background: linear-gradient(135deg, #aa0044 0%, #cc4488 100%);
                    color: #ffffff;
                    border: none;
                    padding: 15px 25px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 0 20px rgba(170, 0, 68, 0.4);
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    💥 爆破装置を設置<br>
                    <small style="opacity: 0.8;">(自己犠牲)</small>
                </button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // ボタンイベント設定
        document.getElementById('repair-engine').onclick = () => {
            modal.remove();
            this.handleEndingChoice(ENGINE_ROOM_CONFIG.endingTypes.REPAIR);
        };
        
        document.getElementById('destroy-engine').onclick = () => {
            modal.remove();
            this.handleEndingChoice(ENGINE_ROOM_CONFIG.endingTypes.DESTROY);
        };
    }
    
    // エンディング選択処理
    handleEndingChoice(endingType) {
        this.gameOver = true;
        
        // 最終スコア計算
        this.calculateFinalScore();
        
        // エンディング固有のスコアボーナス
        if (endingType === ENGINE_ROOM_CONFIG.endingTypes.DESTROY) {
            // 自己犠牲エンディングには英雄ボーナス
            this.currentScore += 50000;
            this.addCombatLog('英雄ボーナス: +50,000点');
        }
        
        // ランキング保存（エンディング情報をスコアデータに含める）
        const scoreData = {
            score: this.currentScore,
            floor: this.floor,
            aliensKilled: this.aliensKilled,
            totalGold: this.totalGoldCollected,
            completedGame: true,
            endingType: endingType,
            date: new Date().toISOString()
        };
        this.rankingManager.addScore('PLR', this.currentScore, this.floor);
        
        // エンディングモーダル表示
        this.uiManager.showEndingModal(endingType, this);
    }
    
    // 最終スコア計算
    calculateFinalScore() {
        let score = 0;
        
        // 基本スコア：到達フロア
        score += this.floor * 1000;
        
        // 敵撃破ボーナス
        score += this.aliensKilled * 100;
        
        // ゴールド収集ボーナス
        score += this.totalGoldCollected * 10;
        
        // 生存HPボーナス
        score += this.playerManager.player.hp * 50;
        
        // クリア完了ボーナス（デッキ20到達）
        if (this.floor >= 20) {
            score += 25000;
        }
        
        this.currentScore = score;
        this.addCombatLog(`最終スコア計算完了: ${score.toLocaleString()}点`);
    }
    
    // ===== チートコード関連メソッド =====
    
    // チートモード切り替え
    toggleCheatMode() {
        this.cheatMode = !this.cheatMode;
        if (this.cheatMode) {
            this.addCombatLog('🔧 チートモード有効 - F:デッキ20移動, G:無敵モード');
            // チート時の視覚的表示
            document.body.style.border = '3px solid #ff0000';
        } else {
            this.addCombatLog('🔧 チートモード無効');
            document.body.style.border = 'none';
            // 無敵モードも無効化
            this.playerManager.godMode = false;
        }
    }
    
    // デッキ20に直接移動
    cheatJumpToFloor20() {
        this.addCombatLog('🚀 チート: デッキ20にワープ！');
        this.floor = 20;
        this.maxFloorReached = Math.max(this.maxFloorReached, this.floor);
        
        // レベルを再生成
        this.levelGenerator.generateLevel(this);
        this.playerManager.placePlayer(this);
        this.enemyManager.placeAliens(this);
        this.itemManager.placeSupplies(this);
        this.itemManager.placeSpecialSupplies(this);
        
        // エンジンルームBGMを再生
        if (this.soundManager) {
            this.soundManager.updateBGMForDeck(this.floor);
        }
        
        // 画面更新
        this.renderManager.render(this);
        this.uiManager.updateStatus(this);
        
        this.addCombatLog('=== エンジンルーム（デッキ20）===');
        this.addCombatLog('🎯 エンジンコア（⚙）を見つけてエンディングを確認！');
    }
    
    // 無敵モード切り替え
    toggleGodMode() {
        this.playerManager.godMode = !this.playerManager.godMode;
        if (this.playerManager.godMode) {
            this.addCombatLog('⚡ 無敵モード有効 - 体力・酸素減少なし');
            // プレイヤーを完全回復
            this.playerManager.player.hp = this.playerManager.player.maxHp;
            this.playerManager.player.oxygen = this.playerManager.player.maxOxygen;
        } else {
            this.addCombatLog('⚡ 無敵モード無効');
        }
        this.uiManager.updateStatus(this);
    }
}