// 敵タイプ定義
const ALIEN_TYPES = {
    BASIC: {
        symbol: 'A',
        name: 'ベーシック・エイリアン',
        color: '#ff4444',
        description: 'マップ内をランダムに歩き回る基本的な敵。プレイヤーを発見すると追跡する',
        detectionRange: 3,
        minFloor: 1
    },
    STALKER: {
        symbol: 'S',
        name: 'ストーカー・エイリアン',
        color: '#ffaa00',
        description: 'プレイヤーの周囲を徘徊し、距離を保つ',
        detectionRange: 4,
        minFloor: 3
    },
    CHARGER: {
        symbol: 'C',
        name: 'チャージャー・エイリアン',
        color: '#ff8800',
        description: '直線上でプレイヤーを発見すると突進する',
        detectionRange: 6,
        minFloor: 6
    },
    GUARDIAN: {
        symbol: 'G',
        name: 'ガーディアン・エイリアン',
        color: '#4488ff',
        description: '特定エリアを守護し、侵入者を攻撃',
        detectionRange: 2,
        minFloor: 6
    },
    HUNTER: {
        symbol: 'H',
        name: 'ハンター・エイリアン',
        color: '#aa44ff',
        description: '巡回パトロールし、発見時は執拗に追跡',
        detectionRange: 5,
        minFloor: 9
    },
    SCOUT: {
        symbol: 'R',
        name: 'スカウト・エイリアン',
        color: '#44ff44',
        description: 'プレイヤーを発見すると他の敵を呼び寄せる',
        detectionRange: 4,
        minFloor: 9
    },
    // デッキ10-15向け中級上位敵
    ASSASSIN: {
        symbol: 'X',
        name: 'アサシン・エイリアン',
        color: '#cc00cc',
        description: '高速移動でテレポート攻撃を行う暗殺者',
        detectionRange: 6,
        minFloor: 10,
        teleportChance: 0.3
    },
    BERSERKER: {
        symbol: 'B',
        name: 'バーサーカー・エイリアン',
        color: '#ff0066',
        description: 'HPが減ると攻撃力が上昇する狂戦士',
        detectionRange: 4,
        minFloor: 11,
        rageMode: true
    },
    PSYCHIC: {
        symbol: 'P',
        name: 'サイキック・エイリアン',
        color: '#6600ff',
        description: '酸素を直接奪う精神攻撃を行う',
        detectionRange: 5,
        minFloor: 12,
        oxygenDrain: true
    },
    PHANTOM: {
        symbol: 'F',
        name: 'ファントム・エイリアン',
        color: '#00ffcc',
        description: '隔壁を通り抜けて移動する幽霊のような敵',
        detectionRange: 7,
        minFloor: 13,
        phaseThrough: true
    },
    // デッキ16-20向けボス級敵
    OVERLORD: {
        symbol: 'O',
        name: 'オーバーロード・エイリアン',
        color: '#ff6600',
        description: '他の敵を指揮し強化する上級指揮官',
        detectionRange: 8,
        minFloor: 16,
        commandAbility: true,
        bossType: true
    },
    NIGHTMARE: {
        symbol: 'N',
        name: 'ナイトメア・エイリアン',
        color: '#990099',
        description: '多重攻撃と再生能力を持つ悪夢の化身',
        detectionRange: 9,
        minFloor: 18,
        multiAttack: true,
        regeneration: true,
        bossType: true
    },
    APEX: {
        symbol: 'Ω',
        name: 'アペックス・エイリアン',
        color: '#ffff00',
        description: '全ての能力を併せ持つ究極の進化体',
        detectionRange: 10,
        minFloor: 20,
        ultimateForm: true,
        bossType: true
    }
};

