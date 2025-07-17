import React, { useState, useEffect } from 'react'; // 导入React hooks
import { useLanguage } from '../hooks/useLanguage'; // 导入多语言Hook
import { internetIdentityService, UserInfo, EarnPosition, BorrowPosition } from '../services/InternetIdentityService'; // 导入II服务

// 总览数据结构
interface PortfolioData {
  totalEarned: number; // 总收益
  totalBorrowed: number; // 总借贷
  netWorth: number; // 净资产
  healthFactor: number; // 健康因子
}

// 统计卡片组件
const StatCard = ({ title, value, color }: { title: string; value: string | number; color?: string }) => (
  <div className={`bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow p-6 flex flex-col items-center ${color || ''}`}
    style={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)' }}>
    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium tracking-wide">{title}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</div>
  </div>
);

// 仪表板页面组件
export default function DashboardPage() {
  const { t } = useLanguage(); // 多语言Hook
  const [activeTab, setActiveTab] = useState<'earn' | 'borrow'>('earn'); // 当前激活的标签页
  
  // 用户数据状态
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null); // 用户信息
  const [earnPositions, setEarnPositions] = useState<EarnPosition[]>([]); // 收益位置
  const [borrowPositions, setBorrowPositions] = useState<BorrowPosition[]>([]); // 借贷位置
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误状态

  // 计算总览数据
  const calculatePortfolioData = (): PortfolioData => {
    if (!userInfo) {
      return {
        totalEarned: 0,
        totalBorrowed: 0,
        netWorth: 0,
        healthFactor: 0,
      };
    }

    return {
      totalEarned: userInfo.total_earned,
      totalBorrowed: userInfo.total_borrowed,
      netWorth: userInfo.ckbtc_balance + userInfo.total_earned - userInfo.total_borrowed,
      healthFactor: userInfo.health_factor,
    };
  };

  // 加载用户数据
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 检查认证状态
      const authState = internetIdentityService.getAuthState();
      if (!authState.isAuthenticated) {
        setError('请先登录Internet Identity');
        return;
      }

      // 并行加载用户信息、收益位置和借贷位置
      const [userInfoResult, earnPositionsResult, borrowPositionsResult] = await Promise.allSettled([
        internetIdentityService.getUserInfo(),
        internetIdentityService.getEarnPositions(),
        internetIdentityService.getBorrowPositions(),
      ]);

      // 处理用户信息
      if (userInfoResult.status === 'fulfilled' && userInfoResult.value) {
        setUserInfo(userInfoResult.value);
      }

      // 处理收益位置
      if (earnPositionsResult.status === 'fulfilled') {
        setEarnPositions(earnPositionsResult.value);
      }

      // 处理借贷位置
      if (borrowPositionsResult.status === 'fulfilled') {
        setBorrowPositions(borrowPositionsResult.value);
      }

      // 检查是否有错误
      if (userInfoResult.status === 'rejected') {
        console.error('获取用户信息失败:', userInfoResult.reason);
      }
      if (earnPositionsResult.status === 'rejected') {
        console.error('获取收益位置失败:', earnPositionsResult.reason);
      }
      if (borrowPositionsResult.status === 'rejected') {
        console.error('获取借贷位置失败:', borrowPositionsResult.reason);
      }

    } catch (error) {
      console.error('加载用户数据失败:', error);
      setError('加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadUserData();
  }, []);

  // 计算总览数据
  const portfolioData = calculatePortfolioData();

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('page_dashboard_title')}
            </h1>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={loadUserData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <StatCard title={t('Total Earned')} value={portfolioData.totalEarned.toFixed(2)} color="" />
          <StatCard title={t('Total Borrowed')} value={portfolioData.totalBorrowed.toFixed(2)} color="" />
          <StatCard title={t('net_worth')} value={portfolioData.netWorth.toFixed(2)} color="" />
          <StatCard title={t('health_factor')} value={portfolioData.healthFactor.toFixed(2)} color="" />
        </div>
        
        {/* Tab切换栏 */}
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
                {(activeTab === 'earn' ? earnPositions : borrowPositions).map((pos) => (
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
                      {activeTab === 'earn' ? (pos as EarnPosition).earned : (pos as BorrowPosition).health_factor}
                    </td>
                  </tr>
                ))}
                {/* 如果没有数据，显示空状态 */}
                {(activeTab === 'earn' ? earnPositions : borrowPositions).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      {activeTab === 'earn' ? '暂无收益仓位' : '暂无借贷仓位'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 