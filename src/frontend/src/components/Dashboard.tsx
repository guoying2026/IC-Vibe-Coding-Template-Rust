// 仪表板组件的属性接口定义
interface DashboardProps {
  totalSupplied: number; // 总供应金额
  totalEarned: number; // 总收益金额
  avgApy: number; // 平均年化收益率
  connectedWallet: string | null; // 连接的钱包地址 (null表示未连接)
}

// 仪表板组件 - 显示用户的投资组合概览和统计信息
export const Dashboard = ({ totalSupplied, totalEarned, avgApy, connectedWallet }: DashboardProps) => {
  // 格式化数字为货币显示格式
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', // 货币格式
      currency: 'USD', // 美元
      minimumFractionDigits: 2, // 最少2位小数
      maximumFractionDigits: 2 // 最多2位小数
    }).format(amount);
  };

  // 统计卡片子组件 - 显示单个统计指标
  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string; // 卡片标题
    value: string; // 主要数值
    subtitle?: string; // 可选的副标题
    icon: string; // 图标 emoji
    color: string; // 文字颜色类名
  }) => (
    // 卡片容器 - 使用毛玻璃效果和悬停动画
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          {/* 标题文本 */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          {/* 主要数值 - 使用动态颜色 */}
          <p className={`text-2xl font-bold ${color}`}>
            {value}
          </p>
          {/* 副标题 - 可选显示 */}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {/* 右侧图标 */}
        <div className="text-3xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );

  // 如果钱包未连接，显示欢迎界面
  if (!connectedWallet) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 text-center">
        {/* 欢迎手势图标 */}
        <div className="text-6xl mb-4">👋</div>
        
        {/* 欢迎标题 */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to ICP Earn
        </h2>
        
        {/* 欢迎描述 */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Connect your wallet to start earning yield on your crypto assets
        </p>
        
        {/* 功能特色网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* 安全性特色卡片 */}
          <div className="p-4 bg-blue-50/70 dark:bg-blue-900/20 rounded-xl">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Secure
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built on Internet Computer Protocol for maximum security
            </p>
          </div>
          
          {/* 高收益特色卡片 */}
          <div className="p-4 bg-green-50/70 dark:bg-green-900/20 rounded-xl">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              High Yield
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Earn competitive APY on your digital assets
            </p>
          </div>
          
          {/* 快速交易特色卡片 */}
          <div className="p-4 bg-purple-50/70 dark:bg-purple-900/20 rounded-xl">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Fast
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Instant transactions with low fees
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 主要统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 总供应金额卡片 */}
        <StatCard
          title="Total Supplied"
          value={formatCurrency(totalSupplied)}
          subtitle="Across all markets"
          icon="💰"
          color="text-blue-600 dark:text-blue-400"
        />
        
        {/* 总收益卡片 */}
        <StatCard
          title="Total Earned"
          value={formatCurrency(totalEarned)}
          subtitle="Lifetime earnings"
          icon="📈"
          color="text-green-600 dark:text-green-400"
        />
        
        {/* 平均年化收益率卡片 */}
        <StatCard
          title="Average APY"
          value={`${avgApy.toFixed(2)}%`}
          subtitle="Weighted average"
          icon="⚡"
          color="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* 投资组合概览区域 */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        {/* 标题和实时状态指示器 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portfolio Overview
          </h3>
          {/* 实时状态指示器 */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Live
            </span>
          </div>
        </div>

        {/* 内容网格 - 图表和快速操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 左侧：净值增长图表占位符 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Net Worth Growth
            </h4>
            {/* 图表占位符区域 */}
            <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chart visualization
                </p>
              </div>
            </div>
          </div>

          {/* 右侧：快速操作按钮组 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Actions
            </h4>
            {/* 快速操作按钮网格 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 供应按钮 */}
              <button className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="text-xl mb-1">📥</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Supply
                </span>
              </button>
              
              {/* 提取按钮 */}
              <button className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <div className="text-xl mb-1">📤</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Withdraw
                </span>
              </button>
              
              {/* 交换按钮 */}
              <button className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <div className="text-xl mb-1">💱</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Swap
                </span>
              </button>
              
              {/* 分析按钮 */}
              <button className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <div className="text-xl mb-1">📊</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Analytics
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 