// 敵のスポーン重み付けシステム（デッキ20まで対応）
const ENEMY_SPAWN_WEIGHTS = {
    1: { 'BASIC': 100 },
    2: { 'BASIC': 80, 'STALKER': 20 },
    3: { 'BASIC': 70, 'STALKER': 30 },
    4: { 'BASIC': 60, 'STALKER': 35, 'CHARGER': 5 },
    5: { 'BASIC': 50, 'STALKER': 30, 'CHARGER': 15, 'GUARDIAN': 5 },
    6: { 'BASIC': 45, 'STALKER': 25, 'CHARGER': 20, 'GUARDIAN': 10 },
    7: { 'BASIC': 40, 'STALKER': 25, 'CHARGER': 20, 'GUARDIAN': 10, 'HUNTER': 5 },
    8: { 'BASIC': 35, 'STALKER': 20, 'CHARGER': 20, 'GUARDIAN': 15, 'HUNTER': 8, 'SCOUT': 2 },
    9: { 'BASIC': 30, 'STALKER': 20, 'CHARGER': 20, 'GUARDIAN': 15, 'HUNTER': 10, 'SCOUT': 5 },
    10: { 'BASIC': 25, 'STALKER': 15, 'CHARGER': 15, 'GUARDIAN': 15, 'HUNTER': 12, 'SCOUT': 8, 'ASSASSIN': 10 },
    11: { 'BASIC': 20, 'STALKER': 15, 'CHARGER': 15, 'GUARDIAN': 12, 'HUNTER': 12, 'SCOUT': 8, 'ASSASSIN': 10, 'BERSERKER': 8 },
    12: { 'BASIC': 18, 'STALKER': 12, 'CHARGER': 12, 'GUARDIAN': 10, 'HUNTER': 12, 'SCOUT': 8, 'ASSASSIN': 12, 'BERSERKER': 10, 'PSYCHIC': 6 },
    13: { 'BASIC': 15, 'STALKER': 10, 'CHARGER': 10, 'GUARDIAN': 8, 'HUNTER': 12, 'SCOUT': 8, 'ASSASSIN': 12, 'BERSERKER': 10, 'PSYCHIC': 8, 'PHANTOM': 7 },
    14: { 'BASIC': 12, 'STALKER': 8, 'CHARGER': 8, 'GUARDIAN': 6, 'HUNTER': 10, 'SCOUT': 8, 'ASSASSIN': 15, 'BERSERKER': 12, 'PSYCHIC': 10, 'PHANTOM': 11 },
    15: { 'BASIC': 10, 'STALKER': 6, 'CHARGER': 6, 'GUARDIAN': 4, 'HUNTER': 8, 'SCOUT': 6, 'ASSASSIN': 18, 'BERSERKER': 15, 'PSYCHIC': 12, 'PHANTOM': 15 },
    16: { 'BASIC': 8, 'STALKER': 4, 'CHARGER': 4, 'GUARDIAN': 2, 'HUNTER': 6, 'SCOUT': 4, 'ASSASSIN': 20, 'BERSERKER': 18, 'PSYCHIC': 15, 'PHANTOM': 17, 'OVERLORD': 2 },
    17: { 'BASIC': 6, 'STALKER': 2, 'CHARGER': 2, 'GUARDIAN': 1, 'HUNTER': 4, 'SCOUT': 2, 'ASSASSIN': 22, 'BERSERKER': 20, 'PSYCHIC': 18, 'PHANTOM': 20, 'OVERLORD': 3 },
    18: { 'BASIC': 4, 'HUNTER': 2, 'SCOUT': 1, 'ASSASSIN': 20, 'BERSERKER': 18, 'PSYCHIC': 20, 'PHANTOM': 18, 'OVERLORD': 5, 'NIGHTMARE': 12 },
    19: { 'BASIC': 2, 'HUNTER': 1, 'ASSASSIN': 15, 'BERSERKER': 15, 'PSYCHIC': 18, 'PHANTOM': 15, 'OVERLORD': 8, 'NIGHTMARE': 25, 'APEX': 1 },
    20: { 'ASSASSIN': 10, 'BERSERKER': 10, 'PSYCHIC': 15, 'PHANTOM': 10, 'OVERLORD': 15, 'NIGHTMARE': 30, 'APEX': 10 }
};

