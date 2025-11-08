# 株式投資シミュレーション 実装計画書

## 1. プロジェクト概要

### 1.1 システム概要
株価データ（CSV）を読み込み、移動平均・RSI等のテクニカル指標を表示しながら、手動で売買シミュレーションを行うWebアプリケーション。ロング（買い）・ショート（売り）の両建て取引に対応し、相殺決済機能により複数ポジションの同時決済が可能。

### 1.2 技術スタック
- **フレームワーク**: Angular 20.1.0
- **言語**: TypeScript 5.8.2
- **UIライブラリ**: Angular Standalone Components
- **チャートライブラリ**:
  - Chart.js 4.5.1
  - ng2-charts 8.0.0
  - chartjs-chart-financial 0.2.1
- **フォームライブラリ**: @angular/forms
- **ビルドツール**: Angular CLI 20.1.4

---

## 2. プロジェクト構成

### 2.1 フォルダ構造
```
stock-simulation/
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── stock-data/              # 株価データCSVファイル配置場所
├── src/
│   ├── app/
│   │   ├── components/              # UIコンポーネント
│   │   │   ├── start-config/        # 初期設定画面
│   │   │   ├── simulation/          # メインシミュレーション画面
│   │   │   ├── control-panel/       # 操作パネル
│   │   │   ├── info-panel/          # 資産情報表示
│   │   │   ├── moving-average-chart/ # 移動平均チャート
│   │   │   ├── rsi-chart/           # RSIチャート
│   │   │   ├── scatter-plot/        # ポジション散布図
│   │   │   ├── offset-points/       # 相殺決済ポイント表示
│   │   │   ├── trade-history/       # 売買履歴
│   │   │   └── result/              # 結果画面
│   │   ├── models/                  # データモデル
│   │   │   ├── simulation-config.model.ts
│   │   │   ├── position.model.ts
│   │   │   ├── trade.model.ts
│   │   │   └── stock-data.model.ts
│   │   ├── services/                # ビジネスロジック
│   │   │   ├── stock-data.ts        # 株価データ管理
│   │   │   ├── calculation.ts       # 計算処理
│   │   │   └── trading.ts           # 取引処理
│   │   ├── config/                  # 設定ファイル
│   │   │   └── app.config.constants.ts
│   │   ├── utils/                   # ユーティリティ
│   │   │   └── debug-logger.ts
│   │   ├── app.ts                   # ルートコンポーネント
│   │   ├── app.config.ts            # アプリ設定
│   │   └── app.routes.ts            # ルーティング設定
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── README.md
├── SETUP.md
├── stock-simulation-spec.md
└── IMPLEMENTATION-PLAN.md           # 本ドキュメント
```

---

## 3. データモデル設計

### 3.1 simulation-config.model.ts

#### SimulationConfig（シミュレーション設定）
```typescript
interface SimulationConfig {
  symbol: string;              // 銘柄コード（例: "7203"）
  startDate: Date;             // シミュレーション開始日
  period: number;              // シミュレーション期間（日数）
  initialCash: number;         // 初期資金
  tradeAmount: number;         // 1回の取引金額
  maxPositions: number;        // 最大保有ポジション数（デフォルト: 5）
  csvFile?: File;              // CSVファイル（アップロード時）
}
```

#### SimulationState（シミュレーション状態）
```typescript
interface SimulationState {
  currentDay: number;          // 現在の経過日数（0始まり）
  currentDate: Date;           // 現在日付
  cash: number;                // 現金残高
  positions: Position[];       // 保有中のポジション
  closedPositions: ClosedPosition[];  // 決済済みポジション
  trades: Trade[];             // 全取引履歴
  nextPositionId: number;      // 次のポジションID
}
```

#### PerformanceMetrics（投資成績）
```typescript
interface PerformanceMetrics {
  winRate: number;             // 勝率（%）
  profitRate: number;          // 利益率（%）
  expectedValue: number;       // 期待値（円）
  maxDrawdown: number;         // 最大ドローダウン（円）
  totalTrades: number;         // 総取引回数
  winTrades: number;           // 勝ち取引数
  loseTrades: number;          // 負け取引数
  avgProfit: number;           // 平均利益（円）
  avgLoss: number;             // 平均損失（円）
  profitFactor: number;        // プロフィットファクター
  totalProfit: number;         // 総利益（円）
  totalLoss: number;           // 総損失（円）
}
```

