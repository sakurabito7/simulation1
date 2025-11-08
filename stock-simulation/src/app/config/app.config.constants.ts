// アプリケーション定数

/**
 * 株価データCSVファイルの配置場所
 *
 * 【重要】CSVファイルの配置について：
 * 1. D:\data\20251101\stock_data フォルダにCSVファイルを配置
 * 2. プロジェクトの public/assets/stock-data/ フォルダにコピー
 * 3. ファイル名形式：{企業コード4桁}.csv (例: 7203.csv)
 *
 * ファイルコピー方法（PowerShell）：
 * Copy-Item "D:\data\20251101\stock_data\*.csv" -Destination "public/assets/stock-data/"
 */
export const STOCK_DATA_CONFIG = {
  // 元データフォルダパス（参照用）
  sourceDataPath: 'D:\\data\\20251101\\stock_data',

  // Webアセットパス（実際の読み込み元）
  webAssetPath: '/assets/stock-data/',
};
