# 株式投資シミュレーション セットアップガイド

## CSVデータの配置

### 1. データフォルダの準備

株価データCSVファイルは以下のフォルダに配置してください：
```
D:\data\20251101\stock_data
```

### 2. ファイル名の規則

ファイル名は企業コード4桁 + `.csv` の形式にしてください。

例：
- トヨタ自動車: `7203.csv`
- ソニーグループ: `6758.csv`
- ソフトバンクグループ: `9984.csv`

### 3. CSVフォーマット

```csv
日付,始値,高値,安値,終値,出来高
2014-01-06,5810,5880,5810,5880,8769100
2014-01-07,5890,5920,5870,5890,7221100
...
```

### 4. プロジェクトへのコピー

PowerShellで以下のコマンドを実行してCSVファイルをプロジェクトにコピーします：

```powershell
# プロジェクトのルートディレクトリに移動
cd D:\data\20251027\stock-simulation

# CSVファイルをコピー
Copy-Item "D:\data\20251101\stock_data\*.csv" -Destination "public\assets\stock-data\"
```

または個別にコピー：
```powershell
Copy-Item "D:\data\20251101\stock_data\7203.csv" -Destination "public\assets\stock-data\7203.csv"
```

### 5. 設定の変更

CSVデータの元フォルダを変更する場合は、以下のファイルを編集してください：

`src/app/config/app.config.constants.ts`
```typescript
export const STOCK_DATA_CONFIG = {
  sourceDataPath: 'D:\\data\\20251101\\stock_data',  // ← ここを変更
  webAssetPath: '/assets/stock-data/',
};
```

## 使い方

### 開発サーバーの起動

```bash
npm start
```

ブラウザで `http://localhost:4200` を開きます。

### 銘柄の選択

1. 開始設定画面でプルダウンから銘柄を選択
2. 銘柄を選択すると、自動的に対応するCSVファイルを読み込みます
3. CSVファイルが見つからない場合は、「ファイルを選択」ボタンで手動選択も可能

### トラブルシューティング

#### CSVファイルが見つからない場合

1. `public/assets/stock-data/` フォルダにファイルが存在するか確認
2. ファイル名が `{4桁コード}.csv` の形式か確認
3. ブラウザのコンソール（F12）でエラーメッセージを確認

#### ファイルパスの確認

開発サーバーが起動している状態で以下のURLにアクセスしてCSVファイルが取得できるか確認：
```
http://localhost:4200/assets/stock-data/7203.csv
```

## 注意事項

- Webアプリケーションのため、`D:\data\20251101\stock_data` フォルダから直接読み込むことはできません
- 必ず `public/assets/stock-data/` フォルダにコピーしてください
- 新しいCSVを追加した場合は、開発サーバーの再起動は不要です（ブラウザをリロードするだけでOK）
