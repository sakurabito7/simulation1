# Stock Simulation（株式投資シミュレーション）

Angularで実装した株式投資シミュレーションアプリケーションです。ローカルの株価データ（CSV）を使用して、移動平均線とRSIのチャートを表示しながら、手動で売買を行い、投資成績を確認できます。

## 機能

- **開始設定画面**: 銘柄名、開始日、期間、初期資金、売買単位金額を設定
- **シミュレーション画面**:
  - 移動平均線チャート（MA5, MA25, MA75）
  - RSIチャート
  - 売買ポイント散布図
  - 資産状況表示（現金、保有株数、評価額、損益）
  - 操作パネル（買い・売り・何もしない・売買単位金額変更）
- **結果表示画面**: 投資成績の詳細表示と売買履歴のエクスポート

## CSVデータ形式

以下の形式のCSVファイルを準備してください：

```
日付,始値,高値,安値,終値,出来高
2024-01-01,1000,1050,990,1020,1000000
2024-01-02,1020,1080,1010,1060,1200000
...
```

## セットアップ

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