// 敵のレベルスケーリング設定
const ENEMY_SCALING = {
    baseHp: 15, // ベーシックエイリアンが2回攻撃で倒せるよう調整
    hpPerLevel: 15, // デッキ毎のHP増加量を調整
    baseAttack: 5,
    attackPerLevel: 4, // デッキ毎の攻撃力増加量を調整
    baseDefense: 1,
    defensePerLevel: 2, // デッキ毎の防御力増加量を調整
    expReward: 15,
    expPerLevel: 8, // 経験値報酬の増加量を調整
    goldReward: 5,
    goldPerLevel: 4 // ゴールド報酬の増加量を調整
};

// 能力定義
const ABILITIES = {
    teleport: {
        name: 'エマージェンシーテレポート',
        key: 'T',
        cost: 80,
        minFloor: 1,
        description: 'ランダムな場所にテレポート',
        category: 'basic'
    },
    shield: {
        name: 'シールドジェネレーター',
        key: 'E',
        cost: 100,
        minFloor: 1,
        description: '3ターンの間、全ての攻撃を無効化',
        category: 'basic'
    },
    blast: {
        name: 'エナジーブラスト',
        key: 'Q',
        cost: 200,
        minFloor: 3,
        description: '周囲8マスの敵に大ダメージ',
        category: 'intermediate'
    },
    hack: {
        name: 'ハッキングツール',
        key: 'H',
        cost: 150,
        minFloor: 3,
        description: '隣接する隔壁を通過可能に',
        category: 'intermediate'
    },
    oxygenRecycler: {
        name: '酸素リサイクラー',
        key: null,
        cost: 250, // 300から250に減額
        minFloor: 2, // 3から2に早期化
        description: '酸素消費量を大幅に削減',
        category: 'intermediate',
        passive: true
    },
    autoMedic: {
        name: 'オートメディック',
        key: null,
        cost: 350,
        minFloor: 6,
        description: 'HP50%未満で自動回復',
        category: 'advanced',
        passive: true
    },
    agilityTraining: {
        name: '敏捷性訓練',
        key: null,
        cost: 150,
        minFloor: 2,
        description: '回避率+5%',
        category: 'intermediate',
        passive: true
    },
    reflexes: {
        name: '反射神経強化',
        key: null,
        cost: 200,
        minFloor: 4,
        description: '連続回避制限+1回',
        category: 'advanced',
        passive: true
    },
    combatAwareness: {
        name: '戦闘感覚',
        key: null,
        cost: 180,
        minFloor: 3,
        description: '包囲時の回避率減少を軽減',
        category: 'intermediate',
        passive: true
    }
};

// 遠距離武器定義
const RANGED_WEAPONS = {
    PLASMA_CUTTER: {
        id: "plasma_cutter",
        name: "プラズマカッター",
        description: "工業用プラズマ切断装置。高威力だが電力消費が激しい",
        type: "ranged_consumable",
        range: 3,
        damage: 40,
        powerCost: 25,
        usesPerGame: 8,
        rarity: "uncommon",
        foundIn: ["workshop", "engineering_bay"],
        icon: "🔥",
        soundEffect: "plasma_fire"
    },
    STUN_GUN: {
        id: "stun_gun",
        name: "スタンガン",
        description: "保安用装備。敵を麻痺させるが威力は控えめ",
        type: "ranged_consumable",
        range: 2,
        damage: 15,
        powerCost: 15,
        usesPerGame: 12,
        specialEffect: "stun",
        rarity: "common",
        foundIn: ["security_office", "armory"],
        icon: "⚡",
        soundEffect: "electric_zap"
    },
    EMERGENCY_LASER: {
        id: "emergency_laser",
        name: "緊急用レーザー",
        description: "非常用信号装置を武器転用。貫通攻撃可能",
        type: "ranged_consumable",
        range: 3,
        damage: 30,
        powerCost: 20,
        usesPerGame: 3,
        specialEffect: "penetrate",
        rarity: "rare",
        foundIn: ["bridge", "emergency_locker"],
        icon: "🔴",
        soundEffect: "laser_beam"
    }
};