### 3.2 position.model.ts

#### PositionType（ポジション種別）
```typescript
enum PositionType {
  LONG = 'LONG',   // 買いポジション
  SHORT = 'SHORT'  // 売りポジション
}
```

#### Position（ポジション）
```typescript
interface Position {
  id: number;                  // ポジションID
  type: PositionType;          // ポジション種別
  entryDate: Date;             // 取得日
  entryPrice: number;          // 取得単価
  quantity: number;            // 数量（株数）
  label: string;               // ラベル（例: "買い1", "売り2"）
}
```

#### ClosedPosition（決済済みポジション）
```typescript
interface ClosedPosition extends Position {
  exitDate: Date;              // 決済日
  exitPrice: number;           // 決済単価
  profit: number;              // 損益（円）
  profitRate: number;          // 損益率（%）
}
```

### 3.3 trade.model.ts

#### TradeAction（取引種別）
```typescript
enum TradeAction {
  BUY = 'BUY',     // 買い
  SELL = 'SELL'    // 売り
}
```

#### Trade（取引）
```typescript
interface Trade {
  date: Date;                  // 取引日
  action: TradeAction;         // 取引種別
  price: number;               // 取引単価
  quantity: number;            // 数量
  positionType: PositionType;  // ポジション種別
  positionId: number;          // ポジションID
  label: string;               // ラベル
  isClosing: boolean;          // 決済取引かどうか
  profit?: number;             // 決済時の損益
}
```

### 3.4 stock-data.model.ts

#### StockData（株価データ）
```typescript
interface StockData {
  date: Date;                  // 日付
  open: number;                // 始値
  high: number;                // 高値
  low: number;                 // 安値
  close: number;               // 終値
  volume: number;              // 出来高
}
```

#### ChartData（チャート表示用データ）
```typescript
interface ChartData {
  date: Date;                  // 日付
  open: number;                // 始値
  high: number;                // 高値
  low: number;                 // 安値
  close: number;               // 終値
  ma5?: number;                // 5日移動平均
  ma25?: number;               // 25日移動平均
  ma75?: number;               // 75日移動平均
  rsi?: number;                // RSI（14日）
}
```

---

## 4. サービス層設計

### 4.1 StockData（株価データサービス）

**責務**: CSVファイルの読み込み、解析、データ管理

#### 主要メソッド

##### loadStockDataFromCSV(file: File): Promise<StockData[]>
- CSVファイルを読み込み、StockData配列に変換
- フォーマット: `日付,始値,高値,安値,終値,出来高`
- 日付でソート（古い順）
- キャッシュに保存

##### getDataByPeriod(startDate: Date, days: number): StockData[]
- 指定開始日から指定日数分のデータを取得

##### getDataWithPreload(startDate: Date, simulationDays: number, preloadDays: number): StockData[]
- チャート表示用：開始日の指定日数前からデータを取得
- プリロード期間 + シミュレーション期間のデータを返却

##### getDataByIndex(centerIndex: number, days: number): StockData[]
- インデックス指定でデータ取得（遡って取得）

##### getAllData(): StockData[]
- 全データを取得

##### clearCache(): void
- キャッシュクリア

##### parseDate(dateStr: string): Date（private）
- 日付文字列の解析（YYYY-MM-DD または YYYY/MM/DD 形式）

---

### 4.2 Calculation（計算サービス）

**責務**: テクニカル指標の計算、相殺決済ポイントの算出

#### 主要メソッド

##### calculateChartData(stockData: StockData[], currentDay: number): ChartData[]
- 移動平均（MA5, MA25, MA75）とRSIを計算
- 表示用のChartData配列を返却

##### calculateMA(data: number[], period: number): number[]（private）
- 移動平均を計算
- Simple Moving Average (SMA) 方式

##### calculateRSI(closes: number[], period: number = 14): number[]（private）
- RSI（相対力指数）を計算
- 期間: 14日（デフォルト）
- 計算式: RSI = 100 - (100 / (1 + RS))
  - RS = 平均上昇幅 / 平均下落幅

