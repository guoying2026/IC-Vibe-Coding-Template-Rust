// 借贷页面组件 - 重构为市场列表视图
// Borrow page component - refactored to a market list view

import { useState, useEffect } from "react";
import { MarketPair } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import { MarketListItem } from "../components/Borrow/MarketListItem";
import { internetIdentityService } from "../services/InternetIdentityService";

// 组件属性接口
interface BorrowPageProps {
  walletAddress: string | null; // 钱包地址
  onSelectMarket: (market: MarketPair) => void; // 选择市场后的回调
}

// 借贷页面主组件
export const BorrowPage = ({
  walletAddress,
  onSelectMarket,
}: BorrowPageProps) => {
  // 多语言Hook
  const { t } = useLanguage();

  // 市场列表状态
  const [markets, setMarkets] = useState<MarketPair[]>([]);

  // 筛选文本状态
  const [filter, setFilter] = useState("");

  // 加载市场数据
  const loadMarkets = async () => {
    try {
      // 从后端获取所有池子信息
      const pools = await internetIdentityService.getAllPools();
      
      // 转换为前端需要的 MarketPair 格式
      const marketsData: MarketPair[] = pools.map((pool) => ({
        id: pool.token_id.toText(),
        name: pool.name,
        baseAsset: pool.pool_account.name,
        quoteAsset: "USDC", // 暂时设为USDC，后续可以从配置获取
        price: 1.0, // 暂时设为1.0，后续可以从价格预言机获取
        change24h: 0, // 暂时设为0，后续可以计算
        volume24h: Number(pool.amount),
        liquidity: Number(pool.amount) - Number(pool.used_amount),
        apy: pool.pool_account.interest_rate,
        collateral_factor: pool.pool_account.collateral_factor,
        interest_rate: pool.pool_account.interest_rate,
        amount: pool.amount,
        used_amount: pool.used_amount,
        maximum_token: pool.maximum_token,
      }));

      setMarkets(marketsData);
      console.log("加载市场数据成功:", marketsData);
    } catch (error) {
      console.error("加载市场数据失败:", error);
    }
  };

  // 初始化市场数据
  useEffect(() => {
    loadMarkets();
  }, []);

  // 筛选市场列表
  const filteredMarkets = markets.filter((market) => {
    return market.name.toLowerCase().includes(filter.toLowerCase()) ||
           market.baseAsset.toLowerCase().includes(filter.toLowerCase()) ||
           market.quoteAsset.toLowerCase().includes(filter.toLowerCase());
  });

  // 计算总市场规模
  const totalMarketSize = markets.reduce((sum, market) => sum + market.volume24h, 0);

  // 计算总流动性
  const totalLiquidity = markets.reduce((sum, market) => sum + market.liquidity, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("borrow.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("borrow.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 总市场规模 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("borrow.totalMarketSize")}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalMarketSize.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 总流动性 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">💧</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("borrow.totalLiquidity")}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalLiquidity.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 活跃市场数量 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🏪</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("borrow.activeMarkets")}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {markets.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t("borrow.searchPlaceholder")}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 市场列表 */}
        <div className="space-y-4">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => (
              <MarketListItem
                key={market.id}
                market={market}
                onSelect={() => onSelectMarket(market)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                {markets.length === 0 ? (
                  <p>{t("borrow.noMarketsAvailable")}</p>
                ) : (
                  <p>{t("borrow.noMarketsMatchFilter")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
