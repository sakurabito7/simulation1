import { Injectable } from '@angular/core';
import { Position, PositionType, ClosedPosition } from '../models/position.model';
import { Trade, TradeAction } from '../models/trade.model';
import { SimulationState, PerformanceMetrics } from '../models/simulation-config.model';

@Injectable({
  providedIn: 'root',
})
export class Trading {

  // 新規ロングポジション（買い）を作成
  openLongPosition(
    state: SimulationState,
    currentPrice: number,
    currentDate: Date,
    tradeAmount: number
  ): void {
    const quantity = Math.floor(tradeAmount / currentPrice);
    const cost = quantity * currentPrice;

    if (state.cash < cost) {
      console.warn('資金不足');
      return;
    }

    const longPositions = state.positions.filter(p => p.type === PositionType.LONG);
    const label = `買い${longPositions.length + 1}`;

    const position: Position = {
      id: state.nextPositionId++,
      type: PositionType.LONG,
      entryDate: currentDate,
      entryPrice: currentPrice,
      quantity: quantity,
      label: label
    };

    state.positions.push(position);
    state.cash -= cost;

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.BUY,
      price: currentPrice,
      quantity: quantity,
      positionType: PositionType.LONG,
      positionId: position.id,
      label: label,
      isClosing: false
    };

    state.trades.push(trade);
  }

  // 新規ショートポジション（売り）を作成
  openShortPosition(
    state: SimulationState,
    currentPrice: number,
    currentDate: Date,
    tradeAmount: number
  ): void {
    const quantity = Math.floor(tradeAmount / currentPrice);
    const proceeds = quantity * currentPrice;

    const shortPositions = state.positions.filter(p => p.type === PositionType.SHORT);
    const label = `売り${shortPositions.length + 1}`;

    const position: Position = {
      id: state.nextPositionId++,
      type: PositionType.SHORT,
      entryDate: currentDate,
      entryPrice: currentPrice,
      quantity: quantity,
      label: label
    };

    state.positions.push(position);
    state.cash += proceeds;

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.SELL,
      price: currentPrice,
      quantity: quantity,
      positionType: PositionType.SHORT,
      positionId: position.id,
      label: label,
      isClosing: false
    };

    state.trades.push(trade);
  }

  // ロングポジションを決済（売り）
  closeLongPosition(
    state: SimulationState,
    positionId: number,
    currentPrice: number,
    currentDate: Date
  ): void {
    const positionIndex = state.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) return;

    const position = state.positions[positionIndex];
    if (position.type !== PositionType.LONG) return;

    const proceeds = position.quantity * currentPrice;
    const profit = proceeds - (position.quantity * position.entryPrice);
    const profitRate = (profit / (position.quantity * position.entryPrice)) * 100;

    state.cash += proceeds;

    const closedPosition: ClosedPosition = {
      ...position,
      exitDate: currentDate,
      exitPrice: currentPrice,
      profit: profit,
      profitRate: profitRate
    };

    state.closedPositions.push(closedPosition);
    state.positions.splice(positionIndex, 1);

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.SELL,
      price: currentPrice,
      quantity: position.quantity,
      positionType: PositionType.LONG,
      positionId: position.id,
      label: position.label,
      isClosing: true,
      profit: profit
    };

    state.trades.push(trade);
  }

  // ショートポジションを決済（買い戻し）
  closeShortPosition(
    state: SimulationState,
    positionId: number,
    currentPrice: number,
    currentDate: Date
  ): void {
    const positionIndex = state.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) return;

    const position = state.positions[positionIndex];
    if (position.type !== PositionType.SHORT) return;

    const cost = position.quantity * currentPrice;
    const profit = (position.quantity * position.entryPrice) - cost;
    const profitRate = (profit / (position.quantity * position.entryPrice)) * 100;

    if (state.cash < cost) {
      console.warn('資金不足');
      return;
    }

    state.cash -= cost;

    const closedPosition: ClosedPosition = {
      ...position,
      exitDate: currentDate,
      exitPrice: currentPrice,
      profit: profit,
      profitRate: profitRate
    };

    state.closedPositions.push(closedPosition);
    state.positions.splice(positionIndex, 1);

    const trade: Trade = {
      date: currentDate,
      action: TradeAction.BUY,
      price: currentPrice,
      quantity: position.quantity,
      positionType: PositionType.SHORT,
      positionId: position.id,
      label: position.label,
      isClosing: true,
      profit: profit
    };

    state.trades.push(trade);
  }

  // 現在の評価額を計算
  calculatePortfolioValue(positions: Position[], currentPrice: number): number {
    let value = 0;

    for (const position of positions) {
      if (position.type === PositionType.LONG) {
        value += position.quantity * currentPrice;
      } else {
        // ショートポジションの評価損益
        value += position.quantity * (position.entryPrice - currentPrice);
      }
    }

    return value;
  }

  // 投資成績を計算
  calculatePerformanceMetrics(
    closedPositions: ClosedPosition[],
    initialCash: number
  ): PerformanceMetrics {
    if (closedPositions.length === 0) {
      return {
        winRate: 0,
        profitRate: 0,
        expectedValue: 0,
        maxDrawdown: 0,
        totalTrades: 0,
        winTrades: 0,
        loseTrades: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        totalProfit: 0,
        totalLoss: 0
      };
    }

    const winTrades = closedPositions.filter(p => p.profit > 0);
    const loseTrades = closedPositions.filter(p => p.profit <= 0);

    const totalProfit = winTrades.reduce((sum, p) => sum + p.profit, 0);
    const totalLoss = Math.abs(loseTrades.reduce((sum, p) => sum + p.profit, 0));

    const totalProfitLoss = closedPositions.reduce((sum, p) => sum + p.profit, 0);

    return {
      winRate: (winTrades.length / closedPositions.length) * 100,
      profitRate: (totalProfitLoss / initialCash) * 100,
      expectedValue: totalProfitLoss / closedPositions.length,
      maxDrawdown: this.calculateMaxDrawdown(closedPositions),
      totalTrades: closedPositions.length,
      winTrades: winTrades.length,
      loseTrades: loseTrades.length,
      avgProfit: winTrades.length > 0 ? totalProfit / winTrades.length : 0,
      avgLoss: loseTrades.length > 0 ? totalLoss / loseTrades.length : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
      totalProfit: totalProfit,
      totalLoss: totalLoss
    };
  }

  // 最大ドローダウンを計算
  private calculateMaxDrawdown(closedPositions: ClosedPosition[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let cumulative = 0;

    for (const position of closedPositions) {
      cumulative += position.profit;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }
}