##### OffsetPoint（相殺決済ポイント型）
```typescript
interface OffsetPoint {
  positions: Position[];       // 対象ポジション
  labels: string[];            // ポジションラベル
  offsetPrice: number;         // 相殺価格
  netQuantity: number;         // 正味数量
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';  // 方向
}
```

##### calculateOffsetPoints(positions: Position[]): OffsetPoint[]
- 複数ポジション組み合わせの相殺決済ポイントを計算
- ロングとショートが混在する組み合わせのみ抽出
- 計算式（加重平均価格）:
  ```
  P0 = ( Σ(q_Bi * p_Bi) + Σ(q_Sj * p_Sj) ) / ( Σ(q_Bi) + Σ(q_Sj) )

  P0: 相殺決済価格
  q_Bi: i番目の買いポジション数量
  p_Bi: i番目の買いポジション取得単価
  q_Sj: j番目の売りポジション数量
  p_Sj: j番目の売りポジション取得単価
  ```

##### calculateOffsetPrice(positions: Position[]): OffsetPoint | null（private）
- 単一組み合わせの相殺価格を計算
- ロングとショートが混在しない場合はnull

##### generateCombinations<T>(arr: T[], minSize: number = 2): T[][]（private）
- 配列の全組み合わせを生成（2個以上）
- ビット演算を使用した高速アルゴリズム

---

### 4.3 Trading（取引サービス）

**責務**: ポジション管理、取引実行、投資成績計算

#### 主要メソッド

##### openLongPosition(state: SimulationState, currentPrice: number, currentDate: Date, tradeAmount: number): void
- 新規ロングポジション（買い）を作成
- 数量 = floor(取引金額 / 現在価格)
- ラベル自動付与: "買い1", "買い2", ...
- 現金から購入金額を差し引き
- positions配列とtrades配列に追加

##### openShortPosition(state: SimulationState, currentPrice: number, currentDate: Date, tradeAmount: number): void
- 新規ショートポジション（売り）を作成
- 数量 = floor(取引金額 / 現在価格)
- ラベル自動付与: "売り1", "売り2", ...
- 現金に売却金額を追加
- positions配列とtrades配列に追加

##### closeLongPosition(state: SimulationState, positionId: number, currentPrice: number, currentDate: Date): void
- ロングポジションを決済（売却）
- 損益計算: (売却価格 - 取得価格) × 数量
- 損益率計算: (損益 / 取得金額) × 100
- 現金に売却金額を追加
- positions配列から削除、closedPositions配列に追加
- trades配列に決済取引を追加

##### closeShortPosition(state: SimulationState, positionId: number, currentPrice: number, currentDate: Date): void
- ショートポジションを決済（買戻し）
- 損益計算: (売却価格 - 買戻価格) × 数量
- 損益率計算: (損益 / 売却金額) × 100
- 現金から買戻金額を差し引き
- positions配列から削除、closedPositions配列に追加
- trades配列に決済取引を追加

##### calculatePortfolioValue(positions: Position[], currentPrice: number): number
- ポジションの評価額を計算
- ロング: 数量 × 現在価格
- ショート: 数量 × (取得価格 - 現在価格)

##### calculatePerformanceMetrics(closedPositions: ClosedPosition[], initialCash: number): PerformanceMetrics
- 投資成績を計算
- 勝率、利益率、期待値、最大ドローダウン等を算出

##### calculateMaxDrawdown(closedPositions: ClosedPosition[]): number（private）
- 最大ドローダウンを計算
- ピークからの最大下落幅

---

## 5. コンポーネント設計

### 5.1 app.ts（ルートコンポーネント）

**責務**: アプリケーション全体の画面遷移管理

#### プロパティ
- `currentView: string` - 現在の表示画面（'config' | 'simulation' | 'result'）
- `config?: SimulationConfig` - シミュレーション設定
- `state?: SimulationState` - シミュレーション状態

#### メソッド
- `onStartSimulation(config: SimulationConfig)` - シミュレーション開始
- `onFinishSimulation(state: SimulationState)` - シミュレーション終了

---

### 5.2 start-config（初期設定画面）

**ファイル**: `components/start-config/`

#### 責務
- シミュレーション開始条件の入力
- CSVファイルのアップロード

