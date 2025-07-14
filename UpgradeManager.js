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
        gameInstance.addCombatLog('T,E,Q,H: アクティブ能力');
        gameInstance.addCombatLog('5,6: パッシブ能力 | >: 次のデッキへ | ESC: キャンセル');
        
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
                case '>':
                    this.nextFloor(gameInstance);
                    this.exitUpgradeMenu(gameInstance);
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

    exitUpgradeMenu(gameInstance) {
        if (this.upgradeHandler) {
            document.removeEventListener('keydown', this.upgradeHandler);
            this.upgradeHandler = null;
        }
        this.inUpgradeMenu = false;
        gameInstance.inUpgradeMenu = false;
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

    nextFloor(gameInstance) {
        gameInstance.floor++;
        gameInstance.maxFloorReached = Math.max(gameInstance.maxFloorReached, gameInstance.floor);
        gameInstance.elevatorPlaced = false; // エレベーターフラグをリセット
        gameInstance.addCombatLog(`=== デッキ ${gameInstance.floor} ===`);
        gameInstance.soundManager.playElevator();
        gameInstance.levelGenerator.generateLevel(gameInstance);
        
        // マップを表示し、ステータスを更新
        gameInstance.renderManager.render(gameInstance);
        gameInstance.uiManager.updateStatus(gameInstance);
    }
}