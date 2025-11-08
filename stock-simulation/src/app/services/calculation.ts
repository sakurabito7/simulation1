import { Injectable } from '@angular/core';
import { StockData, ChartData } from '../models/stock-data.model';
import { Position, PositionType } from '../models/position.model';

export interface OffsetPoint {
  positions: Position[];  // 対象ポジション
  labels: string[];       // ポジションラベル
  offsetPrice: number;    // 相殺価格
  netQuantity: number;    // ネット建玉
  direction: 'buy' | 'sell';  // 方向（買い超過/売り超過）
}

@Injectable({
  providedIn: 'root',
})
export class Calculation {

  // 移動平均を計算
  calculateMovingAverage(data: number[], period: number): (number | undefined)[] {
    const result: (number | undefined)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(undefined);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }

    return result;
  }

  // RSI（相対力指数）を計算
  calculateRSI(prices: number[], period: number = 14): (number | undefined)[] {
    const result: (number | undefined)[] = [];

    if (prices.length < period + 1) {
      return new Array(prices.length).fill(undefined);
    }

    // 価格変動を計算
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    // 最初のperiod分は計算できない
    for (let i = 0; i < period; i++) {
      result.push(undefined);
    }

    // 初期の平均上昇・下降を計算
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }

    avgGain /= period;
    avgLoss /= period;

    // 最初のRSI
    let rs = avgGain / (avgLoss || 1);
    result.push(100 - (100 / (1 + rs)));

    // 残りのRSIを計算（平滑化移動平均）
    for (let i = period; i < changes.length; i++) {
      const gain = changes[i] > 0 ? changes[i] : 0;
      const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rs = avgGain / (avgLoss || 1);
      result.push(100 - (100 / (1 + rs)));
    }

    return result;
  }

  // チャート用データを生成
  generateChartData(stockData: StockData[]): ChartData[] {
    const closes = stockData.map(d => d.close);
    const ma5 = this.calculateMovingAverage(closes, 5);
    const ma20 = this.calculateMovingAverage(closes, 20);
    const ma60 = this.calculateMovingAverage(closes, 60);
    const ma100 = this.calculateMovingAverage(closes, 100);
    const ma300 = this.calculateMovingAverage(closes, 300);
    const rsi = this.calculateRSI(closes, 14);

    return stockData.map((data, index) => ({
      date: data.date,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      ma5: ma5[index],
      ma20: ma20[index],
      ma60: ma60[index],
      ma100: ma100[index],
      ma300: ma300[index],
      rsi: rsi[index]
    }));
  }

  // 相殺決済ポイントを計算
  calculateOffsetPoints(positions: Position[]): OffsetPoint[] {
    if (positions.length === 0) {
      return [];
    }

    const longPositions = positions.filter(p => p.type === PositionType.LONG);
    const shortPositions = positions.filter(p => p.type === PositionType.SHORT);

    const offsetPoints: OffsetPoint[] = [];

    // 買いポジションの組み合わせを生成（空集合を除く）
    const longCombinations = this.generateCombinations(longPositions);

    // 売りポジションの組み合わせを生成（空集合を除く）
    const shortCombinations = this.generateCombinations(shortPositions);

    // 買いと売りの全組み合わせをチェック
    for (const longs of longCombinations) {
      for (const shorts of shortCombinations) {
        const combined = [...longs, ...shorts];
        const offsetPoint = this.calculateOffsetPrice(combined);

        // 相殺価格が存在する場合のみ追加
        if (offsetPoint !== null) {
          offsetPoints.push(offsetPoint);
        }
      }
    }

    return offsetPoints;
  }

  // ポジションの組み合わせを生成（空集合を除く）
  private generateCombinations(positions: Position[]): Position[][] {
    const result: Position[][] = [];
    const n = positions.length;

    // ビットマスクを使用して全組み合わせを生成
    for (let i = 1; i < (1 << n); i++) {  // i = 1から開始（空集合を除く）
      const combination: Position[] = [];
      for (let j = 0; j < n; j++) {
        if (i & (1 << j)) {
          combination.push(positions[j]);
        }
      }
      result.push(combination);
    }

    return result;
  }

  // 指定されたポジションの組み合わせの相殺価格を計算
  private calculateOffsetPrice(positions: Position[]): OffsetPoint | null {
    if (positions.length === 0) {
      return null;
    }

    // 買いと売りが混在しているかチェック
    const hasLong = positions.some(p => p.type === PositionType.LONG);
    const hasShort = positions.some(p => p.type === PositionType.SHORT);

    // 買いだけ、または売りだけの組み合わせは除外
    if (!hasLong || !hasShort) {
      return null;
    }

    // 新しい計算式: P0 = ( Σ(q_Bi * p_Bi) + Σ(q_Sj * p_Sj) ) / ( Σ(q_Bi) + Σ(q_Sj) )
    let sumQP = 0;  // Σ(q_i * p_i) - 全ポジションの建値×数量の合計
    let sumQ = 0;   // Σ(q_i) - 全ポジションの数量の合計

    console.log('[OffsetPoint] Calculating for positions:', positions.map(p => `${p.label}(${p.type === PositionType.LONG ? 'LONG' : 'SHORT'}): ¥${p.entryPrice} x ${p.quantity}株`));

    for (const pos of positions) {
      const q = pos.quantity;
      const p = pos.entryPrice;

      const qp = q * p;

      console.log(`[OffsetPoint] ${pos.label}: q=${q}, p=${p}, q*p=${qp}`);

      sumQP += qp;
      sumQ += q;
    }

    console.log(`[OffsetPoint] sumQP=${sumQP}, sumQ=${sumQ}`);

    // 数量の合計がゼロの場合は計算できない（通常は起こりえない）
    if (sumQ === 0) {
      console.log('[OffsetPoint] 数量の合計がゼロのため相殺価格は計算できません');
      return null;
    }

    // 相殺価格 = 全ポジションの加重平均価格
    const offsetPrice = sumQP / sumQ;
    console.log(`[OffsetPoint] 相殺価格（加重平均価格） = ${sumQP} / ${sumQ} = ¥${offsetPrice}`);

    const labels = positions.map(p => p.label);

    // ネット建玉を計算（買い - 売り）
    let netQuantity = 0;
    for (const pos of positions) {
      if (pos.type === PositionType.LONG) {
        netQuantity += pos.quantity;
      } else {
        netQuantity -= pos.quantity;
      }
    }

    return {
      positions,
      labels,
      offsetPrice,
      netQuantity: Math.abs(netQuantity),
      direction: netQuantity > 0 ? 'buy' : 'sell'
    };
  }
}