#### プロパティ
```typescript
config: SimulationConfig = {
  symbol: '',
  startDate: new Date(),
  period: 30,
  initialCash: 1000000,
  tradeAmount: 100000,
  maxPositions: 5
}
minStartDate: string  // 最小開始日（YYYY-MM-DD）
maxStartDate: string  // 最大開始日（YYYY-MM-DD）
```

#### Output
- `@Output() start: EventEmitter<SimulationConfig>` - シミュレーション開始イベント

#### メソッド
- `onFileSelected(event: Event)` - CSVファイル選択
- `async onSubmit()` - フォーム送信（データ読み込み・バリデーション）

#### バリデーション
- 銘柄コード: 必須
- 開始日: 必須、データ範囲内
- 期間: 1日以上、データ範囲内
- 初期資金: 1円以上
- 取引金額: 1円以上
- 最大ポジション数: 1〜20

---

### 5.3 simulation（メインシミュレーション画面）

**ファイル**: `components/simulation/`

#### 責務
- シミュレーション全体の統括
- 子コンポーネントの配置・連携
- ユーザー操作の処理

#### プロパティ
```typescript
@Input() config: SimulationConfig
state: SimulationState
stockData: StockData[]        // 全株価データ
chartData: ChartData[]        // チャート表示用データ
currentPrice: number          // 現在価格
portfolioValue: number        // 評価額
showNotification: boolean     // 通知表示フラグ
notificationMessage: string   // 通知メッセージ
```

#### Output
- `@Output() finish: EventEmitter<SimulationState>` - シミュレーション終了イベント

#### メソッド
- `ngOnInit()` - 初期化（株価データ読み込み、状態初期化）
- `onBuy(positionId: number | null)` - 買い処理
  - null: 新規ロングポジション作成
  - -1: 全ショートポジション決済
  - 数値: 指定ショートポジション決済
- `onSell(positionId: number | null)` - 売り処理
  - null: 新規ショートポジション作成
  - -1: 全ロングポジション決済
  - 数値: 指定ロングポジション決済
- `onSettlePositions(positionIds: number[])` - 相殺決済処理
- `onNextDay()` - 次の日へ進む
- `onUpdateTradeAmount(amount: number)` - 取引金額変更
- `onFinish()` - シミュレーション終了
- `onGoBack()` - 初期画面に戻る
- `updateChartData()` - チャートデータ更新
- `getLongPositions(): Position[]` - ロングポジション取得
- `getShortPositions(): Position[]` - ショートポジション取得
- `showNotificationMessage(message: string)` - 通知メッセージ表示（3秒間）

#### レイアウト
```
┌─────────────────────────────────────────────────────────────┐
│                    株式投資シミュレーション                     │
├──────────────────────┬──────────────────────┬───────────────┤
│  左側エリア           │  中央エリア           │  右側エリア    │
│                      │                      │               │
│ [移動平均チャート]    │ [売買履歴]           │ [資産情報]     │
│                      │                      │               │
│ [RSIチャート]        │ [相殺決済ポイント]    │ [操作パネル]   │
│                      │                      │               │
│                      │ [散布図]             │               │
└──────────────────────┴──────────────────────┴───────────────┘
```

---

### 5.4 control-panel（操作パネル）

**ファイル**: `components/control-panel/`

#### 責務
- 売買操作のUI提供
- ポジション選択・一括決済

#### プロパティ
```typescript
@Input() longPositions: Position[]   // ロングポジション一覧
@Input() shortPositions: Position[]  // ショートポジション一覧
@Input() tradeAmount: number         // 取引金額

selectedBuyOption: string = 'new'    // 買い選択項目
selectedSellOption: string = 'new'   // 売り選択項目
newTradeAmount: number               // 新取引金額
showTradeAmountDialog: boolean       // 取引金額変更ダイアログ表示フラグ
```

#### Output
```typescript
@Output() buy: EventEmitter<number | null>     // 買い
@Output() sell: EventEmitter<number | null>    // 売り
@Output() nextDay: EventEmitter<void>          // 次の日
@Output() updateTradeAmount: EventEmitter<number>  // 取引金額更新
@Output() finish: EventEmitter<void>           // 終了
@Output() goBack: EventEmitter<void>           // 戻る
```