// 回避システム定義
const DODGE_SYSTEM = {
    // プレイヤー基本回避率
    player: {
        baseChance: 15, // 基本15%
        maxChance: 45,  // 最大45%まで
        perLevelBonus: 2, // レベルアップで+2%
        criticalImmune: false, // クリティカルでも回避可能
    },
    
    // 敵タイプ別回避率
    enemies: {
        BASIC: { dodgeChance: 5 },      // 基本敵：5%
        STALKER: { dodgeChance: 15 },   // 徘徊型：15%（素早い）
        CHARGER: { dodgeChance: 0 },    // 突進型：0%（鈍重）
        GUARDIAN: { dodgeChance: 8 },   // 守護型：8%（重装甲）
        HUNTER: { dodgeChance: 20 },    // 巡回型：20%（非常に素早い）
        SCOUT: { dodgeChance: 25 },     // 偵察型：25%（最高回避）
        ASSASSIN: { dodgeChance: 30 },  // 暗殺者：30%（極めて素早い）
        BERSERKER: { dodgeChance: 5 },  // 狂戦士：5%（防御より攻撃）
        PSYCHIC: { dodgeChance: 12 },   // 精神攻撃：12%（中程度）
        PHANTOM: { dodgeChance: 35 },   // 幽霊型：35%（非物質的）
        OVERLORD: { dodgeChance: 10 },  // 指揮官：10%（重装甲）
        NIGHTMARE: { dodgeChance: 20 }, // 悪夢：20%（変幻自在）
        APEX: { dodgeChance: 25 }       // 究極体：25%（全能力保持）
    },
    
    // 特殊条件
    conditions: {
        // クリティカル攻撃の扱い
        criticalIgnoresDodge: true, // クリティカルは必中
        
        // 連続回避制限（連続で回避されるフラストレーション対策）
        maxConsecutiveDodges: 2, // 最大2回連続まで
        consecutivePenalty: 0.5, // 3回目以降は回避率半減
        
        // 包囲効果
        surroundedPenalty: 0.3, // 複数敵に囲まれると回避率30%減
        
        // 負傷効果
        injuredPenalty: 0.2 // HP50%以下で回避率20%減
    }
};

