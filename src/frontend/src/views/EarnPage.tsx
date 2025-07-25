// 收益页面组件 - 金库列表视图
// Earn page component - vault list view

import { useState, useEffect } from "react";
import { Vault } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import { VaultListItem } from "../components/Earn/VaultListItem";
import { UserInfoDisplay } from "../components/UserInfoDisplay";
import { UserInfo } from "../services/InternetIdentityService";

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

  // 初始化金库数据
  useEffect(() => {
    // 模拟金库数据，匹配图片中的内容
    const mockVaults: Vault[] = [
      {
        id: "1",
        name: "Spark USDC Vault",
        curator: "SparkDAO",
        curatorIcon: "⚡",
        allocation: 490640000,
        supplyShare: 81.76,
        asset: "USDC",
        deposits: 490.64,
        apy: 4.54,
        liquidity: 490590000,
        totalDeposits: 490640000,
        collateral: ["₿"],
        description:
          "SparkDAO managed USDC vault with optimized yield strategies",
        performanceData: {
          nativeApy: 4.54,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 4.54,
          chartData: [],
        },
      },
      {
        id: "2",
        name: "Moonwell Flagship USDC",
        curator: "B.Protocol",
        curatorIcon: "🌙",
        allocation: 50460000,
        supplyShare: 80.0,
        asset: "USDC",
        deposits: 50.46,
        apy: 7.21,
        liquidity: 50460000,
        totalDeposits: 50460000,
        collateral: ["₿", "🔵", "🟡", "🔶"],
        description:
          "Moonwell flagship USDC vault curated by B.Protocol and Block Analitica",
        performanceData: {
          nativeApy: 7.21,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 7.21,
          chartData: [],
        },
      },
      {
        id: "3",
        name: "Seamless USDC Vault",
        curator: "Gauntlet",
        curatorIcon: "🎯",
        allocation: 42060000,
        supplyShare: 80.0,
        asset: "USDC",
        deposits: 42.06,
        apy: 7.25,
        liquidity: 42050000,
        totalDeposits: 42060000,
        collateral: ["₿", "🔵", "🟡", "🔶", "⚡"],
        description: "Seamless USDC vault with multiple collateral support",
        performanceData: {
          nativeApy: 7.25,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 7.25,
          chartData: [],
        },
      },
      {
        id: "4",
        name: "Moonwell Flagship ETH",
        curator: "Block Analitica",
        curatorIcon: "📊",
        allocation: 10290000,
        supplyShare: 80.0,
        asset: "WETH",
        deposits: 10.29,
        apy: 3.76,
        liquidity: 10290000,
        totalDeposits: 10290000,
        collateral: ["⚡", "🔵", "🟡", "🔶"],
        description:
          "Ethereum focused vault with diversified collateral options",
        performanceData: {
          nativeApy: 3.76,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 3.76,
          chartData: [],
        },
      },
      {
        id: "5",
        name: "Moonwell Frontier cbBTC",
        curator: "B.Protocol",
        curatorIcon: "🌙",
        allocation: 203350000,
        supplyShare: 80.0,
        asset: "cbBTC",
        deposits: 203.35,
        apy: 0.72,
        liquidity: 24000000,
        totalDeposits: 203350000,
        collateral: ["₿", "🔵", "🟡"],
        description: "Coinbase wrapped Bitcoin vault with frontier strategies",
        performanceData: {
          nativeApy: 0.72,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 0.72,
          chartData: [],
        },
      },
      {
        id: "6",
        name: "Seamless WETH Vault",
        curator: "Gauntlet",
        curatorIcon: "🎯",
        allocation: 7617270000,
        supplyShare: 80.0,
        asset: "WETH",
        deposits: 7617.27,
        apy: 4.11,
        liquidity: 22760000,
        totalDeposits: 7617270000,
        collateral: ["⚡", "🔵", "🟡", "🔶"],
        description:
          "High-volume WETH vault with institutional-grade management",
        performanceData: {
          nativeApy: 4.11,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 4.11,
          chartData: [],
        },
      },
      {
        id: "7",
        name: "Extrafi XLend WETH",
        curator: "Gauntlet",
        curatorIcon: "🎯",
        allocation: 3869410000,
        supplyShare: 80.0,
        asset: "WETH",
        deposits: 3869.41,
        apy: 4.08,
        liquidity: 11560000,
        totalDeposits: 3869410000,
        collateral: ["⚡", "🔵", "🟡", "🔶"],
        description: "Extrafi lending protocol WETH vault",
        performanceData: {
          nativeApy: 4.08,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 4.08,
          chartData: [],
        },
      },
      {
        id: "8",
        name: "Seamless cbBTC Vault",
        curator: "Gauntlet",
        curatorIcon: "🎯",
        allocation: 82030000,
        supplyShare: 80.0,
        asset: "cbBTC",
        deposits: 82.03,
        apy: 1.14,
        liquidity: 9860000,
        totalDeposits: 82030000,
        collateral: ["₿", "🔵", "🟡", "🔶"],
        description: "Seamless cbBTC vault with balanced risk management",
        performanceData: {
          nativeApy: 1.14,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 1.14,
          chartData: [],
        },
      },
      {
        id: "9",
        name: "Steakhouse USDC",
        curator: "Steakhouse Financial",
        curatorIcon: "🥩",
        allocation: 9460000,
        supplyShare: 80.0,
        asset: "USDC",
        deposits: 9.46,
        apy: 6.39,
        liquidity: 9460000,
        totalDeposits: 9460000,
        collateral: ["₿", "🔵", "🟡"],
        description: "Steakhouse Financial managed USDC vault",
        performanceData: {
          nativeApy: 6.39,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 6.39,
          chartData: [],
        },
      },
      {
        id: "10",
        name: "Re7 - eUSD",
        curator: "RE7 Labs",
        curatorIcon: "🔬",
        allocation: 8870000,
        supplyShare: 80.0,
        asset: "eUSD",
        deposits: 8.87,
        apy: 8.93,
        liquidity: 8870000,
        totalDeposits: 8870000,
        collateral: ["⚡", "🔵", "🟡", "🔶"],
        description:
          "RE7 Labs experimental eUSD vault with high yield potential",
        performanceData: {
          nativeApy: 8.93,
          wellBonus: 0,
          performanceFee: 0,
          netApy: 8.93,
          chartData: [],
        },
      },
    ];
    
    setVaults(mockVaults);
  }, []);

  // 根据筛选条件过滤金库
  const filteredVaults = vaults.filter((vault) => {
    const matchesSearch =
      vault.name.toLowerCase().includes(filter.toLowerCase()) ||
                         vault.curator.toLowerCase().includes(filter.toLowerCase()) ||
                         vault.asset?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesDeposit =
      depositFilter === "All" || vault.asset === depositFilter;
    const matchesCurator =
      curatorFilter === "All" || vault.curator === curatorFilter;
    
    return matchesSearch && matchesDeposit && matchesCurator;
  });

  // 获取唯一的存款类型
  const depositTypes = [
    "All",
    ...Array.from(new Set(vaults.map((v) => v.asset).filter(Boolean))),
  ];
  
  // 获取唯一的管理者
  const curators = [
    "All",
    ...Array.from(new Set(vaults.map((v) => v.curator))),
  ];

  return (
    // 页面主容器
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 pt-24 pb-12 dark:from-gray-900 dark:to-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 用户信息显示 */}
        {/* <UserInfoDisplay
          userInfo={userInfo}
          isAuthenticated={isAuthenticated}
          principal={principal}
          onUserInfoUpdate={onUserInfoUpdate}
        /> */}
        
        {/* 页面头部 */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
            {t("page_earn_title")}
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-400">
            {t("page_earn_subtitle")}
          </p>
        </div>

        {/* 金库列表容器 */}
        <div className="rounded-3xl border border-gray-200/50 bg-white/50 p-4 shadow-xl backdrop-blur-2xl sm:p-6 dark:border-gray-700/50 dark:bg-gray-800/50">
          {/* 筛选和操作栏 */}
          <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setDepositFilter("All")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold shadow transition-colors ${
                  depositFilter === "All"
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100/70 text-gray-600 dark:bg-gray-700/70 dark:text-gray-300"
                }`}
              >
                {t("deposit")}: {t("all")}
              </button>
              <button 
                onClick={() => setCuratorFilter("All")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  curatorFilter === "All"
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100/70 text-gray-600 dark:bg-gray-700/70 dark:text-gray-300"
                }`}
              >
                {t("curator")}: {t("all")}
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <svg
                className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("filter_vaults")}
                className="w-full rounded-xl border border-gray-200 bg-white/70 py-2.5 pr-4 pl-10 text-gray-900 placeholder-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900/70 dark:text-white"
              />
            </div>
          </div>
          
          {/* 列表头部 */}
          <div className="grid grid-cols-12 gap-4 border-b border-gray-200/70 px-4 pb-3 text-xs font-medium text-gray-500 dark:border-gray-700/70 dark:text-gray-400">
            <div className="col-span-3">{t("vault")}</div>
            <div className="col-span-2">{t("deposits")}</div>
            <div className="col-span-2">{t("curator")}</div>
            <div className="col-span-2">{t("collateral")}</div>
            <div className="col-span-3 text-right">{t("apy")}</div>
          </div>

          {/* 金库列表 */}
          <div className="mt-2 space-y-2">
            {filteredVaults.length > 0 ? (
              filteredVaults.map((vault) => (
                <VaultListItem
                  key={vault.id}
                  vault={vault}
                  onSelect={onSelectVault}
                />
              ))
            ) : (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">{t("no_vaults_found")}</p>
                <p>{t("try_adjusting_filters")}</p>
              </div>
            )}
          </div>
          
          {/* 分页控制 */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <button className="cursor-not-allowed rounded-lg bg-gray-100/70 p-2 text-gray-500 dark:bg-gray-700/70 dark:text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("page")} 1 {t("of")} 1
              </span>
              <button className="cursor-not-allowed rounded-lg bg-gray-100/70 p-2 text-gray-500 dark:bg-gray-700/70 dark:text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
