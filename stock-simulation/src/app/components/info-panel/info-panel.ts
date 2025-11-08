import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationConfig, SimulationState } from '../../models/simulation-config.model';
import { Position, PositionType } from '../../models/position.model';

interface PositionDetail {
  position: Position;
  currentValue: number;
  profitLoss: number;
  profitLossRate: number;
}

@Component({
  selector: 'app-info-panel',
  imports: [CommonModule],
  templateUrl: './info-panel.html',
  styleUrl: './info-panel.css',
})
export class InfoPanel {
  @Input() config!: SimulationConfig;
  @Input() state!: SimulationState;
  @Input() currentPrice: number = 0;
  @Input() portfolioValue: number = 0;

  PositionType = PositionType;

  get totalAssets(): number {
    return this.state.cash + this.portfolioValue;
  }

  get profitLoss(): number {
    return this.totalAssets - this.config.initialCash;
  }

  get profitLossRate(): number {
    return (this.profitLoss / this.config.initialCash) * 100;
  }

  get totalHoldings(): number {
    return this.state.positions.reduce((sum, pos) => sum + pos.quantity, 0);
  }

  get recentPositions(): PositionDetail[] {
    // 最新5件のポジション明細を取得
    return this.state.positions
      .slice(-5)
      .reverse()
      .map(pos => {
        const currentValue = pos.quantity * this.currentPrice;
        let profitLoss = 0;

        if (pos.type === PositionType.LONG) {
          // ロング: (現在価格 - 買値) × 数量
          profitLoss = (this.currentPrice - pos.entryPrice) * pos.quantity;
        } else {
          // ショート: (売値 - 現在価格) × 数量
          profitLoss = (pos.entryPrice - this.currentPrice) * pos.quantity;
        }

        const profitLossRate = (profitLoss / (pos.entryPrice * pos.quantity)) * 100;

        return {
          position: pos,
          currentValue,
          profitLoss,
          profitLossRate
        };
      });
  }
}