// 通信システムのメッセージデータベース
const COMMUNICATION_MESSAGES = {
    // 機能的通信（ゲームプレイ支援）
    functional: [
        {
            id: "elevator_location",
            sender: "監視室・ケビン",
            content: "カメラで確認した。次のフロアの東側にエレベーターがある。",
            trigger: "floor_3_reached",
            effect: "hint_elevator_location",
            priority: "high",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "danger_warning",
            sender: "セキュリティ・アレックス",
            content: "警告！現在のフロアにライトキラー型を複数確認。迂回を推奨。",
            trigger: "floor_5_reached",
            effect: "warn_danger_area",
            priority: "high",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "item_location",
            sender: "医療班・サラ",
            content: "医務室のブルーロッカーに酸素ボンベを確保している。",
            trigger: "medical_bay_discovered",
            effect: "hint_oxygen_supply",
            priority: "medium",
            oneTime: true,
            displayDuration: 5000
        },
        {
            id: "system_assistance",
            sender: "エンジニア・トム",
            content: "照明システムを一時復旧する。3分間だけ全フロア照明が点灯する。",
            trigger: "power_system_accessed",
            effect: "temporary_full_lighting",
            priority: "high",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "weapon_cache",
            sender: "保安班・ジャック",
            content: "7階の工作室に武器を隠してある。緊急時に使用してくれ。",
            trigger: "floor_7_reached",
            effect: "hint_weapon_cache",
            priority: "medium",
            oneTime: true,
            displayDuration: 5000
        }
    ],
    
    // ストーリー通信（世界観構築）
    story: [
        {
            id: "incident_revelation",
            sender: "研究主任・ドクター",
            content: "実験体X-47が収容違反を起こした。これは我々の責任だ...",
            trigger: "floor_6_reached",
            effect: "reveal_story_fragment",
            priority: "medium",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "earth_contact_lost",
            sender: "通信士・リナ",
            content: "地球本部への通信が72時間途絶。救助は期待できない。",
            trigger: "floor_10_reached",
            effect: "reveal_isolation",
            priority: "medium",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "command_structure_collapse",
            sender: "副船長・マーカス",
            content: "船長は最初の犠牲者だった。指揮系統は既に崩壊している。",
            trigger: "floor_12_reached",
            effect: "reveal_command_loss",
            priority: "medium",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "survivor_count",
            sender: "医療班・サラ",
            content: "生存者確認：現在7名。うち3名が重傷、2名が行方不明。",
            trigger: "floor_15_reached",
            effect: "reveal_survivor_status",
            priority: "low",
            oneTime: true,
            displayDuration: 5000
        },
        {
            id: "experiment_origin",
            sender: "研究員・ナオミ",
            content: "これらの生物は深宇宙で発見されたものだ。制御不能になった...",
            trigger: "floor_8_reached",
            effect: "reveal_experiment_origin",
            priority: "medium",
            oneTime: true,
            displayDuration: 6000
        }
    ],
    
    // 感情的通信（人間ドラマ）
    emotional: [
        {
            id: "rescue_plea",
            sender: "クルー・ジェン",
            content: "9階で負傷...動けない。誰か...助けて...",
            trigger: "floor_8_reached",
            effect: "create_rescue_mission",
            priority: "medium",
            oneTime: true,
            displayDuration: 7000
        },
        {
            id: "family_message",
            sender: "パイロット・デイブ",
            content: "もし君が脱出できたら...妻のエミリーに愛していると伝えてくれ。",
            trigger: "floor_16_reached",
            effect: "emotional_weight",
            priority: "low",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "hope_message",
            sender: "エンジニア・トム",
            content: "君がいれば必ず脱出できる。一緒に生き延びよう！",
            trigger: "aliens_killed_20",
            effect: "morale_boost",
            priority: "low",
            oneTime: true,
            displayDuration: 5000
        },
        {
            id: "desperation",
            sender: "不明",
            content: "もう限界だ...誰かいるなら...応答して...",
            trigger: "floor_14_reached",
            effect: "create_tension",
            priority: "low",
            oneTime: true,
            displayDuration: 5000
        },
        {
            id: "last_goodbye",
            sender: "医療班・サラ",
            content: "酸素が...残り少ない。最後まで戦ってくれ。みんなの分まで...",
            trigger: "floor_18_reached",
            effect: "final_determination",
            priority: "medium",
            oneTime: true,
            displayDuration: 7000
        }
    ],
    
    // 技術通信（アップグレード・システム）
    technical: [
        {
            id: "upgrade_schematic",
            sender: "技術者・マイク",
            content: "酸素効率化の回路図を送信する。技術部品があれば実装可能だ。",
            trigger: "floor_3_reached",
            effect: "unlock_oxygen_upgrade",
            priority: "high",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "weapon_access",
            sender: "保安責任者・ジャック",
            content: "工作室のプラズマカッター、認証コード：Alpha-2847",
            trigger: "workshop_discovered",
            effect: "unlock_plasma_cutter",
            priority: "medium",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "shield_boost",
            sender: "エンジニア・トム",
            content: "シールドジェネレーターを改良した。持続時間が延長される。",
            trigger: "floor_11_reached",
            effect: "upgrade_shield_duration",
            priority: "high",
            oneTime: true,
            displayDuration: 6000
        },
        {
            id: "power_efficiency",
            sender: "技術者・マイク",
            content: "電力効率化プログラムを送信。バッテリー消費が50%削減される。",
            trigger: "floor_13_reached",
            effect: "improve_power_efficiency",
            priority: "high",
            oneTime: true,
            displayDuration: 6000
        }
    ],
    
    // ミスリード通信（疑心暗鬼）
    mislead: [
        {
            id: "suspicious_captain",
            sender: "船長？",
            content: "こちら船長...状況は...制御下にある...心配...ない...",
            trigger: "floor_9_reached",
            effect: "create_suspicion",
            priority: "medium",
            oneTime: true,
            displayDuration: 6000,
            suspicious: true
        },
        {
            id: "fragmented_help",
            sender: "不明",
            content: "た...すけ...て...17か...い...zzz...ノイズ...",
            trigger: "floor_17_reached",
            effect: "create_uncertainty",
            priority: "low",
            oneTime: true,
            displayDuration: 5000,
            suspicious: true
        },
        {
            id: "false_all_clear",
            sender: "掃討班",
            content: "全エイリアン掃討完了。船内は安全だ。通常業務に戻れ。",
            trigger: "floor_19_reached",
            effect: "false_security",
            priority: "medium",
            oneTime: true,
            displayDuration: 6000,
            suspicious: true
        }
    ]
};

