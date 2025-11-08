export interface SimulationConfig {
  symbol: string;           // 銘柄名
  startDate: Date;          // 開始年月日
  period: number;           // 期間（日数）
  initialCash: number;      // 初期資金
  tradeAmount: number;      // 売買単位金額
  maxPositions: number;     // 最大保有ポジション数
  csvFile?: File;           // CSVファイル
}

export interface SimulationState {
  currentDate: Date;
  currentDay: number;
  cash: number;
  positions: any[];         // Position[]
  closedPositions: any[];   // ClosedPosition[]
  trades: any[];            // Trade[]
  nextPositionId: number;
}

export interface PerformanceMetrics {
  winRate: number;          // 勝率
  profitRate: number;       // 利益率
  expectedValue: number;    // 期待値
  maxDrawdown: number;      // 最大ドローダウン
  totalTrades: number;      // 取引回数
  winTrades: number;        // 勝ち取引数
  loseTrades: number;       // 負け取引数
  avgProfit: number;        // 平均利益
  avgLoss: number;          // 平均損失
  profitFactor: number;     // プロフィットファクター
  totalProfit: number;      // 総利益
  totalLoss: number;        // 総損失
}
