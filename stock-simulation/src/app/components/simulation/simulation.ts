import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationConfig, SimulationState } from '../../models/simulation-config.model';
import { StockData as StockDataModel, ChartData } from '../../models/stock-data.model';
import { Position, PositionType } from '../../models/position.model';
import { Trade } from '../../models/trade.model';
import { StockData } from '../../services/stock-data';
import { Trading } from '../../services/trading';
import { Calculation } from '../../services/calculation';
import { MovingAverageChart } from '../moving-average-chart/moving-average-chart';
import { RsiChart } from '../rsi-chart/rsi-chart';
import { ScatterPlot } from '../scatter-plot/scatter-plot';
import { InfoPanel } from '../info-panel/info-panel';
import { ControlPanel } from '../control-panel/control-panel';
import { TradeHistory } from '../trade-history/trade-history';
import { OffsetPoints } from '../offset-points/offset-points';

@Component({
  selector: 'app-simulation',
  imports: [
    CommonModule,
    MovingAverageChart,
    RsiChart,
    ScatterPlot,
    InfoPanel,
    ControlPanel,
    TradeHistory,
    OffsetPoints
  ],
  templateUrl: './simulation.html',
  styleUrl: './simulation.css',
})
export class Simulation implements OnInit {
  @Input() config!: SimulationConfig;
  @Output() simulationComplete = new EventEmitter<SimulationState>();
  @Output() backToStart = new EventEmitter<void>();

  allStockData: StockDataModel[] = [];
  simulationData: StockDataModel[] = [];
  chartData: ChartData[] = [];

  // チャート表示用の定数
  private readonly CHART_DISPLAY_DAYS = 90; // 3ヶ月分（約90日）
  private readonly PRELOAD_DAYS = 390; // 移動平均300日 + 表示期間90日
  private preloadDays = 0; // 実際にプリロードされた日数

  state: SimulationState = {
    currentDate: new Date(),
    currentDay: 0,
    cash: 0,
    positions: [],
    closedPositions: [],
    trades: [],
    nextPositionId: 1
  };

  currentPrice: number = 0;
  portfolioValue: number = 0;

  // 通知メッセージ用
  notificationMessage: string = '';
  showNotification: boolean = false;

  constructor(
    private stockDataService: StockData,
    private tradingService: Trading,
    private calculationService: Calculation
  ) {}

  async ngOnInit() {
    if (this.config && this.config.csvFile) {
      await this.initializeSimulation();
    }
  }

  async initializeSimulation() {
    console.log('[Simulation] ===== initializeSimulation START =====');
    try {
      // CSVファイルを読み込み
      this.allStockData = await this.stockDataService.loadStockDataFromCSV(this.config.csvFile!);

      // チャート表示用にプリロード期間を含めてデータを取得
      // 300日移動平均 + 表示期間90日 = 390日前からデータを取得
      this.simulationData = this.stockDataService.getDataWithPreload(
        this.config.startDate,
        this.config.period,
        this.PRELOAD_DAYS
      );

      if (this.simulationData.length === 0) {
        alert('指定された期間のデータが見つかりません');
        return;
      }

      // 実際にプリロードされた日数を計算
      const startIndex = this.allStockData.findIndex(
        d => d.date >= this.config.startDate
      );
      this.preloadDays = Math.min(startIndex, this.PRELOAD_DAYS);

      // シミュレーション開始日のデータ（プリロード分を考慮）
      const simulationStartIndex = this.preloadDays;

      // 初期状態を設定
      this.state.currentDate = this.simulationData[simulationStartIndex].date;
      this.state.cash = this.config.initialCash;
      this.currentPrice = this.simulationData[simulationStartIndex].close;
      this.portfolioValue = 0; // 初期状態ではポジションなし

      console.log('[Simulation] Initial state:', {
        currentDate: this.state.currentDate,
        cash: this.state.cash,
        currentPrice: this.currentPrice,
        portfolioValue: this.portfolioValue,
        positions: this.state.positions.length,
        trades: this.state.trades.length
      });

      // チャートデータを生成
      this.updateChartData();
      
      console.log('[Simulation] ===== initializeSimulation END =====');
    } catch (error) {
      console.error('[Simulation] 初期化エラー:', error);
      alert('データの読み込みに失敗しました');
    }
  }

  updateChartData() {
    // 現在の位置（プリロード分を考慮）
    const currentIndex = this.preloadDays + this.state.currentDay;

    // 3ヶ月分（90日分）を表示するための開始位置
    const startIndex = Math.max(0, currentIndex - this.CHART_DISPLAY_DAYS + 1);
    const endIndex = currentIndex + 1;

    // チャート表示用のデータを抽出
    const currentData = this.simulationData.slice(startIndex, endIndex);
    this.chartData = this.calculationService.generateChartData(currentData);
  }

