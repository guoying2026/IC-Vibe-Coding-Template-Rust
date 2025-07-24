// 用户信息显示组件
// User information display component

import { UserInfo } from "../services/InternetIdentityService";

// 组件属性接口
interface UserInfoDisplayProps {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  principal: any;
  onUserInfoUpdate?: (updatedUserInfo: UserInfo) => void;
}

// 用户信息显示组件
export const UserInfoDisplay = ({
  userInfo,
  isAuthenticated,
  principal,
  onUserInfoUpdate,
}: UserInfoDisplayProps) => {
  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              未登录
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              请先登录以查看用户信息
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              加载中...
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              正在获取用户信息
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userInfo.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {userInfo.username}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userInfo.principal.toText()}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              ckBTC 余额
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatNumber(userInfo.ckbtc_balance)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              健康因子
            </p>
            <p className={`text-sm font-semibold ${
              userInfo.health_factor > 1.5 ? 'text-green-600 dark:text-green-400' :
              userInfo.health_factor > 1.0 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {userInfo.health_factor.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              总收益
            </p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              {formatNumber(userInfo.total_earned)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              总借贷
            </p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {formatNumber(userInfo.total_borrowed)}
            </p>
          </div>
        </div>

        {userInfo.recent_activities && userInfo.recent_activities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              最近活动
            </p>
            <div className="space-y-2">
              {userInfo.recent_activities.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 dark:text-gray-300">
                    {activity.description}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            创建时间: {formatTimestamp(userInfo.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};
