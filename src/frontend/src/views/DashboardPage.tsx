import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

// mock 数据类型
interface EarnPosition {
  id: string;
  asset: string;
  amount: number;
  apy: number;
  earned: number;
}
interface BorrowPosition {
  id: string;
  asset: string;
  amount: number;
  rate: number;
  healthFactor: number;
}

// mock 数据
const mockPortfolio = {
  totalEarned: 1234.56,
  totalBorrowed: 789.01,
  netWorth: 2000.12,
  healthFactor: 2.45,
};
const mockEarnPositions: EarnPosition[] = [
  { id: '1', asset: 'BTC', amount: 0.5, apy: 4.5, earned: 0.02 },
  { id: '2', asset: 'ETH', amount: 10, apy: 3.2, earned: 0.15 },
];
const mockBorrowPositions: BorrowPosition[] = [
  { id: '1', asset: 'USDC', amount: 500, rate: 5.1, healthFactor: 2.45 },
  { id: '2', asset: 'DAI', amount: 300, rate: 4.8, healthFactor: 2.45 },
];

const StatCard = ({ title, value, color }: { title: string; value: string | number; color?: string }) => (
  <div className={`bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow p-6 flex flex-col items-center ${color || ''}`}
    style={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)' }}>
    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium tracking-wide">{title}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
  </div>
);

export default function DashboardPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'earn' | 'borrow'>('earn');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('page_dashboard_title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t('page_dashboard_subtitle')}
          </p>
        </div>
        {/* 总览卡片区 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard title={t('Total Earned')} value={mockPortfolio.totalEarned} color="" />
          <StatCard title={t('Total Borrowed')} value={mockPortfolio.totalBorrowed} color="" />
          <StatCard title={t('net_worth')} value={mockPortfolio.netWorth} color="" />
          <StatCard title={t('health_factor')} value={mockPortfolio.healthFactor} color="" />
        </div>
        {/* Tab切换栏 - 与探索页一致 */}
        <div className="flex space-x-8 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`py-3 px-2 text-base font-semibold transition-colors ${activeTab === 'earn' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab('earn')}
          >
            {t('My Earn Positions')}
          </button>
          <button
            className={`py-3 px-2 text-base font-semibold transition-colors ${activeTab === 'borrow' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
            onClick={() => setActiveTab('borrow')}
          >
            {t('My Borrow Positions')}
          </button>
        </div>
        {/* Tab内容区 - 铺满宽度的表格卡片 */}
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-xl p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  <th className="py-3 px-6 text-left font-semibold text-gray-700 dark:text-gray-300 text-xs tracking-wider">{t('Asset')}</th>
                  <th className="py-3 px-6 text-right font-semibold text-gray-700 dark:text-gray-300 text-xs tracking-wider">{t('Amount')}</th>
                  <th className="py-3 px-6 text-right font-semibold text-gray-700 dark:text-gray-300 text-xs tracking-wider">{activeTab === 'earn' ? t('APY') : t('Rate')}</th>
                  <th className="py-3 px-6 text-right font-semibold text-gray-700 dark:text-gray-300 text-xs tracking-wider">{activeTab === 'earn' ? t('Earned') : t('Health Factor')}</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'earn' ? mockEarnPositions : mockBorrowPositions).map((pos) => (
                  <tr
                    key={pos.id}
                    className="transition-colors duration-150 hover:bg-blue-50/60 dark:hover:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-3 px-6 font-medium text-gray-900 dark:text-white">{pos.asset}</td>
                    <td className="py-3 px-6 text-right text-gray-700 dark:text-gray-200 tabular-nums">{pos.amount}</td>
                    <td className="py-3 px-6 text-right text-blue-600 dark:text-blue-400 tabular-nums">
                      {activeTab === 'earn' ? `${(pos as EarnPosition).apy}%` : `${(pos as BorrowPosition).rate}%`}
                    </td>
                    <td className="py-3 px-6 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                      {activeTab === 'earn' ? (pos as EarnPosition).earned : (pos as BorrowPosition).healthFactor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 