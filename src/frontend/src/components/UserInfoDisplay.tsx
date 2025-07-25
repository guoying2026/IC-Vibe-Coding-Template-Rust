// 用户信息显示组件
// User information display component

import { useState } from 'react';
import { UserInfo } from '../services/InternetIdentityService';
import { CkbtcBalanceManager } from './CkbtcBalanceManager';
import { useLanguage } from "../hooks/useLanguage";

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
  const { t } = useLanguage();
  const [showBalanceManager, setShowBalanceManager] = useState(false);

  if (!isAuthenticated || !userInfo) {
    return null;
  }

  const formatPrincipal = (principal: any) => {
    if (!isAuthenticated || !principal) return "-";
    const principalText = principal.toText();
    return `${principalText.slice(0, 6)}...${principalText.slice(-4)}`;
  };

  // 使用默认数据或用户数据
  const displayUserInfo = {
    username: isAuthenticated && userInfo.username ? userInfo.username : '-',
    ckbtc_balance: isAuthenticated && userInfo.ckbtc_balance ? userInfo.ckbtc_balance : 0,
    total_earned: isAuthenticated && userInfo.total_earned ? userInfo.total_earned : 0,
    total_borrowed: isAuthenticated && userInfo.total_borrowed ? userInfo.total_borrowed : 0,
    created_at: isAuthenticated && userInfo.created_at ? userInfo.created_at : BigInt(0),
    recent_activities: [],
  };

  // 处理余额更新
  const handleBalanceUpdate = (newBalance: number) => {
    if (onUserInfoUpdate && userInfo) {
      const updatedUserInfo = {
        ...userInfo,
        ckbtc_balance: newBalance
      };
      onUserInfoUpdate(updatedUserInfo);
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("user_info")}
        </h2>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {t("authenticated")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 基本信息 */}
        <div className="space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t("username")}</div>
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
      </div>

      {/* 隐藏资产信息和最近活动部分 */}
    </div>
  );
};
 