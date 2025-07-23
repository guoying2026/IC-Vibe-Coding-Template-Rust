import React, { useState } from "react";
import { Principal } from "@dfinity/principal";
import {
  getTokenBalance,
  getAllBalances,
} from "../services/InternetIdentityService";

export const TokenBalanceExample: React.FC = () => {
  const [principalText, setPrincipalText] = useState("");
  const [canisterId, setCanisterId] = useState("");
  const [singleBalance, setSingleBalance] = useState<string>("");
  const [allBalances, setAllBalances] = useState<Record<string, bigint>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 查询单个代币余额
  const handleGetSingleBalance = async () => {
    if (!principalText || !canisterId) {
      setError("请输入 Principal 和 Canister ID");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const principal = Principal.fromText(principalText);
      const balance = await getTokenBalance(canisterId, principal);
      setSingleBalance(balance.toString());
    } catch (err) {
      setError(`查询失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // 查询多个代币余额
  const handleGetAllBalances = async () => {
    if (!principalText) {
      setError("请输入 Principal");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const principal = Principal.fromText(principalText);

      // 示例代币列表
      const canisterIds = [
        "mxzaz-hqaaa-aaaar-qaada-cai", // 主网 ckBTC
        "ryjl3-tyaaa-aaaaa-aaaba-cai", // 主网 ICP
      ];

      const balances = await getAllBalances(principal, canisterIds);
      setAllBalances(balances);
    } catch (err) {
      setError(`查询失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-bold">代币余额查询示例</h2>

      <div className="space-y-4">
        {/* 单个代币余额查询 */}
        <div className="rounded border p-4">
          <h3 className="mb-2 font-semibold">查询单个代币余额</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="输入 Principal (例如: 2vxsx-fae)"
              value={principalText}
              onChange={(e) => setPrincipalText(e.target.value)}
              className="w-full rounded border p-2"
            />
            <input
              type="text"
              placeholder="输入 Canister ID (例如: mxzaz-hqaaa-aaaar-qaada-cai)"
              value={canisterId}
              onChange={(e) => setCanisterId(e.target.value)}
              className="w-full rounded border p-2"
            />
            <button
              onClick={handleGetSingleBalance}
              disabled={loading}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "查询中..." : "查询余额"}
            </button>
            {singleBalance && (
              <div className="mt-2 rounded bg-gray-100 p-2">
                <strong>余额:</strong> {singleBalance}
              </div>
            )}
          </div>
        </div>

        {/* 多个代币余额查询 */}
        <div className="rounded border p-4">
          <h3 className="mb-2 font-semibold">查询多个代币余额</h3>
          <div className="space-y-2">
            <button
              onClick={handleGetAllBalances}
              disabled={loading}
              className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "查询中..." : "查询所有余额"}
            </button>
            {Object.keys(allBalances).length > 0 && (
              <div className="mt-2 space-y-1">
                <strong>查询结果:</strong>
                {Object.entries(allBalances).map(([id, balance]) => (
                  <div key={id} className="rounded bg-gray-100 p-2 text-sm">
                    {id}: {balance.toString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="rounded bg-red-100 p-2 text-red-700">{error}</div>
        )}

        {/* 环境信息 */}
        <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
          <p>
            <strong>当前环境:</strong>{" "}
            {import.meta.env.VITE_DFX_NETWORK === "ic" ? "主网" : "本地开发"}
          </p>
          <p>
            <strong>Host:</strong>{" "}
            {import.meta.env.VITE_DFX_NETWORK !== "ic"
              ? "http://localhost:8080"
              : "https://ic0.app"}
          </p>
        </div>
      </div>
    </div>
  );
};