#### メソッド
- `onBuyClick()` - 買いボタンクリック
- `onSellClick()` - 売りボタンクリック
- `onNextDayClick()` - 次の日へボタンクリック
- `openTradeAmountDialog()` - 取引金額変更ダイアログ表示
- `closeTradeAmountDialog()` - ダイアログ閉じる
- `saveTradeAmount()` - 取引金額保存
- `onFinishClick()` - 終了ボタンクリック
- `onGoBackClick()` - 戻るボタンクリック

---

### 5.5 info-panel（資産情報表示）

**ファイル**: `components/info-panel/`

#### 責務
- 資産状況の表示
- ポジション明細の表示

#### プロパティ
```typescript
@Input() config: SimulationConfig
@Input() state: SimulationState
@Input() currentPrice: number
@Input() portfolioValue: number

PositionType = PositionType  // テンプレート用
```

#### Computed Properties
```typescript
get totalAssets(): number        // 総資産
get profitLoss(): number         // 損益
get profitLossRate(): number     // 損益率
get totalHoldings(): number      // 保有株数合計
get recentPositions()            // 直近5件のポジション詳細
```

#### PositionDetail型
```typescript
interface PositionDetail {
  position: Position
  currentValue: number      // 評価額
  profitLoss: number        // 損益
  profitLossRate: number    // 損益率
}
```

---

### 5.6 moving-average-chart（移動平均チャート）

**ファイル**: `components/moving-average-chart/`

#### 責務
- 移動平均線チャートの表示
- 売買ポイントのマーキング

#### プロパティ
```typescript
@Input() chartData: ChartData[]
@Input() trades: Trade[]

scatterChartType: ChartType = 'line'
scatterChartData: ChartConfiguration['data']
scatterChartOptions: ChartOptions
```

#### Chart.js設定
- ラインチャート
- データセット:
  - 終値（黒）
  - MA5（青）
  - MA25（オレンジ）
  - MA75（紫）
  - 買いマーカー（青い▲）
  - 売りマーカー（赤い▼）
- X軸: 日付
- Y軸: 価格（円）

#### メソッド
- `ngOnChanges()` - 入力変更時の処理
- `ngAfterViewInit()` - ビュー初期化後の処理
- `updateChart()` - チャート更新

---

### 5.7 rsi-chart（RSIチャート）

**ファイル**: `components/rsi-chart/`

#### 責務
- RSIチャートの表示
- 買われすぎ/売られすぎラインの表示

#### プロパティ
```typescript
@Input() chartData: ChartData[]

scatterChartType: ChartType = 'line'
scatterChartData: ChartConfiguration['data']
scatterChartOptions: ChartOptions
```

#### Chart.js設定
- ラインチャート
- データセット:
  - RSI（青）
  - 上限ライン（70、赤）
  - 下限ライン（30、緑）
- X軸: 日付
- Y軸: RSI値（0〜100）

#### メソッド
- `ngOnChanges()` - 入力変更時の処理
- `ngAfterViewInit()` - ビュー初期化後の処理
- `updateChart()` - チャート更新

---

### 5.8 scatter-plot（ポジション散布図）

**ファイル**: `components/scatter-plot/`

#### 責務
- 現在のポジションを散布図で表示
- 現在価格との関係を可視化

#### プロパティ
```typescript
@Input() trades: Trade[]
@Input() positions: Position[]
@Input() currentPrice: number
@Input() maxPositions: number = 5

scatterChartType: ChartType = 'scatter'
scatterChartData: ChartConfiguration['data']
scatterChartOptions: ChartOptions
```

#### Chart.js設定
- 散布図
- データセット:
  - ロング（青い●）
  - ショート（赤い●）
- X軸: ポジション番号（1〜maxPositions固定）
- Y軸: 価格（動的調整）
- 現在価格: 赤い点線（annotation）

#### メソッド
- `ngOnInit()` - 初期化
- `ngOnChanges()` - 入力変更時の処理
- `ngAfterViewInit()` - ビュー初期化後の処理
- `updateChart()` - チャート更新

---

### 5.9 offset-points（相殺決済ポイント）

**ファイル**: `components/offset-points/`

#### 責務
- 相殺決済ポイントの表示
- クリックで相殺決済実行

#### プロパティ
```typescript
@Input() positions: Position[]
@Input() currentPrice: number

@Output() settlePositions: EventEmitter<number[]>

offsetPoints: OffsetPoint[]
Math = Math  // テンプレート用
```

