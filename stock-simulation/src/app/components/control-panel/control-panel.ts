import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Position } from '../../models/position.model';

@Component({
  selector: 'app-control-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './control-panel.html',
  styleUrl: './control-panel.css',
})
export class ControlPanel {
  @Input() longPositions: Position[] = [];
  @Input() shortPositions: Position[] = [];
  @Input() tradeAmount: number = 100000;

  @Output() buy = new EventEmitter<number | null>();
  @Output() sell = new EventEmitter<number | null>();
  @Output() nextDay = new EventEmitter<void>();
  @Output() updateTradeAmount = new EventEmitter<number>();
  @Output() finish = new EventEmitter<void>();
  @Output() goBack = new EventEmitter<void>();

  selectedBuyOption: string = 'new';
  selectedSellOption: string = 'new';
  newTradeAmount: number = 100000;
  showTradeAmountDialog: boolean = false;

  onBuyClick() {
    if (this.selectedBuyOption === 'new') {
      // 新規買い
      this.buy.emit(null);
    } else if (this.selectedBuyOption === 'all') {
      // 全てのショートポジションを買戻
      this.buy.emit(-1); // -1 を全清算のシグナルとして使用
    } else {
      // ショートポジションの決済
      const positionId = parseInt(this.selectedBuyOption);
      this.buy.emit(positionId);
    }
  }

  onSellClick() {
    if (this.selectedSellOption === 'new') {
      // 新規売り
      this.sell.emit(null);
    } else if (this.selectedSellOption === 'all') {
      // 全てのロングポジションを売戻
      this.sell.emit(-1); // -1 を全清算のシグナルとして使用
    } else {
      // ロングポジションの決済
      const positionId = parseInt(this.selectedSellOption);
      this.sell.emit(positionId);
    }
  }

  onNextDayClick() {
    this.nextDay.emit();
  }

  openTradeAmountDialog() {
    this.newTradeAmount = this.tradeAmount;
    this.showTradeAmountDialog = true;
  }

  closeTradeAmountDialog() {
    this.showTradeAmountDialog = false;
  }

  saveTradeAmount() {
    this.updateTradeAmount.emit(this.newTradeAmount);
    this.showTradeAmountDialog = false;
  }

  onFinishClick() {
    if (confirm('シミュレーションを終了して結果を表示しますか？')) {
      this.finish.emit();
    }
  }

  onGoBackClick() {
    if (confirm('シミュレーションを中断して初期画面に戻りますか？')) {
      this.goBack.emit();
    }
  }
}
