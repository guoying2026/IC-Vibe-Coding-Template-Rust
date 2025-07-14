// 金库详情页组件
// Vault detail page component

import { useState } from 'react';
import { Vault } from '../types';
import { useLanguage } from '../hooks/useLanguage';

// 组件属性接口
interface VaultDetailPageProps {
  vault: Vault; // 当前金库数据
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

// 格式化存款数量
const formatDeposits = (amount: number, asset: string) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ${asset}`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K ${asset}`;
  return `${amount.toFixed(2)} ${asset}`;
};

// 金库详情页主组件
export const VaultDetailPage = ({ vault, onBack }: VaultDetailPageProps) => {
  // 多语言Hook
  const { t } = useLanguage();
  
  // 当前选中的标签页
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'risk' | 'activity'>('overview');
  
  // 存款金额输入
  const [depositAmount, setDepositAmount] = useState('0.00');

  // 模拟市场暴露数据
  const mockMarketExposure = [
    { market: 'cbBTC', asset: 'cbBTC', allocation: 85.99, allocationValue: 20640000, supplyCap: 0, isIdle: false },
    { market: 'LBTC / cbBTC', asset: 'LBTC', allocation: 14.00, allocationValue: 3360000, supplyCap: 11800000, isIdle: false },
    { market: 'PT-LBTC-29MAY2025 / cbBTC', asset: 'PT-LBTC', allocation: 0.00, allocationValue: 0, supplyCap: 0, isIdle: true },
    { market: 'PT-LBTC-scaled18-25SEP2025 / cbBTC', asset: 'PT-LBTC', allocation: 0.00, allocationValue: 0, supplyCap: 1180000, isIdle: true }
  ];

  return (
    // 页面主容器，带动画效果
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 pt-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 页面头部 */}
        <div className="mb-8">
          {/* 返回按钮 */}
          <button onClick={onBack} className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span>{t('back_to_vaults')}</span>
          </button>
          
          {/* 金库标题 */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 text-4xl flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shadow-md">
              {vault.curatorIcon}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {vault.name}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{vault.curator}</span>
                <span>{vault.asset}</span>
              </div>
            </div>
          </div>
          
          {/* 金库描述 */}
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            {vault.description}
          </p>
        </div>

        {/* 主要内容网格布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 左侧和中间部分 (占2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 关键统计数据 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title={t('total_deposits')} value={formatCurrency(vault.totalDeposits || 0, true)} />
              <StatCard title={t('liquidity')} value={formatCurrency(vault.liquidity || 0, true)} />
              <StatCard title={t('apy')} value={`${vault.apy?.toFixed(2)}%`} color="text-green-500" />
              <StatCard title={t('disclosures')} value="" />
            </div>

            {/* 标签页导航 */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="border-b border-gray-200/50 dark:border-gray-700/50">
                <nav className="flex space-x-8 px-6">
                  {[
                    { key: 'overview', label: t('overview') },
                    { key: 'performance', label: t('performance') },
                    { key: 'risk', label: t('risk') },
                    { key: 'activity', label: t('activity') }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* 标签页内容 */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* APY 图表 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        APY <span className="text-sm font-normal text-gray-500">1 month</span>
                      </h3>
                      <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            {vault.apy?.toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            📈 Chart placeholder
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 市场暴露 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('market_exposure')}
                      </h3>
                      <div className="space-y-3">
                        {mockMarketExposure.map((exposure, index) => (
                          <div key={index} className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="col-span-1 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                              {exposure.asset === 'cbBTC' ? '🔵' : '🟡'}
                            </div>
                            <div className="col-span-4">
                              <p className="font-medium text-gray-900 dark:text-white">{exposure.market}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {exposure.isIdle ? t('idle_liquidity') : t('active_liquidity')}
                              </p>
                            </div>
                            <div className="col-span-3 text-right">
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                {exposure.allocation.toFixed(2)}%
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                {formatCurrency(exposure.allocationValue)}
                              </p>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {exposure.supplyCap > 0 ? formatCurrency(exposure.supplyCap) : t('no_supply_cap')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    {/* 性能指标 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('native_apy')}</span>
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {vault.performanceData?.nativeApy.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('well_bonus')}</span>
                          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            +{vault.performanceData?.wellBonus.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('performance_fee')}</span>
                          <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                            -{vault.performanceData?.performanceFee.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{t('net_apy')}</span>
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {vault.performanceData?.netApy.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'risk' && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">{t('risk_analysis_coming_soon')}</p>
                  </div>
                )}
                
                {activeTab === 'activity' && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">{t('activity_history_coming_soon')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧操作面板 (占1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('deposit')} {vault.asset}
                </h3>
                
                {/* 存款金额输入 */}
                <div className="mb-4">
                  <div className="relative">
                    <input 
                      type="number" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 text-2xl font-semibold rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-900/80 focus:ring-2 focus:ring-blue-500 transition text-center"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                      {vault.asset}
                    </div>
                  </div>
                  <div className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('projected_earnings_placeholder')}
                  </div>
                </div>

                {/* 用户仓位信息 */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('your_position')} ({vault.asset})</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('apy')}</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {vault.apy?.toFixed(2)}% {t('apy_increase')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('projected_earnings_month')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('projected_earnings_year')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">0.00</span>
                  </div>
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
const StatCard = ({ title, value, color }: { title: string; value: string; color?: string }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
    <p className={`text-2xl font-bold text-gray-900 dark:text-white ${color || ''}`}>{value}</p>
  </div>
); 