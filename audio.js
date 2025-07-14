class SoundManager {
    constructor() {
        this.enabled = true;
        this.bgmVolume = 0.5;
        this.sfxVolume = 0.3;
        this.synths = {};
        this.loops = {};
        this.initialized = false;
        this.currentBGM = 'deck1'; // 現在のBGMトラック
        this.bgmTracks = {}; // BGMトラックの管理
    }
    
    async init() {
        try {
            // AudioContextがユーザーの操作後に開始されるように
            if (Tone.context.state === 'suspended') {
                await Tone.start();
            }
        } catch (e) {
            console.warn('Audio context initialization failed:', e);
            return;
        }
        
        // 効果音用のシンセサイザーの作成
        this.synths.move = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
        this.synths.move.volume.value = Tone.gainToDb(this.sfxVolume);
        
        this.synths.attack = new Tone.Synth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
        }).toDestination();
        this.synths.attack.volume.value = Tone.gainToDb(this.sfxVolume);
        
        this.synths.damage = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
        this.synths.damage.volume.value = Tone.gainToDb(this.sfxVolume);
        
        this.synths.collect = new Tone.PolySynth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 }
        }).toDestination();
        this.synths.collect.volume.value = Tone.gainToDb(this.sfxVolume);
        
        this.synths.alert = new Tone.Synth({
            oscillator: { type: 'pulse' },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.3 }
        }).toDestination();
        this.synths.alert.volume.value = Tone.gainToDb(this.sfxVolume);
        
        // クリティカル攻撃用のシンセ
        this.synths.critical = new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 }
        }).toDestination();
        this.synths.critical.volume.value = Tone.gainToDb(this.sfxVolume + 0.1);
        
        // レベルアップファンファーレ用のシンセ
        this.synths.levelup = new Tone.PolySynth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 }
        }).toDestination();
        this.synths.levelup.volume.value = Tone.gainToDb(this.sfxVolume + 0.1);
        
        // アンビエントサウンド用のシンセ
        this.synths.ambient = new Tone.PolySynth({
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 1, sustain: 0.5, release: 3 }
        }).toDestination();
        this.synths.ambient.volume.value = Tone.gainToDb(this.sfxVolume);
        
        // BGM専用のシンセ
        this.synths.bgm = new Tone.PolySynth({
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 1, sustain: 0.5, release: 3 }
        }).toDestination();
        this.synths.bgm.volume.value = Tone.gainToDb(this.bgmVolume);
        
        // エフェクトの追加
        const reverb = new Tone.Reverb({ decay: 5, wet: 0.3 }).toDestination();
        const delay = new Tone.Delay({ delayTime: 0.3, feedback: 0.3, wet: 0.2 }).toDestination();
        
        this.synths.ambient.connect(reverb);
        this.synths.collect.connect(delay);
        
        // BGM用のシーケンサー
        this.createAllBGMs();
        
        // 環境音の作成
        this.createAmbientSounds();
        
        // 初期音量設定
        this.setBGMVolume(this.bgmVolume);
        this.setSFXVolume(this.sfxVolume);
        this.initialized = true;
    }
    
    createAllBGMs() {
        // デッキ1-5: 穏やかな探索BGM
        this.bgmTracks.deck1 = this.createBGMTrack({
            name: 'deck1',
            notes: ['C2', 'G2', 'E2', 'A2'],
            tempo: '2n',
            volume: 0.1,
            highNoteChance: 0.7,
            description: '穏やかな探索'
        });
        
        // デッキ6-10: 少し緊張感のある音楽
        this.bgmTracks.deck6 = this.createBGMTrack({
            name: 'deck6',
            notes: ['D2', 'A2', 'F2', 'Bb2'],
            tempo: '4n',
            volume: 0.12,
            highNoteChance: 0.6,
            description: '緊張感の高まり'
        });
        
        // デッキ11-14: 危険な雰囲気
        this.bgmTracks.deck11 = this.createBGMTrack({
            name: 'deck11',
            notes: ['E2', 'B2', 'G2', 'C3'],
            tempo: '8n',
            volume: 0.15,
            highNoteChance: 0.5,
            description: '危険な雰囲気'
        });
        
        // デッキ15-19: 高い緊迫感
        this.bgmTracks.deck15 = this.createBGMTrack({
            name: 'deck15',
            notes: ['F#2', 'C#3', 'A2', 'D3'],
            tempo: '8n',
            volume: 0.18,
            highNoteChance: 0.4,
            description: '高い緊迫感'
        });
        
        // デッキ20: 最終マップ - 最も緊迫感のある音楽
        this.bgmTracks.deck20 = this.createBGMTrack({
            name: 'deck20',
            notes: ['G2', 'D3', 'Bb2', 'Eb3'],
            tempo: '16n',
            volume: 0.2,
            highNoteChance: 0.3,
            description: '最終決戦'
        });
    }
    
    createBGMTrack(config) {
        let noteIndex = 0;
        
        const loop = new Tone.Loop((time) => {
            if (this.enabled && this.currentBGM === config.name) {
                try {
                    const note = config.notes[noteIndex % config.notes.length];
                    this.synths.bgm.triggerAttackRelease(note, config.tempo, time, config.volume);
                    
                    // 高音の装飾
                    if (Math.random() > config.highNoteChance) {
                        const highNote = Tone.Frequency(note).transpose(24).toNote();
                        this.synths.bgm.triggerAttackRelease(highNote, '16n', time + 0.125, config.volume * 0.5);
                    }
                    
                    // 低音の重厚感（デッキ15以降）
                    if (config.name === 'deck15' || config.name === 'deck20') {
                        const lowNote = Tone.Frequency(note).transpose(-12).toNote();
                        this.synths.bgm.triggerAttackRelease(lowNote, config.tempo, time + 0.05, config.volume * 0.3);
                    }
                    
                    noteIndex++;
                } catch (e) {
                    console.warn(`BGM ${config.name} playback error:`, e);
                }
            }
        }, config.tempo);
        
        return loop;
    }
    
    createAmbientSounds() {
        // 機械音（ビープ音）
        this.loops.beep = new Tone.Loop((time) => {
            if (this.enabled && Math.random() > 0.8) {
                try {
                    this.synths.move.triggerAttackRelease('G5', '32n', time, 0.02);
                } catch (e) {
                    console.warn('Beep sound error:', e);
                }
            }
        }, '4n');
        
        // 換気システムのノイズ
        const noise = new Tone.Noise('pink').toDestination();
        const noiseFilter = new Tone.Filter(200, 'lowpass').toDestination();
        noise.connect(noiseFilter);
        noise.volume.value = -40;
        
        this.loops.ventilation = new Tone.Loop(() => {
            if (this.enabled) {
                try {
                    noise.start();
                    setTimeout(() => {
                        try {
                            noise.stop();
                        } catch (e) {
                            console.warn('Ventilation stop error:', e);
                        }
                    }, 3000);
                } catch (e) {
                    console.warn('Ventilation sound error:', e);
                }
            }
        }, 8);
    }
    
    // 効果音メソッド
    playMove() {
        if (!this.enabled || !this.initialized) return;
        try {
            const now = Tone.now();
            this.synths.move.triggerAttackRelease('C4', '16n', now, 0.1);
            this.synths.move.triggerAttackRelease('G3', '16n', now + 0.05, 0.05);
        } catch (e) {
            console.warn('Sound playback error:', e);
            this.resetAudio();
        }
    }
    
    playAttack() {
        if (!this.enabled || !this.initialized) return;
        try {
            // レーザー音
            const now = Tone.now();
            for (let i = 0; i < 5; i++) {
                const freq = 800 - i * 100;
                this.synths.attack.triggerAttackRelease(freq, '32n', now + i * 0.02, 0.2);
            }
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    playDamage() {
        if (!this.enabled || !this.initialized) return;
        try {
            // ダメージ音
            const now = Tone.now();
            this.synths.damage.triggerAttackRelease('A2', '8n', now, 0.3);
            this.synths.damage.triggerAttackRelease('F2', '8n', now + 0.1, 0.2);
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    playCriticalHit() {
        if (!this.enabled || !this.initialized) return;
        try {
            // クリティカル攻撃音 - 鋭い金属音
            const now = Tone.now();
            // 高音から低音に下がる鋭い音
            this.synths.critical.triggerAttackRelease('C6', '32n', now, 0.4);
            this.synths.critical.triggerAttackRelease('A5', '32n', now + 0.03, 0.3);
            this.synths.critical.triggerAttackRelease('F5', '32n', now + 0.06, 0.2);
            this.synths.critical.triggerAttackRelease('D5', '32n', now + 0.09, 0.1);
            
            // 余韻として通常の攻撃音も少し遅れて再生
            setTimeout(() => {
                this.playAttack();
            }, 100);
        } catch (e) {
            console.warn('Critical hit sound error:', e);
        }
    }
    
    playLevelUp() {
        if (!this.enabled || !this.initialized) return;
        try {
            // レベルアップファンファーレ - 上昇する和音
            const now = Tone.now();
            
            // 第1和音 (C Major)
            this.synths.levelup.triggerAttackRelease(['C4', 'E4', 'G4'], '4n', now, 0.3);
            
            // 第2和音 (F Major)
            this.synths.levelup.triggerAttackRelease(['F4', 'A4', 'C5'], '4n', now + 0.3, 0.3);
            
            // 第3和音 (G Major)
            this.synths.levelup.triggerAttackRelease(['G4', 'B4', 'D5'], '4n', now + 0.6, 0.3);
            
            // 終了和音 (C Major - 高音)
            this.synths.levelup.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '2n', now + 0.9, 0.4);
            
        } catch (e) {
            console.warn('Level up sound error:', e);
        }
    }
    
    playCollect(type = 'item') {
        if (!this.enabled || !this.initialized) return;
        try {
            const notes = {
                item: ['C5', 'E5', 'G5'],
                gold: ['C5', 'E5', 'G5', 'C6'],
                oxygen: ['E5', 'G5', 'B5', 'E6'],
                medical: ['G5', 'B5', 'D6', 'G6'],
                weapon: ['A4', 'C5', 'E5', 'A5']
            };
            
            const selectedNotes = notes[type] || notes.item;
            const now = Tone.now();
            selectedNotes.forEach((note, i) => {
                this.synths.collect.triggerAttackRelease(note, '16n', now + i * 0.05, 0.1);
            });
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    playElevator() {
        if (!this.enabled || !this.initialized) return;
        try {
            // エレベーター音
            const now = Tone.now();
            for (let i = 0; i < 10; i++) {
                const freq = 200 + i * 50;
                this.synths.ambient.triggerAttackRelease(freq, '16n', now + i * 0.1, 0.1);
            }
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    playOxygenAlert() {
        if (!this.enabled || !this.initialized) return;
        try {
            // 酸素警告音
            const now = Tone.now();
            this.synths.alert.triggerAttackRelease('G4', '8n', now, 0.3);
            this.synths.alert.triggerAttackRelease('E4', '8n', now + 0.2, 0.3);
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    playRadiation() {
        if (!this.enabled || !this.initialized) return;
        try {
            // ガイガーカウンター風の音
            const clicks = Math.floor(Math.random() * 5) + 3;
            const now = Tone.now();
            for (let i = 0; i < clicks; i++) {
                const delay = i * 0.05 + Math.random() * 0.03;
                this.synths.move.triggerAttackRelease('C7', '64n', now + delay, 0.05);
            }
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    playGameOver() {
        if (!this.enabled || !this.initialized) return;
        try {
            // ゲームオーバー音
            const notes = ['G3', 'F3', 'E3', 'D3', 'C3'];
            const now = Tone.now();
            notes.forEach((note, i) => {
                this.synths.damage.triggerAttackRelease(note, '4n', now + i * 0.2, 0.2);
            });
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    playLevelUp() {
        if (!this.enabled || !this.initialized) return;
        try {
            // レベルアップファンファーレ
            const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'];
            const now = Tone.now();
            notes.forEach((note, i) => {
                this.synths.collect.triggerAttackRelease(note, '16n', now + i * 0.06, 0.15);
            });
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    // チャージャー検知音
    playChargerAlert() {
        if (!this.enabled || !this.initialized) return;
        try {
            const now = Tone.now();
            // 低音から高音への警告音
            const frequencies = [150, 200, 280, 350];
            frequencies.forEach((freq, i) => {
                this.synths.alert.triggerAttackRelease(freq, '8n', now + i * 0.1, 0.4);
            });
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    // チャージャー突進音
    playChargerCharge() {
        if (!this.enabled || !this.initialized) return;
        try {
            const now = Tone.now();
            // 機械的な駆動音
            for (let i = 0; i < 6; i++) {
                const freq = 100 + i * 20;
                this.synths.attack.triggerAttackRelease(freq, '16n', now + i * 0.05, 0.2);
            }
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    // テレポート音
    playTeleportEffect() {
        if (!this.enabled || !this.initialized) return;
        try {
            const now = Tone.now();
            // 空間転移音
            const notes = ['C5', 'E5', 'G5', 'C6'];
            notes.forEach((note, i) => {
                this.synths.collect.triggerAttackRelease(note, '32n', now + i * 0.03, 0.1);
            });
            // エコー効果
            setTimeout(() => {
                notes.reverse().forEach((note, i) => {
                    this.synths.collect.triggerAttackRelease(note, '32n', Tone.now() + i * 0.02, 0.05);
                });
            }, 150);
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    // シールド音
    playShieldEffect() {
        if (!this.enabled || !this.initialized) return;
        try {
            const now = Tone.now();
            // 防御シールド音
            this.synths.collect.triggerAttackRelease('E5', '4n', now, 0.3);
            this.synths.collect.triggerAttackRelease('G5', '4n', now + 0.1, 0.2);
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    // エナジーブラスト音
    playBlastEffect() {
        if (!this.enabled || !this.initialized) return;
        try {
            const now = Tone.now();
            // 爆発音
            this.synths.attack.triggerAttackRelease('C2', '8n', now, 0.5);
            this.synths.attack.triggerAttackRelease('G2', '8n', now + 0.05, 0.4);
            this.synths.attack.triggerAttackRelease('E3', '8n', now + 0.1, 0.3);
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    // ハッキング音
    playHackEffect() {
        if (!this.enabled || !this.initialized) return;
        try {
            const now = Tone.now();
            // 電子音のシーケンス
            const beeps = [800, 900, 1000, 1100];
            beeps.forEach((freq, i) => {
                this.synths.alert.triggerAttackRelease(freq, '64n', now + i * 0.1, 0.1);
            });
        } catch (e) {
            console.warn('Sound playback error:', e);
        }
    }
    
    setBGMVolume(value) {
        this.bgmVolume = value;
        if (this.synths.bgm) {
            this.synths.bgm.volume.value = Tone.gainToDb(value);
        }
    }
    
    setSFXVolume(value) {
        this.sfxVolume = value;
        // 効果音用のシンセサイザーの音量を更新
        const sfxSynths = ['move', 'attack', 'damage', 'collect', 'alert', 'ambient', 'critical', 'levelup'];
        sfxSynths.forEach(synthName => {
            if (this.synths[synthName]) {
                // criticalとlevelupは少し音量を大きくする
                const volumeBoost = (synthName === 'critical' || synthName === 'levelup') ? 0.1 : 0;
                this.synths[synthName].volume.value = Tone.gainToDb(value + volumeBoost);
            }
        });
    }
    
    // 後方互換性のための古いsetVolumeメソッド
    setVolume(value) {
        this.setBGMVolume(value);
        this.setSFXVolume(value);
    }
    
    // 音声エラーを防ぐためのリセット機能
    resetAudio() {
        try {
            // 全ループを停止
            Object.values(this.loops).forEach(loop => {
                if (loop && loop.state === 'started') {
                    loop.stop();
                }
            });
            
            // 少し待ってから再開
            setTimeout(() => {
                if (this.enabled) {
                    this.startBGM();
                }
            }, 100);
        } catch (e) {
            console.warn('Audio reset error:', e);
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            Tone.Transport.pause();
        } else {
            Tone.Transport.start();
        }
        return this.enabled;
    }
    
    start() {
        if (this.initialized) {
            try {
                // AudioContextの状態をチェック
                if (Tone.context.state === 'suspended') {
                    Tone.start();
                }
                
                // 全てのBGMトラックを開始
                Object.values(this.bgmTracks).forEach(track => {
                    track.start(0);
                });
                
                this.loops.beep.start(0);
                this.loops.ventilation.start(0);
                
                // トランスポートを開始
                Tone.Transport.start();
            } catch (e) {
                console.warn('Audio start error:', e);
            }
        }
    }
    
    // BGMを切り替えるメソッド
    changeBGM(floor) {
        let newBGM = 'deck1';
        
        if (floor >= 20) {
            newBGM = 'deck20';
        } else if (floor >= 15) {
            newBGM = 'deck15';
        } else if (floor >= 11) {
            newBGM = 'deck11';
        } else if (floor >= 6) {
            newBGM = 'deck6';
        }
        
        if (this.currentBGM !== newBGM) {
            const oldBGM = this.currentBGM;
            this.currentBGM = newBGM;
            
            // BGM切り替えをログに出力
            console.log(`BGM changed from ${oldBGM} to ${newBGM} (Floor ${floor})`);
            
            // 短いフェードアウト・フェードイン効果のための音量調整
            if (this.enabled && this.initialized) {
                this.synths.bgm.volume.rampTo(Tone.gainToDb(this.bgmVolume * 0.5), 0.5);
                setTimeout(() => {
                    this.synths.bgm.volume.rampTo(Tone.gainToDb(this.bgmVolume), 0.5);
                }, 500);
            }
        }
    }
    
    stop() {
        Tone.Transport.stop();
    }
}