  onBuy(positionId: number | null) {
    console.log('[Simulation] ===== onBuy START =====');
    console.log('[Simulation] positionId:', positionId);
    console.log('[Simulation] Before - positions:', this.state.positions.length, this.state.positions);
    console.log('[Simulation] Before - trades:', this.state.trades.length);
    
    let quantity = 0;
    let message = '';

    if (positionId === null) {
      // 新規買い（ロング）
      console.log('[Simulation] Opening new LONG position');

      // 最大ポジション数チェック
      if (this.state.positions.length >= this.config.maxPositions) {
        alert(`最大ポジション数（${this.config.maxPositions}件）に達しています。\n新規ポジションを作成するには、既存のポジションを決済してください。`);
        return;
      }

      quantity = Math.floor(this.config.tradeAmount / this.currentPrice);
      this.tradingService.openLongPosition(
        this.state,
        this.currentPrice,
        this.state.currentDate,
        this.config.tradeAmount
      );
      message = `${quantity}株を¥${this.currentPrice.toLocaleString()}で買いました`;
    } else if (positionId === -1) {
      // 全てのショートポジションを買戻
      console.log('[Simulation] Closing ALL SHORT positions');
      const shortPositions = this.state.positions.filter(p => p.type === PositionType.SHORT);
      let closedCount = 0;

      // 全てのショートポジションを決済（逆順で処理して配列のインデックスずれを防ぐ）
      for (let i = shortPositions.length - 1; i >= 0; i--) {
        const position = shortPositions[i];
        this.tradingService.closeShortPosition(
          this.state,
          position.id,
          this.currentPrice,
          this.state.currentDate
        );
        closedCount++;
      }

      message = `${closedCount}件のショートポジションを¥${this.currentPrice.toLocaleString()}で買い戻しました`;
    } else {
      // ショートポジションの決済
      console.log('[Simulation] Closing SHORT position:', positionId);
      const position = this.state.positions.find(p => p.id === positionId);
      if (position) {
        quantity = position.quantity;
        this.tradingService.closeShortPosition(
          this.state,
          positionId,
          this.currentPrice,
          this.state.currentDate
        );
        message = `${position.label}を${quantity}株¥${this.currentPrice.toLocaleString()}で買い戻しました`;
      }
    }

    // 配列の参照を更新してAngularの変更検知をトリガー
    this.state.positions = [...this.state.positions];
    this.state.trades = [...this.state.trades];

    // ポートフォリオ評価額を再計算
    this.portfolioValue = this.tradingService.calculatePortfolioValue(
      this.state.positions,
      this.currentPrice
    );

    console.log('[Simulation] After - positions:', this.state.positions.length, this.state.positions);
    console.log('[Simulation] After - trades:', this.state.trades.length);
    console.log('[Simulation] ===== onBuy END =====');

    this.showNotificationMessage(message);
  }

  onSell(positionId: number | null) {
    console.log('[Simulation] ===== onSell START =====');
    console.log('[Simulation] positionId:', positionId);
    console.log('[Simulation] Before - positions:', this.state.positions.length, this.state.positions);
    console.log('[Simulation] Before - trades:', this.state.trades.length);
    
    let quantity = 0;
    let message = '';

    if (positionId === null) {
      // 新規売り（ショート）
      console.log('[Simulation] Opening new SHORT position');

      // 最大ポジション数チェック
      if (this.state.positions.length >= this.config.maxPositions) {
        alert(`最大ポジション数（${this.config.maxPositions}件）に達しています。\n新規ポジションを作成するには、既存のポジションを決済してください。`);
        return;
      }

      quantity = Math.floor(this.config.tradeAmount / this.currentPrice);
      this.tradingService.openShortPosition(
        this.state,
        this.currentPrice,
        this.state.currentDate,
        this.config.tradeAmount
      );
      message = `${quantity}株を¥${this.currentPrice.toLocaleString()}で売りました`;
    } else if (positionId === -1) {
      // 全てのロングポジションを売戻
      console.log('[Simulation] Closing ALL LONG positions');
      const longPositions = this.state.positions.filter(p => p.type === PositionType.LONG);
      let closedCount = 0;

      // 全てのロングポジションを決済（逆順で処理して配列のインデックスずれを防ぐ）
      for (let i = longPositions.length - 1; i >= 0; i--) {
        const position = longPositions[i];
        this.tradingService.closeLongPosition(
          this.state,
          position.id,
          this.currentPrice,
          this.state.currentDate
        );
        closedCount++;
      }

      message = `${closedCount}件のロングポジションを¥${this.currentPrice.toLocaleString()}で売却しました`;
    } else {
      // ロングポジションの決済
      console.log('[Simulation] Closing LONG position:', positionId);
      const position = this.state.positions.find(p => p.id === positionId);
      if (position) {
        quantity = position.quantity;
        this.tradingService.closeLongPosition(
          this.state,
          positionId,
          this.currentPrice,
          this.state.currentDate
        );
        message = `${position.label}を${quantity}株¥${this.currentPrice.toLocaleString()}で売却しました`;
      }
    }

    // 配列の参照を更新してAngularの変更検知をトリガー
    this.state.positions = [...this.state.positions];
    this.state.trades = [...this.state.trades];

    // ポートフォリオ評価額を再計算
    this.portfolioValue = this.tradingService.calculatePortfolioValue(
      this.state.positions,
      this.currentPrice
    );

    console.log('[Simulation] After - positions:', this.state.positions.length, this.state.positions);
    console.log('[Simulation] After - trades:', this.state.trades.length);
    console.log('[Simulation] ===== onSell END =====');

    this.showNotificationMessage(message);
  }

