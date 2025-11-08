import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationConfig, SimulationState, PerformanceMetrics } from '../../models/simulation-config.model';
import { Trading } from '../../services/trading';

@Component({
  selector: 'app-result',
  imports: [CommonModule],
  templateUrl: './result.html',
  styleUrl: './result.css',
})
export class Result implements OnInit {
  @Input() config!: SimulationConfig;
  @Input() state!: SimulationState;

  metrics!: PerformanceMetrics;

  constructor(private tradingService: Trading) {}

  ngOnInit() {
    this.calculateMetrics();
  }

  calculateMetrics() {
    this.metrics = this.tradingService.calculatePerformanceMetrics(
      this.state.closedPositions,
      this.config.initialCash
    );
  }

  exportTradeHistory() {
    // 売買履歴をテキストファイルとして出力
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const filename = `${this.config.symbol}_${timestamp}.txt`;

    let content = `株式投資シミュレーション結果\n`;
    content += `銘柄: ${this.config.symbol}\n`;
    content += `期間: ${this.config.startDate.toLocaleDateString()} ~ ${this.state.currentDate.toLocaleDateString()}\n`;
    content += `初期資金: ¥${this.config.initialCash.toLocaleString()}\n`;
    content += `\n`;
    content += `===== 投資成績 =====\n`;
    content += `勝率: ${this.metrics.winRate.toFixed(2)}%\n`;
    content += `利益率: ${this.metrics.profitRate.toFixed(2)}%\n`;
    content += `期待値: ¥${this.metrics.expectedValue.toFixed(0)}\n`;
    content += `最大ドローダウン: ¥${this.metrics.maxDrawdown.toFixed(0)}\n`;
    content += `総取引回数: ${this.metrics.totalTrades}\n`;
    content += `勝ち取引数: ${this.metrics.winTrades}\n`;
    content += `負け取引数: ${this.metrics.loseTrades}\n`;
    content += `平均利益: ¥${this.metrics.avgProfit.toFixed(0)}\n`;
    content += `平均損失: ¥${this.metrics.avgLoss.toFixed(0)}\n`;
    content += `プロフィットファクター: ${this.metrics.profitFactor.toFixed(2)}\n`;
    content += `\n`;
    content += `===== 売買履歴 =====\n`;

    this.state.trades.forEach((trade, index) => {
      content += `${index + 1}. ${trade.date.toLocaleDateString()} - `;
      content += `${trade.action} - `;
      content += `${trade.label} - `;
      content += `¥${trade.price.toLocaleString()} × ${trade.quantity}株`;

      if (trade.isClosing && trade.profit !== undefined) {
        content += ` [決済: ${trade.profit > 0 ? '+' : ''}¥${trade.profit.toLocaleString()}]`;
      }

      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  restart() {
    window.location.reload();
  }
}
