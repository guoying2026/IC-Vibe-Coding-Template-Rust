// Internet Identity服务
// 处理用户认证和与后端的交互

import { AuthClient } from "@dfinity/auth-client"; // 导入认证客户端
import { Identity } from "@dfinity/agent"; // 导入身份接口
import { Principal } from "@dfinity/principal"; // 导入主体类型
import { Actor, HttpAgent } from "@dfinity/agent"; // 导入Actor和HTTP代理
import { idlFactory } from "../../../declarations/backend"; // 导入后端接口定义

// 用户信息接口 - 与后端对齐
export interface UserInfo {
  principal: Principal; // 用户主体ID
  username: string; // 用户名
  ckbtc_balance: number; // ckBTC余额
  total_earned: number; // 总收益
  total_borrowed: number; // 总借贷
  health_factor: number; // 健康因子
  created_at: bigint; // 创建时间
  recent_activities?: Array<{
    description: string;
    timestamp: bigint;
  }>; // 最近活动
}

// 资产配置接口 - 与后端对齐
export interface AssetConfig {
  name: string;
  token_id: Principal;
  account: {
    owner: Principal;
    subaccount: [] | [Uint8Array | number[]];
  };
  price_id: string;
  asset_type: { ICP: null } | { ICRC2: null };
  decimals: number;
  collateral_factor: number;
  interest_rate: number;
}

// 池子接口 - 与后端对齐
export interface Pool {
  name: string;
  token_id: Principal;
  pool_account: AssetConfig;
  collateral: AssetConfig[];
  amount: bigint;
  used_amount: bigint;
  maximum_token: bigint;
}

// 借贷位置接口 - 基于后端数据
export interface BorrowPosition {
  id: string; // token_id
  asset: string; // 资产名称
  amount: number; // 借贷金额
  rate: number; // 利率
  health_factor: number; // 健康因子
}

// 收益位置接口 - 基于后端数据
export interface EarnPosition {
  id: string; // token_id
  asset: string; // 资产名称
  amount: number; // 存入金额
  apy: number; // 年化收益率
  earned: number; // 已赚取收益
}

// 认证状态接口
export interface AuthState {
  isAuthenticated: boolean; // 是否已认证
  principal: Principal | null; // 用户主体ID
  userInfo: UserInfo | null; // 用户信息
}

// Internet Identity服务类
export class InternetIdentityService {
  private authClient: AuthClient | null = null; // 认证客户端
  private identity: Identity | null = null; // 用户身份
  private agent: HttpAgent | null = null; // HTTP代理
  private actor: any = null; // 后端Actor实例
  private authState: AuthState = {
    isAuthenticated: false,
    principal: null,
    userInfo: null,
  }; // 认证状态

  // 初始化认证客户端
  async initialize(): Promise<void> {
    try {
      // 根据环境变量决定使用本地还是主网 Internet Identity
      const isLocal = import.meta.env.VITE_DFX_NETWORK === "local";

      // 无论是本地还是主网，都使用 AuthClient
      this.authClient = await AuthClient.create();

      if (isLocal) {
        console.log("使用本地 Internet Identity");
        // 本地环境：使用本地 Internet Identity canister
        // 检查是否已有身份
        const isAuthenticated = await this.authClient.isAuthenticated();
        if (isAuthenticated) {
          this.identity = this.authClient.getIdentity();
          await this.initializeAgent();
          await this.checkAuthenticationStatus();
        }
      } else {
        console.log("使用主网 Internet Identity");
        // 主网环境：使用主网 Internet Identity
        // 检查是否已有身份
        const isAuthenticated = await this.authClient.isAuthenticated();

        if (isAuthenticated) {
          // 如果已认证，获取身份并初始化
          this.identity = this.authClient.getIdentity();
          await this.initializeAgent();
          await this.checkAuthenticationStatus();
        }
      }
    } catch (error) {
      console.error("初始化认证失败:", error);
      throw error;
    }
  }

