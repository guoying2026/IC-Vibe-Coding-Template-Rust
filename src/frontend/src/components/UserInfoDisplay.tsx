// 用户信息显示组件
// User information display component

import { useState } from "react";
import { UserInfo } from "../services/InternetIdentityService";
import { CkbtcBalanceManager } from "./CkbtcBalanceManager";

interface UserInfoDisplayProps {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  principal: any;
  onUserInfoUpdate?: (updatedUserInfo: UserInfo) => void;
}

export const UserInfoDisplay = ({
  userInfo,
  isAuthenticated,
  principal,
  onUserInfoUpdate,
}: UserInfoDisplayProps) => {
  const [showBalanceManager, setShowBalanceManager] = useState(false);

  if (!isAuthenticated || !userInfo) {
    return null;
  }

  const formatPrincipal = (principal: any) => {
    if (!principal) return "";
    const principalText = principal.toText();
    return `${principalText.slice(0, 6)}...${principalText.slice(-4)}`;
  };

  // 使用默认数据或用户数据
  const displayUserInfo = {
    username: userInfo.username || "测试用户",
    ckbtc_balance: userInfo.ckbtc_balance || 0,
    total_earned: userInfo.total_earned || 0,
    total_borrowed: userInfo.total_borrowed || 0,
    created_at: userInfo.created_at || BigInt(Date.now()),
    recent_activities: userInfo.recent_activities || [
      { description: "登录成功", timestamp: BigInt(Date.now()) },
      { description: "查看金库列表", timestamp: BigInt(Date.now() - 60000) },
      { description: "连接钱包", timestamp: BigInt(Date.now() - 120000) },
    ],
  };

  // 处理余额更新
  const handleBalanceUpdate = (newBalance: number) => {
    if (onUserInfoUpdate && userInfo) {
      const updatedUserInfo = {
        ...userInfo,
        ckbtc_balance: newBalance,
      };
      onUserInfoUpdate(updatedUserInfo);
    }
  };

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          用户信息
        </h2>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            已认证
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 基本信息 */}
        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">用户名</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayUserInfo.username}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Principal ID
          </div>
          <div className="font-mono text-sm text-gray-900 dark:text-white">
            {formatPrincipal(principal)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            注册时间
          </div>
          <div className="text-sm text-gray-900 dark:text-white">
            {new Date(Number(displayUserInfo.created_at)).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* 资产信息 */}
      <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            资产概览
          </h3>
          <button
            onClick={() => setShowBalanceManager(!showBalanceManager)}
            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
          >
            {showBalanceManager ? "隐藏" : "管理余额"}
          </button>
        </div>

        {/* 余额管理组件 */}
        {showBalanceManager && (
          <div className="mb-4">
            <CkbtcBalanceManager
              currentBalance={displayUserInfo.ckbtc_balance}
              onBalanceUpdate={handleBalanceUpdate}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="text-sm text-blue-600 dark:text-blue-400">
              ckBTC 余额
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {displayUserInfo.ckbtc_balance.toFixed(8)}
            </div>
          </div>

          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="text-sm text-green-600 dark:text-green-400">
              总收益
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {displayUserInfo.total_earned.toFixed(8)}
            </div>
          </div>

          <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
            <div className="text-sm text-orange-600 dark:text-orange-400">
              总借贷
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {displayUserInfo.total_borrowed.toFixed(8)}
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      {displayUserInfo.recent_activities &&
        displayUserInfo.recent_activities.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              最近活动
            </h3>
            <div className="space-y-2">
              {displayUserInfo.recent_activities
                .slice(0, 3)
                .map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700"
                  >
                    <div className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(
                        Number(activity.timestamp),
                      ).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
};
