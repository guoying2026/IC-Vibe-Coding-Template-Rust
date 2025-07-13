// 资产接口定义 - 定义单个资产的数据结构
interface Asset {
  id: string; // 资产唯一标识符
  symbol: string; // 资产符号，如 USDC、USDT 等
  name: string; // 资产全名
  balance: number; // 钱包中的资产余额
  apy: number; // 年化收益率 (Annual Percentage Yield)
  tvl: number; // 总锁仓价值 (Total Value Locked)
  supplied: number; // 已供应的资产数量
  borrowed: number; // 已借贷的资产数量
  icon: string; // 资产图标 emoji
  collateralFactor: number; // 抵押因子 - 决定可借贷金额的比例
  liquidationThreshold: number; // 清算阈值 - 触发清算的健康因子
  borrowRate: number; // 借贷年化利率
  utilization: number; // 资产利用率 - 已借出资产占总供应的比例
}

// 资产池组件的属性接口定义
interface AssetPoolProps {
  asset: Asset; // 要展示的资产数据
  onSupply: () => void; // 点击供应按钮的回调函数
  onViewDetails: () => void; // 点击查看详情的回调函数
  disabled?: boolean; // 是否禁用操作按钮 (当钱包未连接时)
}

// 资产池卡片组件 - 显示单个资产的概览信息和操作按钮
export const AssetPool = ({ asset, onSupply, onViewDetails, disabled }: AssetPoolProps) => {
  // 格式化数字为易读的货币格式 (K表示千，M表示百万)
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`; // 百万单位
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`; // 千单位
    }
    return `$${num.toFixed(2)}`; // 小于1000直接显示
  };

  return (
    // 主要卡片容器 - 使用毛玻璃效果、圆角、阴影和边框
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-500/50">
      
      {/* 资产头部信息区域 */}
      <div className="flex items-center justify-between mb-4">
        {/* 左侧：资产图标和名称 */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onViewDetails} // 点击资产信息查看详情
        >
          <div className="text-2xl">{asset.icon}</div> {/* 资产图标 emoji */}
          <div>
            {/* 资产符号 */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {asset.symbol}
            </h3>
            {/* 资产全名 */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {asset.name}
            </p>
          </div>
        </div>
        
        {/* 右侧：APY 显示 */}
        <div className="text-right">
          {/* 供应年化收益率 */}
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {asset.apy.toFixed(1)}%
          </div>
          {/* APY 标签 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            APY
          </div>
        </div>
      </div>

      {/* 资产统计信息区域 */}
      <div className="space-y-3 mb-6">
        {/* 钱包余额行 */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Wallet Balance {/* 钱包余额标签 */}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {asset.balance.toFixed(2)} {asset.symbol} {/* 显示余额和币种 */}
          </span>
        </div>
        
        {/* 已供应金额行 */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Supplied {/* 已供应标签 */}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {asset.supplied.toFixed(2)} {asset.symbol} {/* 显示已供应金额 */}
          </span>
        </div>
        
        {/* 已借贷金额行 */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Borrowed {/* 已借贷标签 */}
          </span>
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            {asset.borrowed.toFixed(2)} {asset.symbol} {/* 显示已借贷金额，使用红色表示债务 */}
          </span>
        </div>
        
        {/* 总锁仓价值行 */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total Value Locked {/* TVL 标签 */}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatNumber(asset.tvl)} {/* 格式化显示 TVL */}
          </span>
        </div>
      </div>

      {/* 利用率进度条区域 */}
      <div className="mb-6">
        {/* 利用率标签和百分比 */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>Utilization</span> {/* 利用率标签 */}
          <span>{asset.utilization.toFixed(1)}%</span> {/* 显示利用率百分比 */}
        </div>
        {/* 进度条背景 */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          {/* 进度条填充部分 - 使用渐变色 */}
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${asset.utilization}%` }} // 动态设置宽度
          />
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="flex space-x-3">
        {/* 供应按钮 */}
        <button
          onClick={onSupply} // 点击供应回调
          disabled={disabled} // 根据钱包连接状态禁用
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' // 禁用状态样式
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 active:scale-95 shadow-lg hover:shadow-xl' // 正常状态样式
          }`}
        >
          {disabled ? 'Connect Wallet' : 'Supply'} {/* 根据状态显示不同文本 */}
        </button>
        
        {/* 查看详情按钮 */}
        <button
          onClick={onViewDetails} // 点击查看详情回调
          className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95"
        >
          Details {/* 详情按钮文本 */}
        </button>
      </div>

      {/* 收益显示区域 - 仅在有供应资产时显示 */}
      {asset.supplied > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            {/* 收益标签 */}
            <span className="text-sm text-green-700 dark:text-green-400">
              Daily Earning {/* 每日收益标签 */}
            </span>
            {/* 每日收益计算和显示 */}
            <span className="text-sm font-bold text-green-700 dark:text-green-400">
              +{(asset.supplied * asset.apy / 100 / 365).toFixed(4)} {asset.symbol}/day
            </span>
          </div>
        </div>
      )}
      
      {/* 借贷成本显示区域 - 仅在有借贷时显示 */}
      {asset.borrowed > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            {/* 借贷成本标签 */}
            <span className="text-sm text-red-700 dark:text-red-400">
              Daily Interest {/* 每日利息标签 */}
            </span>
            {/* 每日借贷成本计算和显示 */}
            <span className="text-sm font-bold text-red-700 dark:text-red-400">
              -{(asset.borrowed * asset.borrowRate / 100 / 365).toFixed(4)} {asset.symbol}/day
            </span>
          </div>
        </div>
      )}
    </div>
  );
}; 