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
        
        // スコア統計
        this.aliensKilled = 0;
        this.totalGoldCollected = 0;
        this.maxFloorReached = 1;
        this.currentScore = 0;
        
        // 敵図鑑システム
        this.encounteredEnemies = new Set();
        
        // コンポーネントの初期化
        this.soundManager = new SoundManager();
        this.rankingManager = new RankingManager();
        this.playerManager = new PlayerManager();
        this.levelGenerator = new LevelGenerator(this.gridSize);
        this.enemyManager = new EnemyManager();
        this.itemManager = new ItemManager();
        this.renderManager = new RenderManager(this.gridSize);
        this.uiManager = new UIManager();
        this.upgradeManager = new UpgradeManager();
        
        this.uiManager.init(this);
        this.initSound();
        this.init();
    }

    // 初期化とサウンド関連のメソッド
    async initSound() {
        // サウンドコントロールの設定
        const soundToggle = document.getElementById('sound-toggle');
        const bgmVolumeSlider = document.getElementById('bgm-volume-slider');
        const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
        
        // 初回クリックで音声を初期化
        let soundInitialized = false;
        
        const initializeSound = async () => {
            if (!soundInitialized) {
                this.addCombatLog('サウンドシステムを初期化中...');
                soundToggle.textContent = '初期化中...';
                
                try {
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
        this.levelGenerator.generateLevel(this);
        this.renderManager.render(this);
        this.setupEventListeners();
        this.uiManager.updateStatus(this);
    }

    addCombatLog(message) {
        this.uiManager.addCombatLog(message);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver || this.inUpgradeMenu) return;
            
            // ゲーム関連のキーでブラウザのデフォルト動作を無効化
            const gameKeys = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', 't', 'T', 'e', 'E', 'q', 'Q', 'h', 'H'];
            if (gameKeys.includes(e.key)) {
                e.preventDefault();
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
            }
            
            if (dx !== 0 || dy !== 0) {
                if (this.playerManager.movePlayer(dx, dy, this)) {
                    this.processTurn();
                }
            }
        });
    }

    processTurn() {
        this.turnCount++;
        
        // プレイヤーのターン処理
        this.playerManager.processTurn(this);
        
        if (this.gameOver) return;
        
        // エイリアンの行動
        this.enemyManager.moveAliens(this);
        
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
}