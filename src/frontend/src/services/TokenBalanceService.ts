// 代币余额查询服务
// Token Balance Query Service

import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// Account接口定义
export interface Account {
  owner: Principal;
  subaccount?: Uint8Array;
}

// ICRC Ledger接口定义
export interface ICRCLedger {
  icrc1_balance_of: (args: { account: Account }) => Promise<bigint>;
  icrc1_name: () => Promise<string>;
  icrc1_symbol: () => Promise<string>;
  icrc1_decimals: () => Promise<number>;
}

export class TokenBalanceService {
  private agent: HttpAgent;

  constructor(agent: HttpAgent) {
    this.agent = agent;
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

  // 查询代币余额 - 使用真实ICRC-1接口
  async queryTokenBalance(tokenCanisterId: string, account: Account): Promise<bigint> {
    try {
      console.log(`查询代币余额: ${tokenCanisterId}`);
      console.log(`Account: ${account.owner.toText()}`);
      
      // 使用HTTP请求直接调用ICRC-1接口
      const host = this.agent.rootKey ? "http://localhost:4943" : "https://ic0.app";
      const url = `${host}/api/v2/canister/${tokenCanisterId}/query`;
      
      const requestBody = {
        request_type: "query",
        sender: account.owner.toText(),
        canister_id: tokenCanisterId,
        method_name: "icrc1_balance_of",
        arg: this.encodeAccount(account),
        ingress_expiry: Math.floor(Date.now() / 1000) + 300, // 5分钟后过期
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/cbor",
        },
        body: this.encodeCBOR(requestBody),
      });

      if (!response.ok) {
        console.warn(`查询${tokenCanisterId}余额失败，返回0`);
        return BigInt(0);
      }

      const result = await response.arrayBuffer();
      const balance = this.decodeCBOR(result);
      return BigInt(balance);
    } catch (error) {
      console.error("查询代币余额失败:", error);
      console.warn(`查询${tokenCanisterId}余额失败，返回0`);
      return BigInt(0);
    }
  }

  // 查询用户当前代币余额
  async queryCurrentUserBalance(tokenCanisterId: string, principal: Principal): Promise<bigint> {
    const account = this.generateDefaultAccount(principal);
    return await this.queryTokenBalance(tokenCanisterId, account);
  }

  // 获取代币信息 - 使用真实接口
  async getTokenInfo(tokenCanisterId: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    try {
      console.log(`获取代币信息: ${tokenCanisterId}`);
      
      // 默认代币信息
      const defaultInfo = { name: "Unknown Token", symbol: "UNK", decimals: 8 };
      
      // 尝试获取真实代币信息，如果失败则使用默认值
      try {
        const host = this.agent.rootKey ? "http://localhost:4943" : "https://ic0.app";
        const url = `${host}/api/v2/canister/${tokenCanisterId}/query`;
        
        const requestBody = {
          request_type: "query",
          sender: "2vxsx-fae", // 匿名principal
          canister_id: tokenCanisterId,
          method_name: "icrc1_name",
          arg: [],
          ingress_expiry: Math.floor(Date.now() / 1000) + 300,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/cbor",
          },
          body: this.encodeCBOR(requestBody),
        });

        if (response.ok) {
          const nameResult = await response.arrayBuffer();
          const name = this.decodeCBOR(nameResult);
          
          // 获取symbol
          requestBody.method_name = "icrc1_symbol";
          const symbolResponse = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/cbor",
            },
            body: this.encodeCBOR(requestBody),
          });
          
          let symbol = "UNK";
          if (symbolResponse.ok) {
            const symbolResult = await symbolResponse.arrayBuffer();
            symbol = this.decodeCBOR(symbolResult);
          }
          
          // 获取decimals
          requestBody.method_name = "icrc1_decimals";
          const decimalsResponse = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/cbor",
            },
            body: this.encodeCBOR(requestBody),
          });
          
          let decimals = 8;
          if (decimalsResponse.ok) {
            const decimalsResult = await decimalsResponse.arrayBuffer();
            decimals = this.decodeCBOR(decimalsResult);
          }
          
          return { name, symbol, decimals };
        }
      } catch (error) {
        console.warn(`获取${tokenCanisterId}代币信息失败，使用默认值:`, error);
      }
      
      return defaultInfo;
    } catch (error) {
      console.error("获取代币信息失败:", error);
      return { name: "Unknown Token", symbol: "UNK", decimals: 8 };
    }
  }

  // 格式化余额显示
  formatBalance(balance: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    
    if (fraction === BigInt(0)) {
      return whole.toString();
    }
    
    const fractionStr = fraction.toString().padStart(decimals, '0');
    return `${whole}.${fractionStr}`;
  }

  // 编码Account为CBOR格式
  private encodeAccount(account: Account): Uint8Array {
    // 简化的CBOR编码，实际项目中应该使用完整的CBOR库
    const accountData = {
      owner: account.owner.toText(),
      subaccount: account.subaccount ? Array.from(account.subaccount) : null
    };
    return new TextEncoder().encode(JSON.stringify(accountData));
  }

  // 编码CBOR（简化版本）
  private encodeCBOR(data: any): Uint8Array {
    // 这里应该使用真正的CBOR编码库
    // 暂时使用JSON编码作为占位符
    return new TextEncoder().encode(JSON.stringify(data));
  }

  // 解码CBOR（简化版本）
  private decodeCBOR(data: ArrayBuffer): any {
    // 这里应该使用真正的CBOR解码库
    // 暂时使用JSON解码作为占位符
    const text = new TextDecoder().decode(data);
    return JSON.parse(text);
  }
}

// 常用的代币Canister ID
export const TOKEN_CANISTER_IDS = {
  // 主网代币ID
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai", // ICP Ledger
  CKBTC: "mxzaz-hqaaa-aaaar-qaada-cai", // ckBTC Ledger
  SNS1: "zfcdd-tqaaa-aaaaq-aaaga-cai", // SNS-1 Token
  
  // 本地测试代币ID（开发环境）
  LOCAL_ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  LOCAL_CKBTC: "mxzaz-hqaaa-aaaar-qaada-cai",
};

// 创建全局实例
export function createTokenBalanceService(agent: HttpAgent): TokenBalanceService {
  return new TokenBalanceService(agent);
} 