import { Injectable } from '@angular/core';
import { StockData as StockDataModel } from '../models/stock-data.model';

@Injectable({
  providedIn: 'root',
})
export class StockData {

  private stockDataCache: StockDataModel[] = [];

  // CSVファイルを読み込んで解析
  async loadStockDataFromCSV(file: File): Promise<StockDataModel[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const data: StockDataModel[] = [];

          // ヘッダー行をスキップ（1行目）
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const columns = line.split(',');
            if (columns.length < 6) continue;

            // CSV形式: 日付,始値,高値,安値,終値,出来高
            const stockData: StockDataModel = {
              date: this.parseDate(columns[0]),
              open: parseFloat(columns[1]),
              high: parseFloat(columns[2]),
              low: parseFloat(columns[3]),
              close: parseFloat(columns[4]),
              volume: parseFloat(columns[5])
            };

            data.push(stockData);
          }

          // 日付でソート（古い順）
          data.sort((a, b) => a.date.getTime() - b.date.getTime());

          this.stockDataCache = data;
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('ファイル読み込みエラー'));
      };

      reader.readAsText(file);
    });
  }

  // 日付文字列を解析
  private parseDate(dateStr: string): Date {
    // YYYY-MM-DD または YYYY/MM/DD 形式に対応
    const cleanStr = dateStr.replace(/\//g, '-');
    return new Date(cleanStr);
  }

  // 指定期間のデータを取得
  getDataByPeriod(startDate: Date, days: number): StockDataModel[] {
    const startIndex = this.stockDataCache.findIndex(
      d => d.date >= startDate
    );

    if (startIndex === -1) {
      return [];
    }

    return this.stockDataCache.slice(startIndex, startIndex + days);
  }

  // 開始日の指定日数前からデータを取得（チャート表示用）
  getDataWithPreload(startDate: Date, simulationDays: number, preloadDays: number): StockDataModel[] {
    const startIndex = this.stockDataCache.findIndex(
      d => d.date >= startDate
    );

    if (startIndex === -1) {
      return [];
    }

    // プリロード分を含めた開始インデックス（0未満にならないように）
    const preloadStartIndex = Math.max(0, startIndex - preloadDays);

    // プリロード分 + シミュレーション期間のデータを取得
    return this.stockDataCache.slice(preloadStartIndex, startIndex + simulationDays);
  }

  // 指定インデックスから遡って指定日数分のデータを取得
  getDataByIndex(centerIndex: number, days: number): StockDataModel[] {
    const startIndex = Math.max(0, centerIndex - days + 1);
    const endIndex = centerIndex + 1;
    return this.stockDataCache.slice(startIndex, endIndex);
  }

  // 全データを取得
  getAllData(): StockDataModel[] {
    return this.stockDataCache;
  }

  // キャッシュをクリア
  clearCache(): void {
    this.stockDataCache = [];
  }
}
