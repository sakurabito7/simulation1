import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulationConfig } from '../../models/simulation-config.model';
import { STOCK_DATA_CONFIG } from '../../config/app.config.constants';
import { StockData } from '../../services/stock-data';

interface Company {
  code: string;
  name: string;
}

@Component({
  selector: 'app-start-config',
  imports: [CommonModule, FormsModule],
  templateUrl: './start-config.html',
  styleUrl: './start-config.css',
})
export class StartConfig {
  @Input() existingConfig?: SimulationConfig;
  @Output() startSimulation = new EventEmitter<SimulationConfig>();

  // 会社コードリスト（D:\data\20251101\stock_data配下のCSVファイル）
  companyCodes: string[] = [
    '1301', '1305', '1306', '1308', '1309', '1311', '1319', '1320', '1321', '1322',
    '1325', '1326', '1328', '1329', '1330', '1332', '1333', '1343', '1345', '1346',
    '1348', '1349', '1356', '1357', '1358', '1360', '1364', '1365', '1366', '1367',
    '1368', '1369', '1375', '1376', '1377', '1379', '1380', '1381', '1382', '1383',
    '1384', '1397', '1398', '1399', '1401', '1407', '1414', '1417', '1418', '1419',
    '1420', '1429', '1430', '1431', '1432', '1433', '1434', '1435', '1436', '1438',
    '1443', '1444', '1445', '1446', '1447', '1450', '1452', '1456', '1457', '1458',
    '1459', '1466', '1469', '1472', '1473', '1474', '1475', '1476', '1477', '1478',
    '1479', '1480', '1481', '1482', '1483', '1484', '1486', '1487', '1488', '1489',
    '1491', '1493', '1494', '1495', '1496', '1497', '1498', '1499', '1514', '1515',
    '1518', '1540', '1541', '1542', '1543', '1545', '1546', '1547', '1550', '1551',
    '1554', '1555', '1557', '1559', '1560', '1563', '1566', '1568', '1569', '1570',
    '1571', '1572', '1573', '1577', '1578', '1579', '1580', '1585', '1586', '1591',
    '1592', '1593', '1595', '1596', '1597', '1599', '1605', '1615', '1617', '1618',
    '1619', '1620', '1621', '1622', '1623', '1624', '1625', '1626', '1627', '1628',
    '1629', '1630', '1631', '1632', '1633', '1651', '1652', '1653', '1654', '1655',
    '1656', '1657', '1658', '1659', '1660', '1662', '1663', '1671', '1672', '1673',
    '1674', '1675', '1676', '1677', '1678', '1679', '1680', '1681', '1684', '1685',
    '1686', '1687', '1688', '1689', '1690', '1691', '1692', '1693', '1694', '1695',
    '1696', '1697', '1698', '1699', '1711', '1712', '1716', '1717', '1718', '1719',
    '1720', '1721', '1723', '1724', '1726', '1736', '1743', '1758', '1762', '1764',
    '1766', '1768', '1770', '1773', '1776', '1780', '1783', '1786', '1787', '1788',
    '1793', '1795', '1798', '1799', '1801', '1802', '1803', '1807', '1808', '1810',
    '1811', '1812', '1813', '1814', '1815', '1820', '1821', '1822', '1826', '1827',
    '1828', '1833', '1835', '1840', '1841', '1844', '1847', '1848', '1850', '1852',
    '1853', '1860', '1861', '1866', '1867', '1870', '1871', '1873', '1878', '1879',
    '1882', '1885', '1887', '1888', '1890', '1893', '1897', '1898', '1899', '1904',
    '1905', '1909', '1911', '1914', '1921', '1925', '1926', '1928', '1929', '1930',
    '1934', '1938', '1939', '1941', '1942', '1944', '1945', '1946', '1948', '1949',
    '1950', '1951', '1952', '1959', '1960', '1961', '1963', '1964', '1965', '1966',
    '1967', '1968', '1969', '1972', '1975', '1976', '1979', '1980', '1981', '1982',
    '1992', '1994', '1997', '2001', '2002', '2003', '2004', '2009', '2011', '2012',
    '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2031', '2032', '2033',
    '2034', '2036', '2037', '2038', '2039', '2040', '2041', '2042', '2043', '2044',
    '2045', '2046', '2047', '2048', '2050', '2053', '2055', '2060', '2065', '2067',
    '2068', '2069', '2070', '2071', '2072', '2073', '2080', '2081', '2082', '2083',
    '2084', '2085', '2086', '2087', '2088', '2089', '2090', '2091', '2092', '2093',
    '2094', '2095', '2096', '2097', '2098', '2108', '2109', '2112', '2114', '2117',
    '2120', '2121', '2122', '2124', '2127', '2130', '2134', '2136', '2138', '2139',
    '2146', '2148', '2150', '2152', '2153', '2154', '2156', '2157', '2158', '2160',
    '2162', '2163', '2164', '2168', '2169', '2170', '2173', '2175', '2179', '2180',
    '2181', '2183', '2185', '2186', '2193', '2195', '2196', '2198', '2201', '2204',
    '2206', '2207', '2208', '2209', '2211', '2212', '2215', '2216', '2217', '2220',
    '2221', '2222', '2224', '2226', '2229', '2235', '2236', '2237', '2238', '2239',
    '2240', '2241', '2242', '2243', '2244', '2245', '2246', '2247', '2248', '2249',
    '2250', '2251', '2252', '2253', '2254', '2255', '2256', '2257', '2258', '2259',
    '2264', '2266', '2267', '2268', '2269', '2270', '2281', '2282', '2286', '2288',
    '2291', '2292', '2293', '2294', '2296', '2300', '2301', '2303', '2304', '2305',
    '2307', '2311', '2315', '2317', '2321', '2323', '2325', '2326', '2327', '2329',
    '2330', '6758', '7203', '8306', '9984'
  ];