// 質的アップグレードシステム
const QUALITATIVE_UPGRADES = {
    chain_strike: {
        id: "chain_strike",
        name: "チェインストライク",
        category: "combat_offensive",
        
        levels: [
            {
                level: 1,
                name: "連続攻撃 I",
                description: "敵のHP30%以下を撃破時、追加行動を獲得",
                cost: 100,
                unlockFloor: 1,
                effects: {
                    triggerThreshold: 0.3,
                    maxChains: 1,
                    bonusDamage: 0
                }
            },
            {
                level: 2,
                name: "連続攻撃 II", 
                description: "発動条件をHP50%以下に拡大、連続2回まで可能",
                cost: 200,
                unlockFloor: 5,
                effects: {
                    triggerThreshold: 0.5,
                    maxChains: 2,
                    bonusDamage: 5
                }
            },
            {
                level: 3,
                name: "連続攻撃 III",
                description: "一撃撃破でも発動、無制限連続可能",
                cost: 350,
                unlockFloor: 10,
                effects: {
                    triggerThreshold: 1.0,
                    maxChains: 999,
                    bonusDamage: 10,
                    perfectKillBonus: true
                }
            }
        ]
    },
    
    counter_attack: {
        id: "counter_attack",
        name: "カウンターアタック",
        category: "combat_defensive",
        
        levels: [
            {
                level: 1,
                name: "反撃 I",
                description: "被攻撃時50%の確率で自動反撃",
                cost: 120,
                unlockFloor: 3,
                effects: {
                    triggerChance: 0.5,
                    damageMultiplier: 0.7,
                    canCritical: false
                }
            },
            {
                level: 2,
                name: "反撃 II",
                description: "反撃確率75%、通常ダメージで反撃",
                cost: 250,
                unlockFloor: 7,
                effects: {
                    triggerChance: 0.75,
                    damageMultiplier: 1.0,
                    canCritical: true
                }
            },
            {
                level: 3,
                name: "反撃 III",
                description: "必ず反撃、クリティカル率2倍",
                cost: 400,
                unlockFloor: 12,
                effects: {
                    triggerChance: 1.0,
                    damageMultiplier: 1.2,
                    canCritical: true,
                    criticalBonus: 2.0
                }
            }
        ]
    },
    
    auto_repair: {
        id: "auto_repair",
        name: "オートリペア",
        category: "defense_utility",
        
        levels: [
            {
                level: 1,
                name: "自動修復 I",
                description: "フロア移動時にシールドが50%の確率で回復",
                cost: 150,
                unlockFloor: 4,
                effects: {
                    floorRecoveryChance: 0.5,
                    turnRecovery: false,
                    maxShields: 1
                }
            },
            {
                level: 2,
                name: "自動修復 II",
                description: "フロア移動時に確実に回復、15ターンごとに回復判定",
                cost: 280,
                unlockFloor: 8,
                effects: {
                    floorRecoveryChance: 1.0,
                    turnRecovery: true,
                    turnInterval: 15,
                    turnRecoveryChance: 0.3,
                    maxShields: 1
                }
            },
            {
                level: 3,
                name: "自動修復 III",
                description: "最大シールド2個、10ターンごとに確実に回復",
                cost: 450,
                unlockFloor: 13,
                effects: {
                    floorRecoveryChance: 1.0,
                    turnRecovery: true,
                    turnInterval: 10,
                    turnRecoveryChance: 1.0,
                    maxShields: 2
                }
            }
        ]
    }
};

