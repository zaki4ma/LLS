// 敵タイプ定義
const ALIEN_TYPES = {
    BASIC: {
        symbol: 'A',
        name: 'ベーシック・エイリアン',
        color: '#ff4444',
        description: 'プレイヤーを直線的に追跡する基本的な敵',
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
    baseHp: 20,
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
        description: '次の攻撃を完全に無効化',
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
        cost: 400,
        minFloor: 6,
        description: '酸素消費量を半分に削減',
        category: 'advanced',
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
    }
};