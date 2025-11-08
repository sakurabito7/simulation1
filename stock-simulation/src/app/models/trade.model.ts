import { PositionType } from './position.model';

export enum TradeAction {
  BUY = 'BUY',   // 買い
  SELL = 'SELL'  // 売り
}

export interface Trade {
  date: Date;
  action: TradeAction;
  price: number;
  quantity: number;
  positionType: PositionType;
  positionId: number;
  label: string;
  isClosing: boolean; // ポジション決済かどうか
  profit?: number;    // 決済時の損益
}