// エンジンルーム関連定数
const ENGINE_ROOM_CONFIG = {
    // デッキ20専用のエンジンルーム設定
    roomSize: {
        width: 6,
        height: 6
    },
    
    // エンジンコアの配置位置（部屋の中央）
    corePosition: {
        x: 3,
        y: 3
    },
    
    // エンディングタイプ
    endingTypes: {
        REPAIR: 'repair',
        DESTROY: 'destroy'
    },
    
    // エンディングメッセージ
    endingMessages: {
        repair: {
            title: '🌍 地球帰還エンディング',
            content: `
                <div style="text-align: center; line-height: 1.8;">
                    <h2 style="color: #00ff88; margin-bottom: 20px;">エンジン修理完了</h2>
                    <p style="color: #ffffff; font-size: 16px; margin-bottom: 15px;">
                        君の手によってルミナス号のエンジンが息を吹き返した。<br>
                        巨大な船体が静かに振動し、推進システムが再起動する。
                    </p>
                    <p style="color: #ffaa88; font-size: 16px; margin-bottom: 15px;">
                        3年ぶりの地球への帰路が開かれた。<br>
                        故郷の青い星が、遠い宇宙の彼方で君を待っている。
                    </p>
                    <p style="color: #ff8888; font-size: 16px; margin-bottom: 20px;">
                        しかし...船内に潜むエイリアンたちも<br>
                        君と共に地球へと向かうことになる。
                    </p>
                    <p style="color: #888888; font-size: 14px; font-style: italic;">
                        この選択の結末は、まだ誰にも分からない...
                    </p>
                </div>
            `
        },
        destroy: {
            title: '💥 自己犠牲エンディング',
            content: `
                <div style="text-align: center; line-height: 1.8;">
                    <h2 style="color: #ff4444; margin-bottom: 20px;">爆破装置設置完了</h2>
                    <p style="color: #ffffff; font-size: 16px; margin-bottom: 15px;">
                        君は最後の決断を下した。<br>
                        ルミナス号と共に、エイリアンの脅威を終わらせることを。
                    </p>
                    <p style="color: #ffaa88; font-size: 16px; margin-bottom: 15px;">
                        爆破装置のカウントダウンが始まる。<br>
                        脱出ポッドはとうの昔に機能を停止している。
                    </p>
                    <p style="color: #88ff88; font-size: 16px; margin-bottom: 20px;">
                        君の犠牲によって、地球は守られた。<br>
                        120億の人々が、君の勇気を永遠に記憶するだろう。
                    </p>
                    <p style="color: #888888; font-size: 14px; font-style: italic;">
                        真の英雄とは、誰も見ていない場所で<br>
                        正しいことを行う者のことである。
                    </p>
                </div>
            `
        }
    }
};