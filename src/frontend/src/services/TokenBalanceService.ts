// Token Balance Query Service

import { Actor, HttpAgent, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { sha224 } from "js-sha256";

// Account interface
export interface Account {
  owner: Principal;
  subaccount?: Uint8Array | null;
}

// ICRC Ledger interface
export interface ICRCLedger {
  icrc1_balance_of: (args: {
    account: { owner: Principal; subaccount?: number[] };
  }) => Promise<bigint>;
  icrc1_name: () => Promise<string>;
  icrc1_symbol: () => Promise<string>;
  icrc1_decimals: () => Promise<number>;
}

// ICRC Ledger IDL
const icrc1Idl: IDL.InterfaceFactory = ({ IDL }) =>
  IDL.Service({
    icrc1_balance_of: IDL.Func(
      [
        IDL.Record({
          account: IDL.Record({
            owner: IDL.Principal,
            subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
          }),
        }),
      ],
      [IDL.Nat],
      ["query"],
    ),
    icrc1_name: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_symbol: IDL.Func([], [IDL.Text], ["query"]),
    icrc1_decimals: IDL.Func([], [IDL.Nat8], ["query"]),
  });

export class TokenBalanceService {
  private agent: HttpAgent;
  private tokenInfoCache: Map<
    string,
    { name: string; symbol: string; decimals: number }
  >;

  constructor(agent: HttpAgent) {
    this.agent = agent;
    this.tokenInfoCache = new Map();
    const network = import.meta.env.DFX_NETWORK || "ic";
    if (network === "local") {
      this.agent
        .fetchRootKey()
        .catch((error) => console.error("获取本地 Root Key 失败:", error));
    }
  }

  // Get network configuration
  private getNetworkConfig() {
    const network = import.meta.env.DFX_NETWORK || "ic";
    if (!["local", "ic"].includes(network)) {
      throw new Error(
        `无效的 DFX_NETWORK 值: ${network}，应为 "local" 或 "ic"`,
      );
    }
    const isLocal = network === "local";
    const host = isLocal ? "http://localhost:4943" : "https://icp-api.io";
    return { network, isLocal, host };
  }

  // Generate Account from Principal
  generateAccountFromPrincipal(
    principal: Principal,
    subaccount?: Uint8Array,
  ): Account {
    return {
      owner: principal,
      subaccount: subaccount ?? undefined,
    };
  }

  // Generate default Account (no subaccount)
  generateDefaultAccount(principal: Principal): Account {
    return this.generateAccountFromPrincipal(principal);
  }

  // Query token balance
  async queryTokenBalance(
    tokenCanisterId: string,
    principal: Principal,
    subaccount?: Uint8Array,
  ): Promise<{ balance?: bigint; error?: string }> {
    try {
      const actor = Actor.createActor<ICRCLedger>(icrc1Idl, {
        agent: this.agent,
        canisterId: tokenCanisterId,
      });
      
      // 构建account参数，始终包含subaccount字段
      const account: any = {
        owner: principal,
        subaccount: subaccount && subaccount.length === 32 ? Array.from(subaccount) : undefined,
      };
      
      const result = await actor.icrc1_balance_of({ account });
      return { balance: result as bigint };
    } catch (error) {
      console.error("Failed to query token balance:", error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Generate Account ID
  async generateAccountId(
    principal: Principal,
    subaccount?: Uint8Array,
  ): Promise<string> {
    try {
      console.log("TokenBalanceService: 开始生成Account ID");
      console.log("Principal:", principal.toText());

      // 按照 ICP 官方文档的公式：
      // account_identifier(principal, subaccount) := CRC32(h) || h
      // where h = SHA224("\x0Aaccount-id" || principal || subaccount)

      // 1. 构建 padding: "\x0Aaccount-id" (11字节)
      const padding = new Uint8Array([
        0x0a,
        ...new TextEncoder().encode("account-id"),
      ]);
      console.log("Padding length:", padding.length);

      // 2. 获取 principal 的原始字节
      const principalBytes = principal.toUint8Array();
      console.log("Principal bytes length:", principalBytes.length);

      // 3. 处理 subaccount: 如果没有提供，使用32字节的0
      const sub = subaccount ?? new Uint8Array(32);
      console.log("Subaccount length:", sub.length);

      // 4. 拼接数据: padding || principal || subaccount
      const data = new Uint8Array(
        padding.length + principalBytes.length + sub.length,
      );
      data.set(padding, 0);
      data.set(principalBytes, padding.length);
      data.set(sub, padding.length + principalBytes.length);
      console.log("Total data length:", data.length);

      // 5. 计算 SHA224 哈希 (使用 js-sha256 库)
      console.log("开始计算SHA224哈希...");
      const hash224 = sha224.create();
      hash224.update(data);
      const hash = new Uint8Array(hash224.array());
      console.log("SHA224哈希完成，长度:", hash.length);

      // 6. 计算 CRC32 校验和
      console.log("开始计算CRC32校验和...");
      const crc32 = this.calculateCRC32(hash);
      console.log("CRC32校验和完成，长度:", crc32.length);

      // 7. 拼接最终结果: CRC32(h) || h
      const result = new Uint8Array(4 + hash.length);
      result.set(crc32, 0);
      result.set(hash, 4);
      console.log("最终结果长度:", result.length);

      const hexResult = this.toHex(result);
      console.log("Account ID生成成功:", hexResult);
      return hexResult;
    } catch (error) {
      console.error(
        "TokenBalanceService: Failed to generate Account ID:",
        error,
      );
      console.error("错误详情:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  // Get token information
  async getTokenInfo(tokenCanisterId: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  }> {
    try {
      if (this.tokenInfoCache.has(tokenCanisterId)) {
        return this.tokenInfoCache.get(tokenCanisterId)!;
      }

      console.log(`Fetching token info for ${tokenCanisterId}`);
      const actor = Actor.createActor<ICRCLedger>(icrc1Idl, {
        agent: this.agent,
        canisterId: tokenCanisterId,
      });

      const [name, symbol, decimals] = await Promise.all([
        actor.icrc1_name(),
        actor.icrc1_symbol(),
        actor.icrc1_decimals(),
      ]);

      const tokenInfo = { name, symbol, decimals: Number(decimals) };
      this.tokenInfoCache.set(tokenCanisterId, tokenInfo);
      return tokenInfo;
    } catch (error) {
      console.warn(
        `Failed to fetch ${tokenCanisterId} token info, using default:`,
        error,
      );
      return { name: "Unknown Token", symbol: "", decimals: 8 };
    }
  }

  // Format balance display
  formatBalance(balance: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;

    if (fraction === BigInt(0)) {
      return whole.toString();
    }

    const fractionStr = fraction
      .toString()
      .padStart(decimals, "0")
      .replace(/0+$/, "");
    return `${whole}.${fractionStr}`;
  }

  // Calculate CRC32 checksum
  private calculateCRC32(data: Uint8Array): Uint8Array {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    crc = ~crc >>> 0;
    const buffer = new Uint8Array(4);
    buffer[0] = (crc >> 24) & 0xff;
    buffer[1] = (crc >> 16) & 0xff;
    buffer[2] = (crc >> 8) & 0xff;
    buffer[3] = crc & 0xff;
    return buffer;
  }

  // Convert byte array to hex string
  private toHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map((x) => ("00" + x.toString(16)).slice(-2))
      .join("");
  }
}

// Common token Canister IDs
export const TOKEN_CANISTER_IDS = {
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  CKBTC: "mxzaz-hqaaa-aaaar-qaada-cai",
  SNS1: "zfcdd-tqaaa-aaaaq-aaaga-cai",
  LOCAL_ICP: import.meta.env.LOCAL_ICP_CANISTER_ID || "",
  LOCAL_CKBTC: import.meta.env.LOCAL_CKBTC_CANISTER_ID || "",
};

// Create global instance
export function createTokenBalanceService(
  agent: HttpAgent,
): TokenBalanceService {
  return new TokenBalanceService(agent);
}
