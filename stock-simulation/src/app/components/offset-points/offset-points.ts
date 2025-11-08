import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position, PositionType } from '../../models/position.model';
import { Calculation, OffsetPoint } from '../../services/calculation';

@Component({
  selector: 'app-offset-points',
  imports: [CommonModule],
  templateUrl: './offset-points.html',
  styleUrl: './offset-points.css',
})
export class OffsetPoints implements OnChanges {
  @Input() positions: Position[] = [];
  @Input() currentPrice: number = 0;
  @Output() settlePositions = new EventEmitter<number[]>();

  offsetPoints: OffsetPoint[] = [];
  Math = Math; // テンプレートでMathを使用可能にする

  constructor(private calculationService: Calculation) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['positions']) {
      this.updateOffsetPoints();
    }
  }

  updateOffsetPoints(): void {
    const points = this.calculationService.calculateOffsetPoints(this.positions);
    // 相殺価格の降順でソート
    this.offsetPoints = points.sort((a, b) => b.offsetPrice - a.offsetPrice);
  }

  // ラベルを色分けして表示するためのメソッド
  getLabelClass(label: string): string {
    if (label.startsWith('買い')) {
      return 'label-long';
    } else if (label.startsWith('売り')) {
      return 'label-short';
    }
    return '';
  }

  // 相殺決済ポイントをクリックした時の処理
  onOffsetPointClick(point: OffsetPoint): void {
    const labelsText = point.labels.join(', ');
    const priceText = point.offsetPrice.toLocaleString('ja-JP', {minimumFractionDigits: 0, maximumFractionDigits: 2});

    const confirmed = confirm(`相殺決済しますか？\n\n対象ポジション: ${labelsText}\n相殺価格: ¥${priceText}`);

    if (confirmed) {
      // ポジションIDのリストを送信
      const positionIds = point.positions.map(p => p.id);
      this.settlePositions.emit(positionIds);
    }
  }

  // 現在価格との差額を計算
  getPriceDifference(offsetPrice: number): number {
    return offsetPrice - this.currentPrice;
  }

  // 差額のクラスを取得
  getDifferenceClass(difference: number): string {
    if (difference > 0) {
      return 'diff-positive';
    } else if (difference < 0) {
      return 'diff-negative';
    }
    return 'diff-zero';
  }
}
