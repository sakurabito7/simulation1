export enum PositionType {
  LONG = 'LONG',  // 買いポジション
  SHORT = 'SHORT' // 売りポジション
}

export interface Position {
  id: number;
  type: PositionType;
  entryDate: Date;
  entryPrice: number;
  quantity: number;
  label: string; // "買い1", "売り2" など
}

export interface ClosedPosition extends Position {
  exitDate: Date;
  exitPrice: number;
  profit: number;
  profitRate: number;
}
