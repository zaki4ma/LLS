class PlayerManager {
    constructor() {
        this.player = { 
            x: 0, y: 0, hp: 100, maxHp: 100, attack: 20, defense: 5,
            level: 1, exp: 0, expToNext: 100, gold: 0,
            oxygen: 100, maxOxygen: 100,
            abilities: {
                teleport: { unlocked: false, uses: 0, maxUses: 3 },
                shield: { unlocked: false, uses: 0, maxUses: 2 },
                blast: { unlocked: false, uses: 0, maxUses: 2 },
                hack: { unlocked: false, uses: 0, maxUses: 3 },
                oxygenRecycler: { unlocked: false, passive: true },
                autoMedic: { unlocked: false, passive: true }
            },
            shieldActive: false
        };
    }

    getPlayer() {
        return this.player;
    }

    movePlayer(dx, dy, gameInstance) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (newX >= 0 && newX < gameInstance.gridSize && newY >= 0 && newY < gameInstance.gridSize) {
            const cellType = gameInstance.grid[newY][newX];
            
            if (cellType === 'bulkhead') return;
            
            const walkableCells = ['floor', 'alien', 'supply', 'oxygen-supply', 'medical-supply', 'weapon-supply', 'elevator'];
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
            
            if (cellType === 'elevator') {
                gameInstance.upgradeManager.showUpgradeMenu(gameInstance);
                return false; // エレベーターはターン処理しない
            }
            
            gameInstance.grid[this.player.y][this.player.x] = 'floor';
            this.player.x = newX;
            this.player.y = newY;
            gameInstance.grid[this.player.y][this.player.x] = 'player';
            
            return true; // 移動したのでターン処理を行う
        }
        return false;
    }

    attackAlien(alien, gameInstance) {
        const damage = Math.max(1, this.player.attack - alien.defense);
        alien.hp -= damage;
        
        gameInstance.addCombatLog(`${alien.typeData.name}に${damage}ダメージ！`);
        gameInstance.soundManager.playAttack();
        
        // ダメージエフェクト表示
        gameInstance.renderManager.showFloatingText(alien.x, alien.y, `-${damage}`, '#ff4444');
        gameInstance.renderManager.showAttackFlash(alien.x, alien.y);
        
        if (alien.hp <= 0) {
            alien.alive = false;
            gameInstance.grid[alien.y][alien.x] = 'floor';
            this.player.exp += alien.expReward;
            this.player.gold += alien.goldReward;
            gameInstance.aliensKilled++;
            gameInstance.encounteredEnemies.add(alien.type);
            gameInstance.addCombatLog(`${alien.typeData.name}を倒した！ EXP+${alien.expReward}, Gold+${alien.goldReward}`);
            
            // 経験値・ゴールドエフェクト
            gameInstance.renderManager.showFloatingText(alien.x, alien.y, `EXP+${alien.expReward}`, '#00aaff');
            gameInstance.renderManager.showFloatingText(alien.x, alien.y, `Gold+${alien.goldReward}`, '#ffaa00');
            
            this.checkLevelUp(gameInstance);
        }
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
            
            gameInstance.addCombatLog(`レベルアップ！ Lv.${this.player.level} HP、攻撃力、防御力が上昇！`);
        }
    }

    processTurn(gameInstance) {
        // 酸素消費（酸素リサイクラーで半減）
        let oxygenCost = 1 + Math.floor(gameInstance.floor / 5);
        if (this.player.abilities.oxygenRecycler.unlocked) {
            oxygenCost = Math.ceil(oxygenCost / 2);
        }
        this.player.oxygen = Math.max(0, this.player.oxygen - oxygenCost);
        
        if (this.player.oxygen <= 0) {
            const suffocationDamage = 5;
            this.player.hp -= suffocationDamage;
            gameInstance.addCombatLog(`酸素不足！ ${suffocationDamage}ダメージ！`);
            
            if (this.player.hp <= 0) {
                gameInstance.gameOver = true;
                gameInstance.addCombatLog('酸素不足で力尽きました...');
                return;
            }
        }
        
        // オートメディック処理
        if (this.player.abilities.autoMedic.unlocked && this.player.hp < this.player.maxHp * 0.5) {
            const healAmount = Math.floor(this.player.maxHp * 0.1);
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
            gameInstance.addCombatLog(`オートメディック作動！ HP+${healAmount}`);
        }
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
                gameInstance.soundManager.playTeleportEffect();
            }
            attempts++;
        }
        
        if (!teleported) {
            gameInstance.addCombatLog('テレポート先が見つかりませんでした');
        }
    }

    executeShield(gameInstance) {
        this.player.shieldActive = true;
        gameInstance.addCombatLog('シールドを展開！次の攻撃を無効化します');
        gameInstance.soundManager.playShieldEffect();
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
                        const damage = this.player.attack * 2;
                        alien.hp -= damage;
                        hitCount++;
                        
                        // ブラストダメージエフェクト
                        gameInstance.renderManager.showFloatingText(targetX, targetY, `-${damage}`, '#ff8800');
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
        gameInstance.soundManager.playBlastEffect();
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
        gameInstance.soundManager.playHackEffect();
    }

    takeDamage(damage, gameInstance) {
        // シールドが有効な場合
        if (this.player.shieldActive) {
            gameInstance.addCombatLog('攻撃をシールドで防いだ！');
            this.player.shieldActive = false;
            return false; // ダメージを受けていない
        }
        
        this.player.hp -= damage;
        gameInstance.soundManager.playDamage();
        
        // ダメージエフェクト
        gameInstance.renderManager.showFloatingText(this.player.x, this.player.y, `-${damage}`, '#ff4444');
        gameInstance.renderManager.showPlayerDamageFlash(gameInstance);
        
        if (this.player.hp <= 0) {
            gameInstance.gameOver = true;
            gameInstance.addCombatLog('力尽きました...');
            gameInstance.soundManager.playGameOver();
            
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
            return true; // ゲームオーバー
        }
        
        return false;
    }
}