class ItemManager {
    constructor() {
        this.supplies = [];
        this.oxygenSupplies = [];
        this.medicalSupplies = [];
        this.weaponSupplies = [];
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
        
        gameInstance.oxygenSupplies = this.oxygenSupplies;
        gameInstance.medicalSupplies = this.medicalSupplies;
        gameInstance.weaponSupplies = this.weaponSupplies;
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
}