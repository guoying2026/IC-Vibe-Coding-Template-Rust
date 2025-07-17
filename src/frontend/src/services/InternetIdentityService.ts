// Internet Identity服务
// 处理用户认证和与后端的交互

import { AuthClient } from "@dfinity/auth-client"; // 导入认证客户端
import { Identity } from "@dfinity/agent"; // 导入身份接口
import { Principal } from "@dfinity/principal"; // 导入主体类型
import { Actor, HttpAgent } from "@dfinity/agent"; // 导入Actor和HTTP代理
import { idlFactory } from "../../../declarations/backend"; // 导入后端接口定义

// 用户信息接口
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

// 借贷位置接口
export interface BorrowPosition {
  id: string; // 位置ID
  asset: string; // 资产类型
  amount: number; // 借贷金额
  rate: number; // 利率
  health_factor: number; // 健康因子
}

// 收益位置接口
export interface EarnPosition {
  id: string; // 位置ID
  asset: string; // 资产类型
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
      // 创建认证客户端
      this.authClient = await AuthClient.create();

      // 检查是否已有身份
      const isAuthenticated = await this.authClient.isAuthenticated();

      if (isAuthenticated) {
        // 如果已认证，获取身份并初始化
        this.identity = this.authClient.getIdentity();
        await this.initializeAgent();
        await this.checkAuthenticationStatus();
      }
    } catch (error) {
      console.error("初始化Internet Identity失败:", error);
      throw error;
    }
  }

  // 初始化HTTP代理和Actor
  private async initializeAgent(): Promise<void> {
    if (!this.identity) {
      throw new Error("身份未初始化");
    }

    // 创建HTTP代理 - 统一使用主网II登录，但连接到本地后端
    const useLocalBackend = import.meta.env.VITE_USE_LOCAL_BACKEND === "true";

    // 统一使用本地后端进行开发
    const host = useLocalBackend ? "http://localhost:4943" : "https://ic0.app";

    console.log("=== Agent初始化信息 ===");
    console.log("使用host:", host);
    console.log("使用本地后端配置:", useLocalBackend);
    console.log("网络配置:", import.meta.env.VITE_DFX_NETWORK);

    this.agent = new HttpAgent({
      identity: this.identity,
      host: host,
    });

    // 如果是本地环境，需要获取root key
    if (useLocalBackend) {
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

  // 登录方法 - 统一使用主网 Internet Identity
  async login(): Promise<void> {
    console.log("=== 开始登录流程 ===");
    console.log("当前环境变量:", {
      dfxNetwork: import.meta.env.VITE_DFX_NETWORK,
      useLocalBackend: import.meta.env.VITE_USE_LOCAL_BACKEND,
      isDev: import.meta.env.DEV,
      canisterId: import.meta.env.VITE_CANISTER_ID_BACKEND,
    });

    if (!this.authClient) {
      console.error("认证客户端未初始化");
      throw new Error("认证客户端未初始化");
    }

    // 统一使用主网 Internet Identity 登录
    console.log("使用主网 Internet Identity 进行认证");
    await this.loginWithInternetIdentity();
  }

  // 使用 dfx identity 登录（开发环境）
  private async loginWithDfxIdentity(): Promise<void> {
    try {
      // 在开发环境中，直接使用 dfx identity
      // 这里我们需要创建一个简单的身份验证流程
      console.log("使用 dfx identity 登录...");

      // 获取当前 dfx identity 的 principal
      const principal = await this.getDfxIdentityPrincipal();

      // 初始化 agent 和 actor
      await this.initializeAgent();

      // 检查认证状态
      await this.checkAuthenticationStatus();

      console.log("dfx identity 登录成功");
    } catch (error) {
      console.error("dfx identity 登录失败:", error);
      throw error;
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

      // 使用推荐的格式：canisterId.localhost:4943
      identityProvider = `http://${iiCanisterId}.localhost:4943/`;

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

  // 获取 dfx identity 的 principal
  private async getDfxIdentityPrincipal(): Promise<any> {
    // 这里我们需要通过某种方式获取 dfx identity 的 principal
    // 可以通过调用本地 dfx 命令或者使用其他方式
    try {
      // 临时方案：创建一个匿名身份
      const { Ed25519KeyIdentity } = await import("@dfinity/identity");
      const key = Ed25519KeyIdentity.generate();
      this.identity = key;
      return key.getPrincipal();
    } catch (error) {
      console.error("获取 dfx identity principal 失败:", error);
      throw error;
    }
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

  // 更新ckBTC余额
  async updateCkbtcBalance(amount: number): Promise<number> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.update_ckbtc_balance(amount);

      if ("Ok" in result) {
        // 更新本地用户信息
        if (this.authState.userInfo) {
          this.authState.userInfo.ckbtc_balance = result.Ok;
        }
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("更新ckBTC余额失败:", error);
      throw error;
    }
  }

  // 获取借贷位置
  async getBorrowPositions(): Promise<BorrowPosition[]> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.get_borrow_positions();

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("获取借贷位置失败:", error);
      throw error;
    }
  }

  // 获取收益位置
  async getEarnPositions(): Promise<EarnPosition[]> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.get_earn_positions();

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("获取收益位置失败:", error);
      throw error;
    }
  }

  // 添加借贷位置
  async addBorrowPosition(
    asset: string,
    amount: number,
    rate: number,
  ): Promise<BorrowPosition> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.add_borrow_position(asset, amount, rate);

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("添加借贷位置失败:", error);
      throw error;
    }
  }

  // 添加收益位置
  async addEarnPosition(
    asset: string,
    amount: number,
    apy: number,
  ): Promise<EarnPosition> {
    if (!this.actor) {
      throw new Error("Actor未初始化");
    }

    try {
      const result = await this.actor.add_earn_position(asset, amount, apy);

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("添加收益位置失败:", error);
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
