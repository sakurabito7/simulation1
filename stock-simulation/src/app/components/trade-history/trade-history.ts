import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Trade, TradeAction } from '../../models/trade.model';
import { ChartData } from '../../models/stock-data.model';

interface DailyRecord {
  date: Date;
  close: number;
  trades: Trade[];
}

@Component({
  selector: 'app-trade-history',
  imports: [CommonModule],
  templateUrl: './trade-history.html',
  styleUrl: './trade-history.css',
})
export class TradeHistory implements OnChanges {
  @Input() trades: Trade[] = [];
  @Input() chartData: ChartData[] = [];
  @Input() currentDate: Date = new Date();
  @Input() currentPrice: number = 0;

  TradeAction = TradeAction;
  displayRecords: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] || changes['trades']) {
      this.updateDisplayRecords();
    }
  }

  updateDisplayRecords(): void {
    const tempRecords: any[] = [];

    // 日々の株価データをベースにレコードを作成
    this.chartData.forEach(data => {
      // その日の売買を検索（複数ある可能性がある）
      const dayTrades = this.trades.filter(t =>
        this.isSameDay(t.date, data.date)
      );

      if (dayTrades.length > 0) {
        // 売買がある場合は売買ごとに行を作成
        dayTrades.forEach(trade => {
          // 損益計算（現在価格との差額）
          let profitLoss: number | undefined = undefined;

          if (trade.action === TradeAction.BUY) {
            // 買いの場合: (現在価格 - 買値) × 数量
            profitLoss = (this.currentPrice - trade.price) * trade.quantity;
          } else if (trade.action === TradeAction.SELL) {
            // 売りの場合: (売値 - 現在価格) × 数量
            profitLoss = (trade.price - this.currentPrice) * trade.quantity;
          }

          tempRecords.push({
            date: data.date,
            close: data.close,
            trade: trade,
            profitLoss: profitLoss
          });
        });
      } else {
        // 売買がない場合は終値のみの行を作成
        tempRecords.push({
          date: data.date,
          close: data.close,
          trade: null,
          profitLoss: undefined
        });
      }
    });

    // 日付降順（最新が上）にソート
    tempRecords.sort((a, b) => b.date.getTime() - a.date.getTime());

    // 連続上げ下げ日数を計算
    this.calculateConsecutiveDays(tempRecords);

    // 最大90日分に制限
    this.displayRecords = tempRecords.slice(0, 90);
  }

  // 連続上げ下げ日数を計算
  private calculateConsecutiveDays(records: any[]): void {
    if (records.length === 0) return;

    for (let i = 0; i < records.length; i++) {
      let consecutiveDays = 0;
      let direction: 'up' | 'down' | 'none' = 'none';

      if (i < records.length - 1) {
        const currentClose = records[i].close;
        const previousClose = records[i + 1].close;

        if (currentClose > previousClose) {
          direction = 'up';
          consecutiveDays = 1;

          // 過去に遡って連続上げ日数をカウント
          for (let j = i + 1; j < records.length - 1; j++) {
            if (records[j].close > records[j + 1].close) {
              consecutiveDays++;
            } else {
              break;
            }
          }
        } else if (currentClose < previousClose) {
          direction = 'down';
          consecutiveDays = 1;

          // 過去に遡って連続下げ日数をカウント
          for (let j = i + 1; j < records.length - 1; j++) {
            if (records[j].close < records[j + 1].close) {
              consecutiveDays++;
            } else {
              break;
            }
          }
        }
      }

      records[i].consecutiveDays = consecutiveDays;
      records[i].direction = direction;
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}
