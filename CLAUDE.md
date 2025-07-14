# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

回答は日本語で行ってください。モチベーションを維持できる回答をしてください。

ファイルは機能単位で適度なファイルサイズで分けて実装してください。

## TDD開発手法（t-wada流）

### 基本サイクル
- 🔴 **Red**: 失敗するテストを書く
- 🟢 **Green**: テストを通す最小限の実装
- 🔵 **Refactor**: リファクタリング

### 実践原則
- **小さなステップ**: 一度に1つの機能のみ
- **仮実装**: テストを通すためにベタ書きでもOK（例：`return 42`）
- **三角測量**: 2つ目、3つ目のテストケースで一般化する
- **TODOリスト更新**: 実装中に思いついたことはすぐリストに追加
- **不安なところから**: 不安な箇所を優先的にテスト
- **即座にコミット**: テストが通ったらすぐコミット

### TDDコミットルール
- 🔴 テストを書いたら: `test: add failing test for [feature]`
- 🟢 テストを通したら: `feat: implement [feature] to pass test`
- 🔵 リファクタリングしたら: `refactor: [description]`

## Project Overview

This is a roguelike game project. The codebase is currently empty and ready for initial development.

## Development Setup

No build system or dependencies have been configured yet. Common setup patterns for roguelike games include:
- Python with pygame, curses, or similar libraries
- JavaScript/TypeScript with web-based rendering
- C/C++ with ncurses or similar terminal libraries
- Rust with crossterm or similar crates
- Go with termui or similar packages

## Next Steps

The project appears to be in initial setup phase. Consider:
1. Choose a programming language and framework
2. Set up basic project structure
3. Initialize version control with `git init`
4. Add appropriate build/run scripts
5. Create initial game loop and display system

This file should be updated once the project structure and tooling are established.