#### メソッド
- `ngOnChanges()` - 入力変更時の処理
- `updateOffsetPoints()` - 相殺ポイント更新（降順ソート）
- `getLabelClass(label: string): string` - ラベルのCSSクラス取得
- `onOffsetPointClick(point: OffsetPoint)` - クリック時の処理（確認ダイアログ→決済）
- `getPriceDifference(offsetPrice: number): number` - 現在価格との差額計算
- `getDifferenceClass(difference: number): string` - 差額のCSSクラス取得

#### 表示フォーマット
```
[買い1, 売り2] ¥123,456 (+¥1,234)
```
- 買いラベル: 青
- 売りラベル: 赤
- 差額プラス: 青
- 差額マイナス: 赤

---

### 5.10 trade-history（売買履歴）

**ファイル**: `components/trade-history/`

#### 責務
- 売買履歴の表示
- スクロール可能なリスト表示

#### プロパティ
```typescript
@Input() trades: Trade[]
@Input() chartData: ChartData[]
@Input() currentDate: Date
@Input() currentPrice: number

TradeAction = TradeAction      // テンプレート用
PositionType = PositionType    // テンプレート用
```

#### メソッド
- なし（表示のみ）

#### 表示内容
- 日付
- 取引種別（買い/売り）
- ラベル（買い1、売り2等）
- 価格 × 数量
- 決済時の損益（ある場合）

---

### 5.11 result（結果画面）

**ファイル**: `components/result/`

#### 責務
- シミュレーション結果の表示
- 投資成績の計算・表示
- 売買履歴のエクスポート

#### プロパティ
```typescript
@Input() config: SimulationConfig
@Input() state: SimulationState

metrics: PerformanceMetrics
```

#### メソッド
- `ngOnInit()` - 初期化（成績計算）
- `calculateMetrics()` - 投資成績計算
- `exportTradeHistory()` - 売買履歴テキスト出力
- `restart()` - アプリ再起動

#### エクスポートファイル名
```
{銘柄コード}_{YYYYMMDDHHmmss}.txt
```

#### 表示内容
- 投資成績サマリー
  - 勝率
  - 利益率
  - 期待値
  - 最大ドローダウン
  - 総取引回数
  - 勝ち取引数/負け取引数
  - 平均利益/平均損失
  - プロフィットファクター
- 売買履歴一覧

---

## 6. 主要機能フロー

### 6.1 アプリケーション起動フロー

```
1. アプリ起動（app.ts）
   ↓
2. start-config表示
   ↓
3. ユーザー入力（銘柄、期間、資金等）
   ↓
4. CSVファイルアップロード
   ↓
5. StockDataService.loadStockDataFromCSV()
   ↓
6. バリデーション
   ↓
7. シミュレーション開始イベント発火
   ↓
8. app.ts: currentView = 'simulation'
   ↓
9. simulationコンポーネント表示
```

### 6.2 シミュレーション初期化フロー

```
1. simulation.ngOnInit()
   ↓
2. SimulationState初期化
   - currentDay = 0
   - cash = initialCash
   - positions = []
   - trades = []
   ↓
3. 株価データ取得（プリロード含む）
   - StockDataService.getDataWithPreload()
   ↓
4. チャートデータ計算
   - Calculation.calculateChartData()
   ↓
5. 初回チャート描画
   - moving-average-chart.updateChart()
   - rsi-chart.updateChart()
   - scatter-plot.updateChart()
```

### 6.3 買い操作フロー

```
1. control-panel: 買いボタンクリック
   ↓
2. プルダウン選択に応じて分岐

   【新規購入の場合】
   3a. simulation.onBuy(null)
      ↓
   4a. ポジション数チェック（maxPositions）
      ↓
   5a. Trading.openLongPosition()
      ↓
   6a. 新規ポジション作成
      - 数量計算: floor(tradeAmount / currentPrice)
      - ラベル付与: "買いN"
      - 現金減少
      - positions配列追加
      - trades配列追加

   【ショート決済の場合】
   3b. simulation.onBuy(positionId)
      ↓
   4b. Trading.closeShortPosition()
      ↓
   5b. ポジション決済
      - 損益計算
      - 現金減少（買戻金額）
      - positions配列から削除
      - closedPositions配列追加
      - trades配列追加（決済取引）

7. チャート更新
   - scatter-plot更新（ポジション変化）
   - moving-average-chart更新（マーカー追加）
   ↓
8. 通知表示（3秒間）
```

