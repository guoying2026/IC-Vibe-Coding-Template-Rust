import React, { useState, useEffect } from "react"; // 导入React hooks
import { useLanguage } from "../hooks/useLanguage"; // 导入多语言Hook
import {
  internetIdentityService,
  UserInfo,
  EarnPosition,
  BorrowPosition,
} from "../services/InternetIdentityService"; // 导入II服务
import { UserInfoDisplay } from "../components/UserInfoDisplay";
import { TokenBalanceDisplay } from "../components/TokenBalanceDisplay";
import { LocalTokenManager } from "../components/LocalTokenManager";

// 新增 props 类型定义
interface DashboardPageProps {
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  principal: any;
  onUserInfoUpdate?: (updatedUserInfo: any) => void;
}
// 总览数据结构
interface PortfolioData {
  totalEarned: number; // 总收益
  totalBorrowed: number; // 总借贷
  netWorth: number; // 净资产
  healthFactor: number; // 健康因子
}

// 统计卡片组件
const StatCard = ({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color?: string;
}) => (
  <div
    className={`flex flex-col items-center rounded-2xl bg-white/80 p-6 shadow dark:bg-gray-900/80 ${color || ""}`}
    style={{ boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)" }}
  >
    <div className="mb-1 text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
      {title}
    </div>
    <div className="text-2xl font-bold text-gray-900 tabular-nums dark:text-white">
      {value}
    </div>
  </div>
);

// 修改导出函数签名，接收 props
export default function DashboardPage({
  userInfo,
  isAuthenticated,
  principal,
  onUserInfoUpdate,
}: DashboardPageProps) {
  const { t } = useLanguage(); // 多语言Hook
  const [activeTab, setActiveTab] = useState<"earn" | "borrow">("earn"); // 当前激活的标签页

  // 其余状态保留（收益、借贷位置、loading、error）
  const [earnPositions, setEarnPositions] = useState<EarnPosition[]>([]); // 收益位置
  const [borrowPositions, setBorrowPositions] = useState<BorrowPosition[]>([]); // 借贷位置
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误状态

  // 计算总览数据
  const calculatePortfolioData = (): PortfolioData => {
    if (!userInfo) {
      return {
        totalEarned: 0,
        totalBorrowed: 0,
        netWorth: 0,
        healthFactor: 0,
      };
    }

    return {
      totalEarned: userInfo.total_earned,
      totalBorrowed: userInfo.total_borrowed,
      netWorth:
        userInfo.ckbtc_balance +
        userInfo.total_earned -
        userInfo.total_borrowed,
      healthFactor: userInfo.health_factor,
    };
  };

  // 加载用户数据
  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 检查认证状态
      const authState = internetIdentityService.getAuthState();
      if (!authState.isAuthenticated) {
        setError("请先登录Internet Identity");
        return;
      }

      // 并行加载用户信息、收益位置和借贷位置
      const [userInfoResult, earnPositionsResult, borrowPositionsResult] =
        await Promise.allSettled([
          internetIdentityService.getUserInfo(),
          internetIdentityService.getEarnPositions(),
          internetIdentityService.getBorrowPositions(),
        ]);

      // 处理用户信息
      if (userInfoResult.status === "fulfilled" && userInfoResult.value) {
        userInfo = userInfoResult.value; // 更新 props 中的 userInfo
        onUserInfoUpdate?.(userInfoResult.value); // 调用 onUserInfoUpdate
      }

      // 处理收益位置
      if (earnPositionsResult.status === "fulfilled") {
        setEarnPositions(earnPositionsResult.value);
      }

      // 处理借贷位置
      if (borrowPositionsResult.status === "fulfilled") {
        setBorrowPositions(borrowPositionsResult.value);
      }

      // 检查是否有错误
      if (userInfoResult.status === "rejected") {
        console.error("获取用户信息失败:", userInfoResult.reason);
      }
      if (earnPositionsResult.status === "rejected") {
        console.error("获取收益位置失败:", earnPositionsResult.reason);
      }
      if (borrowPositionsResult.status === "rejected") {
        console.error("获取借贷位置失败:", borrowPositionsResult.reason);
      }
    } catch (error) {
      console.error("加载用户数据失败:", error);
      setError("加载用户数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadUserData();
  }, []);

  // 计算总览数据
  const portfolioData = calculatePortfolioData();

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pt-24 pb-12 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pt-24 pb-12 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
              {t("page_dashboard_title")}
            </h1>
            <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={loadUserData}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pt-24 pb-12 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 用户信息卡片 */}
        <UserInfoDisplay
          userInfo={userInfo}
          isAuthenticated={isAuthenticated}
          principal={principal}
          onUserInfoUpdate={onUserInfoUpdate}
        />
        {/* 页面头部 */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
            {t("page_dashboard_title")}
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-400">
            {t("page_dashboard_subtitle")}
          </p>
        </div>

        {/* 代币余额显示 */}
        {isAuthenticated && principal && (
          <div className="mb-8">
            <TokenBalanceDisplay principal={principal} />
          </div>
        )}

        {/* 本地代币管理 */}
        {isAuthenticated && principal && (
          <div className="mb-8">
            <LocalTokenManager principal={principal} />
          </div>
        )}

        {/* 总览卡片区 */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          <StatCard
            title={t("Total Earned")}
            value={portfolioData.totalEarned.toFixed(2)}
            color=""
          />
          <StatCard
            title={t("Total Borrowed")}
            value={portfolioData.totalBorrowed.toFixed(2)}
            color=""
          />
          <StatCard
            title={t("net_worth")}
            value={portfolioData.netWorth.toFixed(2)}
            color=""
          />
          <StatCard
            title={t("health_factor")}
            value={portfolioData.healthFactor.toFixed(2)}
            color=""
          />
        </div>

        {/* Tab切换栏 */}
        <div className="mb-6 flex space-x-8 border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-2 py-3 text-base font-semibold transition-colors ${activeTab === "earn" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-blue-600"}`}
            onClick={() => setActiveTab("earn")}
          >
            {t("My Earn Positions")}
          </button>
          <button
            className={`px-2 py-3 text-base font-semibold transition-colors ${activeTab === "borrow" ? "border-b-2 border-purple-600 text-purple-600" : "text-gray-500 hover:text-purple-600"}`}
            onClick={() => setActiveTab("borrow")}
          >
            {t("My Borrow Positions")}
          </button>
        </div>

        {/* Tab内容区 - 铺满宽度的表格卡片 */}
        <div className="overflow-hidden rounded-3xl bg-white/80 p-0 shadow-xl dark:bg-gray-900/80">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-700 dark:text-gray-300">
                    {t("Asset")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-700 dark:text-gray-300">
                    {t("Amount")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-700 dark:text-gray-300">
                    {activeTab === "earn" ? t("APY") : t("Rate")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-700 dark:text-gray-300">
                    {activeTab === "earn" ? t("Earned") : t("Health Factor")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "earn" ? earnPositions : borrowPositions).map(
                  (pos) => (
                    <tr
                      key={pos.id}
                      className="border-b border-gray-100 transition-colors duration-150 last:border-0 hover:bg-blue-50/60 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                        {pos.asset}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700 tabular-nums dark:text-gray-200">
                        {pos.amount}
                      </td>
                      <td className="px-6 py-3 text-right text-blue-600 tabular-nums dark:text-blue-400">
                        {activeTab === "earn"
                          ? `${(pos as EarnPosition).apy}%`
                          : `${(pos as BorrowPosition).rate}%`}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-700 tabular-nums dark:text-gray-200">
                        {activeTab === "earn"
                          ? (pos as EarnPosition).earned
                          : (pos as BorrowPosition).health_factor}
                      </td>
                    </tr>
                  ),
                )}
                {/* 如果没有数据，显示空状态 */}
                {(activeTab === "earn" ? earnPositions : borrowPositions)
                  .length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {activeTab === "earn" ? "暂无收益仓位" : "暂无借贷仓位"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