  // 主要企業の会社名マッピング
  companyNameMap: { [code: string]: string } = {
    '7203': 'トヨタ自動車',
    '6758': 'ソニーグループ',
    '9984': 'ソフトバンクグループ',
    '8306': '三菱UFJフィナンシャル・グループ'
  };

  // 会社マスターデータ
  companies: Company[] = [];

  config: SimulationConfig = {
    symbol: '',
    startDate: new Date(),
    period: 365,
    initialCash: 1000000,
    tradeAmount: 200000,
    maxPositions: 5
  };

  selectedCompanyCode: string = '';
  selectedFile: File | null = null;
  startDateStr: string = '';
  csvDataLoaded: boolean = false;
  csvDataInfo: string = '';

  constructor(private stockDataService: StockData) {}

  ngOnInit() {
    // 会社マスターデータを生成
    this.companies = this.companyCodes.map(code => ({
      code: code,
      name: this.companyNameMap[code] || `会社コード${code}`
    }));

    // 既存のconfigがあれば初期値として設定
    if (this.existingConfig) {
      this.config = { ...this.existingConfig };
      this.startDateStr = this.existingConfig.startDate.toISOString().split('T')[0];

      // 銘柄から企業コードを抽出（例: "トヨタ自動車(7203)" → "7203"）
      const match = this.existingConfig.symbol.match(/\((\d+)\)/);
      if (match) {
        this.selectedCompanyCode = match[1];
        this.csvDataLoaded = true;
        this.csvDataInfo = 'データ読み込み済み';
      }
    } else {
      // 開始年月日の初期値を2014/1/1に設定
      this.startDateStr = '2014-01-01';
    }
  }

  // 初期資金変更時に取引金額を自動更新
  onInitialCashChange() {
    this.config.tradeAmount = Math.floor(this.config.initialCash / 5);
  }

  async onCompanyChange() {
    if (!this.selectedCompanyCode) {
      this.csvDataLoaded = false;
      this.csvDataInfo = '';
      this.selectedFile = null;
      this.config.symbol = '';
      return;
    }

    // 選択された会社の情報を取得
    const company = this.companies.find(c => c.code === this.selectedCompanyCode);
    if (!company) return;

    // 銘柄名を設定
    this.config.symbol = `${company.name}(${company.code})`;

    // CSVファイルを読み込む
    try {
      const csvPath = `${STOCK_DATA_CONFIG.webAssetPath}${this.selectedCompanyCode}.csv`;
      const response = await fetch(csvPath);
      if (!response.ok) {
        throw new Error('CSVファイルが見つかりません');
      }

      const csvText = await response.text();
      const blob = new Blob([csvText], { type: 'text/csv' });
      this.selectedFile = new File([blob], `${this.selectedCompanyCode}.csv`, { type: 'text/csv' });

      // CSV情報を表示
      const lines = csvText.split('\n').filter(line => line.trim());
      this.csvDataInfo = `${lines.length - 1}件のデータを読み込みました`;
      this.csvDataLoaded = true;

      // 開始日を2018年以前でランダムに設定
      await this.setRandomStartDate(this.selectedFile);

    } catch (error) {
      console.error('CSV読み込みエラー:', error);
      alert(`${this.selectedCompanyCode}.csv が見つかりません。\n設定フォルダ: ${STOCK_DATA_CONFIG.webAssetPath}\nまたは手動でファイルを選択してください。`);
      this.csvDataLoaded = false;
      this.csvDataInfo = '';
      this.selectedFile = null;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.csvDataLoaded = true;
      this.csvDataInfo = `${file.name} を選択しました`;
    }
  }

  async onSubmit() {
    // 銘柄コードが選択されているがファイルが未選択の場合、自動読み込み
    if (!this.selectedFile && this.selectedCompanyCode) {
      await this.onCompanyChange();
    }

    if (!this.selectedFile) {
      alert('銘柄を選択するか、CSVファイルを選択してください');
      return;
    }

    if (!this.config.symbol) {
      alert('銘柄名を入力してください');
      return;
    }

    // 日付文字列をDateオブジェクトに変換
    this.config.startDate = new Date(this.startDateStr);
    this.config.csvFile = this.selectedFile;

    // 取引金額を初期資金の1/5に設定（明示的に変更されていない場合）
    if (this.config.tradeAmount === 200000 || this.config.tradeAmount === this.config.initialCash / 5) {
      this.config.tradeAmount = Math.floor(this.config.initialCash / 5);
    }

    this.startSimulation.emit(this.config);
  }

  // 開始日を2018年以前でランダムに設定
  async setRandomStartDate(file: File): Promise<void> {
    try {
      // ファイルからデータを読み込む
      const stockData = await this.stockDataService.loadStockDataFromCSV(file);

      if (stockData.length === 0) {
        // データがない場合のデフォルト
        this.startDateStr = '2022-01-01';
        return;
      }

      // 2018年以前のデータを抽出
      const before2018 = stockData.filter(data => data.date.getFullYear() < 2018);

      if (before2018.length > 0) {
        // 2018年以前のデータからランダムに選択
        const randomIndex = Math.floor(Math.random() * before2018.length);
        const randomDate = before2018[randomIndex].date;
        this.startDateStr = randomDate.toISOString().split('T')[0];
      } else {
        // 2018年以前のデータがない場合は2022/1/1
        this.startDateStr = '2022-01-01';
      }

    } catch (error) {
      console.error('開始日設定エラー:', error);
      this.startDateStr = '2022-01-01';
    }
  }
}
