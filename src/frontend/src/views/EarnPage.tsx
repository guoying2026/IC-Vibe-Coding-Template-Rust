// 收益页面组件 - 金库列表视图
// Earn page component - vault list view

import { useState, useEffect } from "react";
import { Vault } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import { VaultListItem } from "../components/Earn/VaultListItem";
import { UserInfoDisplay } from "../components/UserInfoDisplay";
import { UserInfo, internetIdentityService } from "../services/InternetIdentityService";

// 组件属性接口
interface EarnPageProps {
  walletAddress: string | null; // 钱包地址
  userInfo: UserInfo | null; // 用户信息
  isAuthenticated: boolean; // 认证状态
  principal: any; // Principal对象
  onError: (error: string) => void; // 错误处理回调
  setLoading: (loading: boolean) => void; // 加载状态设置
  onSelectVault: (vault: Vault) => void; // 选择金库回调
  onUserInfoUpdate?: (updatedUserInfo: UserInfo) => void; // 用户信息更新回调
}

// 收益页面主组件
export const EarnPage = ({
  walletAddress,
  userInfo,
  isAuthenticated,
  principal,
  onError,
  setLoading,
  onSelectVault,
  onUserInfoUpdate,
}: EarnPageProps) => {
  // 多语言Hook
  const { t } = useLanguage();

  // 金库列表状态
  const [vaults, setVaults] = useState<Vault[]>([]);

  // 筛选文本状态
  const [filter, setFilter] = useState("");

  // 存款类型筛选状态
  const [depositFilter, setDepositFilter] = useState("All");

  // 管理者筛选状态
  const [curatorFilter, setCuratorFilter] = useState("All");

  // 加载金库数据
  const loadVaults = async () => {
    try {
      setLoading(true);
      
      if (!isAuthenticated) {
        console.log("用户未认证，跳过加载金库数据");
        return;
      }

      // 从后端获取所有池子信息
      const pools = await internetIdentityService.getAllPools();
      
      // 转换为前端需要的 Vault 格式
      const vaultsData: Vault[] = pools.map((pool) => ({
        id: pool.token_id.toText(),
        name: pool.name,
        asset: pool.pool_account.name,
        apy: pool.pool_account.interest_rate,
        tvl: Number(pool.amount),
        userDeposit: 0, // 暂时设为0，后续可以从用户供应信息获取
        earned: 0, // 暂时设为0，后续可以计算
        collateral_factor: pool.pool_account.collateral_factor,
        interest_rate: pool.pool_account.interest_rate,
        amount: pool.amount,
        used_amount: pool.used_amount,
        maximum_token: pool.maximum_token,
      }));

      setVaults(vaultsData);
      console.log("加载金库数据成功:", vaultsData);
    } catch (error) {
      console.error("加载金库数据失败:", error);
      onError("加载金库数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 初始化金库数据
  useEffect(() => {
    loadVaults();
  }, [isAuthenticated]);

  // 筛选金库列表
  const filteredVaults = vaults.filter((vault) => {
    const matchesFilter = vault.name.toLowerCase().includes(filter.toLowerCase()) ||
                         vault.asset.toLowerCase().includes(filter.toLowerCase());
    
    const matchesDepositFilter = depositFilter === "All" || 
                                (depositFilter === "Deposited" && vault.userDeposit > 0) ||
                                (depositFilter === "Not Deposited" && vault.userDeposit === 0);
    
    const matchesCuratorFilter = curatorFilter === "All" || 
                                vault.name.toLowerCase().includes(curatorFilter.toLowerCase());
    
    return matchesFilter && matchesDepositFilter && matchesCuratorFilter;
  });

  // 计算总TVL
  const totalTVL = vaults.reduce((sum, vault) => sum + vault.tvl, 0);

  // 计算用户总存款
  const totalUserDeposits = vaults.reduce((sum, vault) => sum + vault.userDeposit, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部用户信息区域 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("earn.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("earn.subtitle")}
              </p>
            </div>
            
            {/* 用户信息显示 */}
            <div className="mt-4 lg:mt-0">
              <UserInfoDisplay
                userInfo={userInfo}
                isAuthenticated={isAuthenticated}
                principal={principal}
                onUserInfoUpdate={onUserInfoUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 总TVL */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("earn.totalTVL")}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalTVL.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 用户总存款 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("earn.yourDeposits")}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${totalUserDeposits.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 活跃金库数量 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🏦</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("earn.activeVaults")}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {vaults.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选和搜索区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* 搜索框 */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={t("earn.searchPlaceholder")}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 筛选下拉菜单 */}
              <div className="flex space-x-4">
                <select
                  value={depositFilter}
                  onChange={(e) => setDepositFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">{t("earn.allDeposits")}</option>
                  <option value="Deposited">{t("earn.deposited")}</option>
                  <option value="Not Deposited">{t("earn.notDeposited")}</option>
                </select>

                <select
                  value={curatorFilter}
                  onChange={(e) => setCuratorFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">{t("earn.allCurators")}</option>
                  <option value="SparkDAO">SparkDAO</option>
                  <option value="B.Protocol">B.Protocol</option>
                  <option value="Block Analitica">Block Analitica</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 金库列表 */}
        <div className="space-y-4">
          {filteredVaults.length > 0 ? (
            filteredVaults.map((vault) => (
              <VaultListItem
                key={vault.id}
                vault={vault}
                onSelect={() => onSelectVault(vault)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                {vaults.length === 0 ? (
                  <p>{t("earn.noVaultsAvailable")}</p>
                ) : (
                  <p>{t("earn.noVaultsMatchFilter")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