  // 初始化HTTP代理和Actor
  private async initializeAgent(): Promise<void> {
    if (!this.identity) {
      throw new Error("身份未初始化");
    }

    // 根据环境变量决定使用本地还是主网后端
    const isLocal = import.meta.env.VITE_DFX_NETWORK === "local";
    const host = isLocal ? "http://localhost:8080" : "https://ic0.app";

    console.log("使用host:", host);
    console.log("网络配置:", import.meta.env.VITE_DFX_NETWORK);

    this.agent = new HttpAgent({
      identity: this.identity,
      host: host,
    });

    // 如果是本地环境，需要获取root key
    if (isLocal) {
      try {
        console.log("获取本地环境的root key...");
        await this.agent.fetchRootKey();
        console.log("root key获取成功");
      } catch (error) {
        console.error("获取root key失败:", error);
        throw new Error("无法连接到本地环境，请确保dfx正在运行");
      }
    }

    // 获取后端canister ID
    const canisterId = import.meta.env.VITE_CANISTER_ID_BACKEND;
    if (!canisterId) {
      throw new Error("后端canister ID未配置");
    }

    console.log("使用后端canister ID:", canisterId);

    // 创建Actor实例
    this.actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId: canisterId,
    });
  }

  // 登录方法
  async login(): Promise<void> {
    console.log("=== 开始登录流程 ===");
    console.log("当前环境变量:", {
      dfxNetwork: import.meta.env.VITE_DFX_NETWORK,
      useLocalBackend: import.meta.env.VITE_USE_LOCAL_BACKEND,
      isDev: import.meta.env.DEV,
      canisterId: import.meta.env.VITE_CANISTER_ID_BACKEND,
    });

    // 根据环境变量决定使用本地还是主网 Internet Identity
    const isLocal = import.meta.env.VITE_DFX_NETWORK === "local";

    if (isLocal) {
      console.log("本地环境：使用本地 Internet Identity 登录");
      // 本地环境使用本地 Internet Identity
      await this.loginWithInternetIdentity();
    } else {
      console.log("主网环境：使用主网 Internet Identity 登录");
      if (!this.authClient) {
        console.error("认证客户端未初始化");
        throw new Error("认证客户端未初始化");
      }
      // 主网环境使用正常的 AuthClient 登录
      return new Promise((resolve, reject) => {
        const loginOptions: any = {
          onSuccess: async () => {
            console.log("Internet Identity登录成功");
            try {
              // 登录成功，获取身份并初始化
              this.identity = this.authClient!.getIdentity();
              await this.initializeAgent();
              await this.checkAuthenticationStatus();
              resolve();
            } catch (error) {
              console.error("登录后初始化失败:", error);
              reject(error);
            }
          },
          onError: (error: any) => {
            console.error("Internet Identity登录失败:", error);
            reject(error);
          },
        };

        console.log("使用主网 Internet Identity");
        // 开始登录流程
        this.authClient!.login(loginOptions);
      });
    }
  }

  // 使用 Internet Identity 登录
  private async loginWithInternetIdentity(): Promise<void> {
    // 构建identityProvider URL
    let identityProvider: string;

    if (import.meta.env.VITE_DFX_NETWORK === "ic") {
      identityProvider = "https://identity.ic0.app";
    } else {
      // 本地环境，使用推荐的URL格式
      const iiCanisterId = import.meta.env.VITE_II_CANISTER_ID;

      // 使用推荐的格式：canisterId.localhost:8080
      identityProvider = `http://${iiCanisterId}.localhost:8080/`;

      console.log("使用本地II推荐URL格式");
    }

    console.log("使用Internet Identity URL:", identityProvider);
    console.log("环境变量:", {
      network: import.meta.env.VITE_DFX_NETWORK,
      iiCanisterId: import.meta.env.VITE_II_CANISTER_ID,
      useLocalBackend: import.meta.env.VITE_USE_LOCAL_BACKEND,
    });

    return new Promise((resolve, reject) => {
      // 开始登录流程
      this.authClient!.login({
        identityProvider,
        onSuccess: async () => {
          console.log("Internet Identity登录成功");
          try {
            // 登录成功，获取身份并初始化
            this.identity = this.authClient!.getIdentity();
            await this.initializeAgent();
            await this.checkAuthenticationStatus();
            // 派发登录成功事件，通知主窗口
            window.dispatchEvent(new Event("ii-login-success"));
            resolve();
          } catch (error) {
            console.error("登录后初始化失败:", error);
            reject(error);
          }
        },
        onError: (error: any) => {
          console.error("Internet Identity登录失败:", error);
          reject(error);
        },
      });
    });
  }

  // 登出方法
  async logout(): Promise<void> {
    if (this.authClient) {
      await this.authClient.logout();
    }

    // 重置状态
    this.identity = null;
    this.agent = null;
    this.actor = null;
    this.authState = {
      isAuthenticated: false,
      principal: null,
      userInfo: null,
    };
  }

  // 检查认证状态并自动注册用户
  private async checkAuthenticationStatus(): Promise<void> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      console.log("开始检查认证状态...");

      // 首先测试基本连接
      try {
        console.log("测试与后端的连接...");
        // 尝试调用一个简单的查询方法
        const testResult = await this.actor.is_authenticated();
        console.log("连接测试成功，认证状态:", testResult);
      } catch (connectionError) {
        console.error("连接测试失败:", connectionError);
        throw new Error("无法连接到后端服务，请检查dfx是否正在运行");
      }

      // 获取用户主体ID
      const principal = await this.actor.get_principal();
      console.log("获取到Principal:", principal.toText());

      // 检查是否已认证
      const isAuthenticated = await this.actor.is_authenticated();
      console.log("后端认证状态:", isAuthenticated);

      if (isAuthenticated) {
        // 用户已注册，获取用户信息
        try {
          const userInfoResult = await this.actor.get_user_info();
          console.log("用户信息结果:", userInfoResult);

          if ("Ok" in userInfoResult) {
            // 用户已注册，更新状态
            this.authState = {
              isAuthenticated: true,
              principal,
              userInfo: userInfoResult.Ok,
            };
            console.log("用户已注册，状态已更新");
          } else {
            throw new Error(userInfoResult.Err);
          }
        } catch (error) {
          console.error("获取用户信息失败:", error);
          // 即使获取用户信息失败，也保持认证状态
          this.authState = {
            isAuthenticated: true,
            principal,
            userInfo: null,
          };
        }
      } else {
        // 用户未注册，自动注册
        console.log("用户未注册，开始自动注册...");
        await this.autoRegisterUser(principal);
      }

      console.log("最终认证状态:", this.authState);
    } catch (error) {
      console.error("检查认证状态失败:", error);
      this.authState = {
        isAuthenticated: false,
        principal: null,
        userInfo: null,
      };
    }
  }

  // 自动注册用户
  private async autoRegisterUser(principal: Principal): Promise<void> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      // 使用Principal ID的前8位作为用户名
      const principalText = principal.toText();
      const username = principalText.slice(0, 8) + "...";

      // 自动注册用户
      const result = await this.actor.register_user(username);

      if ("Ok" in result) {
        // 注册成功，更新认证状态
        this.authState = {
          isAuthenticated: true,
          principal,
          userInfo: result.Ok,
        };
        console.log("用户自动注册成功:", username);
      } else {
        // 如果注册失败，可能是因为用户已存在，尝试获取用户信息
        if (result.Err.includes("用户已存在")) {
          console.log("用户已存在，尝试获取用户信息...");
          try {
            const userInfoResult = await this.actor.get_user_info();
            if ("Ok" in userInfoResult) {
              this.authState = {
                isAuthenticated: true,
                principal,
                userInfo: userInfoResult.Ok,
              };
              console.log("成功获取已存在用户的信息");
            } else {
              throw new Error(userInfoResult.Err);
            }
          } catch (error) {
            console.error("获取已存在用户信息失败:", error);
            // 即使获取失败，也保持认证状态
            this.authState = {
              isAuthenticated: true,
              principal,
              userInfo: null,
            };
          }
        } else {
          throw new Error(result.Err);
        }
      }
    } catch (error) {
      console.error("自动注册用户失败:", error);
      // 即使注册失败，也保持认证状态
      this.authState = {
        isAuthenticated: true,
        principal,
        userInfo: null,
      };
    }
  }

  // 获取用户信息
  async getUserInfo(): Promise<UserInfo | null> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.get_user_info();

      if ("Ok" in result) {
        this.authState.userInfo = result.Ok;
        return result.Ok;
      } else {
        return null;
      }
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return null;
    }
  }

  // 获取所有资产配置
  async getAllAssets(): Promise<AssetConfig[]> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      return await this.actor.get_all_assets();
    } catch (error) {
      console.error("获取所有资产失败:", error);
      throw error;
    }
  }

  // 获取所有池子信息
  async getAllPools(): Promise<Pool[]> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      return await this.actor.get_all_pools();
    } catch (error) {
      console.error("获取所有池子失败:", error);
      throw error;
    }
  }

  // 获取用户的供应信息
  async getUserSupplies(user: Principal): Promise<Array<[Principal, bigint]>> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      return await this.actor.get_user_supplies(user);
    } catch (error) {
      console.error("获取用户供应信息失败:", error);
      throw error;
    }
  }

  // 获取用户的借贷信息
  async getUserBorrows(user: Principal): Promise<Array<[Principal, bigint]>> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      return await this.actor.get_user_borrows(user);
    } catch (error) {
      console.error("获取用户借贷信息失败:", error);
      throw error;
    }
  }

  // 获取池子详情
  async getPoolInfo(tokenId: string): Promise<Pool> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.get_pool_info(tokenId);
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("获取池子详情失败:", error);
      throw error;
    }
  }

  // 获取资产详情
  async getAssetInfo(tokenId: string): Promise<AssetConfig> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.get_asset_info(tokenId);
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("获取资产详情失败:", error);
      throw error;
    }
  }

  // 获取用户的总供应价值
  async getUserTotalSupplyValue(user: Principal): Promise<number> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      return await this.actor.get_user_total_supply_value(user);
    } catch (error) {
      console.error("获取用户总供应价值失败:", error);
      throw error;
    }
  }

  // 获取用户的总借贷价值
  async getUserTotalBorrowValue(user: Principal): Promise<number> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      return await this.actor.get_user_total_borrow_value(user);
    } catch (error) {
      console.error("获取用户总借贷价值失败:", error);
      throw error;
    }
  }

  // 获取用户的健康因子
  async getUserHealthFactor(user: Principal): Promise<number> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      return await this.actor.get_user_health_factor(user);
    } catch (error) {
      console.error("获取用户健康因子失败:", error);
      throw error;
    }
  }

  // 获取借贷位置 - 基于后端数据转换
  async getBorrowPositions(): Promise<BorrowPosition[]> {
    if (!this.actor || !this.authState.principal) {
      throw new Error("Actor未初始化或用户未认证");
    }

    try {
      const borrows = await this.getUserBorrows(this.authState.principal);
      const assets = await this.getAllAssets();
      
      return borrows.map(([tokenId, amount]) => {
        const asset = assets.find(a => a.token_id.toText() === tokenId.toText());
        const assetName = asset?.name || tokenId.toText().slice(0, 8);
        
        return {
          id: tokenId.toText(),
          asset: assetName,
          amount: Number(amount),
          rate: asset?.interest_rate || 0,
          health_factor: this.authState.userInfo?.health_factor || 0,
        };
      });
    } catch (error) {
      console.error("获取借贷位置失败:", error);
      throw error;
    }
  }

  // 获取收益位置 - 基于后端数据转换
  async getEarnPositions(): Promise<EarnPosition[]> {
    if (!this.actor || !this.authState.principal) {
      throw new Error("Actor未初始化或用户未认证");
    }

    try {
      const supplies = await this.getUserSupplies(this.authState.principal);
      const assets = await this.getAllAssets();
      
      return supplies.map(([tokenId, amount]) => {
        const asset = assets.find(a => a.token_id.toText() === tokenId.toText());
        const assetName = asset?.name || tokenId.toText().slice(0, 8);
        
        return {
          id: tokenId.toText(),
          asset: assetName,
          amount: Number(amount),
          apy: asset?.interest_rate || 0,
          earned: 0, // 暂时设为0，后续可以计算
        };
      });
    } catch (error) {
      console.error("获取收益位置失败:", error);
      throw error;
    }
  }

  // 获取当前认证状态
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // 刷新认证状态
  async refreshAuthState(): Promise<void> {
    await this.checkAuthenticationStatus();
  }
}

// 创建全局实例
export const internetIdentityService = new InternetIdentityService();
