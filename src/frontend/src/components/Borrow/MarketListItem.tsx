// 市场列表项组件
// Market list item component

import { MarketPair } from "../../types";
import { useLanguage } from "../../hooks/useLanguage";

// 组件属性接口
interface MarketListItemProps {
  market: MarketPair;
  onSelect: () => void;
}

// 市场列表项组件
export const MarketListItem = ({ market, onSelect }: MarketListItemProps) => {
  const { t } = useLanguage();

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // 格式化百分比
  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      <div className="flex items-center justify-between">
        {/* 左侧：市场信息 */}
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {/* 市场图标 */}
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <span className="text-xl">🏪</span>
            </div>
            
            {/* 市场名称和资产 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {market.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {market.baseAsset} / {market.quoteAsset}
              </p>
            </div>
          </div>
        </div>

        {/* 右侧：市场数据 */}
        <div className="flex items-center space-x-8">
          {/* 价格 */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(market.price)}
            </p>
            <p className={`text-xs ${market.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
            </p>
          </div>

          {/* 交易量 */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(market.volume24h)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              24h Volume
            </p>
          </div>

          {/* 流动性 */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(market.liquidity)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Liquidity
            </p>
          </div>

          {/* APY */}
          <div className="text-right">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {formatPercentage(market.apy)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              APY
            </p>
          </div>

          {/* 抵押系数 */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatPercentage(market.collateral_factor)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Collateral Factor
            </p>
          </div>

          {/* 箭头 */}
          <div className="text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
