class ItemManager {
    constructor() {
        this.supplies = [];
        this.oxygenSupplies = [];
        this.medicalSupplies = [];
        this.weaponSupplies = [];
        this.powerChargeStations = [];
        this.rangedWeaponContainers = [];
    }

    placeSupplies(gameInstance) {
        this.supplies = [];
        const numSupplies = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numSupplies; i++) {
            this.placeItem('supply', { 
                gold: 5 + Math.floor(Math.random() * 10) * gameInstance.floor,
                taken: false
            }, gameInstance);
        }
        
        gameInstance.supplies = this.supplies;
    }

    placeSpecialSupplies(gameInstance) {
        this.oxygenSupplies = [];
        this.medicalSupplies = [];
        this.weaponSupplies = [];
        this.powerChargeStations = [];
        this.rangedWeaponContainers = [];
        
        // 酸素補給
        for (let i = 0; i < 2; i++) {
            this.placeItem('oxygen-supply', { 
                oxygen: 30 + Math.floor(Math.random() * 20),
                taken: false
            }, gameInstance);
        }
        
        // 医療補給
        if (Math.random() < 0.7) {
            this.placeItem('medical-supply', { 
                healing: 25 + Math.floor(Math.random() * 15),
                taken: false
            }, gameInstance);
        }
        
        // 武器補給（出現率を50%から75%に上昇）
        if (Math.random() < 0.75) {
            this.placeItem('weapon-supply', { 
                attackBonus: 3 + Math.floor(Math.random() * 3),
                defenseBonus: 1 + Math.floor(Math.random() * 2),
                taken: false
            }, gameInstance);
        }
        
        // 高階層では追加の武器コンテナが出現する可能性
        if (gameInstance.floor >= 3 && Math.random() < 0.4) {
            this.placeItem('weapon-supply', { 
                attackBonus: 2 + Math.floor(Math.random() * 4),
                defenseBonus: 1 + Math.floor(Math.random() * 2),
                taken: false
            }, gameInstance);
        }
        
        // 電力チャージステーション（各デッキに1-2個）
        const chargeStationCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < chargeStationCount; i++) {
            this.placeItem('power-charge-station', {
                powerRestore: 40 + Math.floor(Math.random() * 30),
                taken: false
            }, gameInstance);
        }
        
        // 遠距離武器コンテナ（確率的に出現）
        this.placeRangedWeaponContainers(gameInstance);
        
        gameInstance.oxygenSupplies = this.oxygenSupplies;
        gameInstance.medicalSupplies = this.medicalSupplies;
        gameInstance.weaponSupplies = this.weaponSupplies;
        gameInstance.powerChargeStations = this.powerChargeStations;
        gameInstance.rangedWeaponContainers = this.rangedWeaponContainers;
    }

    placeItem(type, item, gameInstance) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 50) {
            const x = Math.floor(Math.random() * gameInstance.gridSize);
            const y = Math.floor(Math.random() * gameInstance.gridSize);
            
            if (gameInstance.grid[y][x] === 'floor') {
                item.x = x;
                item.y = y;
                
                if (type === 'supply') this.supplies.push(item);
                else if (type === 'oxygen-supply') this.oxygenSupplies.push(item);
                else if (type === 'medical-supply') this.medicalSupplies.push(item);
                else if (type === 'weapon-supply') this.weaponSupplies.push(item);
                else if (type === 'power-charge-station') this.powerChargeStations.push(item);
                else if (type === 'ranged-weapon-container') this.rangedWeaponContainers.push(item);
                
                gameInstance.grid[y][x] = type;
                placed = true;
            }
            attempts++;
        }
    }

    collectSupply(supply, player, gameInstance) {
        supply.taken = true;
        player.gold += supply.gold;
        gameInstance.totalGoldCollected += supply.gold;
        gameInstance.addCombatLog(`金庫コンテナを発見！ Gold+${supply.gold}`);
        gameInstance.soundManager.playCollect('gold');
        gameInstance.grid[supply.y][supply.x] = 'floor';
        
        // ゴールド収集エフェクト
        gameInstance.renderManager.showFloatingText(supply.x, supply.y, `+${supply.gold}G`, '#ffaa00');
    }

    collectOxygenSupply(oxygenSupply, player, gameInstance) {
        oxygenSupply.taken = true;
        const oldOxygen = player.oxygen;
        player.oxygen = Math.min(player.maxOxygen, player.oxygen + oxygenSupply.oxygen);
        const actualOxygen = player.oxygen - oldOxygen;
        gameInstance.addCombatLog(`酸素コンテナを発見！ 酸素+${actualOxygen}`);
        gameInstance.soundManager.playCollect('oxygen');
        gameInstance.grid[oxygenSupply.y][oxygenSupply.x] = 'floor';
        
        // 酸素回復エフェクト
        gameInstance.renderManager.showFloatingText(oxygenSupply.x, oxygenSupply.y, `+${actualOxygen} O₂`, '#00aaff');
    }

    collectMedicalSupply(medicalSupply, player, gameInstance) {
        medicalSupply.taken = true;
        const oldHp = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + medicalSupply.healing);
        const actualHealing = player.hp - oldHp;
        gameInstance.addCombatLog(`医療コンテナを発見！ HP+${actualHealing}`);
        gameInstance.soundManager.playCollect('medical');
        gameInstance.grid[medicalSupply.y][medicalSupply.x] = 'floor';
        
        // 回復エフェクト
        gameInstance.renderManager.showFloatingText(medicalSupply.x, medicalSupply.y, `+${actualHealing} HP`, '#44ff44');
    }

    collectWeaponSupply(weaponSupply, player, gameInstance) {
        weaponSupply.taken = true;
        player.attack += weaponSupply.attackBonus;
        player.defense += weaponSupply.defenseBonus;
        gameInstance.addCombatLog(`武器コンテナを発見！ 攻撃力+${weaponSupply.attackBonus}, 防御力+${weaponSupply.defenseBonus}`);
        gameInstance.soundManager.playCollect('weapon');
        gameInstance.grid[weaponSupply.y][weaponSupply.x] = 'floor';
        
        // 武器強化エフェクト
        gameInstance.renderManager.showFloatingText(weaponSupply.x, weaponSupply.y, `ATK+${weaponSupply.attackBonus}`, '#ff8844');
        gameInstance.renderManager.showFloatingText(weaponSupply.x, weaponSupply.y, `DEF+${weaponSupply.defenseBonus}`, '#8844ff');
    }

    placeRangedWeaponContainers(gameInstance) {
        // デッキに応じた武器出現確率
        let weaponChances = {
            stun_gun: 0.3,    // 30% - 最も一般的
            plasma_cutter: 0.15, // 15% - 希少
            emergency_laser: 0.05  // 5% - 超希少
        };
        
        // 高層デッキでは出現率を上げる
        if (gameInstance.floor >= 5) {
            weaponChances.stun_gun = 0.4;
            weaponChances.plasma_cutter = 0.25;
        }
        if (gameInstance.floor >= 10) {
            weaponChances.emergency_laser = 0.1;
        }
        
        // 各武器タイプをチェック
        Object.entries(weaponChances).forEach(([weaponId, chance]) => {
            if (Math.random() < chance) {
                const weaponData = RANGED_WEAPONS[weaponId.toUpperCase()];
                const quantity = 1 + Math.floor(Math.random() * 2); // 1-2個
                
                this.placeItem('ranged-weapon-container', {
                    weaponId: weaponId,
                    weaponName: weaponData.name,
                    weaponIcon: weaponData.icon,
                    quantity: quantity,
                    taken: false
                }, gameInstance);
            }
        });
    }

    collectPowerChargeStation(chargeStation, player, gameInstance) {
        chargeStation.taken = true;
        const oldPower = player.power;
        player.power = Math.min(player.maxPower, player.power + chargeStation.powerRestore);
        const actualPowerRestore = player.power - oldPower;
        gameInstance.addCombatLog(`電力チャージステーションを使用！ 電力+${actualPowerRestore}`);
        gameInstance.soundManager.playCollect('item');
        gameInstance.grid[chargeStation.y][chargeStation.x] = 'floor';
        
        // 電力回復エフェクト
        gameInstance.renderManager.showFloatingText(chargeStation.x, chargeStation.y, `+${actualPowerRestore} ⚡`, '#ffcc00');
    }

    collectRangedWeaponContainer(weaponContainer, player, gameInstance) {
        weaponContainer.taken = true;
        
        // 遠距離武器をインベントリに追加
        const success = gameInstance.rangedWeaponManager.addWeapon(weaponContainer.weaponId, weaponContainer.quantity);
        
        if (success) {
            gameInstance.addCombatLog(`${weaponContainer.weaponIcon} ${weaponContainer.weaponName} ×${weaponContainer.quantity} を入手！`);
            gameInstance.soundManager.playCollect('weapon');
            gameInstance.grid[weaponContainer.y][weaponContainer.x] = 'floor';
            
            // 武器入手エフェクト
            gameInstance.renderManager.showFloatingText(weaponContainer.x, weaponContainer.y, `${weaponContainer.weaponIcon}×${weaponContainer.quantity}`, '#ff6600');
        }
    }
}