// 页面路由类型
export type PageRoute = "earn" | "borrow" | "explore" | "migrate" | "dashboard";

// 导航项类型
export interface NavItem {
  id: PageRoute;
  key: string; // 添加key属性
  label: string; // 改为string类型，而不是对象
  icon: string;
  href: string;
}

// 语言类型
export type Language = "en" | "zh";

// 市场对类型 - 与后端 Pool 对齐
export interface MarketPair {
  id: string; // token_id
  name: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  apy: number;
  collateral_factor: number;
  interest_rate: number;
  amount: bigint;
  used_amount: bigint;
  maximum_token: bigint;
  // 添加缺失的属性
  collateral?: string;
  loan?: string;
  totalMarketSize?: number;
  totalLiquidity?: number;
  borrowRate?: number;
  trustedBy?: number;
  vaults?: any[];
}

// 金库类型 - 与后端 Pool 对齐
export interface Vault {
  id: string; // token_id
  name: string;
  asset: string;
  apy: number;
  tvl: number;
  userDeposit: number;
  earned: number;
  collateral_factor: number;
  interest_rate: number;
  amount: bigint;
  used_amount: bigint;
  maximum_token: bigint;
  // 添加缺失的属性
  curatorIcon?: string;
  curator?: string;
  description?: string;
  totalDeposits?: number;
  liquidity?: number;
  allocation?: number;
  supplyShare?: number;
  performanceData?: any;
}

// 资产配置类型 - 与后端 AssetConfig 对齐
export interface AssetConfig {
  name: string;
  token_id: string;
  account: {
    owner: string;
    subaccount: [] | [Uint8Array | number[]];
  };
  price_id: string;
  asset_type: "ICP" | "ICRC2";
  decimals: number;
  collateral_factor: number;
  interest_rate: number;
}

// 池子类型 - 与后端 Pool 对齐
export interface Pool {
  name: string;
  token_id: string;
  pool_account: AssetConfig;
  collateral: AssetConfig[];
  amount: bigint;
  used_amount: bigint;
  maximum_token: bigint;
}

// 用户供应信息类型
export interface UserSupply {
  token_id: string;
  amount: bigint;
  asset_name: string;
  value: number;
}

// 用户借贷信息类型
export interface UserBorrow {
  token_id: string;
  amount: bigint;
  asset_name: string;
  value: number;
  rate: number;
}

// 借贷位置类型 - 基于后端数据
export interface BorrowPosition {
  id: string; // token_id
  asset: string; // 资产名称
  amount: number; // 借贷金额
  rate: number; // 利率
  health_factor: number; // 健康因子
}

// 收益位置类型 - 基于后端数据
export interface EarnPosition {
  id: string; // token_id
  asset: string; // 资产名称
  amount: number; // 存入金额
  apy: number; // 年化收益率
  earned: number; // 已赚取收益
}

// 用户信息类型 - 与后端 UserInfo 对齐
export interface UserInfo {
  principal: string;
  username: string;
  ckbtc_balance: number;
  total_earned: number;
  total_borrowed: number;
  health_factor: number;
  created_at: bigint;
  recent_activities?: Array<{
    description: string;
    timestamp: bigint;
  }>;
}

// 认证状态类型
export interface AuthState {
  isAuthenticated: boolean;
  principal: string | null;
  userInfo: UserInfo | null;
}
