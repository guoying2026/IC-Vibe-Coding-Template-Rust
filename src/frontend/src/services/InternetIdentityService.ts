// Internet Identity服务
// 处理用户认证和与后端的交互

import { AuthClient } from "@dfinity/auth-client"; // 导入认证客户端
import { Identity } from "@dfinity/agent"; // 导入身份接口
import { Principal } from "@dfinity/principal"; // 导入主体类型
import { Actor, HttpAgent } from "@dfinity/agent"; // 导入Actor和HTTP代理
import { idlFactory } from "../../../declarations/backend"; // 导入后端接口定义
import { TokenBalanceService, TOKEN_CANISTER_IDS } from "./TokenBalanceService"; // 导入余额查询服务

// Account接口定义
export interface Account {
  owner: Principal;
  subaccount?: Uint8Array;
}

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
  private tokenBalanceService: TokenBalanceService | null = null; // 代币余额查询服务
  private authState: AuthState = {
    isAuthenticated: false,
    principal: null,
    userInfo: null,
  }; // 认证状态

  // 初始化认证客户端
  async initialize(): Promise<void> {
    try {
      console.log("=== 初始化Internet Identity服务 ===");
      console.log("环境变量检查:", {
        DFX_NETWORK: import.meta.env.DFX_NETWORK,
        CANISTER_ID_INTERNET_IDENTITY: import.meta.env.CANISTER_ID_INTERNET_IDENTITY,
        CANISTER_ID_BACKEND: import.meta.env.CANISTER_ID_BACKEND,
      });
      
      // 创建认证客户端
      this.authClient = await AuthClient.create();
      console.log("AuthClient创建成功");

      // 检查是否已有身份
      const isAuthenticated = await this.authClient.isAuthenticated();
      console.log("当前认证状态:", isAuthenticated);

      if (isAuthenticated) {
        console.log("用户已认证，开始初始化...");
        // 如果已认证，获取身份并初始化
        this.identity = this.authClient.getIdentity();
        console.log("获取到身份:", this.identity.getPrincipal().toText());
        
        await this.initializeAgent();
        await this.checkAuthenticationStatus();
        console.log("已认证用户初始化完成");
      } else {
        console.log("用户未认证，使用匿名身份初始化agent");
        // 即使未认证，也要初始化agent以便调用查询方法
        await this.initializeAgentWithAnonymousIdentity();
        console.log("匿名用户初始化完成");
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
    const useLocalBackend = import.meta.env.DFX_NETWORK === "local";

    // 统一使用本地后端进行开发
    const host = useLocalBackend ? "http://localhost:4943" : "https://ic0.app";

    console.log("=== Agent初始化信息 ===");
    console.log("使用host:", host);
    console.log("使用本地后端配置:", useLocalBackend);
    console.log("网络配置:", import.meta.env.DFX_NETWORK);

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
    const canisterId = import.meta.env.CANISTER_ID_BACKEND;
    if (!canisterId) {
      throw new Error("后端canister ID未配置");
    }

    console.log("使用后端canister ID:", canisterId);

    // 创建Actor实例
    this.actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId: canisterId,
    });

    // 初始化代币余额查询服务
    this.tokenBalanceService = new TokenBalanceService(this.agent);
  }

  // 使用匿名身份初始化HTTP代理和Actor
  private async initializeAgentWithAnonymousIdentity(): Promise<void> {
    console.log("使用匿名身份初始化HTTP代理和Actor...");
    
    // 创建匿名身份
    const { AnonymousIdentity } = await import("@dfinity/agent");
    this.identity = new AnonymousIdentity();
    
    await this.initializeAgent();
    console.log("匿名用户初始化完成");
  }

  // 确保TokenBalanceService已初始化
  private ensureTokenBalanceService(): TokenBalanceService {
    if (!this.tokenBalanceService) {
      if (!this.agent) {
        // 如果agent未初始化，尝试使用匿名身份初始化
        console.log("Agent未初始化，尝试使用匿名身份初始化...");
        this.initializeAgentWithAnonymousIdentity().catch(error => {
          console.error("匿名身份初始化失败:", error);
          throw new Error("无法初始化Agent，请先登录");
        });
        
        // 如果还是失败，抛出错误
        if (!this.agent) {
          throw new Error("Agent初始化失败，请先登录");
        }
      }
      console.log("延迟初始化TokenBalanceService...");
      this.tokenBalanceService = new TokenBalanceService(this.agent);
    }
    return this.tokenBalanceService;
  }

  // 登录方法 - 统一使用主网 Internet Identity
  async login(): Promise<void> {
    console.log("=== 开始登录流程 ===");
    console.log("当前环境变量:", {
      dfxNetwork: import.meta.env.DFX_NETWORK,
      useLocalBackend: import.meta.env.VITE_USE_LOCAL_BACKEND,
      isDev: import.meta.env.DEV,
      canisterId: import.meta.env.VITE_CANISTER_ID_BACKEND,
    });

    if (!this.authClient) {
      console.error("认证客户端未初始化");
      throw new Error("认证客户端未初始化");
    }

    // 检查是否已经认证
    const isAuthenticated = await this.authClient.isAuthenticated();
    if (isAuthenticated) {
      console.log("用户已经认证，直接获取身份信息");
      this.identity = this.authClient.getIdentity();
      await this.initializeAgent();
      await this.checkAuthenticationStatus();
      return;
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

    if (import.meta.env.DFX_NETWORK === "ic") {
      identityProvider = "https://identity.ic0.app";
    } else {
      // 本地环境，使用推荐的URL格式
      const iiCanisterId = import.meta.env.CANISTER_ID_INTERNET_IDENTITY;

      // 使用推荐的格式：canisterId.localhost:4943 (使用dfx.json中配置的端口)
      identityProvider = `http://${iiCanisterId}.localhost:4943/`;

      console.log("使用本地II推荐URL格式");
    }

    console.log("使用Internet Identity URL:", identityProvider);
    console.log("环境变量:", {
      network: import.meta.env.DFX_NETWORK,
      iiCanisterId: import.meta.env.CANISTER_ID_INTERNET_IDENTITY,
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
            console.log("获取到用户身份:", this.identity.getPrincipal().toText());
            
            // 初始化agent和actor
            await this.initializeAgent();
            console.log("Agent和Actor初始化成功");
            
            // 检查认证状态并获取用户信息
            await this.checkAuthenticationStatus();
            console.log("认证状态检查完成");
            
            // 派发登录成功事件，通知主窗口
            window.dispatchEvent(new Event('ii-login-success'));
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
        // 添加窗口配置
        windowOpenerFeatures: "toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=1,width=500,height=600",
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
    if (!this.actor || !this.identity) {
      throw new Error("Actor或Identity未初始化");
    }

    try {
      console.log("开始检查认证状态...");

      // 获取前端用户主体ID
      const principal = this.identity.getPrincipal();
      console.log("前端Principal:", principal.toText());

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

      // 检查是否已认证
      const isAuthenticated = await this.actor.is_authenticated();
      console.log("后端认证状态:", isAuthenticated);

      if (isAuthenticated) {
        // 尝试获取用户信息
        try {
          const userInfoResult = await this.actor.get_user_info(principal);
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
            // 用户不存在，进入自动注册流程
            console.log("用户不存在，开始自动注册...");
            await this.autoRegisterUser(principal);
          }
        } catch (error) {
          console.error("获取用户信息失败:", error);
          // 如果获取用户信息失败，尝试自动注册
          console.log("获取用户信息失败，尝试自动注册...");
          await this.autoRegisterUser(principal);
        }
      } else {
        // 用户未认证，自动注册
        console.log("用户未认证，开始自动注册...");
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
      const result = await this.actor.register_user(principal, username);

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
            const userInfoResult = await this.actor.get_user_info(principal);
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

  // 获取认证状态
  getAuthState(): AuthState {
    return this.authState;
  }

  // 检查服务是否已初始化
  isInitialized(): boolean {
    return this.actor !== null;
  }

  // 获取当前用户Principal
  getCurrentPrincipal(): Principal | null {
    return this.identity ? this.identity.getPrincipal() : null;
  }

  // 从Principal生成Account identifier
  generateAccountFromPrincipal(principal: Principal, subaccount?: Uint8Array): Account {
    return {
      owner: principal,
      subaccount: subaccount,
    };
  }

  // 生成默认Account（无subaccount）
  generateDefaultAccount(principal: Principal): Account {
    return this.generateAccountFromPrincipal(principal);
  }

  // 查询代币余额
  async queryTokenBalance(tokenCanisterId: string, account: Account): Promise<bigint> {
    if (!this.agent) {
      throw new Error("Agent未初始化");
    }

    try {
      // 使用简单的HTTP请求查询余额
      // 这里使用简化的方法，实际项目中可能需要更完整的IDL定义
      console.log(`查询代币余额: ${tokenCanisterId}`);
      console.log(`Account: ${account.owner.toText()}`);
      
      // 返回模拟余额，实际实现需要完整的ledger IDL
      return BigInt(0);
    } catch (error) {
      console.error("查询代币余额失败:", error);
      throw error;
    }
  }

  // 查询用户当前代币余额
  async queryCurrentUserBalance(tokenCanisterId: string): Promise<bigint> {
    const tokenBalanceService = this.ensureTokenBalanceService();
    
    const principal = this.getCurrentPrincipal();
    if (!principal) {
      throw new Error("用户未认证");
    }

    return await tokenBalanceService.queryCurrentUserBalance(tokenCanisterId, principal);
  }

  // 查询ICP余额
  async queryICPBalance(): Promise<bigint> {
    const tokenBalanceService = this.ensureTokenBalanceService();
    
    const principal = this.getCurrentPrincipal();
    if (!principal) {
      throw new Error("用户未认证");
    }

    return await tokenBalanceService.queryCurrentUserBalance(
      TOKEN_CANISTER_IDS.ICP, 
      principal
    );
  }

  // 查询ckBTC余额
  async queryCkbtcBalance(): Promise<bigint> {
    const tokenBalanceService = this.ensureTokenBalanceService();
    
    const principal = this.getCurrentPrincipal();
    if (!principal) {
      throw new Error("用户未认证");
    }

    return await tokenBalanceService.queryCurrentUserBalance(
      TOKEN_CANISTER_IDS.CKBTC, 
      principal
    );
  }

  // 获取代币信息
  async getTokenInfo(tokenCanisterId: string) {
    const tokenBalanceService = this.ensureTokenBalanceService();
    
    return await tokenBalanceService.getTokenInfo(tokenCanisterId);
  }

  // 格式化余额显示
  formatBalance(balance: bigint, decimals: number): string {
    const tokenBalanceService = this.ensureTokenBalanceService();
    
    return tokenBalanceService.formatBalance(balance, decimals);
  }

  // 检查用户是否已认证
  async isUserAuthenticated(): Promise<boolean> {
    if (!this.authClient) return false;
    return await this.authClient.isAuthenticated();
  }

  // 刷新认证状态
  async refreshAuthState(): Promise<void> {
    await this.checkAuthenticationStatus();
  }
}

// ckBTC minter canister 配置
const CKBTC_MINTER_CANISTER_ID = "qjdve-lqaaa-aaaaa-aaaeq-cai"; // 主网 minter canister
const CKBTC_MINTER_IDL = (IDL: any) => IDL.Service({
  get_btc_deposit_state: IDL.Func([], [IDL.Record({
    status: IDL.Text,
    btcAddress: IDL.Text,
    received: IDL.Float64,
    required: IDL.Float64,
    confirmations: IDL.Nat,
    requiredConfirmations: IDL.Nat,
  })], ["query"]),
});

// 查询充值进度
export async function getCkbtcDepositState(): Promise<any> {
  const agent = new HttpAgent({ host: "https://ic0.app" });
  const minter = Actor.createActor(CKBTC_MINTER_IDL, {
    agent,
    canisterId: CKBTC_MINTER_CANISTER_ID,
  });
  // 这里只是伪实现，实际参数和返回结构请根据 minter candid 调整
  const result = await minter.get_btc_deposit_state();
  if (Array.isArray(result) && result.length > 0) {
    return result[0];
  }
  return null;
}

// 创建全局实例
export const internetIdentityService = new InternetIdentityService();
 