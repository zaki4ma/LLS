class UpgradeManager {
    constructor() {
        this.inUpgradeMenu = false;
        this.upgradeHandler = null;
    }

    showUpgradeMenu(gameInstance) {
        if (this.inUpgradeMenu) return;
        
        this.inUpgradeMenu = true;
        gameInstance.inUpgradeMenu = true;
        gameInstance.addCombatLog('=== アップグレードメニュー ===');
        gameInstance.addCombatLog(`現在のGold: ${gameInstance.playerManager.player.gold}`);
        gameInstance.addCombatLog('');
        
        // アクティブ能力の表示
        gameInstance.addCombatLog('🔥 アクティブ能力:');
        this.showAbilityInfo('teleport', 'T', gameInstance);
        this.showAbilityInfo('shield', 'E', gameInstance);
        this.showAbilityInfo('blast', 'Q', gameInstance);
        this.showAbilityInfo('hack', 'H', gameInstance);
        gameInstance.addCombatLog('');
        
        // パッシブ能力の表示
        gameInstance.addCombatLog('⚡ パッシブ能力:');
        this.showAbilityInfo('oxygenRecycler', '5', gameInstance);
        this.showAbilityInfo('autoMedic', '6', gameInstance);
        this.showAbilityInfo('agilityTraining', '7', gameInstance);
        this.showAbilityInfo('combatAwareness', '8', gameInstance);
        this.showAbilityInfo('reflexes', '9', gameInstance);
        gameInstance.addCombatLog('');
        
        gameInstance.addCombatLog('>: 次のデッキへ | ESC: キャンセル');
        
        this.upgradeHandler = (e) => {
            if (!this.inUpgradeMenu) return;
            
            switch (e.key) {
                case '5':
                    // 酸素リサイクラー
                    this.purchasePassiveAbility('oxygenRecycler', gameInstance);
                    break;
                case '6':
                    // オートメディック
                    this.purchasePassiveAbility('autoMedic', gameInstance);
                    break;
                case '7':
                    // 敏捷性訓練
                    this.purchasePassiveAbility('agilityTraining', gameInstance);
                    break;
                case '8':
                    // 戦闘感覚
                    this.purchasePassiveAbility('combatAwareness', gameInstance);
                    break;
                case '9':
                    // 反射神経強化
                    this.purchasePassiveAbility('reflexes', gameInstance);
                    break;
                case '>':
                    // デッキ20では勝利条件
                    if (gameInstance.floor >= 20) {
                        gameInstance.addCombatLog('🎉 ゲームクリア！ エンジンルームに到達しました！');
                        // ここで勝利処理を追加可能
                        this.exitUpgradeMenu(gameInstance);
                        return;
                    }
                    
                    // エレベーター上にいるかチェック（複数の方法で確認）
                    const onElevator = gameInstance.playerManager.player.onElevator || 
                                     this.inUpgradeMenu || 
                                     this.isPlayerNearElevator(gameInstance);
                    
                    if (onElevator) {
                        this.exitUpgradeMenu(gameInstance);
                        this.nextFloor(gameInstance);
                    } else {
                        gameInstance.addCombatLog('エレベーターが見つかりません');
                    }
                    return;
                case 'Escape':
                    gameInstance.addCombatLog('アップグレードメニューを終了');
                    this.exitUpgradeMenu(gameInstance);
                    return;
            }
            
            // 特殊能力の処理
            this.handleAbilityUpgrade(e.key, gameInstance);
        };
        
        document.addEventListener('keydown', this.upgradeHandler);
    }

    showAbilityInfo(abilityKey, keyBinding, gameInstance) {
        const ability = ABILITIES[abilityKey];
        if (!ability) return;
        
        const player = gameInstance.playerManager.player;
        const isUnlocked = player.abilities[abilityKey].unlocked;
        const canAfford = player.gold >= ability.cost;
        const isAvailable = gameInstance.floor >= ability.minFloor;
        
        let statusIcon = '';
        let statusText = '';
        
        if (isUnlocked) {
            statusIcon = '✅';
            statusText = '購入済み';
        } else if (!isAvailable) {
            statusIcon = '🔒';
            statusText = `デッキ${ability.minFloor}+`;
        } else if (!canAfford) {
            statusIcon = '💰';
            statusText = `Gold不足`;
        } else {
            statusIcon = '⭐';
            statusText = '購入可能';
        }
        
        gameInstance.addCombatLog(`[${keyBinding}] ${ability.name} (${ability.cost}G) - ${statusIcon} ${statusText}`);
    }

    exitUpgradeMenu(gameInstance) {
        console.log('Exiting upgrade menu...');
        if (this.upgradeHandler) {
            document.removeEventListener('keydown', this.upgradeHandler);
            this.upgradeHandler = null;
            console.log('Upgrade handler removed');
        }
        this.inUpgradeMenu = false;
        gameInstance.inUpgradeMenu = false;
        console.log('Upgrade menu state cleared');
    }

    purchasePassiveAbility(abilityKey, gameInstance) {
        const ability = ABILITIES[abilityKey];
        if (!ability) return;
        
        if (gameInstance.floor < ability.minFloor) {
            gameInstance.addCombatLog(`${ability.name}はデッキ${ability.minFloor}以降で利用可能です`);
            return;
        }
        
        if (gameInstance.playerManager.player.abilities[abilityKey].unlocked) {
            gameInstance.addCombatLog(`${ability.name}は既に購入済みです`);
            return;
        }
        
        if (gameInstance.playerManager.player.gold >= ability.cost) {
            gameInstance.playerManager.player.gold -= ability.cost;
            gameInstance.playerManager.player.abilities[abilityKey].unlocked = true;
            gameInstance.addCombatLog(`${ability.name}を購入しました！`);
            gameInstance.uiManager.updateStatus(gameInstance);
        } else {
            gameInstance.addCombatLog(`Gold不足です (必要: ${ability.cost})`);
        }
    }

    handleAbilityUpgrade(key, gameInstance) {
        const ability = Object.values(ABILITIES).find(a => a.key === key.toUpperCase());
        if (!ability) return;
        
        if (gameInstance.floor < ability.minFloor) {
            gameInstance.addCombatLog(`${ability.name}はデッキ${ability.minFloor}以降で利用可能です`);
            return;
        }
        
        const abilityKey = Object.keys(gameInstance.playerManager.player.abilities).find(key => 
            ABILITIES[key] && ABILITIES[key].name === ability.name
        );
        
        if (!abilityKey) return;
        
        if (gameInstance.playerManager.player.abilities[abilityKey].unlocked) {
            gameInstance.addCombatLog(`${ability.name}は既に購入済みです`);
            return;
        }
        
        if (gameInstance.playerManager.player.gold >= ability.cost) {
            gameInstance.playerManager.player.gold -= ability.cost;
            gameInstance.playerManager.player.abilities[abilityKey].unlocked = true;
            // アクティブ能力の場合は使用回数を設定
            if (!ability.passive) {
                gameInstance.playerManager.player.abilities[abilityKey].uses = gameInstance.playerManager.player.abilities[abilityKey].maxUses;
            }
            gameInstance.addCombatLog(`${ability.name}を購入しました！`);
            gameInstance.uiManager.updateStatus(gameInstance);
        } else {
            gameInstance.addCombatLog(`Gold不足です (必要: ${ability.cost})`);
        }
    }
    
    // プレイヤーがエレベーターの近くにいるかチェック
    isPlayerNearElevator(gameInstance) {
        const player = gameInstance.playerManager.player;
        
        const directions = [
            [0, 0],   // プレイヤーの位置
            [-1, 0], [1, 0], [0, -1], [0, 1], // 隣接する4方向
            [-1, -1], [-1, 1], [1, -1], [1, 1] // 斜め4方向
        ];
        
        for (const [dx, dy] of directions) {
            const x = player.x + dx;
            const y = player.y + dy;
            
            if (x >= 0 && x < gameInstance.gridSize && y >= 0 && y < gameInstance.gridSize) {
                const cellType = gameInstance.grid[y][x];
                if (cellType === 'elevator') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // デバッグ用：プレイヤー周辺のグリッド状況を取得
    getGridAroundPlayer(gameInstance) {
        const player = gameInstance.playerManager.player;
        const result = {};
        
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = player.x + dx;
                const y = player.y + dy;
                
                if (x >= 0 && x < gameInstance.gridSize && y >= 0 && y < gameInstance.gridSize) {
                    result[`${x},${y}`] = gameInstance.grid[y][x];
                }
            }
        }
        
        return result;
    }

    nextFloor(gameInstance) {
        console.log('NextFloor called - checking states before transition');
        console.log('UpgradeManager.inUpgradeMenu:', this.inUpgradeMenu);
        console.log('GameInstance.inUpgradeMenu:', gameInstance.inUpgradeMenu);
        
        gameInstance.floor++;
        gameInstance.maxFloorReached = Math.max(gameInstance.maxFloorReached, gameInstance.floor);
        gameInstance.elevatorPlaced = false; // エレベーターフラグをリセット
        
        // プレイヤーのエレベーター状態をリセット
        gameInstance.playerManager.player.onElevator = false;
        
        // 回避システムのリセット
        if (gameInstance.dodgeSystem) {
            gameInstance.dodgeSystem.reset();
        }
        
        // BGMを切り替え
        if (gameInstance.soundManager) gameInstance.soundManager.changeBGM(gameInstance.floor);
        
        // 特定のデッキでメッセージを表示
        if (gameInstance.floor === 6) {
            gameInstance.addCombatLog('📢 警告: より危険なエリアに突入しています');
        } else if (gameInstance.floor === 11) {
            gameInstance.addCombatLog('🚨 高危険区域: 強力な敵が待ち受けています');
        } else if (gameInstance.floor === 15) {
            gameInstance.addCombatLog('⚠️ 最大危険区域: 生存確率が大幅に低下しています');
        } else if (gameInstance.floor === 20) {
            gameInstance.addCombatLog('🔥 最終デッキ: 最後の戦いが始まります');
        }
        
        gameInstance.addCombatLog(`=== デッキ ${gameInstance.floor} ===`);
        if (gameInstance.soundManager) gameInstance.soundManager.playElevator();
        
        // 新しいレベルを生成
        gameInstance.levelGenerator.generateLevel(gameInstance);
        
        // 通信システムのフロア進行イベント
        gameInstance.communicationManager.checkTriggers(gameInstance);
        
        // マップを表示し、ステータスを更新
        gameInstance.renderManager.render(gameInstance);
        gameInstance.uiManager.updateStatus(gameInstance);
        
        // 状態を強制的にクリア（安全のため）
        this.inUpgradeMenu = false;
        gameInstance.inUpgradeMenu = false;
        if (this.upgradeHandler) {
            document.removeEventListener('keydown', this.upgradeHandler);
            this.upgradeHandler = null;
        }
        
        console.log('NextFloor completed - final states:');
        console.log('UpgradeManager.inUpgradeMenu:', this.inUpgradeMenu);
        console.log('GameInstance.inUpgradeMenu:', gameInstance.inUpgradeMenu);
        console.log('UpgradeHandler exists:', !!this.upgradeHandler);
    }
}