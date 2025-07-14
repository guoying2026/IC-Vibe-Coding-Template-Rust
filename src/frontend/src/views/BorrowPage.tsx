// 借贷页面组件 - 重构为市场列表视图
// Borrow page component - refactored to a market list view

import { useState, useEffect } from 'react';
import { MarketPair, BTCAsset, Token } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { MarketListItem } from '../components/Borrow/MarketListItem';

// 组件属性接口
interface BorrowPageProps {
  walletAddress: string | null; // 钱包地址
  onSelectMarket: (market: MarketPair) => void; // 选择市场后的回调
}

// 模拟的非BTC资产数据
const mockTokens: { [key: string]: Token } = {
  USDC: { id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: '💵', price: 1.00 },
  USDT: { id: 'usdt', symbol: 'USDT', name: 'Tether', icon: '💲', price: 1.00 },
  DAI: { id: 'dai', symbol: 'DAI', name: 'Dai Stablecoin', icon: '🪙', price: 1.00 },
};

// 模拟的BTC资产数据
const mockBtcAssets: { [key: string]: BTCAsset } = {
  cbBTC: { id: 'cbbtc', symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', icon: '🔵', price: 67520, balance: 0.2, supplyApy: 4.5, borrowApy: 6.5, tvl: 45000000, supplied: 0.05, borrowed: 0.01, collateralFactor: 70, liquidationThreshold: 75, utilization: 65, priceChange24h: 2.4 },
  wstETH: { id: 'wsteth', symbol: 'wstETH', name: 'Lido Wrapped Staked ETH', icon: '💧', price: 3500, balance: 10, supplyApy: 3.5, borrowApy: 4.5, tvl: 500000000, supplied: 2, borrowed: 1, collateralFactor: 85, liquidationThreshold: 90, utilization: 75, priceChange24h: 1.5 },
  // ... 其他BTC资产
};

// 借贷页面主组件
export const BorrowPage = ({ walletAddress, onSelectMarket }: BorrowPageProps) => {
  // 多语言Hook
  const { t } = useLanguage();
  
  // 市场列表状态
  const [markets, setMarkets] = useState<MarketPair[]>([]);
  
  // 筛选文本状态
  const [filter, setFilter] = useState('');

  // 初始化市场数据
  useEffect(() => {
    // 模拟市场交易对数据，以匹配截图
    const mockMarkets: MarketPair[] = [
      {
        id: '1',
        collateral: mockBtcAssets.cbBTC,
        loan: mockTokens.USDC,
        lltv: 0.86,
        totalMarketSize: 59965000,
        totalLiquidity: 5964000,
        borrowRate: 5.44,
        vaults: [{ id: 'v1', name: 'SparkDAO', curator: 'SparkDAO', curatorIcon: '⚡️', allocation: 50270000, supplyShare: 81.76 }],
        creatorIcon: 'S'
      },
      {
        id: '2',
        collateral: mockBtcAssets.wstETH,
        loan: { ...mockBtcAssets.wstETH, symbol: 'WETH' }, // 这里简化处理，实际应为WETH
        lltv: 0.945,
        totalMarketSize: 12040000,
        totalLiquidity: 1651000,
        borrowRate: 2.52,
        vaults: [
            { id: 'v2', name: 'Morpho', curator: 'Morpho', curatorIcon: '🦋', allocation: 10000000, supplyShare: 80 },
            { id: 'v3', name: 'Aave', curator: 'Aave', curatorIcon: '👻', allocation: 2040000, supplyShare: 20 }
        ],
        creatorIcon: 'M'
      },
       // ...可以添加更多市场数据
    ];
    setMarkets(mockMarkets);
  }, []);

  // 根据筛选文本过滤市场
  const filteredMarkets = markets.filter(market =>
    market.collateral.symbol.toLowerCase().includes(filter.toLowerCase()) ||
    market.loan.symbol.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    // 页面主容器
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('page_borrow_title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t('page_borrow_subtitle')}
          </p>
        </div>
        
        {/* 连接钱包提示 */}
        {!walletAddress && (
          <div className="text-center mb-8">
            <button
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {t('connect_wallet')}
            </button>
          </div>
        )}

        {/* 市场列表容器 */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-2xl rounded-3xl shadow-xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50">
          
          {/* 筛选和操作栏 */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg shadow">Collateral: All</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100/70 dark:bg-gray-700/70 rounded-lg">Loan: All</button>
            </div>
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t('Filter markets')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-900/70 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          {/* 列表头部 */}
          <div className="grid grid-cols-12 gap-4 px-4 pb-3 border-b border-gray-200/70 dark:border-gray-700/70 text-xs font-medium text-gray-500 dark:text-gray-400">
            <div className="col-span-2">{t('collateral')}</div>
            <div className="col-span-2">{t('loan')}</div>
            <div className="col-span-1">LLTV</div>
            <div className="col-span-2">{t('total_market_size') || 'Total Market Size'}</div>
            <div className="col-span-2">{t('total_liquidity') || 'Total Liquidity'}</div>
            <div className="col-span-1">{t('rate') || 'Rate'}</div>
            <div className="col-span-2 text-right">{t('vault_listing') || 'Vault Listing'}</div>
          </div>

          {/* 市场列表 */}
          <div className="space-y-2 mt-2">
            {filteredMarkets.length > 0 ? (
              filteredMarkets.map(market => (
                <MarketListItem
                  key={market.id}
                  market={market}
                  onSelect={onSelectMarket}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">{t('no_markets_found')}</p>
                <p>{t('try_adjusting_market_filters')}</p>
              </div>
            )}
          </div>
          
          {/* 分页控制 */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg bg-gray-100/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Page 1 of 12
              </span>
              <button className="p-2 rounded-lg bg-gray-100/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 