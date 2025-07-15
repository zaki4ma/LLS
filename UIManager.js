class UIManager {
    constructor() {
        this.gameInstance = null;
    }

    init(gameInstance) {
        console.log('UIManager init starting...');
        this.gameInstance = gameInstance;
        // グローバル参照を設定
        window.uiManager = this;
        console.log('UIManager init completed');
    }

    addCombatLog(message) {
        const logElement = document.getElementById('combat-log');
        if (logElement) {
            logElement.innerHTML += '<div>' + message + '</div>';
            logElement.scrollTop = logElement.scrollHeight;
        }
    }

    updateQualitativeUpgradeStatus(gameInstance) {
        if (!gameInstance.qualitativeUpgradeManager) return;
        
        const levels = gameInstance.qualitativeUpgradeManager.getCurrentLevels();
        
        // チェインストライク
        const chainElement = document.getElementById('chain-strike-status');
        if (chainElement) {
            chainElement.className = 'upgrade-status-item';
            if (levels.chainStrike > 0) {
                chainElement.classList.add(`level-${levels.chainStrike}`);
            }
            chainElement.querySelector('.upgrade-level').textContent = `Lv.${levels.chainStrike}`;
        }
        
        // カウンターアタック
        const counterElement = document.getElementById('counter-attack-status');
        if (counterElement) {
            counterElement.className = 'upgrade-status-item';
            if (levels.counterAttack > 0) {
                counterElement.classList.add(`level-${levels.counterAttack}`);
            }
            counterElement.querySelector('.upgrade-level').textContent = `Lv.${levels.counterAttack}`;
        }
        
        // オートリペア
        const repairElement = document.getElementById('auto-repair-status');
        if (repairElement) {
            repairElement.className = 'upgrade-status-item';
            if (levels.autoRepair > 0) {
                repairElement.classList.add(`level-${levels.autoRepair}`);
            }
            repairElement.querySelector('.upgrade-level').textContent = `Lv.${levels.autoRepair}`;
        }
    }
    
    openUpgradeModal(gameInstance) {
        const modal = document.getElementById('upgrade-modal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        this.updateUpgradeModalContent(gameInstance);
    }
    
    closeUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    updateUpgradeModalContent(gameInstance) {
        // Gold表示を更新
        const goldDisplay = document.getElementById('modal-gold-display');
        if (goldDisplay) {
            goldDisplay.textContent = gameInstance.playerManager.player.gold;
        }
        
        // 相乗効果表示を更新
        const synergyDisplay = document.getElementById('synergy-status');
        if (synergyDisplay && gameInstance.qualitativeUpgradeManager) {
            const synergy = gameInstance.qualitativeUpgradeManager.getSynergyBonus(gameInstance);
            const progress = gameInstance.qualitativeUpgradeManager.getUpgradeProgress();
            
            if (synergy.active) {
                synergyDisplay.innerHTML = `
                    <div style="background: linear-gradient(135deg, #404020 0%, #505030 100%); border: 2px solid #ffaa00; padding: 8px; border-radius: 5px;">
                        <div style="color: #ffaa00; font-weight: bold; margin-bottom: 5px;">✨ ${synergy.name}</div>
                        <div style="color: #ccc; font-size: 12px;">${synergy.description}</div>
                    </div>
                `;
            } else {
                synergyDisplay.innerHTML = `
                    <div style="color: #888; font-size: 12px;">
                        相乗効果: 無し (特殊能力を組み合わせてボーナスを獲得しよう！)<br>
                        進行状況: ${progress.current}/${progress.max} (${progress.percentage}%)
                    </div>
                `;
            }
        }
        
        // 質的アップグレードセクションを更新
        const qualitativeGrid = document.getElementById('qualitative-upgrades-grid');
        if (qualitativeGrid) {
            qualitativeGrid.innerHTML = '';
            
            const upgrades = gameInstance.qualitativeUpgradeManager.getAvailableUpgrades(gameInstance);
            
            // 各アップグレードタイプ（チェインストライク、カウンター、オートリペア）について
            ['chain_strike', 'counter_attack', 'auto_repair'].forEach(upgradeId => {
                const upgrade = QUALITATIVE_UPGRADES[upgradeId];
                const currentLevel = gameInstance.qualitativeUpgradeManager.purchasedUpgrades[upgradeId];
                
                const card = document.createElement('div');
                card.className = 'upgrade-card';
                
                if (currentLevel >= upgrade.levels.length) {
                    card.classList.add('maxed');
                }
                
                const icon = upgradeId === 'chain_strike' ? '⚡' : 
                           upgradeId === 'counter_attack' ? '🛡️' : '🔧';
                
                let levelInfo = '';
                let description = '';
                let cost = 0;
                let canPurchase = false;
                
                if (currentLevel < upgrade.levels.length) {
                    const nextLevel = upgrade.levels[currentLevel];
                    levelInfo = `Lv.${currentLevel} → Lv.${currentLevel + 1}`;
                    description = nextLevel.description;
                    cost = nextLevel.cost;
                    canPurchase = gameInstance.playerManager.player.gold >= cost && 
                                 gameInstance.floor >= nextLevel.unlockFloor;
                    
                    if (gameInstance.floor < nextLevel.unlockFloor) {
                        card.classList.add('locked');
                    }
                } else {
                    levelInfo = `Lv.${currentLevel} (MAX)`;
                    description = upgrade.levels[currentLevel - 1].description;
                }
                
                card.innerHTML = `
                    <div class="upgrade-card-icon">${icon}</div>
                    <div class="upgrade-card-name">${upgrade.name}</div>
                    <div class="upgrade-card-description">${description}</div>
                    <div class="upgrade-card-level">
                        <span>${levelInfo}</span>
                        <div class="upgrade-level-bar">
                            <div class="upgrade-level-fill" style="width: ${(currentLevel / upgrade.levels.length) * 100}%"></div>
                        </div>
                    </div>
                    ${currentLevel < upgrade.levels.length ? `
                        <div class="upgrade-card-cost">${cost} Gold</div>
                        <button class="upgrade-card-btn ${canPurchase ? '' : 'disabled'}" 
                                ${canPurchase ? '' : 'disabled'}
                                onclick="game.uiManager.purchaseQualitativeUpgrade('${upgradeId}', game)">
                            ${canPurchase ? '購入' : (gameInstance.floor < upgrade.levels[currentLevel].unlockFloor ? `デッキ${upgrade.levels[currentLevel].unlockFloor}で解放` : 'Gold不足')}
                        </button>
                    ` : `
                        <button class="upgrade-card-btn maxed" disabled>最大レベル</button>
                    `}
                `;
                
                qualitativeGrid.appendChild(card);
            });
        }
    }
    
    purchaseQualitativeUpgrade(upgradeId, gameInstance) {
        const result = gameInstance.qualitativeUpgradeManager.purchaseUpgrade(upgradeId, gameInstance);
        
        if (result.success) {
            // 購入成功のエフェクト
            gameInstance.addCombatLog(`✨ ${result.message}`);
            
            if (gameInstance.soundManager) {
                gameInstance.soundManager.playSound('upgrade_purchased');
            }
            
            // UIを更新
            this.updateUpgradeModalContent(gameInstance);
            this.updateQualitativeUpgradeStatus(gameInstance);
            this.updateStatus(gameInstance);
            
            // 購入エフェクトを表示
            this.showUpgradePurchaseEffect(upgradeId);
        } else {
            gameInstance.addCombatLog(`❌ ${result.message}`);
        }
    }
    
    showUpgradePurchaseEffect(upgradeId) {
        // 購入時の視覚効果
        if (this.gameInstance && this.gameInstance.renderManager && this.gameInstance.playerManager) {
            const player = this.gameInstance.playerManager.player;
            this.gameInstance.renderManager.showUpgradeEffect(player.x, player.y);
        }
        
        // アップグレードアイコンにパルスエフェクトを追加
        const statusId = upgradeId.replace('_', '-') + '-status';
        const statusElement = document.getElementById(statusId);
        if (statusElement) {
            statusElement.style.animation = 'pulseEffect 0.6s ease-out';
            setTimeout(() => {
                statusElement.style.animation = '';
            }, 600);
        }
    }

    updateStatus(gameInstance) {
        const player = gameInstance.playerManager.player;
        
        document.getElementById('player-hp').textContent = Math.max(0, player.hp);
        document.getElementById('player-maxhp').textContent = player.maxHp;
        document.getElementById('player-shields').textContent = player.shields;
        document.getElementById('player-level').textContent = player.level;
        document.getElementById('player-attack').textContent = player.attack;
        document.getElementById('player-defense').textContent = player.defense;
        document.getElementById('player-critical').textContent = Math.floor(player.criticalChance * 100);
        document.getElementById('player-gold').textContent = player.gold;
        
        // 回避率表示の更新（安全性チェック付き）
        try {
            if (gameInstance.dodgeSystem && gameInstance.enemyManager && gameInstance.playerManager) {
                const dodgeChance = gameInstance.dodgeSystem.calculatePlayerDodgeChance(gameInstance);
                const consecutiveDodges = gameInstance.dodgeSystem.playerConsecutiveDodges;
                
                document.getElementById('player-dodge').textContent = dodgeChance.toFixed(1);
                document.getElementById('consecutive-dodges').textContent = consecutiveDodges;
                
                // 連続回避が制限に近づいたら警告色
                const dodgeElement = document.getElementById('consecutive-dodges');
                if (consecutiveDodges >= DODGE_SYSTEM.conditions.maxConsecutiveDodges) {
                    dodgeElement.style.color = '#ff8888';
                } else {
                    dodgeElement.style.color = '#ffcc00';
                }
            } else {
                // 初期化中はデフォルト値を表示
                document.getElementById('player-dodge').textContent = '15.0';
                document.getElementById('consecutive-dodges').textContent = '0';
            }
        } catch (error) {
            console.warn('Dodge system update error:', error);
            document.getElementById('player-dodge').textContent = '15.0';
            document.getElementById('consecutive-dodges').textContent = '0';
        }
        
        document.getElementById('player-exp').textContent = player.exp;
        document.getElementById('player-expnext').textContent = player.expToNext;
        document.getElementById('aliens-alive').textContent = gameInstance.aliens.filter(a => a.alive).length;
        document.getElementById('floor').textContent = gameInstance.floor;
        document.getElementById('player-oxygen').textContent = Math.max(0, player.oxygen);
        document.getElementById('player-maxoxygen').textContent = player.maxOxygen;
        document.getElementById('player-power').textContent = Math.max(0, player.power);
        document.getElementById('player-maxpower').textContent = player.maxPower;
        document.getElementById('turn-count').textContent = gameInstance.turnCount;
        
        const expPercentage = (player.exp / player.expToNext) * 100;
        document.getElementById('exp-fill').style.width = expPercentage + '%';
        
        // 体力バーの更新
        const healthPercentage = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        const healthBarFill = document.getElementById('health-bar-fill');
        if (healthBarFill) {
            console.log(`Health bar update: ${player.hp}/${player.maxHp} = ${healthPercentage}%`);
            healthBarFill.style.setProperty('width', healthPercentage + '%', 'important');
            if (healthPercentage <= 25) {
                healthBarFill.style.background = 'linear-gradient(90deg, #ff0000 0%, #ff4444 50%, #ff0000 100%)';
                healthBarFill.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
            } else if (healthPercentage <= 50) {
                healthBarFill.style.background = 'linear-gradient(90deg, #ff8800 0%, #ffaa00 50%, #ff8800 100%)';
                healthBarFill.style.boxShadow = '0 0 10px rgba(255, 136, 0, 0.6)';
            } else {
                healthBarFill.style.background = 'linear-gradient(90deg, #00ff00 0%, #44ff44 50%, #00ff00 100%)';
                healthBarFill.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
            }
        } else {
            console.error('Health bar fill element not found');
        }
        
        // 酸素バーの更新
        const oxygenPercentage = Math.max(0, Math.min(100, (player.oxygen / player.maxOxygen) * 100));
        const oxygenBarFill = document.getElementById('oxygen-bar-fill');
        if (oxygenBarFill) {
            console.log(`Oxygen bar update: ${player.oxygen}/${player.maxOxygen} = ${oxygenPercentage}%`);
            oxygenBarFill.style.setProperty('width', oxygenPercentage + '%', 'important');
            oxygenBarFill.classList.remove('warning', 'critical');
            
            if (oxygenPercentage <= 15) {
                oxygenBarFill.classList.add('critical');
            } else if (oxygenPercentage <= 30) {
                oxygenBarFill.classList.add('warning');
            } else {
                oxygenBarFill.style.background = 'linear-gradient(90deg, #0088ff 0%, #00aaff 50%, #0088ff 100%)';
            }
        } else {
            console.error('Oxygen bar fill element not found');
        }
        
        // 電力バーの更新
        const powerPercentage = Math.max(0, Math.min(100, (player.power / player.maxPower) * 100));
        const powerBarFill = document.getElementById('power-bar-fill');
        if (powerBarFill) {
            console.log(`Power bar update: ${player.power}/${player.maxPower} = ${powerPercentage}%`);
            powerBarFill.style.setProperty('width', powerPercentage + '%', 'important');
            powerBarFill.classList.remove('warning', 'critical');
            
            if (powerPercentage <= 15) {
                powerBarFill.classList.add('critical');
            } else if (powerPercentage <= 30) {
                powerBarFill.classList.add('warning');
            } else {
                powerBarFill.style.background = 'linear-gradient(90deg, #ffaa00 0%, #ffcc00 50%, #ffaa00 100%)';
            }
        } else {
            console.error('Power bar fill element not found');
        }
        
        // スコア更新
        gameInstance.currentScore = gameInstance.aliensKilled * 100 + player.gold + gameInstance.floor * 50;
        document.getElementById('current-score').textContent = gameInstance.currentScore.toLocaleString();
        document.getElementById('aliens-killed').textContent = gameInstance.aliensKilled;
        
        this.updateFloorDisplay();
        this.updateAbilitiesDisplay(gameInstance);
        this.updateRangedWeaponsDisplay(gameInstance);
        this.updateQualitativeUpgradeStatus(gameInstance);
        
        // 相乗効果の表示更新
        this.updateSynergyStatus(gameInstance);
    }
    
    updateSynergyStatus(gameInstance) {
        if (!gameInstance.qualitativeUpgradeManager) return;
        
        const synergy = gameInstance.qualitativeUpgradeManager.getSynergyBonus(gameInstance);
        const progress = gameInstance.qualitativeUpgradeManager.getUpgradeProgress();
        
        // 相乗効果ステータス表示を更新（将来的に実装）
        console.log('相乗効果ステータス:', synergy);
        console.log('アップグレード進行状況:', progress);
    }

    updateFloorDisplay() {
        const floorElement = document.getElementById('floor');
        if (floorElement) {
            floorElement.style.animation = 'none';
            setTimeout(() => {
                floorElement.style.animation = 'elevatorGlow 2s ease-in-out';
            }, 10);
        }
    }

    updateAbilitiesDisplay(gameInstance) {
        const abilitiesStatus = document.getElementById('abilities-status');
        if (!abilitiesStatus) return;
        
        const unlockedAbilities = [];
        const player = gameInstance.playerManager.player;
        
        for (const [key, ability] of Object.entries(player.abilities)) {
            if (ability.unlocked) {
                const abilityData = ABILITIES[key];
                if (abilityData) {
                    if (abilityData.passive) {
                        unlockedAbilities.push(`${abilityData.name} (パッシブ)`);
                    } else {
                        let statusInfo = `${abilityData.name} (${abilityData.key}キー): ${ability.uses}/${ability.maxUses}`;
                        // シールドの場合、アクティブ時の残りターン数を表示
                        if (key === 'shield' && player.shieldActive) {
                            statusInfo += ` [アクティブ: ${player.shieldDuration}ターン]`;
                        }
                        unlockedAbilities.push(statusInfo);
                    }
                }
            }
        }
        
        if (unlockedAbilities.length === 0) {
            abilitiesStatus.innerHTML = '<div style="color: #888;">購入済みアップグレードなし</div>';
        } else {
            abilitiesStatus.innerHTML = unlockedAbilities.map(ability => 
                `<div style="color: #44ff44; margin: 2px 0;">${ability}</div>`
            ).join('');
        }
    }

    showBestiary(gameInstance) {
        const encountered = Array.from(gameInstance.encounteredEnemies);
        let bestiaryHTML = '<div style="max-height: 400px; overflow-y: auto;">';
        bestiaryHTML += '<h3 style="color: #00ffff; text-align: center; margin-bottom: 20px;">👽 敵図鑑</h3>';
        
        if (encountered.length === 0) {
            bestiaryHTML += '<p style="text-align: center; color: #888;">まだ敵と遭遇していません</p>';
        } else {
            Object.entries(ALIEN_TYPES).forEach(([typeKey, typeData]) => {
                if (encountered.includes(typeKey)) {
                    bestiaryHTML += `
                        <div style="border: 1px solid #00aaff; margin: 10px 0; padding: 10px; border-radius: 5px;">
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <span style="font-size: 24px; color: ${typeData.color}; margin-right: 10px; text-shadow: 0 0 10px ${typeData.color};">${typeData.symbol}</span>
                                <strong style="color: ${typeData.color};">${typeData.name}</strong>
                            </div>
                            <p style="margin: 5px 0; color: #ccc; font-size: 12px;">${typeData.description}</p>
                            <div style="font-size: 11px; color: #888;">
                                探知範囲: ${typeData.detectionRange} • 出現デッキ: ${typeData.minFloor}+
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        bestiaryHTML += '</div>';
        this.showModal('敵図鑑', bestiaryHTML);
    }

    showRanking(gameInstance) {
        const rankings = gameInstance.rankingManager.getRankings();
        let rankingHTML = '<div style="max-height: 400px; overflow-y: auto;">';
        rankingHTML += '<h3 style="color: #ffaa00; text-align: center; margin-bottom: 20px;">🏆 ハイスコアランキング</h3>';
        
        if (rankings.length === 0) {
            rankingHTML += '<p style="text-align: center; color: #888;">まだスコアが記録されていません</p>';
        } else {
            rankingHTML += '<table style="width: 100%; border-collapse: collapse;">';
            rankingHTML += '<tr style="border-bottom: 1px solid #00aaff;"><th style="padding: 5px; color: #00ffff;">順位</th><th style="padding: 5px; color: #00ffff;">名前</th><th style="padding: 5px; color: #00ffff;">スコア</th><th style="padding: 5px; color: #00ffff;">デッキ</th><th style="padding: 5px; color: #00ffff;">日付</th></tr>';
            
            rankings.forEach((entry, index) => {
                const rankColor = index < 3 ? ['#ffdd00', '#cccccc', '#cd7f32'][index] : '#ffffff';
                rankingHTML += `
                    <tr style="border-bottom: 1px solid #333;">
                        <td style="padding: 5px; text-align: center; color: ${rankColor}; font-weight: bold;">${index + 1}</td>
                        <td style="padding: 5px; text-align: center; color: #ffffff;">${entry.name}</td>
                        <td style="padding: 5px; text-align: center; color: #ffaa00;">${entry.score.toLocaleString()}</td>
                        <td style="padding: 5px; text-align: center; color: #00aaff;">${entry.floor}</td>
                        <td style="padding: 5px; text-align: center; color: #888; font-size: 11px;">${entry.date}</td>
                    </tr>
                `;
            });
            
            rankingHTML += '</table>';
        }
        
        rankingHTML += '</div>';
        this.showModal('ハイスコアランキング', rankingHTML);
    }

    updateRangedWeaponsDisplay(gameInstance) {
        const weaponsDisplay = document.getElementById('ranged-weapons-inventory');
        if (!weaponsDisplay) {
            console.warn('ranged-weapons-inventory element not found');
            return;
        }
        
        const inventory = gameInstance.rangedWeaponManager.getWeaponInventory();
        console.log('Updating weapons display with inventory:', inventory);
        
        let weaponsHTML = '';
        let hasWeapons = false;
        
        let keyNumber = 1;
        Object.entries(inventory).forEach(([weaponId, count]) => {
            console.log(`Processing weapon: ${weaponId}, count: ${count}`);
            if (count > 0) {
                hasWeapons = true;
                const weaponData = gameInstance.rangedWeaponManager.getWeaponData(weaponId);
                console.log(`Weapon data for ${weaponId}:`, weaponData);
                if (weaponData) {
                    weaponsHTML += `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                            <span style="color: #ff6600;">[${keyNumber}] ${weaponData.icon} ${weaponData.name}</span>
                            <span style="color: #ffaa00; font-weight: bold;">×${count}</span>
                        </div>
                        <div style="color: #888; font-size: 11px; margin-bottom: 5px;">
                            射程: ${weaponData.range} / 威力: ${weaponData.damage} / 電力: ${weaponData.powerCost}
                        </div>
                    `;
                    keyNumber++;
                } else {
                    console.warn(`No weapon data found for ${weaponId}`);
                }
            }
        });
        
        if (!hasWeapons) {
            weaponsHTML = '<div style="color: #888;">武器なし</div>';
        }
        
        console.log('Final weapons HTML:', weaponsHTML);
        weaponsDisplay.innerHTML = weaponsHTML;
    }

    showUpgradeGuide() {
        const guideHTML = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h3 style="color: #44ff44; text-align: center; margin-bottom: 20px;">🔧 アップグレード操作方法</h3>
                
                <div style="margin: 15px 0;">
                    <h4 style="color: #00ffff; margin-bottom: 10px;">⚡ アクティブ特殊能力</h4>
                    <p style="color: #ccc; margin: 5px 0; font-size: 13px;">エレベーターで対応するキーを押して購入：</p>
                    <div style="font-size: 12px;">
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #333; border-radius: 4px;">
                            <strong style="color: #88ff88;">基本能力 (デッキ1+)</strong><br>
                            <span style="color: #ccc;">• エマージェンシーテレポート [T] - 80 Gold</span><br>
                            <span style="color: #ccc;">• シールドジェネレーター [E] - 100 Gold</span>
                        </div>
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #333; border-radius: 4px;">
                            <strong style="color: #ffaa88;">中級能力 (デッキ3+)</strong><br>
                            <span style="color: #ccc;">• エナジーブラスト [Q] - 200 Gold</span><br>
                            <span style="color: #ccc;">• ハッキングツール [H] - 150 Gold</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin: 15px 0;">
                    <h4 style="color: #00ffff; margin-bottom: 10px;">🔧 パッシブ特殊能力</h4>
                    <p style="color: #ccc; margin: 5px 0; font-size: 13px;">エレベーターで対応する数字キーを押して購入：</p>
                    <div style="font-size: 12px;">
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #333; border-radius: 4px;">
                            <strong style="color: #ffaa88;">中級能力 (デッキ3+)</strong><br>
                            <span style="color: #ccc;">• 酸素リサイクラー [5] - 300 Gold</span>
                        </div>
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #333; border-radius: 4px;">
                            <strong style="color: #ff8888;">上級能力 (デッキ6+)</strong><br>
                            <span style="color: #ccc;">• オートメディック [6] - 350 Gold</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin: 15px 0;">
                    <h4 style="color: #ff8800; margin-bottom: 10px;">⭐ 特殊能力（質的アップグレード）</h4>
                    <p style="color: #ccc; margin: 5px 0; font-size: 13px;">エレベーターで対応するキーを押して購入（最大3レベルまで強化可能）：</p>
                    <div style="font-size: 12px;">
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #ff8800; border-radius: 4px; background: rgba(255, 136, 0, 0.1);">
                            <strong style="color: #ffaa00;">チェインストライク [C]</strong><br>
                            <span style="color: #ccc;">• 弱った敵を擊破時に追加行動を獲得</span><br>
                            <span style="color: #ffaa00;">Lv1: 100G → Lv2: 200G → Lv3: 350G</span>
                        </div>
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #ff8800; border-radius: 4px; background: rgba(255, 136, 0, 0.1);">
                            <strong style="color: #ffaa00;">カウンターアタック [X]</strong><br>
                            <span style="color: #ccc;">• 被攻撃時に自動で反撃してダメージを与える</span><br>
                            <span style="color: #ffaa00;">Lv1: 120G → Lv2: 250G → Lv3: 400G</span>
                        </div>
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #ff8800; border-radius: 4px; background: rgba(255, 136, 0, 0.1);">
                            <strong style="color: #ffaa00;">オートリペア [R]</strong><br>
                            <span style="color: #ccc;">• シールドが時間経過で自動回復する</span><br>
                            <span style="color: #ffaa00;">Lv1: 150G → Lv2: 280G → Lv3: 450G</span>
                        </div>
                    </div>
                </div>
                
                <div style="margin: 15px 0;">
                    <h4 style="color: #00ffff; margin-bottom: 10px;">🎮 エレベーター操作</h4>
                    <ul style="color: #ccc; margin-left: 20px; font-size: 12px;">
                        <li><strong style="color: #00ffff;">[>]</strong> - 次のデッキに進む</li>
                        <li><strong style="color: #ffaa00;">[ESC]</strong> - アップグレードメニューを終了</li>
                    </ul>
                </div>
            </div>
        `;
        
        this.showModal('アップグレード操作方法', guideHTML);
    }

    showGameOverModal(scoreData) {
        const gameOverHTML = `
            <div style="text-align: center;">
                <h2 style="color: #ff4444; margin-bottom: 20px; text-shadow: 0 0 10px #ff4444;">💀 GAME OVER 💀</h2>
                
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #ffaa00; margin-bottom: 15px;">📊 最終スコア</h3>
                    <div style="font-size: 18px; margin: 10px 0;">
                        <span style="color: #00ffff;">スコア: </span>
                        <span style="color: #ffaa00; font-weight: bold;">${scoreData.score.toLocaleString()}</span>
                    </div>
                    <div style="font-size: 14px; color: #ccc; margin: 5px 0;">
                        <span>到達デッキ: ${scoreData.floor}</span> | 
                        <span>撃破敵: ${scoreData.aliensKilled}</span> | 
                        <span>収集Gold: ${scoreData.totalGold}</span>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <h4 style="color: #ffaa00; margin-bottom: 10px;">🏆 ランキング登録</h4>
                    <p style="color: #ccc; font-size: 12px; margin-bottom: 10px;">名前を入力してください（最大3文字）：</p>
                    <input type="text" id="player-name-input" maxlength="3" placeholder="PLR" style="
                        background: #1a1a2e;
                        color: #ffffff;
                        border: 1px solid #00ffff;
                        padding: 10px;
                        border-radius: 5px;
                        font-size: 16px;
                        text-align: center;
                        width: 80px;
                        margin: 0 10px;
                    ">
                    <button onclick="window.uiManager.registerScore()" style="
                        background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
                        color: #ffffff;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                        margin: 0 5px;
                    ">登録</button>
                </div>
                
                <div style="margin-top: 30px;">
                    <button onclick="location.reload()" style="
                        background: linear-gradient(135deg, #00aaff 0%, #0088cc 100%);
                        color: #ffffff;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        margin: 0 10px;
                        box-shadow: 0 4px 8px rgba(0, 170, 255, 0.3);
                    ">🔄 リスタート</button>
                    <button onclick="game.showRanking()" style="
                        background: linear-gradient(135deg, #ffaa00 0%, #ff8800 100%);
                        color: #ffffff;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        margin: 0 10px;
                        box-shadow: 0 4px 8px rgba(255, 170, 0, 0.3);
                    ">🏆 ランキング</button>
                </div>
            </div>
        `;
        
        this.showModal('ゲームオーバー', gameOverHTML);
        
        // スコアデータを保存し、登録ボタンのイベントを設定
        this.pendingScoreData = scoreData;
        
        // 名前入力フィールドにフォーカス
        setTimeout(() => {
            const nameInput = document.getElementById('player-name-input');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }, 100);
    }

    registerScore() {
        const nameInput = document.getElementById('player-name-input');
        const playerName = nameInput ? nameInput.value.trim() || 'PLR' : 'PLR';
        
        if (this.pendingScoreData) {
            // ランキングに登録
            const rank = this.gameInstance.rankingManager.addScore(playerName, this.pendingScoreData.score, this.pendingScoreData.floor);
            
            // 登録完了メッセージを表示
            const nameSection = nameInput.parentElement;
            nameSection.innerHTML = `
                <p style="color: #00ff88; font-weight: bold; margin: 10px 0;">
                    🎉 ${playerName} として${rank}位に登録されました！
                </p>
            `;
            
            this.pendingScoreData = null;
        }
    }

    showModal(title, content) {
        // モーダル要素を作成
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #0a1420 0%, #1a2540 100%);
            border: 2px solid #00aaff;
            border-radius: 10px;
            padding: 20px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 30px rgba(0, 170, 255, 0.5);
            color: #ffffff;
        `;
        
        modalContent.innerHTML = content + `
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="this.closest('.modal').remove()" style="
                    background: #ff4444;
                    color: #ffffff;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">閉じる</button>
            </div>
        `;
        
        modal.className = 'modal';
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // ESCキーで閉じる
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
        
        // 背景クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
    }
    
    // 質的アップグレード表示の更新
    updateQualitativeUpgradesDisplay(gameInstance) {
        if (!gameInstance.qualitativeUpgradeManager) return;
        
        const levels = gameInstance.qualitativeUpgradeManager.getCurrentLevels();
        
        // チェインストライク
        const chainElement = document.getElementById('chain-strike-level');
        if (chainElement) {
            if (levels.chainStrike > 0) {
                chainElement.textContent = `Lv.${levels.chainStrike}`;
                chainElement.style.color = '#ffaa00';
                chainElement.style.textShadow = '0 0 5px #ffaa00';
            } else {
                chainElement.textContent = '未習得';
                chainElement.style.color = '#666666';
                chainElement.style.textShadow = 'none';
            }
        }
        
        // カウンターアタック
        const counterElement = document.getElementById('counter-attack-level');
        if (counterElement) {
            if (levels.counterAttack > 0) {
                counterElement.textContent = `Lv.${levels.counterAttack}`;
                counterElement.style.color = '#ff0088';
                counterElement.style.textShadow = '0 0 5px #ff0088';
            } else {
                counterElement.textContent = '未習得';
                counterElement.style.color = '#666666';
                counterElement.style.textShadow = 'none';
            }
        }
        
        // オートリペア
        const repairElement = document.getElementById('auto-repair-level');
        if (repairElement) {
            if (levels.autoRepair > 0) {
                repairElement.textContent = `Lv.${levels.autoRepair}`;
                repairElement.style.color = '#00aaff';
                repairElement.style.textShadow = '0 0 5px #00aaff';
            } else {
                repairElement.textContent = '未習得';
                repairElement.style.color = '#666666';
                repairElement.style.textShadow = 'none';
            }
        }
    }
}