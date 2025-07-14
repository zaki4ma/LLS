# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

回答は日本語で行ってください。モチベーションを維持できる回答をしてください。

ファイルは機能単位で適度なファイルサイズで分けて実装してください。

## Project Overview

「ルミナス・ロスト・シグナル」は、エイリアンに襲われた巨大宇宙船の中を探索し、エイリアンと戦いながら生き残るローグライクゲームです。Web技術（HTML5、CSS3、JavaScript ES6+、Web Audio API）を使用して実装されています。

## Running the Game

```bash
# ローカル開発サーバーを起動
python -m http.server 8000
# または
python3 -m http.server 8000

# ブラウザで http://localhost:8000 にアクセス
```

## Core Architecture

### Module Structure
ゲームは8つの主要なモジュールに分割されています：

- **GameCore.js**: メインゲームループ、イベントハンドラー、全体統括
- **PlayerManager.js**: プレイヤー状態管理、能力システム、戦闘処理
- **EnemyManager.js**: 敵AI、行動パターン、スポーンシステム
- **LevelGenerator.js**: プロシージャルマップ生成、部屋配置、エレベーター配置
- **ItemManager.js**: アイテム生成、収集システム、バランス調整
- **RenderManager.js**: 描画処理、視界システム、エフェクト管理
- **UIManager.js**: ユーザーインターフェース、モーダル、戦闘ログ
- **UpgradeManager.js**: アップグレードメニュー、特殊能力購入
- **audio.js**: サウンドシステム、BGM管理、効果音
- **constants.js**: ゲーム定数、敵タイプ、能力定義
- **ranking.js**: ランキングシステム、ローカルストレージ管理

### Game State Management
ゲーム状態は`GameCore.js`のRoguelikeGameクラスで一元管理されています。重要な状態変数：

- `grid`: 20x20のゲームマップ
- `visibleCells`: プレイヤーの視界システム
- `exploredCells`: 探索済みエリアの記録
- `floor`: 現在のデッキ階層（1-20、20階が最終マップ）
- `gameOver`: ゲームオーバー状態
- `inUpgradeMenu`: アップグレードメニュー表示状態

### Audio System
`audio.js`の`SoundManager`クラスがTone.jsを使用して音響効果を管理：

- **BGM**: デッキ進行に応じて5段階の音楽変化（deck1, deck6, deck11, deck15, deck20）
- **効果音**: 攻撃、アイテム収集、特殊能力、クリティカル音など
- **音量制御**: BGMとSFXの個別音量調整

### Combat System
戦闘システムの重要な特徴：

- **ターン制**: プレイヤーの行動後に敵が行動
- **クリティカル攻撃**: 15%の確率で2倍ダメージ（レベルアップで30%まで向上）
- **シールドシステム**: 一回限りの攻撃無効化
- **酸素システム**: 毎ターン消費、不足時はダメージ

### Level Progression
レベル設計は段階的な難易度上昇：

- **デッキ1-5**: 基本的な探索、穏やかなBGM
- **デッキ6-10**: 難易度上昇、新しい敵タイプ
- **デッキ11-14**: 危険区域、より強力な敵
- **デッキ15-19**: 最大危険区域、高い緊迫感
- **デッキ20**: 最終マップ、エレベーターなし

## Game Constants

### Enemy Types
`constants.js`で定義された敵タイプ：

- **BASIC**: 基本的な追跡敵（デッキ1+）
- **STALKER**: 徘徊型敵（デッキ3+）
- **CHARGER**: 突進型敵（デッキ6+）
- **GUARDIAN**: 守護型敵（デッキ6+）
- **HUNTER**: 巡回型敵（デッキ9+）
- **SCOUT**: 召喚型敵（デッキ9+）

### Special Abilities
特殊能力は3つのカテゴリーに分類：

- **基本能力**: テレポート、シールド（デッキ1+）
- **中級能力**: エナジーブラスト、ハッキング（デッキ3+）
- **上級能力**: 酸素リサイクラー、オートメディック（デッキ6+）

## Code Style and Patterns

### Component Communication
全てのコンポーネントは`gameInstance`パラメータを通じて通信します。直接的な相互参照は避け、GameCoreが仲介役を果たします。

### State Management
プレイヤー状態、敵状態、アイテム状態は各々のManagerクラスで管理されており、GameCoreが統括します。

### Event Handling
キーボードイベントは`GameCore.js`で一元管理され、ゲーム状態に応じて適切なManagerに委譲されます。

### Error Handling
音響システムでは`try-catch`を使用した包括的なエラーハンドリングを実装しています。

## Game Balance

### Resource Management
- **HP**: 基本100、レベルアップで+10
- **酸素**: 基本100、毎ターン消費（階層に応じて増加）
- **Gold**: 特殊能力購入に使用

### Item Spawn Rates
- **武器コンテナ**: 75%の確率で出現（デッキ3+では追加40%）
- **医療コンテナ**: 70%の確率で出現
- **酸素コンテナ**: 常に2個配置

### Combat Balance
- **基本攻撃力**: 20（レベルアップで+2）
- **基本防御力**: 5（レベルアップで+1）
- **クリティカル率**: 15%（レベルアップで最大30%）

## Visual System

### Lighting System
`RenderManager.js`で実装された方向性照明：

- **向いている方向**: 通常の照明範囲（4マス）
- **背後方向**: 制限された照明範囲（2マス）
- **プレイヤーの向き**: 移動方向に応じて自動更新

### Rendering Pipeline
1. グリッドの初期化
2. 視界計算
3. セルの描画
4. エフェクトの表示
5. UIの更新

## Performance Considerations

### Memory Management
- ゲームオブジェクトの適切な初期化とクリーンアップ
- イベントリスナーの適切な削除
- 大量のDOM操作の回避

### Audio Performance
- 音響リソースの事前初期化
- 効果音の適切な停止とリソース解放
- 音量調整の効率的な実装

## 世界観
深宇宙探査船ルミナス号
君は保守技術者として、3年間の任務を終え地球への帰路についていた。
乗員120名、帰還予定まで残り3日...

「緊急事態発生。全員、持ち場を離れ避難せよ」
最後の船内放送から6時間が経過した。

機械室での定期点検中に気を失い、今ようやく目覚めた。
薄暗い非常灯だけが照らす廊下に、人の姿はない。
静寂を破るのは、どこからか聞こえる奇怪な鳴き声だけ。

スーツの表示：酸素残量3時間、電力わずか
無線：応答なし

3年ぶりに待つ故郷へ帰るため、
仲間たちの身に何が起こったのかを知るため...
一人きりの探索が始まる。

## 目的
デッキ20にあるエンジンルームを目指す。エンジンを修理することが最終目標。