### 6.4 売り操作フロー

```
1. control-panel: 売りボタンクリック
   ↓
2. プルダウン選択に応じて分岐

   【新規売却の場合】
   3a. simulation.onSell(null)
      ↓
   4a. ポジション数チェック（maxPositions）
      ↓
   5a. Trading.openShortPosition()
      ↓
   6a. 新規ポジション作成
      - 数量計算: floor(tradeAmount / currentPrice)
      - ラベル付与: "売りN"
      - 現金増加
      - positions配列追加
      - trades配列追加

   【ロング決済の場合】
   3b. simulation.onSell(positionId)
      ↓
   4b. Trading.closeLongPosition()
      ↓
   5b. ポジション決済
      - 損益計算
      - 現金増加（売却金額）
      - positions配列から削除
      - closedPositions配列追加
      - trades配列追加（決済取引）

7. チャート更新
   - scatter-plot更新（ポジション変化）
   - moving-average-chart更新（マーカー追加）
   ↓
8. 通知表示（3秒間）
```

### 6.5 相殺決済フロー

```
1. offset-points: 相殺ポイントクリック
   ↓
2. 確認ダイアログ表示
   - 対象ポジション一覧
   - 相殺価格
   ↓
3. ユーザー確認
   ↓
4. offset-points.settlePositions.emit(positionIds)
   ↓
5. simulation.onSettlePositions(positionIds)
   ↓
6. ポジションごとに決済処理
   - ロング: Trading.closeLongPosition()
   - ショート: Trading.closeShortPosition()
   ↓
7. positions配列更新（スプレッド演算子で新配列作成）
   ↓
8. チャート更新
   ↓
9. 通知表示: "N件のポジションを相殺決済しました"
```

### 6.6 次の日へ進むフロー

```
1. control-panel: 次の日へボタンクリック
   ↓
2. simulation.onNextDay()
   ↓
3. state.currentDay++
   ↓
4. 期間終了チェック
   - currentDay >= config.period の場合
     → シミュレーション強制終了
   ↓
5. 現在日付更新
   - state.currentDate
   ↓
6. チャートデータ更新
   - updateChartData()
   - Calculation.calculateChartData()
   ↓
7. 全チャート再描画
   - moving-average-chart.updateChart()
   - rsi-chart.updateChart()
   - scatter-plot.updateChart()
   ↓
8. 評価額再計算
   - Trading.calculatePortfolioValue()
```

### 6.7 シミュレーション終了フロー

```
1. control-panel: 終了ボタンクリック
   ↓
2. 確認ダイアログ表示
   ↓
3. simulation.onFinish()
   ↓
4. 未決済ポジションの自動決済
   - 全ロングポジション: closeLongPosition()
   - 全ショートポジション: closeShortPosition()
   ↓
5. finish.emit(state)
   ↓
6. app.ts: currentView = 'result'
   ↓
7. result表示
   ↓
8. 投資成績計算
   - Trading.calculatePerformanceMetrics()
   ↓
9. 結果表示
```

---

## 7. スタイリング規約

### 7.1 色定義

#### プラス/マイナス表示
- **プラス（利益）**: `#1976D2`（青）
- **マイナス（損失）**: `#D32F2F`（赤）

#### ポジション種別
- **ロング（買い）**: `#2196F3`（青）、`rgba(54, 162, 235, 0.9)`
- **ショート（売り）**: `#f44336`（赤）、`rgba(255, 99, 132, 0.9)`

#### テキスト
- **通常テキスト**: `#333`
- **ラベル**: `#666`
- **ハイライト**: `#2196F3`

#### 背景
- **パネル背景**: `#fff`
- **カード背景**: `#f9f9f9`
- **ホバー背景**: `#fff3e0`

#### ボーダー
- **通常ボーダー**: `#ddd`, `#e0e0e0`
- **アクセントボーダー**: `#4CAF50`, `#FF9800`

### 7.2 フォントサイズ
- **大見出し**: `18px`
- **中見出し**: `16px`
- **小見出し**: `14px`
- **通常テキスト**: `12px`
- **小テキスト**: `11px`

