import { Component, Input, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Trade, TradeAction } from '../../models/trade.model';
import { Position, PositionType } from '../../models/position.model';

@Component({
  selector: 'app-scatter-plot',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './scatter-plot.html',
  styleUrl: './scatter-plot.css',
})
export class ScatterPlot implements OnInit, OnChanges, AfterViewInit {
  @Input() trades: Trade[] = [];
  @Input() positions: Position[] = [];
  @Input() currentPrice: number = 0;
  @Input() maxPositions: number = 5;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public scatterChartType: ChartType = 'scatter';
  public scatterChartData: ChartConfiguration['data'] = {
    datasets: []
  };

  // カスタムプラグイン：現在の株価を横線で表示、プロット上にラベルを表示
  public customPlugin: any;

  constructor(private cdr: ChangeDetectorRef) {
    console.log('[ScatterPlot] Constructor called');

    // カスタムプラグインを作成
    this.customPlugin = {
      id: 'currentPriceLineAndLabels',
      afterDatasetsDraw: (chart: any) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const yScale = chart.scales['y'];

        // 現在の株価の横線を描画
        if (this.currentPrice > 0 && yScale) {
          const yPosition = yScale.getPixelForValue(this.currentPrice);

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(chartArea.left, yPosition);
          ctx.lineTo(chartArea.right, yPosition);
          ctx.stroke();
          ctx.setLineDash([]);

          // 横線のラベル（現在の株価）
          ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`現在価格: ¥${this.currentPrice.toLocaleString()}`, chartArea.right - 5, yPosition - 5);
          ctx.restore();
        }

        // 各プロット上にラベルを表示
        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta.hidden) {
            meta.data.forEach((element: any, index: number) => {
              const data = dataset.data[index];
              const label = dataset.labels?.[index] || '';
              const price = data.y;

              ctx.save();
              ctx.fillStyle = dataset.borderColor;
              ctx.font = 'bold 11px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';

              // ラベル名と価格を表示
              ctx.fillText(label, element.x, element.y - 20);
              ctx.fillText(`¥${price.toLocaleString()}`, element.x, element.y - 8);
              ctx.restore();
            });
          }
        });
      }
    };
  }

  ngOnInit(): void {
    console.log('[ScatterPlot] ngOnInit called');
    console.log('[ScatterPlot] Initial trades:', this.trades.length, this.trades);
    console.log('[ScatterPlot] Initial positions:', this.positions.length, this.positions);
    console.log('[ScatterPlot] Current price:', this.currentPrice);
  }

  ngAfterViewInit(): void {
    console.log('[ScatterPlot] ngAfterViewInit called');
    // 初期チャートを描画
    this.updateChart();
  }

  public scatterChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: '現在のポジション'
      },
      tooltip: {
        enabled: false // ツールチップを無効化（常にラベル表示するため）
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: '売買回数'
        },
        min: 0,
        ticks: {
          stepSize: 1
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: '価格 (円)'
        },
        ticks: {
          callback: function(value: any) {
            return '¥' + value.toLocaleString();
          }
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[ScatterPlot] ngOnChanges called');
    console.log('[ScatterPlot] Changes:', changes);

    if (changes['trades']) {
      const prevTrades = changes['trades'].previousValue?.length || 0;
      const currTrades = changes['trades'].currentValue?.length || 0;
      console.log('[ScatterPlot] trades changed:', prevTrades, '->', currTrades);
      if (changes['trades'].previousValue && changes['trades'].currentValue) {
        console.log('[ScatterPlot] Previous trades:', changes['trades'].previousValue);
        console.log('[ScatterPlot] Current trades:', changes['trades'].currentValue);
      }
    }

    if (changes['positions']) {
      const prevPositions = changes['positions'].previousValue?.length || 0;
      const currPositions = changes['positions'].currentValue?.length || 0;
      console.log('[ScatterPlot] positions changed:', prevPositions, '->', currPositions);
      if (changes['positions'].previousValue && changes['positions'].currentValue) {
        console.log('[ScatterPlot] Previous positions:', changes['positions'].previousValue);
        console.log('[ScatterPlot] Current positions:', changes['positions'].currentValue);
      }
    }

    if (changes['currentPrice']) {
      console.log('[ScatterPlot] currentPrice changed:', changes['currentPrice'].previousValue, '->', changes['currentPrice'].currentValue);
    }

    if (changes['maxPositions']) {
      console.log('[ScatterPlot] maxPositions changed:', changes['maxPositions'].previousValue, '->', changes['maxPositions'].currentValue);
    }

    if (changes['trades'] || changes['positions'] || changes['currentPrice'] || changes['maxPositions']) {
      console.log('[ScatterPlot] Triggering updateChart from ngOnChanges');
      this.updateChart();
    }
  }

  updateChart(): void {
    console.log('[ScatterPlot] ===== updateChart START =====');
    console.log('[ScatterPlot] Current trades:', this.trades.length, this.trades);
    console.log('[ScatterPlot] Current positions:', this.positions.length, this.positions);
    console.log('[ScatterPlot] Current price:', this.currentPrice);
    console.log('[ScatterPlot] Max positions:', this.maxPositions);

    const longPoints: any[] = [];
    const shortPoints: any[] = [];
    const longLabels: string[] = [];
    const shortLabels: string[] = [];

    console.log('[ScatterPlot] Processing', this.positions.length, 'positions');

    // 現在のポジションを横軸の順番にプロット
    this.positions.forEach((position, index) => {
      const point = { x: index + 1, y: position.entryPrice };
      console.log(`[ScatterPlot] Position[${index}]:`, {
        id: position.id,
        type: position.type === PositionType.LONG ? 'LONG' : 'SHORT',
        label: position.label,
        entryPrice: position.entryPrice,
        point: point
      });

      if (position.type === PositionType.LONG) {
        longPoints.push(point);
        longLabels.push(position.label);
      } else {
        shortPoints.push(point);
        shortLabels.push(position.label);
      }
    });

    console.log('[ScatterPlot] Long points:', longPoints.length, longPoints);
    console.log('[ScatterPlot] Short points:', shortPoints.length, shortPoints);

    this.scatterChartData = {
      datasets: [
        {
          label: 'ロング（買い）',
          data: longPoints,
          backgroundColor: 'rgba(54, 162, 235, 0.9)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointRadius: 12,
          pointHoverRadius: 16,
          labels: longLabels
        } as any,
        {
          label: 'ショート（売り）',
          data: shortPoints,
          backgroundColor: 'rgba(255, 99, 132, 0.9)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointRadius: 12,
          pointHoverRadius: 16,
          labels: shortLabels
        } as any
      ]
    };

    // x軸の最大値を最大ポジション数で固定
    if (this.scatterChartOptions?.scales?.['x']) {
      (this.scatterChartOptions.scales['x'] as any).max = this.maxPositions + 1;
      console.log('[ScatterPlot] X-axis max set to:', this.maxPositions + 1);
    }

    // y軸の範囲を価格データに基づいて動的に設定（現在価格も含む）
    if (this.scatterChartOptions?.scales?.['y']) {
      const prices = this.positions.map(p => p.entryPrice);

      // 現在価格も価格リストに追加
      if (this.currentPrice > 0) {
        prices.push(this.currentPrice);
      }

      console.log('[ScatterPlot] Prices for Y-axis calculation:', prices);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        let margin: number;
        const priceRange = maxPrice - minPrice;

        if (priceRange === 0 || prices.length === 1) {
          // 価格が1つの場合、または価格差が0の場合、価格の10%を固定マージンとして使用
          margin = minPrice * 0.1;
        } else {
          // 複数価格の場合、価格差の10%をマージンとして使用（最小でも価格の5%）
          margin = Math.max(priceRange * 0.1, minPrice * 0.05);
        }

        const yMin = Math.floor(minPrice - margin);
        const yMax = Math.ceil(maxPrice + margin);

        (this.scatterChartOptions.scales['y'] as any).min = yMin;
        (this.scatterChartOptions.scales['y'] as any).max = yMax;

        console.log('[ScatterPlot] Y-axis range: min=', yMin, 'max=', yMax, 'minPrice=', minPrice, 'maxPrice=', maxPrice, 'margin=', margin, 'priceRange=', priceRange);
      } else {
        console.log('[ScatterPlot] ⚠️ No prices available for Y-axis calculation');
        // 価格データがない場合、Y軸の範囲を削除（自動スケーリング）
        delete (this.scatterChartOptions.scales!['y'] as any).min;
        delete (this.scatterChartOptions.scales!['y'] as any).max;
      }
    }

    // チャートを更新
    if (this.chart) {
      console.log('[ScatterPlot] Chart reference exists, calling update()');
      this.chart.update();
      console.log('[ScatterPlot] Chart.update() completed');
    } else {
      console.warn('[ScatterPlot] ⚠️ Chart reference not available (ViewChild not initialized)');
    }

    // 変更検知を明示的にトリガー
    console.log('[ScatterPlot] Triggering change detection');
    this.cdr.detectChanges();
    console.log('[ScatterPlot] ===== updateChart END =====');
  }
}
