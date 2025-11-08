import { Component, Input, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ChartData } from '../../models/stock-data.model';
import { Trade, TradeAction } from '../../models/trade.model';

@Component({
  selector: 'app-moving-average-chart',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './moving-average-chart.html',
  styleUrl: './moving-average-chart.css',
})
export class MovingAverageChart implements OnChanges {
  @Input() chartData: ChartData[] = [];
  @Input() trades: Trade[] = [];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  constructor(private cdr: ChangeDetectorRef) {}

  public lineChartType: ChartType = 'line';
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
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
        text: '株価チャート（終値 + 移動平均線）'
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] || changes['trades']) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (this.chartData.length === 0) return;

    const labels = this.chartData.map(d => d.date.toLocaleDateString('ja-JP'));

    // 終値データ
    const closeData = this.chartData.map(d => d.close);
    const ma5Data = this.chartData.map(d => d.ma5 ?? null);
    const ma20Data = this.chartData.map(d => d.ma20 ?? null);
    const ma60Data = this.chartData.map(d => d.ma60 ?? null);
    const ma100Data = this.chartData.map(d => d.ma100 ?? null);
    const ma300Data = this.chartData.map(d => d.ma300 ?? null);

    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: closeData,
          label: '終値',
          borderColor: 'rgba(0, 0, 0, 0.8)',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          data: ma5Data,
          label: 'MA5',
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          spanGaps: true
        },
        {
          data: ma20Data,
          label: 'MA20',
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          spanGaps: true
        },
        {
          data: ma60Data,
          label: 'MA60',
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          spanGaps: true
        },
        {
          data: ma100Data,
          label: 'MA100',
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          spanGaps: true
        },
        {
          data: ma300Data,
          label: 'MA300',
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          spanGaps: true
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
    this.cdr.detectChanges();
  }
}
