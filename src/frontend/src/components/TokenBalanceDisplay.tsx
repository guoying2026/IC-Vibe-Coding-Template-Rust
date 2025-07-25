// 代币余额显示组件
// Token Balance Display Component

import React, { useState, useEffect } from 'react';
import { internetIdentityService } from '../services/InternetIdentityService';
import { TOKEN_CANISTER_IDS } from '../services/TokenBalanceService';
import { useLanguage } from "../hooks/useLanguage";

interface TokenBalanceDisplayProps {
  isAuthenticated: boolean;
}

// 代币配置
const SUPPORTED_TOKENS = [
  {
    id: 'icp',
    name: 'ICP',
    symbol: 'ICP',
    canisterId: TOKEN_CANISTER_IDS.ICP,
    color: 'orange',
    icon: '🟠',
    descriptionKey: 'icp_description'
  },
  {
    id: 'ckbtc',
    name: 'ckBTC',
    symbol: 'ckBTC',
    canisterId: TOKEN_CANISTER_IDS.CKBTC,
    color: 'yellow',
    icon: '🟡',
    descriptionKey: 'ckbtc_description'
  },
  {
    id: 'sns1',
    name: 'SNS-1',
    symbol: 'SNS1',
    canisterId: TOKEN_CANISTER_IDS.SNS1,
    color: 'blue',
    icon: '🔵',
    descriptionKey: 'sns1_description'
  }
];

export const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({ 
  isAuthenticated 
}) => {
  const { t } = useLanguage();
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [tokenInfos, setTokenInfos] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 查询所有代币余额
  const fetchAllBalances = async () => {
    if (!isAuthenticated) {
      console.log("用户未认证，跳过余额查询");
      return;
    }

    console.log('开始查询所有代币余额...');
    setLoading(true);
    setError(null);

    try {
      const newBalances: Record<string, string> = {};
      const newTokenInfos: Record<string, any> = {};

      // 并行查询所有代币余额
      const balancePromises = SUPPORTED_TOKENS.map(async (token) => {
        try {
          console.log(`查询${token.name}余额...`);
          // 查询余额
          const balance = await internetIdentityService.queryCurrentUserBalance(token.canisterId);
          console.log(`${token.name}余额:`, balance);
          
          // 获取代币信息
          const tokenInfo = await internetIdentityService.getTokenInfo(token.canisterId);
          console.log(`${token.name}信息:`, tokenInfo);
          
          // 格式化余额
          const formattedBalance = internetIdentityService.formatBalance(balance, tokenInfo.decimals);
          console.log(`${token.name}格式化余额:`, formattedBalance);
          
          return {
            id: token.id,
            balance: formattedBalance,
            info: tokenInfo
          };
        } catch (err) {
          console.error(`查询${token.name}余额失败:`, err);
          return {
            id: token.id,
            balance: '0',
            info: { name: token.name, symbol: token.symbol, decimals: 8 }
          };
        }
      });

      const results = await Promise.all(balancePromises);
      console.log('所有代币查询结果:', results);
      
      results.forEach(result => {
        newBalances[result.id] = result.balance;
        newTokenInfos[result.id] = result.info;
      });

      setBalances(newBalances);
      setTokenInfos(newTokenInfos);
      console.log('余额更新完成');
    } catch (err) {
      console.error('查询余额失败:', err);
      setError(err instanceof Error ? err.message : '查询余额失败');
    } finally {
      setLoading(false);
    }
  };

  // 查询单个代币余额
  const fetchTokenBalance = async (tokenId: string) => {
    if (!isAuthenticated) {
      console.log("用户未认证，跳过余额查询");
      return;
    }

    const token = SUPPORTED_TOKENS.find(t => t.id === tokenId);
    if (!token) return;

    console.log(`开始查询${token.name}余额...`);
    
    // 为单个代币设置加载状态
    setBalances(prev => ({ ...prev, [tokenId]: '...' }));

    try {
      const balance = await internetIdentityService.queryCurrentUserBalance(token.canisterId);
      console.log(`${token.name}余额:`, balance);
      
      const tokenInfo = await internetIdentityService.getTokenInfo(token.canisterId);
      console.log(`${token.name}信息:`, tokenInfo);
      
      const formattedBalance = internetIdentityService.formatBalance(balance, tokenInfo.decimals);
      console.log(`${token.name}格式化余额:`, formattedBalance);
      
      setBalances(prev => ({ ...prev, [tokenId]: formattedBalance }));
      setTokenInfos(prev => ({ ...prev, [tokenId]: tokenInfo }));
      console.log(`${token.name}余额更新完成`);
      
      // 清除错误状态
      setError(null);
    } catch (err) {
      console.error(`查询${token.name}余额失败:`, err);
      // 恢复原来的余额显示
      setBalances(prev => ({ ...prev, [tokenId]: prev[tokenId] || '0' }));
      setError(`查询${token.name}余额失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  // 组件挂载时查询余额
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllBalances();
    }
  }, [isAuthenticated]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("token_balances") || "代币余额"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("supported_tokens") || "支持的代币类型"}
          </p>
        </div>
        <button
          onClick={fetchAllBalances}
          disabled={loading || !isAuthenticated}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? (t("loading") || "加载中...") : (t("refresh") || "刷新")}
        </button>
      </div>

      {!isAuthenticated && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            请先登录以查看代币余额
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SUPPORTED_TOKENS.map((token) => (
          <div key={token.id} className="rounded-xl border border-gray-200 p-4 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{token.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {token.name}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {t(token.descriptionKey) || token.descriptionKey}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {!isAuthenticated ? '--' : (loading ? '...' : (balances[token.id] || '0'))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {tokenInfos[token.id]?.symbol || token.symbol}
                  </div>
                </div>
              </div>
              <button
                onClick={() => fetchTokenBalance(token.id)}
                disabled={loading || !isAuthenticated}
                className="ml-2 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                title={`刷新${token.name}余额`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加自定义代币 */}
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t("add_custom_token") || "添加自定义代币"}
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("custom_token_note") || "支持任意ICRC-1标准代币"}
          </p>
          <button className="mt-2 rounded bg-gray-200 px-3 py-1 text-xs text-gray-700 transition hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
            {t("coming_soon") || "即将推出"}
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {t("balance_update_note") || "余额实时更新，点击刷新按钮获取最新数据"}
      </div>
    </div>
  );
}; 