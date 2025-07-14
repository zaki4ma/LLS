class RangedWeaponManager {
    constructor() {
        this.weapons = new Map();
        this.activeWeapon = null;
        this.weaponInventory = {
            plasma_cutter: 0,
            stun_gun: 0,
            emergency_laser: 0
        };
        this.isTargeting = false;
        this.validTargets = [];
        this.initializeWeapons();
    }
    
    // 武器の初期化
    initializeWeapons() {
        this.weapons.set('plasma_cutter', RANGED_WEAPONS.PLASMA_CUTTER);
        this.weapons.set('stun_gun', RANGED_WEAPONS.STUN_GUN);
        this.weapons.set('emergency_laser', RANGED_WEAPONS.EMERGENCY_LASER);
    }
    
    // 武器の取得
    addWeapon(weaponId, quantity = 1) {
        if (this.weaponInventory.hasOwnProperty(weaponId)) {
            this.weaponInventory[weaponId] += quantity;
            return true;
        }
        return false;
    }
    
    // 武器の使用可能性チェック
    canUseWeapon(weaponId, gameInstance) {
        const weapon = this.weapons.get(weaponId);
        if (!weapon) return false;
        
        return (
            this.weaponInventory[weaponId] > 0 &&
            gameInstance.playerManager.player.power >= weapon.powerCost
        );
    }
    
    // 射程内判定
    isInRange(weapon, playerX, playerY, targetX, targetY) {
        const distance = Math.abs(targetX - playerX) + Math.abs(targetY - playerY);
        return distance <= weapon.range && distance >= 1;
    }
    
    // 射線判定（障害物チェック）
    hasLineOfSight(startX, startY, endX, endY, gameInstance) {
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = startX < endX ? 1 : -1;
        const sy = startY < endY ? 1 : -1;
        let err = dx - dy;
        
        let x = startX;
        let y = startY;
        
        while (true) {
            // 壁があるかチェック（開始点と終了点は除く）
            if ((x !== startX || y !== startY) && 
                (x !== endX || y !== endY) && 
                gameInstance.grid[y] && gameInstance.grid[y][x] === 'bulkhead') {
                return false;
            }
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return true;
    }
    
    // 直線上の敵を検索（貫通攻撃用）
    findEnemiesInLine(startX, startY, endX, endY, gameInstance) {
        const enemies = [];
        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const sx = startX < endX ? 1 : -1;
        const sy = startY < endY ? 1 : -1;
        let err = dx - dy;
        
        let x = startX;
        let y = startY;
        
        while (true) {
            if (x !== startX || y !== startY) { // 開始点は除外
                const enemy = gameInstance.aliens.find(a => a.x === x && a.y === y && a.alive);
                if (enemy) {
                    enemies.push(enemy);
                }
            }
            
            if (x === endX && y === endY) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return enemies;
    }
    
    // 武器使用
    useWeapon(weaponId, targetX, targetY, gameInstance) {
        if (!this.canUseWeapon(weaponId, gameInstance)) {
            return { success: false, message: "使用できません" };
        }
        
        const weapon = this.weapons.get(weaponId);
        const result = this.executeRangedAttack(weapon, targetX, targetY, gameInstance);
        
        if (result.success) {
            // リソース消費
            this.weaponInventory[weaponId]--;
            
            // 通信システムの電力効率化効果を適用
            let actualPowerCost = weapon.powerCost;
            if (gameInstance.communicationManager) {
                actualPowerCost = Math.ceil(actualPowerCost * gameInstance.communicationManager.getPowerEfficiency());
            }
            gameInstance.playerManager.player.power -= actualPowerCost;
        }
        
        return result;
    }
    
    // 攻撃実行
    executeRangedAttack(weapon, targetX, targetY, gameInstance) {
        const playerX = gameInstance.playerManager.player.x;
        const playerY = gameInstance.playerManager.player.y;
        
        // 射程チェック
        if (!this.isInRange(weapon, playerX, playerY, targetX, targetY)) {
            return { success: false, message: "射程外です" };
        }
        
        // 射線チェック
        if (!this.hasLineOfSight(playerX, playerY, targetX, targetY, gameInstance)) {
            return { success: false, message: "障害物があります" };
        }
        
        // 特殊効果に応じた処理
        let targets = [];
        
        if (weapon.specialEffect === "penetrate") {
            // 貫通攻撃：直線上の全ての敵
            targets = this.findEnemiesInLine(playerX, playerY, targetX, targetY, gameInstance);
        } else {
            // 通常攻撃：指定位置の敵のみ
            const enemy = gameInstance.aliens.find(a => a.x === targetX && a.y === targetY && a.alive);
            if (enemy) targets.push(enemy);
        }
        
        if (targets.length === 0) {
            return { success: false, message: "敵がいません" };
        }
        
        // ダメージ適用
        let results = [];
        targets.forEach(enemy => {
            let damage = weapon.damage;
            
            // クリティカル判定
            const isCritical = Math.random() < gameInstance.playerManager.player.criticalChance;
            if (isCritical) {
                damage = Math.floor(damage * gameInstance.playerManager.player.criticalMultiplier);
            }
            
            enemy.hp -= damage;
            
            // ダメージエフェクト
            const damageColor = isCritical ? '#ff8800' : '#ff4444';
            const damageText = isCritical ? `CRIT ${damage}!` : `-${damage}`;
            gameInstance.renderManager.showFloatingText(enemy.x, enemy.y, damageText, damageColor);
            
            // 特殊効果適用
            if (weapon.specialEffect === "stun") {
                enemy.stunned = true;
                enemy.stunDuration = 2; // 2ターン麻痺に延長
                gameInstance.addCombatLog(`${enemy.typeData.name}が麻痺しました（2ターン）`);
            }
            
            results.push({
                enemyId: enemy.id,
                damage: damage,
                killed: enemy.hp <= 0,
                critical: isCritical
            });
            
            // 敵撃破処理
            if (enemy.hp <= 0) {
                enemy.alive = false;
                gameInstance.grid[enemy.y][enemy.x] = 'floor';
                gameInstance.playerManager.player.exp += enemy.expReward;
                gameInstance.playerManager.player.gold += enemy.goldReward;
                gameInstance.aliensKilled++;
                gameInstance.encounteredEnemies.add(enemy.type);
                
                // 経験値・ゴールドエフェクト
                gameInstance.renderManager.showFloatingText(enemy.x, enemy.y, `EXP+${enemy.expReward}`, '#00aaff');
                gameInstance.renderManager.showFloatingText(enemy.x, enemy.y, `Gold+${enemy.goldReward}`, '#ffaa00');
                
                gameInstance.addCombatLog(`${enemy.typeData.name}を撃破！ EXP+${enemy.expReward}, Gold+${enemy.goldReward}`);
            }
        });
        
        // 攻撃アニメーション
        this.playRangedAttackAnimation(weapon, playerX, playerY, targetX, targetY, gameInstance);
        
        // レベルアップチェック
        gameInstance.playerManager.checkLevelUp(gameInstance);
        
        return { 
            success: true, 
            results: results,
            weaponUsed: weapon.name
        };
    }
    
    // 攻撃アニメーション
    playRangedAttackAnimation(weapon, startX, startY, endX, endY, gameInstance) {
        switch(weapon.id) {
            case 'plasma_cutter':
                this.createPlasmaBeamEffect(startX, startY, endX, endY);
                break;
            case 'stun_gun':
                this.createElectricArcEffect(startX, startY, endX, endY);
                break;
            case 'emergency_laser':
                this.createLaserBeamEffect(startX, startY, endX, endY);
                break;
        }
        
        // 音響効果
        if (weapon.soundEffect && gameInstance.soundManager) {
            this.playWeaponSound(weapon.soundEffect, gameInstance);
        }
    }
    
    // プラズマビームエフェクト
    createPlasmaBeamEffect(startX, startY, endX, endY) {
        const beam = document.createElement('div');
        beam.className = 'plasma-beam';
        beam.style.cssText = `
            position: absolute;
            background: linear-gradient(90deg, #ff4400, #ffaa00);
            height: 4px;
            transform-origin: left center;
            box-shadow: 0 0 10px #ff4400;
            z-index: 100;
            pointer-events: none;
        `;
        
        // 位置とサイズの計算
        const cellSize = 30;
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy) * cellSize;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        beam.style.left = `${startX * cellSize + cellSize/2}px`;
        beam.style.top = `${startY * cellSize + cellSize/2}px`;
        beam.style.width = `${length}px`;
        beam.style.transform = `rotate(${angle}deg)`;
        
        document.getElementById('game-grid').appendChild(beam);
        
        setTimeout(() => {
            beam.remove();
        }, 300);
    }
    
    // 電撃エフェクト
    createElectricArcEffect(startX, startY, endX, endY) {
        const arc = document.createElement('div');
        arc.className = 'electric-arc';
        arc.style.cssText = `
            position: absolute;
            background: linear-gradient(90deg, #00ffff, #ffffff);
            height: 2px;
            transform-origin: left center;
            box-shadow: 0 0 8px #00ffff;
            z-index: 100;
            pointer-events: none;
            animation: electricFlicker 0.3s ease-in-out;
        `;
        
        const cellSize = 30;
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy) * cellSize;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        arc.style.left = `${startX * cellSize + cellSize/2}px`;
        arc.style.top = `${startY * cellSize + cellSize/2}px`;
        arc.style.width = `${length}px`;
        arc.style.transform = `rotate(${angle}deg)`;
        
        document.getElementById('game-grid').appendChild(arc);
        
        setTimeout(() => {
            arc.remove();
        }, 300);
    }
    
    // レーザービームエフェクト
    createLaserBeamEffect(startX, startY, endX, endY) {
        const laser = document.createElement('div');
        laser.className = 'laser-beam';
        laser.style.cssText = `
            position: absolute;
            background: linear-gradient(90deg, #ff0000, #ff6666);
            height: 3px;
            transform-origin: left center;
            box-shadow: 0 0 12px #ff0000;
            z-index: 100;
            pointer-events: none;
        `;
        
        const cellSize = 30;
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy) * cellSize;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        laser.style.left = `${startX * cellSize + cellSize/2}px`;
        laser.style.top = `${startY * cellSize + cellSize/2}px`;
        laser.style.width = `${length}px`;
        laser.style.transform = `rotate(${angle}deg)`;
        
        document.getElementById('game-grid').appendChild(laser);
        
        setTimeout(() => {
            laser.remove();
        }, 400);
    }
    
    // 武器音の再生
    playWeaponSound(soundType, gameInstance) {
        if (!gameInstance.soundManager.enabled || !gameInstance.soundManager.initialized) return;
        
        try {
            switch(soundType) {
                case 'plasma_fire':
                    // プラズマ音：低音から高音へのスイープ
                    gameInstance.soundManager.synths.attack.triggerAttackRelease('C2', '0.3');
                    setTimeout(() => gameInstance.soundManager.synths.attack.triggerAttackRelease('C4', '0.1'), 100);
                    break;
                    
                case 'electric_zap':
                    // 電撃音：短いパルス音
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            gameInstance.soundManager.synths.attack.triggerAttackRelease('G5', '0.05');
                        }, i * 50);
                    }
                    break;
                    
                case 'laser_beam':
                    // レーザー音：高音の持続音
                    gameInstance.soundManager.synths.attack.triggerAttackRelease('A5', '0.2');
                    break;
            }
        } catch (e) {
            console.warn('Weapon sound error:', e);
        }
    }
    
    // 武器インベントリの取得
    getWeaponInventory() {
        return this.weaponInventory;
    }
    
    // 武器データの取得
    getWeaponData(weaponId) {
        return this.weapons.get(weaponId);
    }
}