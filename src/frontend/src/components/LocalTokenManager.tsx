import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { localTokenService } from '../services/LocalTokenService';

interface LocalTokenManagerProps {
  principal: Principal;
}

export const LocalTokenManager: React.FC<LocalTokenManagerProps> = ({ principal }) => {
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [mintAmount, setMintAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化服务
  useEffect(() => {
    const initService = async () => {
      try {
        await localTokenService.initialize();
        setIsInitialized(true);
        await refreshBalance();
      } catch (error) {
        setError('初始化本地代币服务失败');
        console.error('初始化失败:', error);
      }
    };

    initService();
  }, []);

  // 刷新余额
  const refreshBalance = async () => {
    try {
      const newBalance = await localTokenService.getBalance(principal);
      setBalance(newBalance);
    } catch (error) {
      console.error('刷新余额失败:', error);
    }
  };

  // 铸造代币
  const handleMint = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      setError('请输入有效金额');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amount = BigInt(parseFloat(mintAmount) * 10 ** 8); // 转换为最小单位
      await localTokenService.mintTokens(principal, amount);
      setSuccess(`成功铸造 ${mintAmount} MYT`);
      setMintAmount('');
      await refreshBalance();
    } catch (error) {
      setError(`铸造失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 转账
  const handleTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setError('请输入有效金额');
      return;
    }

    if (!transferTo) {
      setError('请输入接收方 Principal');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const toPrincipal = Principal.fromText(transferTo);
      const amount = BigInt(parseFloat(transferAmount) * 10 ** 8);
      
      await localTokenService.transfer(principal, toPrincipal, amount);
      setSuccess(`成功转账 ${transferAmount} MYT`);
      setTransferAmount('');
      setTransferTo('');
      await refreshBalance();
    } catch (error) {
      setError(`转账失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">本地代币管理</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化本地代币服务...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">本地代币管理 (ckBTC)</h3>
      
      {/* 当前余额 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-600 mb-1">当前余额</div>
        <div className="text-2xl font-bold text-blue-900">
          {localTokenService.formatBalance(balance)} ckBTC
        </div>
        <button 
          onClick={refreshBalance}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          刷新余额
        </button>
      </div>

      {/* 错误和成功消息 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* 铸造代币 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h4 className="font-semibold mb-3">铸造代币</h4>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="输入铸造数量 (例如: 100)"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            className="w-full p-2 border rounded"
            step="0.00000001"
            min="0"
          />
          <button
            onClick={handleMint}
            disabled={loading || !mintAmount}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '铸造中...' : '铸造 ckBTC'}
          </button>
        </div>
      </div>

      {/* 转账 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h4 className="font-semibold mb-3">转账</h4>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="接收方 Principal (例如: 2vxsx-fae)"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="转账数量 (例如: 10)"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="w-full p-2 border rounded"
            step="0.00000001"
            min="0"
          />
          <button
            onClick={handleTransfer}
            disabled={loading || !transferAmount || !transferTo}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '转账中...' : '转账 ckBTC'}
          </button>
        </div>
      </div>

      {/* 代币信息 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">代币信息</h4>
        <div className="text-sm space-y-1">
          <p><strong>代币名称:</strong> ckBTC (Local)</p>
          <p><strong>代币符号:</strong> ckBTC</p>
          <p><strong>小数位数:</strong> 8</p>
          <p><strong>Ledger Canister:</strong> q3fc5-haaaa-aaaaa-aaahq-cai</p>
          <p><strong>环境:</strong> 本地开发</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">快速铸造</h4>
        <div className="flex flex-wrap gap-2">
          {[1, 10, 100, 1000].map((amount) => (
            <button
              key={amount}
              onClick={() => setMintAmount(amount.toString())}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            >
              {amount} ckBTC
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 