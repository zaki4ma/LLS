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

    updateStatus(gameInstance) {
        const player = gameInstance.playerManager.player;
        
        document.getElementById('player-hp').textContent = Math.max(0, player.hp);
        document.getElementById('player-maxhp').textContent = player.maxHp;
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
}