  onNextDay() {
    if (this.state.currentDay >= this.simulationData.length - 1) {
      this.completeSimulation();
      return;
    }

    this.showNotificationMessage('次の日に進みます');
    this.advanceDay();
  }

  onUpdateTradeAmount(amount: number) {
    this.config.tradeAmount = amount;
  }

  advanceDay() {
    this.state.currentDay++;

    // シミュレーション期間の終了チェック
    if (this.state.currentDay >= this.config.period) {
      this.completeSimulation();
      return;
    }

    // データのインデックス（プリロード分を考慮）
    const dataIndex = this.preloadDays + this.state.currentDay;

    // データの存在チェック
    if (dataIndex >= this.simulationData.length) {
      this.completeSimulation();
      return;
    }

    this.state.currentDate = this.simulationData[dataIndex].date;
    this.currentPrice = this.simulationData[dataIndex].close;
    this.portfolioValue = this.tradingService.calculatePortfolioValue(
      this.state.positions,
      this.currentPrice
    );

    this.updateChartData();
  }

  completeSimulation() {
    this.simulationComplete.emit(this.state);
  }

  getLongPositions(): Position[] {
    return this.state.positions.filter(p => p.type === PositionType.LONG);
  }

  getShortPositions(): Position[] {
    return this.state.positions.filter(p => p.type === PositionType.SHORT);
  }

  onFinish() {
    this.completeSimulation();
  }

  onGoBack() {
    this.backToStart.emit();
  }

  showNotificationMessage(message: string) {
    this.notificationMessage = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 1000);
  }

  onSettlePositions(positionIds: number[]) {
    console.log('[Simulation] ===== onSettlePositions START =====');
    console.log('[Simulation] Position IDs to settle:', positionIds);
    console.log('[Simulation] Before - positions:', this.state.positions.length, this.state.positions);
    console.log('[Simulation] Before - trades:', this.state.trades.length);

    let settledCount = 0;
    let totalProfit = 0;

    // 逆順で処理して配列のインデックスずれを防ぐ
    for (let i = positionIds.length - 1; i >= 0; i--) {
      const positionId = positionIds[i];
      const position = this.state.positions.find(p => p.id === positionId);

      if (position) {
        const profitBefore = this.state.cash;

        if (position.type === PositionType.LONG) {
          // ロングポジションを決済
          this.tradingService.closeLongPosition(
            this.state,
            positionId,
            this.currentPrice,
            this.state.currentDate
          );
        } else {
          // ショートポジションを決済
          this.tradingService.closeShortPosition(
            this.state,
            positionId,
            this.currentPrice,
            this.state.currentDate
          );
        }

        const profitAfter = this.state.cash;
        const profit = profitAfter - profitBefore;
        totalProfit += profit;
        settledCount++;

        console.log(`[Simulation] Settled ${position.label}: profit = ¥${profit.toLocaleString()}`);
      }
    }

    // 配列の参照を更新してAngularの変更検知をトリガー
    this.state.positions = [...this.state.positions];
    this.state.trades = [...this.state.trades];

    // ポートフォリオ評価額を再計算
    this.portfolioValue = this.tradingService.calculatePortfolioValue(
      this.state.positions,
      this.currentPrice
    );

    console.log('[Simulation] After - positions:', this.state.positions.length, this.state.positions);
    console.log('[Simulation] After - trades:', this.state.trades.length);
    console.log('[Simulation] Total profit:', totalProfit);
    console.log('[Simulation] ===== onSettlePositions END =====');

    const message = `${settledCount}件のポジションを¥${this.currentPrice.toLocaleString()}で相殺決済しました（損益: ¥${totalProfit.toLocaleString()}）`;
    this.showNotificationMessage(message);
  }
}
