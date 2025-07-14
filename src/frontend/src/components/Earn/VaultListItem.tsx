// 金库列表项组件
// Vault list item component for the earn page

import { Vault } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

// 组件属性接口
interface VaultListItemProps {
  vault: Vault;
  onSelect: (vault: Vault) => void;
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

// 金库列表项主组件
export const VaultListItem = ({ vault, onSelect }: VaultListItemProps) => {
  const { t } = useLanguage();

  return (
    <div 
      className="grid grid-cols-12 gap-4 items-center px-4 py-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-lg shadow-sm hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors cursor-pointer border border-gray-200/50 dark:border-gray-700/50"
      onClick={() => onSelect(vault)}
    >
      {/* 金库名称 */}
      <div className="col-span-3 flex items-center space-x-3">
        <div className="w-8 h-8 text-2xl flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          {vault.curatorIcon}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{vault.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{vault.description?.substring(0, 40)}...</p>
        </div>
      </div>

      {/* 存款金额 */}
      <div className="col-span-2">
        <p className="font-medium text-gray-800 dark:text-gray-200">
          {formatDeposits(vault.deposits || 0, vault.asset || '')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatCurrency(vault.allocation, true)}
        </p>
      </div>

      {/* 管理者 */}
      <div className="col-span-2 flex items-center space-x-2">
        <div className="w-6 h-6 text-sm flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
          {vault.curatorIcon}
        </div>
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{vault.curator}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Block Analitica</p>
        </div>
      </div>

      {/* 抵押品 */}
      <div className="col-span-2">
        <div className="flex items-center space-x-1">
          {vault.collateral?.slice(0, 4).map((collateral, index) => (
            <div key={index} className="w-6 h-6 text-sm flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              {collateral}
            </div>
          ))}
          {vault.collateral && vault.collateral.length > 4 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{vault.collateral.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* APY */}
      <div className="col-span-3 text-right">
        <p className="text-xl font-bold text-green-600 dark:text-green-400">
          {vault.apy?.toFixed(2)}%
        </p>
        <div className="flex items-center justify-end space-x-1 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">↗</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {vault.performanceData?.wellBonus || 0}%
          </span>
        </div>
      </div>
    </div>
  );
}; 