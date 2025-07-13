// 多语言管理Hook
// Multi-language management hook

import React, { useState, useCallback, useContext, createContext, ReactNode } from 'react';
import { Language } from '../types';

// 多语言文本定义接口
interface Translations {
  [key: string]: {
    en: string; // 英文文本
    zh: string; // 中文文本
  };
}

// 应用内所有文本的多语言定义
const translations: Translations = {
  // 导航栏文本
  nav_earn: { en: 'Earn', zh: '收益' },
  nav_borrow: { en: 'Borrow', zh: '借贷' },
  nav_explore: { en: 'Explore', zh: '探索' },
  nav_migrate: { en: 'Migrate', zh: '迁移' },
  nav_dashboard: { en: 'Dashboard', zh: '仪表板' },
  
  // 通用文本
  connect_wallet: { en: 'Connect Wallet', zh: '连接钱包' },
  disconnect: { en: 'Disconnect', zh: '断开连接' },
  loading: { en: 'Loading...', zh: '加载中...' },
  error: { en: 'Error', zh: '错误' },
  success: { en: 'Success', zh: '成功' },
  pending: { en: 'Pending', zh: '待处理' },
  failed: { en: 'Failed', zh: '失败' },
  
  // 资产相关
  total_supply: { en: 'Total Supply', zh: '总供应量' },
  total_borrow: { en: 'Total Borrow', zh: '总借贷量' },
  available_liquidity: { en: 'Available Liquidity', zh: '可用流动性' },
  utilization_rate: { en: 'Utilization Rate', zh: '利用率' },
  apy: { en: 'APY', zh: '年化收益率' },
  supply_apy: { en: 'Supply APY', zh: '供应年化收益率' },
  borrow_apy: { en: 'Borrow APY', zh: '借贷年化收益率' },
  
  // 操作相关
  supply: { en: 'Supply', zh: '供应' },
  withdraw: { en: 'Withdraw', zh: '提取' },
  borrow: { en: 'Borrow', zh: '借贷' },
  repay: { en: 'Repay', zh: '还款' },
  amount: { en: 'Amount', zh: '金额' },
  balance: { en: 'Balance', zh: '余额' },
  
  // Earn页面相关
  vault: { en: 'Vault', zh: '金库' },
  deposits: { en: 'Deposits', zh: '存款' },
  curator: { en: 'Curator', zh: '管理者' },
  collateral: { en: 'Collateral', zh: '抵押品' },
  liquidity: { en: 'Liquidity', zh: '流动性' },
  total_deposits: { en: 'Total Deposits', zh: '总存款' },
  your_position: { en: 'Your position', zh: '您的仓位' },
  projected_earnings_month: { en: 'Projected Earnings / Month', zh: '预计月收益' },
  projected_earnings_year: { en: 'Projected Earnings / Year', zh: '预计年收益' },
  deposit: { en: 'Deposit', zh: '存款' },
  overview: { en: 'Overview', zh: '概览' },
  performance: { en: 'Performance', zh: '表现' },
  risk: { en: 'Risk', zh: '风险' },
  activity: { en: 'Activity', zh: '活动' },
  native_apy: { en: 'Native APY', zh: '原生APY' },
  well_bonus: { en: 'WELL Bonus', zh: 'WELL奖励' },
  performance_fee: { en: 'Performance Fee', zh: '性能费用' },
  net_apy: { en: 'Net APY', zh: '净APY' },
  market_exposure: { en: 'Market Exposure', zh: '市场暴露' },
  vault_allocation: { en: 'Vault Allocation', zh: '金库分配' },
  supply_cap: { en: 'Supply Cap', zh: '供应上限' },
  idle_liquidity: { en: 'Idle Liquidity', zh: '闲置流动性' },
  filter_vaults: { en: 'Filter vaults', zh: '筛选金库' },
  all: { en: 'All', zh: '全部' },
  back_to_vaults: { en: 'Back to Vaults', zh: '返回金库' },
  no_vaults_found: { en: 'No vaults found.', zh: '未找到金库。' },
  try_adjusting_filters: { en: 'Try adjusting your filters.', zh: '请尝试调整筛选条件。' },
  
  // 页面标题
  page_earn_title: { en: 'Earn Bitcoin Yield', zh: '赚取比特币收益' },
  page_earn_subtitle: { en: 'Supply BTC assets to earn competitive yields', zh: '供应BTC资产赚取有竞争力的收益' },
  page_borrow_title: { en: 'Borrow Against BTC', zh: '以BTC为抵押借贷' },
  page_borrow_subtitle: { en: 'Use your Bitcoin as collateral to borrow other assets', zh: '使用您的比特币作为抵押品借贷其他资产' },
  page_explore_title: { en: 'Explore BTC Markets', zh: '探索BTC市场' },
  page_explore_subtitle: { en: 'Discover the best Bitcoin DeFi opportunities', zh: '发现最佳的比特币DeFi机会' },
  page_migrate_title: { en: 'Migrate Positions', zh: '迁移头寸' },
  page_migrate_subtitle: { en: 'Move your positions to better protocols', zh: '将您的头寸迁移到更好的协议' },
  page_dashboard_title: { en: 'Your Portfolio', zh: '您的投资组合' },
  page_dashboard_subtitle: { en: 'Manage your Bitcoin DeFi positions', zh: '管理您的比特币DeFi头寸' },
  
  // 统计数据
  total_supplied: { en: 'Total Supplied', zh: '总供应金额' },
  total_borrowed: { en: 'Total Borrowed', zh: '总借贷金额' },
  total_earned: { en: 'Total Earned', zh: '总收益' },
  net_worth: { en: 'Net Worth', zh: '净资产' },
  health_factor: { en: 'Health Factor', zh: '健康因子' },
  
  // 交易历史
  transaction_history: { en: 'Transaction History', zh: '交易历史' },
  recent_transactions: { en: 'Recent Transactions', zh: '最近交易' },
  view_all: { en: 'View All', zh: '查看全部' },
  
  // 市场信息
  market_info: { en: 'Market Information', zh: '市场信息' },
  collateral_factor: { en: 'Collateral Factor', zh: '抵押因子' },
  liquidation_threshold: { en: 'Liquidation Threshold', zh: '清算阈值' },
  price: { en: 'Price', zh: '价格' },
  price_change_24h: { en: '24h Change', zh: '24小时变化' },
  
  // 迁移相关
  migrate_from: { en: 'Migrate From', zh: '从...迁移' },
  migrate_to: { en: 'Migrate To', zh: '迁移到' },
  estimated_gas: { en: 'Estimated Gas', zh: '预估Gas费' },
  estimated_time: { en: 'Estimated Time', zh: '预估时间' },
  migration_benefits: { en: 'Migration Benefits', zh: '迁移收益' },
  
  // 品牌相关
  app_name: { en: 'ICP BTC DeFi', zh: 'ICP 比特币 DeFi' },
  app_subtitle: { en: 'Decentralized Bitcoin Finance on Internet Computer', zh: '互联网计算机上的去中心化比特币金融' },
  loan: { en: 'Loan', zh: '借贷资产' },
  total_market_size: { en: 'Total Market Size', zh: '总市场规模' },
  total_liquidity: { en: 'Total Liquidity', zh: '总流动性' },
  rate: { en: 'Rate', zh: '利率' },
  vault_listing: { en: 'Vault Listing', zh: '金库列表' },
  page: { en: 'Page', zh: '第' },
  of: { en: 'of', zh: '页，共' },
  active_liquidity: { en: 'Active', zh: '活跃流动性' },
  no_supply_cap: { en: '-', zh: '-' },
  risk_analysis_coming_soon: { en: 'Risk analysis coming soon', zh: '风险分析即将上线' },
  activity_history_coming_soon: { en: 'Activity history coming soon', zh: '活动历史即将上线' },
  projected_earnings_placeholder: { en: '$0', zh: '¥0' },
  apy_increase: { en: '↗', zh: '↗' },
  markets_tab: { en: 'Markets', zh: '市场' },
  vaults_tab: { en: 'Vaults', zh: '金库' },
  more_tab: { en: 'More', zh: '更多' },
};

// 创建上下文
const LanguageContext = createContext<any>(null);

// Provider组件
export const LanguageProvider = ({ children }: React.PropsWithChildren<{}>) => {
  // 初始化时从localStorage读取
  const [language, setLanguage] = useState<Language>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    return (stored === 'en' || stored === 'zh') ? stored : 'en';
  });
  // 切换语言时写入localStorage
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      if (typeof window !== 'undefined') localStorage.setItem('language', next);
      return next;
    });
  }, []);
  const setSpecificLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') localStorage.setItem('language', lang);
  }, []);
  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }
    return translation[language];
  }, [language]);
  const isZh = language === 'zh';
  const isEn = language === 'en';
  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage: setSpecificLanguage, t, isZh, isEn }}>
      {children}
    </LanguageContext.Provider>
  );
};

// useLanguage钩子
export const useLanguage = () => useContext(LanguageContext); 