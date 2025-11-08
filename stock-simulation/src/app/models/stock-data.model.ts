export interface StockData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  ma5?: number;
  ma20?: number;
  ma60?: number;
  ma100?: number;
  ma300?: number;
  rsi?: number;
}
