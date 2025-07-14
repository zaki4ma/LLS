class LevelGenerator {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.rooms = [];
        this.corridors = [];
    }

    generateLevel(gameInstance) {
        // グリッドを初期化
        gameInstance.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        gameInstance.visibleCells = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        gameInstance.exploredCells = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(null));
        
        // 部屋を生成
        this.generateRooms(gameInstance);
        
        // 隔壁を配置
        this.placeBulkheads(gameInstance);
        
        // プレイヤーを配置
        this.placePlayer(gameInstance);
        
        // 敵を配置
        gameInstance.enemyManager.placeAliens(gameInstance);
        
        // アイテムを配置
        gameInstance.itemManager.placeSupplies(gameInstance);
        gameInstance.itemManager.placeSpecialSupplies(gameInstance);
        
        // エレベーターを配置（デッキ20では配置しない - 最終マップ）
        if (gameInstance.floor < 20) {
            this.placeElevator(gameInstance);
        } else {
            gameInstance.addCombatLog('🏁 最終デッキ - エレベーターは機能していません');
        }
        
        // 視界を計算
        gameInstance.renderManager.calculateVisibility(gameInstance);
        
        gameInstance.addCombatLog(`デッキ${gameInstance.floor}に到着しました`);
    }

    generateRooms(gameInstance) {
        this.rooms = [];
        const roomCount = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < roomCount; i++) {
            let room;
            let attempts = 0;
            
            do {
                room = {
                    x: Math.floor(Math.random() * (this.gridSize - 8)) + 2,
                    y: Math.floor(Math.random() * (this.gridSize - 8)) + 2,
                    width: 3 + Math.floor(Math.random() * 4),
                    height: 3 + Math.floor(Math.random() * 4)
                };
                attempts++;
            } while (this.roomOverlaps(room) && attempts < 50);
            
            if (attempts < 50) {
                room.centerX = Math.floor(room.x + room.width / 2);
                room.centerY = Math.floor(room.y + room.height / 2);
                this.rooms.push(room);
                this.createRoom(room, gameInstance);
            }
        }
        
        this.connectRooms(gameInstance);
    }

    roomOverlaps(newRoom) {
        return this.rooms.some(room => 
            newRoom.x < room.x + room.width + 1 &&
            newRoom.x + newRoom.width + 1 > room.x &&
            newRoom.y < room.y + room.height + 1 &&
            newRoom.y + newRoom.height + 1 > room.y
        );
    }

    createRoom(room, gameInstance) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                gameInstance.grid[y][x] = 'floor';
            }
        }
    }

    connectRooms(gameInstance) {
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const roomA = this.rooms[i];
            const roomB = this.rooms[i + 1];
            this.carveCorridor(roomA.centerX, roomA.centerY, roomB.centerX, roomB.centerY, gameInstance);
        }
    }

    carveCorridor(x1, y1, x2, y2, gameInstance) {
        let currentX = x1;
        let currentY = y1;
        
        while (currentX !== x2) {
            if (gameInstance.grid[currentY] && gameInstance.grid[currentY][currentX] === null) {
                gameInstance.grid[currentY][currentX] = 'floor';
            }
            currentX += (currentX < x2) ? 1 : -1;
        }
        
        while (currentY !== y2) {
            if (gameInstance.grid[currentY] && gameInstance.grid[currentY][currentX] === null) {
                gameInstance.grid[currentY][currentX] = 'floor';
            }
            currentY += (currentY < y2) ? 1 : -1;
        }
        
        if (gameInstance.grid[currentY] && gameInstance.grid[currentY][currentX] === null) {
            gameInstance.grid[currentY][currentX] = 'floor';
        }
    }

    placeBulkheads(gameInstance) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (gameInstance.grid[y][x] === null) {
                    gameInstance.grid[y][x] = 'bulkhead';
                }
            }
        }
    }

    placePlayer(gameInstance) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 50) {
            if (this.rooms.length > 0) {
                const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
                const x = room.x + Math.floor(Math.random() * room.width);
                const y = room.y + Math.floor(Math.random() * room.height);
                
                if (gameInstance.grid[y][x] === 'floor') {
                    gameInstance.playerManager.player.x = x;
                    gameInstance.playerManager.player.y = y;
                    gameInstance.grid[y][x] = 'player';
                    placed = true;
                }
            }
            attempts++;
        }
    }

    placeElevator(gameInstance) {
        if (gameInstance.elevatorPlaced) return;
        
        if (this.rooms.length > 0) {
            // 十分な大きさの部屋を選択（最低3x3以上）
            const suitableRooms = this.rooms.filter(room => room.width >= 3 && room.height >= 3);
            if (suitableRooms.length === 0) {
                // 適切な部屋がない場合は元の方法にフォールバック
                this.placeElevatorFallback(gameInstance);
                return;
            }
            
            const room = suitableRooms[Math.floor(Math.random() * suitableRooms.length)];
            let x, y;
            let attempts = 0;
            let placed = false;
            
            // 部屋の壁から1マス離れた場所に配置
            do {
                // 部屋の内側の範囲で、壁から1マス離れた場所を選択
                x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
                y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
                attempts++;
                
                // 配置予定位置が床であることを確認
                if (gameInstance.grid[y][x] === 'floor') {
                    // 周囲8マスが通路（corridor）でないことを確認
                    if (this.isValidElevatorPosition(x, y, gameInstance)) {
                        gameInstance.grid[y][x] = 'elevator';
                        gameInstance.elevatorPlaced = true;
                        gameInstance.addCombatLog('エレベーターが利用可能！ >キーで次のデッキへ');
                        placed = true;
                    }
                }
            } while (!placed && attempts < 50);
            
            // 配置に失敗した場合はフォールバック
            if (!placed) {
                this.placeElevatorFallback(gameInstance);
            }
        }
    }
    
    // 従来の配置方法（フォールバック）
    placeElevatorFallback(gameInstance) {
        if (this.rooms.length > 0) {
            const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            let x, y;
            let attempts = 0;
            
            do {
                x = room.x + Math.floor(Math.random() * room.width);
                y = room.y + Math.floor(Math.random() * room.height);
                attempts++;
            } while (gameInstance.grid[y][x] !== 'floor' && attempts < 20);
            
            if (attempts < 20) {
                gameInstance.grid[y][x] = 'elevator';
                gameInstance.elevatorPlaced = true;
                gameInstance.addCombatLog('エレベーターが利用可能！ >キーで次のデッキへ');
            }
        }
    }
    
    // エレベーター配置位置の妥当性チェック
    isValidElevatorPosition(x, y, gameInstance) {
        // 周囲8マスをチェック
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // 中心は除外
                
                const checkX = x + dx;
                const checkY = y + dy;
                
                // 境界チェック
                if (checkX < 0 || checkX >= this.gridSize || checkY < 0 || checkY >= this.gridSize) {
                    continue;
                }
                
                // 周囲に通路がある場合は不適切
                if (this.isCorridorPosition(checkX, checkY, gameInstance)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 通路位置かどうかの判定
    isCorridorPosition(x, y, gameInstance) {
        if (gameInstance.grid[y][x] !== 'floor') return false;
        
        // 部屋の中かどうかをチェック
        for (const room of this.rooms) {
            if (x >= room.x && x < room.x + room.width &&
                y >= room.y && y < room.y + room.height) {
                return false; // 部屋の中なので通路ではない
            }
        }
        
        return true; // 部屋の外の床 = 通路
    }

    getRooms() {
        return this.rooms;
    }
}