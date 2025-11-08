import { Component, Input, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ChartData } from '../../models/stock-data.model';

@Component({
  selector: 'app-rsi-chart',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './rsi-chart.html',
  styleUrl: './rsi-chart.css',
})
export class RsiChart implements OnChanges {
  @Input() chartData: ChartData[] = [];

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
        text: 'RSI（相対力指数）- 70以上で買われすぎ、30以下で売られすぎ'
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData']) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (this.chartData.length === 0) return;

    const labels = this.chartData.map(d => d.date.toLocaleDateString('ja-JP'));
    const rsiData = this.chartData.map(d => d.rsi ?? null);

    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: rsiData,
          label: 'RSI',
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }
      ]
    };

    if (this.chart) {
      this.chart.update();
    }
    this.cdr.detectChanges();
  }
}
