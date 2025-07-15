class PlayerManager {
    constructor() {
        this.player = { 
            x: 0, y: 0, hp: 100, maxHp: 100, attack: 20, defense: 5,
            level: 1, exp: 0, expToNext: 100, gold: 0,
            oxygen: 100, maxOxygen: 100,
            power: 100, maxPower: 100, // 電力リソース
            criticalChance: 0.15, // 15%のクリティカル確率
            criticalMultiplier: 2.0, // クリティカル時のダメージ倍率
            abilities: {
                teleport: { unlocked: false, uses: 0, maxUses: 3 },
                shield: { unlocked: false, uses: 0, maxUses: 2 },
                blast: { unlocked: false, uses: 0, maxUses: 2 },
                hack: { unlocked: false, uses: 0, maxUses: 3 },
                oxygenRecycler: { unlocked: false, passive: true },
                autoMedic: { unlocked: false, passive: true },
                agilityTraining: { unlocked: false, passive: true },
                reflexes: { unlocked: false, passive: true },
                combatAwareness: { unlocked: false, passive: true }
            },
            shields: 0, // 質的アップグレード用のシールド数
            shieldActive: false,
            shieldDuration: 0, // シールドの残りターン数
            facing: 'down', // プレイヤーの向き: 'up', 'down', 'left', 'right'
            dodgeBonus: 0, // 装備やアップグレードによる回避ボーナス
            onElevator: false // エレベーター上にいるかどうか
        };
        // 質的アップグレード関連の状態
        this.hasExtraAction = false;
        this.chainBonusDamage = 0;
    }

    getPlayer() {
        return this.player;
    }
    
    placePlayer(gameInstance) {
        // プレイヤーの位置はLevelGeneratorで設定されるため、ここでは何もしない
        // 必要に応じて追加の初期化処理を行う
        console.log('Player placed at:', this.player.x, this.player.y);
    }

    movePlayer(dx, dy, gameInstance) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // プレイヤーの向きを更新
        if (dx > 0) this.player.facing = 'right';
        else if (dx < 0) this.player.facing = 'left';
        else if (dy > 0) this.player.facing = 'down';
        else if (dy < 0) this.player.facing = 'up';
        
        if (newX >= 0 && newX < gameInstance.gridSize && newY >= 0 && newY < gameInstance.gridSize) {
            const cellType = gameInstance.grid[newY][newX];
            
            if (cellType === 'bulkhead') return;
            
            const walkableCells = ['floor', 'alien', 'supply', 'oxygen-supply', 'medical-supply', 'weapon-supply', 'power-charge-station', 'ranged-weapon-container', 'elevator'];
            if (!walkableCells.includes(cellType)) return;
            
            if (cellType === 'alien') {
                const alien = gameInstance.aliens.find(a => a.x === newX && a.y === newY && a.alive);
                if (alien) {
                    this.attackAlien(alien, gameInstance);
                    return true; // 攻撃したのでターン処理を行う
                }
            }
            
            // アイテム収集処理
            if (cellType === 'supply') {
                const supply = gameInstance.supplies.find(s => s.x === newX && s.y === newY && !s.taken);
                if (supply) gameInstance.itemManager.collectSupply(supply, this.player, gameInstance);
            }
            
            if (cellType === 'oxygen-supply') {
                const oxygenSupply = gameInstance.oxygenSupplies.find(o => o.x === newX && o.y === newY && !o.taken);
                if (oxygenSupply) gameInstance.itemManager.collectOxygenSupply(oxygenSupply, this.player, gameInstance);
            }
            
            if (cellType === 'medical-supply') {
                const medicalSupply = gameInstance.medicalSupplies.find(m => m.x === newX && m.y === newY && !m.taken);
                if (medicalSupply) gameInstance.itemManager.collectMedicalSupply(medicalSupply, this.player, gameInstance);
            }
            
            if (cellType === 'weapon-supply') {
                const weaponSupply = gameInstance.weaponSupplies.find(w => w.x === newX && w.y === newY && !w.taken);
                if (weaponSupply) gameInstance.itemManager.collectWeaponSupply(weaponSupply, this.player, gameInstance);
            }
            
            if (cellType === 'power-charge-station') {
                const chargeStation = gameInstance.powerChargeStations.find(p => p.x === newX && p.y === newY && !p.taken);
                if (chargeStation) gameInstance.itemManager.collectPowerChargeStation(chargeStation, this.player, gameInstance);
            }
            
            if (cellType === 'ranged-weapon-container') {
                const weaponContainer = gameInstance.rangedWeaponContainers.find(r => r.x === newX && r.y === newY && !r.taken);
                if (weaponContainer) gameInstance.itemManager.collectRangedWeaponContainer(weaponContainer, this.player, gameInstance);
            }
            
            if (cellType === 'elevator') {
                // プレイヤーの位置を更新し、エレベーター状態を記録
                gameInstance.grid[this.player.y][this.player.x] = 'floor';
                this.player.x = newX;
                this.player.y = newY;
                this.player.onElevator = true; // エレベーター上にいることを記録
                gameInstance.grid[this.player.y][this.player.x] = 'player';
                
                gameInstance.upgradeManager.showUpgradeMenu(gameInstance);
                return false; // エレベーターはターン処理しない
            }
            
            // 現在の位置がエレベーターの場合、移動後にエレベーターを復元
            const wasOnElevator = this.player.onElevator;
            const oldX = this.player.x;
            const oldY = this.player.y;
            
            gameInstance.grid[this.player.y][this.player.x] = wasOnElevator ? 'elevator' : 'floor';
            this.player.x = newX;
            this.player.y = newY;
            this.player.onElevator = false; // 通常移動時はエレベーター状態をリセット
            gameInstance.grid[this.player.y][this.player.x] = 'player';
            
            if (wasOnElevator) {
                console.log('Player moved off elevator, elevator restored at:', oldX, oldY);
            }
            
            console.log('Player moved successfully to:', newX, newY);
            return true; // 移動したのでターン処理を行う
        }
        return false;
    }

    attackAlien(alien, gameInstance) {
        // クリティカル判定
        const isCritical = Math.random() < this.player.criticalChance;
        
        // 敵の回避判定
        const dodgeResult = gameInstance.dodgeSystem.checkEnemyDodge(alien, isCritical, gameInstance);
        
        if (dodgeResult.dodged) {
            // 回避成功
            gameInstance.addCombatLog(
                `${alien.typeData.name}が攻撃を回避した！ (${dodgeResult.chance}%)`
            );
            
            // 回避エフェクト表示
            gameInstance.renderManager.showFloatingText(
                alien.x, alien.y, "MISS", '#ffff00'
            );
            
            // 音響効果
            if (gameInstance.soundManager) gameInstance.soundManager.playSound('dodge');
            
            return { hit: false, damage: 0, critical: false, dodged: true };
        }
        
        // 基本ダメージ計算
        let damage = Math.max(1, this.player.attack - alien.defense);
        
        // 連続攻撃ボーナスダメージを追加
        if (this.chainBonusDamage > 0) {
            damage += this.chainBonusDamage;
        }
        
        // クリティカル時のダメージ倍率適用
        if (isCritical) {
            damage = Math.floor(damage * this.player.criticalMultiplier);
        }
        
        alien.hp -= damage;
        
        // ログ表示（クリティカル時は特別な表示）
        if (isCritical) {
            gameInstance.addCombatLog(`💥 CRITICAL HIT！${alien.typeData.name}に${damage}ダメージ！`);
            if (gameInstance.soundManager) gameInstance.soundManager.playCriticalHit();
        } else {
            gameInstance.addCombatLog(`${alien.typeData.name}に${damage}ダメージ！`);
            if (gameInstance.soundManager) gameInstance.soundManager.playAttack();
        }
        
        // ダメージエフェクト表示（クリティカル時は色を変更）
        const damageColor = isCritical ? '#ff8800' : '#ff4444';
        const damageText = isCritical ? `CRIT ${damage}!` : `-${damage}`;
        gameInstance.renderManager.showFloatingText(alien.x, alien.y, damageText, damageColor);
        gameInstance.renderManager.showAttackFlash(alien.x, alien.y);
        
        if (alien.hp <= 0) {
            alien.alive = false;
            gameInstance.grid[alien.y][alien.x] = 'floor';
            this.player.exp += alien.expReward;
            this.player.gold += alien.goldReward;
            gameInstance.aliensKilled++;
            gameInstance.encounteredEnemies.add(alien.type);
            gameInstance.addCombatLog(`${alien.typeData.name}を倒した！ EXP+${alien.expReward}, Gold+${alien.goldReward}`);
            
            // 質的アップグレード：チェインストライク判定
            gameInstance.qualitativeUpgradeManager.onEnemyKilled(alien, damage, gameInstance);
            
            // 経験値・ゴールドエフェクト
            gameInstance.renderManager.showFloatingText(alien.x, alien.y, `EXP+${alien.expReward}`, '#00aaff');
            gameInstance.renderManager.showFloatingText(alien.x, alien.y, `Gold+${alien.goldReward}`, '#ffaa00');
            
            this.checkLevelUp(gameInstance);
        }
        
        // 連続攻撃ボーナスダメージをリセット
        this.chainBonusDamage = 0;
        
        return { hit: true, damage, critical: isCritical, killed: alien.hp <= 0 };
    }

    checkLevelUp(gameInstance) {
        if (this.player.exp >= this.player.expToNext) {
            this.player.level++;
            this.player.exp -= this.player.expToNext;
            this.player.expToNext = Math.floor(this.player.expToNext * 1.2);
            this.player.maxHp += 10;
            this.player.hp = this.player.maxHp;
            this.player.attack += 2;
            this.player.defense += 1;
            
            // レベルアップ時にクリティカル率も微増（最大30%まで）
            if (this.player.criticalChance < 0.30) {
                this.player.criticalChance = Math.min(0.30, this.player.criticalChance + 0.02);
            }
            
            gameInstance.addCombatLog(`レベルアップ！ Lv.${this.player.level} HP、攻撃力、防御力が上昇！`);
            gameInstance.addCombatLog(`クリティカル率: ${Math.floor(this.player.criticalChance * 100)}%`);
            if (gameInstance.soundManager) gameInstance.soundManager.playLevelUp();
        }
    }

    processTurn(gameInstance) {
        console.log('=== PlayerManager.processTurn called ===');
        console.log('Before turn - HP:', this.player.hp, 'Oxygen:', this.player.oxygen, 'Power:', this.player.power);
        
        // 酸素消費（より緩やかな増加に調整）
        // 新しい計算式：デッキ1-4は1、デッキ5-10は1.3、デッキ11-16は1.6、デッキ17+は1.9
        let oxygenCost = 1;
        if (gameInstance.floor >= 5) {
            oxygenCost = 1 + Math.floor((gameInstance.floor - 1) / 6) * 0.3;
        }
        
        console.log('Base oxygen cost:', oxygenCost);
        
        // 酸素リサイクラーで大幅削減（65%削減に強化）
        if (this.player.abilities.oxygenRecycler.unlocked) {
            oxygenCost = Math.ceil(oxygenCost * 0.35);
            console.log('Oxygen cost after recycler:', oxygenCost);
        }
        
        // 通信システムの酸素効率化効果を適用
        if (gameInstance.communicationManager) {
            const efficiency = gameInstance.communicationManager.getOxygenEfficiency();
            oxygenCost = Math.ceil(oxygenCost * efficiency);
            console.log('Oxygen efficiency:', efficiency, 'Final cost:', oxygenCost);
        }
        
        const oldOxygen = this.player.oxygen;
        this.player.oxygen = Math.max(0, this.player.oxygen - oxygenCost);
        console.log('Oxygen change:', oldOxygen, '->', this.player.oxygen, '(cost:', oxygenCost, ')');
        
        // 電力は自然減少しない（武器使用時のみ消費）
        
        // シールドの持続時間を管理
        if (this.player.shieldActive && this.player.shieldDuration > 0) {
            this.player.shieldDuration--;
            if (this.player.shieldDuration <= 0) {
                this.player.shieldActive = false;
                gameInstance.addCombatLog('シールドが解除されました');
            }
        }
        
        if (this.player.oxygen <= 0) {
            const suffocationDamage = 5;
            this.player.hp -= suffocationDamage;
            gameInstance.addCombatLog(`酸素不足！ ${suffocationDamage}ダメージ！`);
            if (gameInstance.soundManager) gameInstance.soundManager.playDamage();
            
            // 酸素不足ダメージエフェクト（青色で表示）
            gameInstance.renderManager.showFloatingText(this.player.x, this.player.y, `-${suffocationDamage}`, '#4444ff');
            gameInstance.renderManager.showPlayerDamageFlash(gameInstance);
            
            if (this.player.hp <= 0) {
                this.triggerGameOver(gameInstance, '酸素不足で力尽きました...');
                return;
            }
        }
        
        // オートメディック処理
        if (this.player.abilities.autoMedic.unlocked && this.player.hp < this.player.maxHp * 0.5) {
            const healAmount = Math.floor(this.player.maxHp * 0.1);
            const oldHp = this.player.hp;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
            console.log('AutoMedic healing:', oldHp, '->', this.player.hp, '(+' + healAmount + ')');
            gameInstance.addCombatLog(`オートメディック作動！ HP+${healAmount}`);
        }
        
        console.log('After turn - HP:', this.player.hp, 'Oxygen:', this.player.oxygen, 'Power:', this.player.power);
        console.log('=== PlayerManager.processTurn completed ===');
    }

    useAbility(abilityName, gameInstance) {
        const ability = this.player.abilities[abilityName];
        if (!ability || !ability.unlocked) {
            gameInstance.addCombatLog(`${abilityName}は未購入です`);
            return;
        }
        
        if (ability.uses <= 0) {
            gameInstance.addCombatLog(`${abilityName}の使用回数が不足しています`);
            return;
        }
        
        switch (abilityName) {
            case 'teleport':
                this.executeTeleport(gameInstance);
                break;
            case 'shield':
                this.executeShield(gameInstance);
                break;
            case 'blast':
                this.executeBlast(gameInstance);
                break;
            case 'hack':
                this.executeHack(gameInstance);
                break;
        }
        
        ability.uses--;
        return true; // 能力使用でターン処理を行う
    }

    executeTeleport(gameInstance) {
        let teleported = false;
        let attempts = 0;
        
        while (!teleported && attempts < 50) {
            const newX = Math.floor(Math.random() * gameInstance.gridSize);
            const newY = Math.floor(Math.random() * gameInstance.gridSize);
            
            if (gameInstance.grid[newY][newX] === 'floor') {
                gameInstance.grid[this.player.y][this.player.x] = 'floor';
                this.player.x = newX;
                this.player.y = newY;
                gameInstance.grid[this.player.y][this.player.x] = 'player';
                teleported = true;
                gameInstance.addCombatLog('緊急テレポートを実行！');
                if (gameInstance.soundManager) gameInstance.soundManager.playTeleportEffect();
            }
            attempts++;
        }
        
        if (!teleported) {
            gameInstance.addCombatLog('テレポート先が見つかりませんでした');
        }
    }

    executeShield(gameInstance) {
        this.player.shieldActive = true;
        let baseDuration = 3; // 基本3ターン持続
        
        // 通信システムのシールド強化効果を適用
        if (gameInstance.communicationManager) {
            baseDuration += gameInstance.communicationManager.getShieldDurationBonus();
        }
        
        this.player.shieldDuration = baseDuration;
        gameInstance.addCombatLog(`シールドを展開！${baseDuration}ターンの間、全ての攻撃を無効化します`);
        if (gameInstance.soundManager) gameInstance.soundManager.playShieldEffect();
    }

    executeBlast(gameInstance) {
        const blastRange = 1;
        let hitCount = 0;
        
        for (let dy = -blastRange; dy <= blastRange; dy++) {
            for (let dx = -blastRange; dx <= blastRange; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const targetX = this.player.x + dx;
                const targetY = this.player.y + dy;
                
                if (targetX >= 0 && targetX < gameInstance.gridSize && targetY >= 0 && targetY < gameInstance.gridSize) {
                    const alien = gameInstance.aliens.find(a => a.x === targetX && a.y === targetY && a.alive);
                    if (alien) {
                        // エナジーブラストでもクリティカル判定
                        const isCritical = Math.random() < this.player.criticalChance;
                        let damage = this.player.attack * 2;
                        
                        if (isCritical) {
                            damage = Math.floor(damage * this.player.criticalMultiplier);
                        }
                        
                        alien.hp -= damage;
                        hitCount++;
                        
                        // ブラストダメージエフェクト（クリティカル時は色を変更）
                        const damageColor = isCritical ? '#ffaa00' : '#ff8800';
                        const damageText = isCritical ? `CRIT ${damage}!` : `-${damage}`;
                        gameInstance.renderManager.showFloatingText(targetX, targetY, damageText, damageColor);
                        gameInstance.renderManager.showAttackFlash(targetX, targetY);
                        
                        if (alien.hp <= 0) {
                            alien.alive = false;
                            gameInstance.grid[alien.y][alien.x] = 'floor';
                            this.player.exp += alien.expReward;
                            this.player.gold += alien.goldReward;
                            gameInstance.aliensKilled++;
                            gameInstance.encounteredEnemies.add(alien.type);
                            
                            // 経験値・ゴールドエフェクト
                            gameInstance.renderManager.showFloatingText(targetX, targetY, `EXP+${alien.expReward}`, '#00aaff');
                            gameInstance.renderManager.showFloatingText(targetX, targetY, `Gold+${alien.goldReward}`, '#ffaa00');
                        }
                    }
                }
            }
        }
        
        gameInstance.addCombatLog(`エナジーブラストを発射！${hitCount}体の敵にダメージ`);
        if (gameInstance.soundManager) gameInstance.soundManager.playBlastEffect();
        this.checkLevelUp(gameInstance);
    }

    executeHack(gameInstance) {
        // 隣接する隔壁をフロアに変換
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        let hackedCount = 0;
        
        for (const [dx, dy] of directions) {
            const targetX = this.player.x + dx;
            const targetY = this.player.y + dy;
            
            if (targetX >= 0 && targetX < gameInstance.gridSize && targetY >= 0 && targetY < gameInstance.gridSize) {
                if (gameInstance.grid[targetY][targetX] === 'bulkhead') {
                    gameInstance.grid[targetY][targetX] = 'floor';
                    hackedCount++;
                }
            }
        }
        
        gameInstance.addCombatLog(`ハッキングを実行！${hackedCount}つの隔壁を無力化`);
        if (gameInstance.soundManager) gameInstance.soundManager.playHackEffect();
    }

    takeDamage(damage, gameInstance, isCritical = false) {
        console.log('=== takeDamage called ===');
        console.log('Damage:', damage, 'Current HP:', this.player.hp, 'Critical:', isCritical);
        
        // シールドが有効な場合
        if (this.player.shieldActive) {
            console.log('Damage blocked by shield');
            gameInstance.addCombatLog(`攻撃をシールドで防いだ！（残り${this.player.shieldDuration}ターン）`);
            return false; // ダメージを受けていない
        }
        
        // プレイヤーの回避判定
        const dodgeResult = gameInstance.dodgeSystem.checkPlayerDodge(null, isCritical, gameInstance);
        
        if (dodgeResult.dodged) {
            // 回避成功
            gameInstance.addCombatLog(
                `攻撃を回避した！ (${dodgeResult.chance}%)`
            );
            
            // 回避エフェクト表示
            gameInstance.renderManager.showFloatingText(
                this.player.x, this.player.y, "DODGE", '#00ff88'
            );
            
            // 音響効果
            if (gameInstance.soundManager) gameInstance.soundManager.playSound('player_dodge');
            
            return { damaged: false, finalDamage: 0, dodged: true };
        }
        
        const oldHp = this.player.hp;
        this.player.hp -= damage;
        console.log('HP change:', oldHp, '->', this.player.hp, '(damage:', damage, ')');
        
        if (gameInstance.soundManager) gameInstance.soundManager.playDamage();
        
        // ダメージエフェクト
        gameInstance.renderManager.showFloatingText(this.player.x, this.player.y, `-${damage}`, '#ff4444');
        gameInstance.renderManager.showPlayerDamageFlash(gameInstance);
        
        // 質的アップグレード：カウンターアタック判定（攻撃者がいる場合）
        if (arguments.length > 3 && arguments[3]) { // 攻撃者情報が渡されている場合
            const attacker = arguments[3];
            gameInstance.qualitativeUpgradeManager.onPlayerAttacked(attacker, gameInstance);
        }
        
        if (this.player.hp <= 0) {
            this.triggerGameOver(gameInstance, '力尽きました...');
            return true; // ゲームオーバー
        }
        
        return false;
    }

    triggerGameOver(gameInstance, message) {
        gameInstance.gameOver = true;
        gameInstance.addCombatLog(message);
        if (gameInstance.soundManager) gameInstance.soundManager.playGameOver();
        
        // スコアデータを準備
        const scoreData = {
            score: gameInstance.currentScore,
            floor: gameInstance.floor,
            aliensKilled: gameInstance.aliensKilled,
            totalGold: gameInstance.totalGoldCollected,
            date: Date.now()
        };
        
        // ゲームオーバーモーダルを表示
        gameInstance.uiManager.showGameOverModal(scoreData);
    }
    
    // 回避ボーナス取得（アップグレードシステム用）
    getDodgeBonus() {
        let bonus = this.player.dodgeBonus;
        
        // 敏捷性訓練による回避率ボーナス
        if (this.player.abilities.agilityTraining.unlocked) {
            bonus += 5;
        }
        
        return bonus;
    }
    
    // 質的アップグレード：シールド最大数取得
    getMaxShields(gameInstance) {
        if (gameInstance.qualitativeUpgradeManager) {
            return gameInstance.qualitativeUpgradeManager.getPlayerMaxShields();
        }
        return 1; // デフォルト値
    }
    
    // 質的アップグレード：追加行動のチェック
    hasExtraActionAvailable() {
        return this.hasExtraAction;
    }
    
    // 質的アップグレード：追加行動を消費
    consumeExtraAction() {
        this.hasExtraAction = false;
        this.chainBonusDamage = 0;
    }
    
    // 被攻撃時の処理（質的アップグレード統合）
    takeDamage(damage, attacker, gameInstance) {
        // 質的アップグレードのシールド判定
        if (this.player.shields > 0) {
            this.player.shields--;
            gameInstance.addCombatLog('シールドが攻撃を防いだ！');
            gameInstance.renderManager.showFloatingText(this.player.x, this.player.y, 'SHIELD!', '#00aaff');
            
            // 音響効果
            if (gameInstance.soundManager) {
                gameInstance.soundManager.playSound('shield');
            }
            
            return 0; // ダメージなし
        }
        
        // 従来のシールド判定（アクティブ能力）
        if (this.player.shieldActive) {
            gameInstance.addCombatLog('シールドが攻撃を防いだ！');
            gameInstance.renderManager.showFloatingText(this.player.x, this.player.y, 'SHIELD!', '#00aaff');
            
            // シールド持続時間を減らす（設定により）
            if (this.player.shieldDuration > 0) {
                this.player.shieldDuration--;
                if (this.player.shieldDuration <= 0) {
                    this.player.shieldActive = false;
                    gameInstance.addCombatLog('シールドが解除されました');
                }
            }
            
            return 0; // ダメージなし
        }
        
        // 通常のダメージ計算
        const finalDamage = Math.max(1, damage - this.player.defense);
        this.player.hp -= finalDamage;
        
        // ダメージエフェクト
        gameInstance.renderManager.showFloatingText(this.player.x, this.player.y, `-${finalDamage}`, '#ff4444');
        gameInstance.renderManager.showPlayerDamageFlash(gameInstance);
        
        // 質的アップグレード：反撃処理
        if (attacker && gameInstance.qualitativeUpgradeManager) {
            gameInstance.onPlayerAttacked(attacker, finalDamage);
        }
        
        return finalDamage;
    }
}