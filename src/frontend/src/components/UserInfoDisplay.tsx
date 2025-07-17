// 用户信息显示组件
// User information display component

import { UserInfo } from '../services/InternetIdentityService';

interface UserInfoDisplayProps {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  principal: any;
}

export const UserInfoDisplay = ({ userInfo, isAuthenticated, principal }: UserInfoDisplayProps) => {
  if (!isAuthenticated || !userInfo) {
    return null;
  }

  const formatPrincipal = (principal: any) => {
    if (!principal) return '';
    const principalText = principal.toText();
    return `${principalText.slice(0, 6)}...${principalText.slice(-4)}`;
  };

  // 使用默认数据或用户数据
  const displayUserInfo = {
    username: userInfo.username || '测试用户',
    ckbtc_balance: userInfo.ckbtc_balance || 0,
    total_earned: userInfo.total_earned || 0,
    total_borrowed: userInfo.total_borrowed || 0,
    created_at: userInfo.created_at || BigInt(Date.now()),
    recent_activities: userInfo.recent_activities || [
      { description: '登录成功', timestamp: BigInt(Date.now()) },
      { description: '查看金库列表', timestamp: BigInt(Date.now() - 60000) },
      { description: '连接钱包', timestamp: BigInt(Date.now() - 120000) }
    ]
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          用户信息
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            已认证
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 基本信息 */}
        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">用户名</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayUserInfo.username}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">Principal ID</div>
          <div className="text-sm font-mono text-gray-900 dark:text-white">
            {formatPrincipal(principal)}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">注册时间</div>
          <div className="text-sm text-gray-900 dark:text-white">
            {new Date(Number(displayUserInfo.created_at)).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      {/* 资产信息 */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          资产概览
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400">ckBTC 余额</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {displayUserInfo.ckbtc_balance}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400">总收益</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {displayUserInfo.total_earned}
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="text-sm text-orange-600 dark:text-orange-400">总借贷</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {displayUserInfo.total_borrowed}
            </div>
          </div>
        </div>
      </div>
      
      {/* 最近活动 */}
      {displayUserInfo.recent_activities && displayUserInfo.recent_activities.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            最近活动
          </h3>
          <div className="space-y-2">
            {displayUserInfo.recent_activities.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-900 dark:text-white">
                  {activity.description}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(Number(activity.timestamp)).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 