class BGMManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.currentTrack = null;
        this.tracks = {};
        this.fadeTransition = false;
        this.fadeDuration = 2000; // 2秒でフェード
        
        // デッキ別BGM設定
        this.deckBGMMapping = {
            1: 'beginning',      // デッキ1-5: beginning.mp3
            2: 'beginning',
            3: 'beginning',
            4: 'beginning',
            5: 'beginning',
            6: 'darkzone',       // デッキ6-10: darkzone.mp3
            7: 'darkzone',
            8: 'darkzone',
            9: 'darkzone',
            10: 'darkzone',
            11: 'danger_area',   // デッキ11-14: danger_area.mp3
            12: 'danger_area',
            13: 'danger_area',
            14: 'danger_area',
            15: 'tension',       // デッキ15-19: tension.mp3
            16: 'tension',
            17: 'tension',
            18: 'tension',
            19: 'tension',
            20: 'engine_room'    // デッキ20: engine_room.mp3
        };
        
        this.initialized = false;
    }
    
    async init() {
        try {
            console.log('BGMManager initialization starting...');
            
            // MP3ファイルを使用するトラックの設定
            this.loadMp3Track('beginning', 'sound/bgm/beginning.mp3');
            this.loadMp3Track('darkzone', 'sound/bgm/darkzone.mp3');
            this.loadMp3Track('danger_area', 'sound/bgm/danger_area.mp3');
            this.loadMp3Track('tension', 'sound/bgm/tension.mp3');
            this.loadMp3Track('engine_room', 'sound/bgm/engine_room.mp3');
            this.loadMp3Track('ending_gameover', 'sound/bgm/ending_gameover.mp3');
            
            this.initialized = true;
            console.log('BGMManager initialized successfully');
            
            // デバッグ用：グローバルアクセス
            window.bgmManager = this;
            
        } catch (error) {
            console.warn('BGMManager initialization failed:', error);
        }
    }
    
    loadMp3Track(trackName, filePath) {
        try {
            // ending_gameover.mp3はループしない
            const shouldLoop = trackName !== 'ending_gameover';
            
            this.tracks[trackName] = new Howl({
                src: [filePath],
                loop: shouldLoop,
                volume: 0, // 初期音量は0（フェードイン用）
                preload: true,
                onload: () => {
                    console.log(`BGM track '${trackName}' loaded successfully`);
                },
                onloaderror: (id, error) => {
                    console.warn(`Failed to load BGM track '${trackName}':`, error);
                },
                onplay: () => {
                    console.log(`BGM track '${trackName}' started playing`);
                },
                onstop: () => {
                    console.log(`BGM track '${trackName}' stopped`);
                },
                onend: () => {
                    if (trackName === 'ending_gameover') {
                        console.log(`${trackName} finished playing (no loop)`);
                    }
                }
            });
        } catch (error) {
            console.warn(`Error creating Howl for '${trackName}':`, error);
        }
    }
    
    changeBGM(floor) {
        if (!this.enabled || !this.initialized) return;
        
        const targetTrack = this.deckBGMMapping[floor] || 'beginning';
        
        // 同じトラックの場合は何もしない
        if (this.currentTrack === targetTrack) return;
        
        console.log(`BGM changing from '${this.currentTrack}' to '${targetTrack}' (Floor ${floor})`);
        
        // MP3トラックが存在する場合
        if (this.tracks[targetTrack]) {
            this.switchToMp3Track(targetTrack);
        } else {
            // MP3トラックが存在しない場合はTone.jsにフォールバック
            this.switchToToneJS(targetTrack, floor);
        }
    }
    
    switchToMp3Track(trackName) {
        if (this.fadeTransition) return; // 既にフェード中の場合は処理しない
        
        this.fadeTransition = true;
        const newTrack = this.tracks[trackName];
        
        if (!newTrack) {
            console.warn(`Track '${trackName}' not found`);
            this.fadeTransition = false;
            return;
        }
        
        // 現在のトラックをフェードアウト
        if (this.currentTrack && this.tracks[this.currentTrack]) {
            const currentHowl = this.tracks[this.currentTrack];
            currentHowl.fade(currentHowl.volume(), 0, this.fadeDuration);
            
            setTimeout(() => {
                currentHowl.stop();
            }, this.fadeDuration);
        }
        
        // 新しいトラックを再生してフェードイン
        newTrack.volume(0);
        newTrack.play();
        newTrack.fade(0, this.volume, this.fadeDuration);
        
        this.currentTrack = trackName;
        
        setTimeout(() => {
            this.fadeTransition = false;
        }, this.fadeDuration);
    }
    
    switchToToneJS(trackName, floor) {
        // 現在のMP3トラックを停止
        if (this.currentTrack && this.tracks[this.currentTrack]) {
            const currentHowl = this.tracks[this.currentTrack];
            currentHowl.fade(currentHowl.volume(), 0, this.fadeDuration);
            
            setTimeout(() => {
                currentHowl.stop();
            }, this.fadeDuration);
        }
        
        this.currentTrack = trackName;
        
        // Tone.jsのBGM切り替えロジックを呼び出し（SoundManagerに委譲）
        if (window.game && window.game.soundManager && window.game.soundManager.changeBGM) {
            window.game.soundManager.changeBGM(floor);
        }
    }
    
    startInitialBGM() {
        if (!this.enabled || !this.initialized) return;
        
        // 初期デッキ（デッキ1）のBGMを開始
        this.changeBGM(1);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // 現在再生中のMP3トラックの音量を更新
        if (this.currentTrack && this.tracks[this.currentTrack]) {
            this.tracks[this.currentTrack].volume(this.volume);
        }
        
        console.log(`BGM volume set to ${this.volume}`);
    }
    
    stop() {
        // 全てのMP3トラックを停止
        Object.values(this.tracks).forEach(track => {
            if (track.playing()) {
                track.fade(track.volume(), 0, 1000);
                setTimeout(() => track.stop(), 1000);
            }
        });
        
        this.currentTrack = null;
        console.log('All BGM tracks stopped');
    }
    
    pause() {
        if (this.currentTrack && this.tracks[this.currentTrack]) {
            this.tracks[this.currentTrack].pause();
        }
    }
    
    resume() {
        if (this.currentTrack && this.tracks[this.currentTrack]) {
            this.tracks[this.currentTrack].play();
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        
        if (this.enabled) {
            this.resume();
        } else {
            this.pause();
        }
        
        return this.enabled;
    }
    
    // MP3トラックが現在再生中かどうかを確認
    isPlayingMp3() {
        return this.currentTrack && 
               this.tracks[this.currentTrack] && 
               this.tracks[this.currentTrack].playing();
    }
    
    // 特別なシーン用BGM再生
    playGameOverBGM() {
        console.log('Playing game over BGM');
        this.switchToMp3Track('ending_gameover');
    }
    
    playEndingBGM() {
        console.log('Playing ending BGM');
        this.switchToMp3Track('ending_gameover');
    }
    
    playRankingBGM() {
        console.log('Playing ranking BGM');
        this.switchToMp3Track('ending_gameover');
    }
    
    // BGM音量の段階的調整
    increaseBGMVolume() {
        const newVolume = Math.min(1.0, this.volume + 0.1);
        this.setVolume(newVolume);
        return newVolume;
    }
    
    decreaseBGMVolume() {
        const newVolume = Math.max(0.0, this.volume - 0.1);
        this.setVolume(newVolume);
        return newVolume;
    }
    
    // 音量レベルを0-10の段階で設定
    setBGMVolumeLevel(level) {
        const volume = Math.max(0, Math.min(10, level)) / 10;
        this.setVolume(volume);
        return volume;
    }
    
    getBGMVolumeLevel() {
        return Math.round(this.volume * 10);
    }

    // デバッグ用：現在の状態を取得
    getStatus() {
        return {
            enabled: this.enabled,
            initialized: this.initialized,
            currentTrack: this.currentTrack,
            volume: this.volume,
            volumeLevel: this.getBGMVolumeLevel(),
            isPlayingMp3: this.isPlayingMp3(),
            fadeTransition: this.fadeTransition,
            availableTracks: Object.keys(this.tracks)
        };
    }
}