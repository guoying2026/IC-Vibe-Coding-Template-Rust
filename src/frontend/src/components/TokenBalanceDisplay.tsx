import React, { useState, useEffect } from "react";
import { Principal } from "@dfinity/principal";
import {
  getTokenBalance,
  getAllBalances,
} from "../services/InternetIdentityService";

interface TokenBalanceDisplayProps {
  principal: Principal;
}

// 常见代币的 canister ID 列表
const COMMON_TOKENS = {
  ckBTC: "mxzaz-hqaaa-aaaar-qaada-cai", // 主网 ckBTC ledger
  ICP: "ryjl3-tyaaa-aaaaa-aaaba-cai", // 主网 ICP ledger
  // 可以添加更多代币
};

// 本地开发环境的代币 ID
const LOCAL_TOKENS = {
  ckBTC: "q3fc5-haaaa-aaaaa-aaahq-cai", // 本地 ckBTC ledger
  // 可以添加更多本地代币
};

export const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({
  principal,
}) => {
  const [balances, setBalances] = useState<Record<string, bigint>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取当前环境的代币列表
  const getTokenList = () => {
    const isLocal = import.meta.env.VITE_DFX_NETWORK !== "ic";
    return isLocal ? LOCAL_TOKENS : COMMON_TOKENS;
  };

  // 查询单个代币余额
  const fetchSingleBalance = async (canisterId: string, tokenName: string) => {
    try {
      const balance = await getTokenBalance(canisterId, principal);
      setBalances((prev) => ({
        ...prev,
        [tokenName]: balance,
      }));
    } catch (error) {
      console.error(`查询 ${tokenName} 余额失败:`, error);
      setError(`查询 ${tokenName} 余额失败`);
    }
  };

  // 查询所有代币余额
  const fetchAllBalances = async () => {
    setLoading(true);
    setError(null);

    try {
      const tokenList = getTokenList();
      const canisterIds = Object.values(tokenList);
      const allBalances = await getAllBalances(principal, canisterIds);

      // 将结果映射到代币名称
      const namedBalances: Record<string, bigint> = {};
      Object.entries(tokenList).forEach(([name, id]) => {
        namedBalances[name] = allBalances[id] || BigInt(0);
      });

      setBalances(namedBalances);
    } catch (error) {
      console.error("查询所有余额失败:", error);
      setError("查询余额失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  // 格式化余额显示
  const formatBalance = (balance: bigint, decimals: number = 8): string => {
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;

    const fractionStr = fraction.toString().padStart(decimals, "0");
    return `${whole}.${fractionStr}`;
  };

  useEffect(() => {
    if (principal) {
      fetchAllBalances();
    }
  }, [principal]);

  return (
    <div className="token-balance-display">
      <h3>代币余额</h3>

      {loading && <p>正在加载余额...</p>}

      {error && (
        <div className="error-message">
          <p style={{ color: "red" }}>{error}</p>
          <button onClick={fetchAllBalances}>重试</button>
        </div>
      )}

      <div className="balances-list">
        {Object.entries(balances).map(([tokenName, balance]) => (
          <div key={tokenName} className="balance-item">
            <span className="token-name">{tokenName}:</span>
            <span className="balance-amount">{formatBalance(balance)}</span>
            <button
              onClick={() => {
                const tokenList = getTokenList();
                fetchSingleBalance(
                  tokenList[tokenName as keyof typeof tokenList],
                  tokenName,
                );
              }}
              className="refresh-btn"
            >
              刷新
            </button>
          </div>
        ))}
      </div>

      <div className="actions">
        <button onClick={fetchAllBalances} disabled={loading}>
          {loading ? "加载中..." : "刷新所有余额"}
        </button>
      </div>

      <div className="environment-info">
        <p>
          当前环境:{" "}
          {import.meta.env.VITE_DFX_NETWORK === "ic" ? "主网" : "本地开发"}
        </p>
        <p>
          Host:{" "}
          {import.meta.env.VITE_DFX_NETWORK !== "ic"
            ? "http://localhost:8080"
            : "https://ic0.app"}
        </p>
      </div>
    </div>
  );
};
