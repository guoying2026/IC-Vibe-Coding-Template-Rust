// 市场详情页组件
// Market detail page component

import { MarketPair, Vault } from '../types';
import { useLanguage } from '../hooks/useLanguage';

// 组件属性接口
interface MarketDetailPageProps {
  market: MarketPair; // 当前市场数据
  onBack: () => void; // 返回列表页的回调
}

// 格式化数字为易读的货币格式
const formatCurrency = (amount: number, compact = false) => {
  if (compact) {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 市场详情页主组件
export const MarketDetailPage = ({ market, onBack }: MarketDetailPageProps) => {
  // 多语言Hook
  const { t } = useLanguage();

  return (
    // 页面主容器，带动画效果
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 pt-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 页面头部 */}
        <div className="mb-8">
          {/* 返回按钮 */}
          <button onClick={onBack} className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>{t('Back to Markets')}</span>
          </button>
          
          {/* 市场标题 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center -space-x-2">
              <div className="w-12 h-12 text-4xl flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md z-10">{market.collateral.icon}</div>
              <div className="w-12 h-12 text-4xl flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md">{market.loan.icon}</div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {market.collateral.symbol} / {market.loan.symbol}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{market.collateral.name}</span>
                <span>/</span>
                <span>{market.loan.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容网格布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左侧和中间部分 (占2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 关键统计数据 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title={t('Total Market Size')} value={formatCurrency(market.totalMarketSize, true)} />
              <StatCard title={t('Total Liquidity')} value={formatCurrency(market.totalLiquidity, true)} />
              <StatCard title={t('Borrow Rate')} value={`${market.borrowRate.toFixed(2)}%`} color="text-green-500" />
              <StatCard title={t('Trusted By')} icons={market.trustedBy || []} />
            </div>

            {/* 图表区域 */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Total Borrow (USD)</h3>
              <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">📈 Chart placeholder</p>
              </div>
            </div>
            
            {/* 金库列表 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vaults Listing The Market</h3>
              <div className="space-y-3">
                {market.vaults.map(vault => <VaultListItem key={vault.id} vault={vault} />)}
              </div>
            </div>
          </div>
          
          {/* 右侧操作面板 (占1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
                
                {/* 供应抵押品 */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Supply Collateral {market.collateral.symbol}</label>
                  <input type="number" placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-900/80 focus:ring-2 focus:ring-blue-500 transition"/>
                </div>

                {/* 借贷 */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Borrow {market.loan.symbol}</label>
                  <input type="number" placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-900/80 focus:ring-2 focus:ring-blue-500 transition"/>
                </div>
                
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200">
                  {t('connect_wallet')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 统计卡片子组件
const StatCard = ({ title, value, icons, color }: { title: string; value?: string; icons?: string[]; color?: string }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
    {value && <p className={`text-2xl font-bold text-gray-900 dark:text-white ${color}`}>{value}</p>}
    {icons && (
      <div className="flex items-center space-x-2 mt-2">
        {icons.map((icon, index) => <div key={index} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">{icon}</div>)}
      </div>
    )}
  </div>
);

// 金库列表项子组件
const VaultListItem = ({ vault }: { vault: Vault }) => (
  <div className="grid grid-cols-12 gap-4 items-center px-4 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg shadow-sm hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors">
    <div className="col-span-1 flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-lg">{vault.curatorIcon}</div>
    <div className="col-span-4">
      <p className="font-semibold text-gray-900 dark:text-white">{vault.name}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{vault.curator}</p>
    </div>
    <div className="col-span-4 text-left">
      <p className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(vault.allocation)}</p>
    </div>
    <div className="col-span-3 text-right">
      <p className="font-medium text-gray-800 dark:text-gray-200">{vault.supplyShare.toFixed(2)}%</p>
    </div>
  </div>
); 