### 7.3 レイアウト
- **Grid Gap**: `8px`, `10px`
- **Padding**: `6px`, `8px`, `10px`
- **Border Radius**: `3px`, `4px`
- **ポジションカード幅**: `180px`（固定）

---

## 8. テスト計画

### 8.1 単体テスト

#### StockDataService
- CSVファイル読み込み
- 日付解析（YYYY-MM-DD, YYYY/MM/DD）
- データ範囲取得

#### CalculationService
- 移動平均計算（MA5, MA25, MA75）
- RSI計算
- 相殺決済ポイント計算

#### TradingService
- ロングポジション作成
- ショートポジション作成
- ロングポジション決済
- ショートポジション決済
- 評価額計算
- 投資成績計算

### 8.2 統合テスト
- 初期設定 → シミュレーション開始
- 売買操作 → ポジション管理
- 相殺決済 → 複数ポジション同時決済
- 次の日 → データ更新
- シミュレーション終了 → 結果表示

### 8.3 E2Eテスト
- CSVアップロード → 全操作 → 結果エクスポート
- エラーハンドリング（資金不足、データ不足等）

---

## 9. デプロイメント

### 9.1 ビルド
```bash
npm run build
```

### 9.2 開発サーバー
```bash
npm start
# http://localhost:4200
```

### 9.3 本番ビルド
```bash
ng build --configuration production
```
- 出力先: `dist/stock-simulation/browser/`
- 静的ファイルとしてホスティング可能

---

## 10. 今後の拡張性

### 10.1 実装済み機能
- ✅ ロング・ショート両建て取引
- ✅ 相殺決済機能
- ✅ 移動平均・RSIチャート
- ✅ ポジション散布図
- ✅ 投資成績レポート
- ✅ 売買履歴エクスポート
- ✅ ポジション数制限

### 10.2 今後の拡張候補
- [ ] バックテスト自動実行（戦略ベース）
- [ ] 複数銘柄同時シミュレーション
- [ ] MACD、ボリンジャーバンド等の追加指標
- [ ] ストップロス・テイクプロフィット設定
- [ ] ポートフォリオ管理
- [ ] API連携（リアルタイム株価データ）
- [ ] カスタム戦略のスクリプト実行
- [ ] バックテスト結果の比較機能

---

## 11. 開発環境セットアップ

### 11.1 前提条件
- Node.js 18以上
- npm 9以上
- Angular CLI 20以上

### 11.2 インストール手順

```bash
# リポジトリクローン（またはダウンロード）
cd stock-simulation

# 依存関係インストール
npm install

# 開発サーバー起動
npm start
```

### 11.3 CSVデータ準備

```bash
# CSVファイルを配置
# フォーマット: 日付,始値,高値,安値,終値,出来高
# 例: 2024-01-01,1000,1100,950,1050,1000000

# public/assets/stock-data/ フォルダにコピー
# または、アプリケーション内でファイルアップロード
```

---

## 12. トラブルシューティング

### 12.1 よくある問題

#### チャートが表示されない
- Chart.jsのバージョン確認
- BaseChartDirectiveのインポート確認
- データフォーマット確認

#### 株価データが読み込めない
- CSVフォーマット確認（カンマ区切り、ヘッダー行）
- 日付フォーマット確認（YYYY-MM-DD または YYYY/MM/DD）
- 数値フォーマット確認（小数点はピリオド）

#### ポジション数制限が効かない
- maxPositions設定確認
- onBuy/onSellメソッドでのチェック処理確認

#### 相殺決済が表示されない
- ロングとショートが混在しているか確認
- calculateOffsetPointsメソッドのログ確認

---

## 13. 参考資料

### 13.1 公式ドキュメント
- [Angular公式サイト](https://angular.dev/)
- [Chart.js公式サイト](https://www.chartjs.org/)
- [ng2-charts](https://github.com/valor-software/ng2-charts)

### 13.2 プロジェクト内ドキュメント
- `README.md` - プロジェクト概要
- `SETUP.md` - セットアップ手順
- `stock-simulation-spec.md` - 仕様書
- `IMPLEMENTATION-PLAN.md` - 本ドキュメント

---

## 変更履歴

| 日付 | バージョン | 内容 | 担当 |
|------|------------|------|------|
| 2025-11-08 | 1.0 | 初版作成 | - |

---

**以上**
