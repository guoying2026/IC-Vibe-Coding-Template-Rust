import React, { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { getTokenBalance, getAllBalances } from '../services/InternetIdentityService';

export const TokenBalanceExample: React.FC = () => {
  const [principalText, setPrincipalText] = useState('');
  const [canisterId, setCanisterId] = useState('');
  const [singleBalance, setSingleBalance] = useState<string>('');
  const [allBalances, setAllBalances] = useState<Record<string, bigint>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 查询单个代币余额
  const handleGetSingleBalance = async () => {
    if (!principalText || !canisterId) {
      setError('请输入 Principal 和 Canister ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
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
      setError('请输入 Principal');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const principal = Principal.fromText(principalText);
      
      // 示例代币列表
      const canisterIds = [
        'mxzaz-hqaaa-aaaar-qaada-cai', // 主网 ckBTC
        'ryjl3-tyaaa-aaaaa-aaaba-cai', // 主网 ICP
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
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">代币余额查询示例</h2>
      
      <div className="space-y-4">
        {/* 单个代币余额查询 */}
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">查询单个代币余额</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="输入 Principal (例如: 2vxsx-fae)"
              value={principalText}
              onChange={(e) => setPrincipalText(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="输入 Canister ID (例如: mxzaz-hqaaa-aaaar-qaada-cai)"
              value={canisterId}
              onChange={(e) => setCanisterId(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleGetSingleBalance}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '查询中...' : '查询余额'}
            </button>
            {singleBalance && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <strong>余额:</strong> {singleBalance}
              </div>
            )}
          </div>
        </div>

        {/* 多个代币余额查询 */}
        <div className="border p-4 rounded">
          <h3 className="font-semibold mb-2">查询多个代币余额</h3>
          <div className="space-y-2">
            <button
              onClick={handleGetAllBalances}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '查询中...' : '查询所有余额'}
            </button>
            {Object.keys(allBalances).length > 0 && (
              <div className="mt-2 space-y-1">
                <strong>查询结果:</strong>
                {Object.entries(allBalances).map(([id, balance]) => (
                  <div key={id} className="p-2 bg-gray-100 rounded text-sm">
                    {id}: {balance.toString()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* 环境信息 */}
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
          <p><strong>当前环境:</strong> {import.meta.env.VITE_DFX_NETWORK === "ic" ? "主网" : "本地开发"}</p>
          <p><strong>Host:</strong> {import.meta.env.VITE_DFX_NETWORK !== "ic" ? "http://localhost:8080" : "https://ic0.app"}</p>
        </div>
      </div>
    </div>
  );
}; 