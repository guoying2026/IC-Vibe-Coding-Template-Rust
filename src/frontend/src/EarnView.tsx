// 从React导入必要的钩子函数
import React, { useState, useEffect } from 'react';
import { BTCAsset } from './types';
import { useLanguage } from './hooks/useLanguage';
import { AssetPool, Dashboard, LiquidityProvider, TransactionHistory, WalletConnector, MarketDetail } from "./components";

// 资产接口定义 - 包含借贷平台所需的所有资产属性
interface Asset {
  id: string; // 资产唯一标识符
  symbol: string; // 资产符号 (如 USDC, USDT)
  name: string; // 资产全名
  balance: number; // 钱包中的可用余额
  apy: number; // 供应年化收益率
  tvl: number; // 总锁仓价值
  supplied: number; // 用户已供应的金额
  borrowed: number; // 用户已借贷的金额
  icon: string; // 资产图标 emoji
  collateralFactor: number; // 抵押因子 (决定借贷能力)
  liquidationThreshold: number; // 清算阈值
  borrowRate: number; // 借贷年化利率
  utilization: number; // 市场利用率
}

// 交易记录接口定义
interface Transaction {
  id: string; // 交易唯一标识符
  type: 'supply' | 'withdraw' | 'borrow' | 'repay'; // 交易类型：供应、提取、借贷、还款
  asset: string; // 涉及的资产符号
  amount: number; // 交易金额
  timestamp: number; // 交易时间戳
  txHash: string; // 交易哈希
  status: 'pending' | 'success' | 'failed'; // 交易状态
}

// 组件属性接口定义
interface EarnViewProps {
  onError: (error: string) => void; // 错误处理回调函数
  setLoading: (loading: boolean) => void; // 加载状态设置回调函数
}

// 主要的借贷平台视图组件
export const EarnView = ({ onError, setLoading }: EarnViewProps) => {
  // 钱包连接状态 - 存储连接的钱包地址
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  // 资产列表状态
  const [assets, setAssets] = useState<Asset[]>([]);
  // 交易历史状态
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // 总供应金额统计
  const [totalSupplied, setTotalSupplied] = useState(0);
  // 总收益统计
  const [totalEarned, setTotalEarned] = useState(0);
  // 平均年化收益率
  const [avgApy, setAvgApy] = useState(0);
  // 当前选中的资产 (用于模态框)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  // 流动性供应模态框显示状态
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  // 市场详情模态框显示状态
  const [showMarketDetail, setShowMarketDetail] = useState(false);

  // 组件初始化时加载模拟数据
  useEffect(() => {
    // 模拟资产数据 - 在真实应用中应该从后端API获取
    const mockAssets: Asset[] = [
      {
        id: "1",
        symbol: "USDC",
        name: "USD Coin",
        balance: 1000, // 钱包余额
        apy: 5.2, // 供应APY
        tvl: 15000000, // 总锁仓价值
        supplied: 500, // 已供应金额
        borrowed: 50, // 已借贷金额
        icon: "💰",
        collateralFactor: 80, // 80%抵押因子
        liquidationThreshold: 85, // 85%清算阈值
        borrowRate: 7.5, // 借贷利率
        utilization: 75 // 利用率
      },
      {
        id: "2",
        symbol: "USDT",
        name: "Tether",
        balance: 750,
        apy: 4.8,
        tvl: 12000000,
        supplied: 200,
        borrowed: 0, // 无借贷
        icon: "💵",
        collateralFactor: 75,
        liquidationThreshold: 80,
        borrowRate: 8.2,
        utilization: 68
      },
      {
        id: "3",
        symbol: "DAI",
        name: "Dai Stablecoin",
        balance: 500,
        apy: 6.1,
        tvl: 8000000,
        supplied: 100,
        borrowed: 25,
        icon: "🏦",
        collateralFactor: 77,
        liquidationThreshold: 82,
        borrowRate: 7.8,
        utilization: 72
      },
      {
        id: "4",
        symbol: "WETH",
        name: "Wrapped Ethereum",
        balance: 2.5,
        apy: 3.9,
        tvl: 25000000,
        supplied: 1.2,
        borrowed: 0.3,
        icon: "⚡",
        collateralFactor: 82,
        liquidationThreshold: 87,
        borrowRate: 6.5,
        utilization: 85
      }
    ];

    // 模拟交易历史数据
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        type: "supply", // 供应交易
        asset: "USDC",
        amount: 100,
        timestamp: Date.now() - 3600000, // 1小时前
        txHash: "0x123...abc",
        status: "success"
      },
      {
        id: "2",
        type: "borrow", // 借贷交易
        asset: "USDT",
        amount: 50,
        timestamp: Date.now() - 7200000, // 2小时前
        txHash: "0x456...def",
        status: "success"
      }
    ];

    // 设置模拟数据到状态
    setAssets(mockAssets);
    setTransactions(mockTransactions);

    // 计算统计数据
    const totalSuppliedValue = mockAssets.reduce((sum, asset) => sum + (asset.supplied * 1), 0);
    const totalEarnedValue = mockAssets.reduce((sum, asset) => sum + (asset.supplied * asset.apy / 100), 0);
    const avgApyValue = mockAssets.reduce((sum, asset) => sum + asset.apy, 0) / mockAssets.length;

    // 更新统计状态
    setTotalSupplied(totalSuppliedValue);
    setTotalEarned(totalEarnedValue);
    setAvgApy(avgApyValue);
  }, []); // 空依赖数组表示仅在组件挂载时执行一次

  // 处理钱包连接
  const handleConnectWallet = async () => {
    setLoading(true); // 开始加载
    try {
      // 模拟钱包连接过程 - 真实应用中需要集成实际的钱包连接
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟1秒延迟
      setConnectedWallet("0x1234...5678"); // 设置模拟钱包地址
    } catch (error) {
      onError("Failed to connect wallet"); // 连接失败时显示错误
    } finally {
      setLoading(false); // 结束加载
    }
  };

  // 处理资产供应操作
  const handleSupplyAsset = (asset: Asset, amount: number) => {
    setLoading(true); // 开始处理
    try {
      // 创建新的供应交易记录
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'supply',
        asset: asset.symbol,
        amount,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 5)}`,
        status: 'pending' // 初始状态为待处理
      };

      // 添加交易到历史记录 (在前面插入新交易)
      setTransactions(prev => [newTransaction, ...prev]);
      
      // 更新资产余额和供应金额
      setAssets(prev => prev.map(a => 
        a.id === asset.id 
          ? { ...a, supplied: a.supplied + amount, balance: a.balance - amount }
          : a
      ));

      // 模拟交易完成 - 3秒后更新状态为成功
      setTimeout(() => {
        setTransactions(prev => prev.map(tx => 
          tx.id === newTransaction.id 
            ? { ...tx, status: 'success' }
            : tx
        ));
      }, 3000);

    } catch (error) {
      onError("Failed to supply asset"); // 供应失败错误处理
    } finally {
      setLoading(false); // 结束处理
      setShowLiquidityModal(false); // 关闭模态框
      setShowMarketDetail(false); // 关闭详情模态框
    }
  };

  // 处理资产借贷操作
  const handleBorrowAsset = (asset: Asset, amount: number) => {
    setLoading(true);
    try {
      // 创建借贷交易记录
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'borrow',
        asset: asset.symbol,
        amount,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 5)}`,
        status: 'pending'
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // 更新资产借贷金额和钱包余额
      setAssets(prev => prev.map(a => 
        a.id === asset.id 
          ? { ...a, borrowed: a.borrowed + amount, balance: a.balance + amount }
          : a
      ));

      setTimeout(() => {
        setTransactions(prev => prev.map(tx => 
          tx.id === newTransaction.id 
            ? { ...tx, status: 'success' }
            : tx
        ));
      }, 3000);

    } catch (error) {
      onError("Failed to borrow asset");
    } finally {
      setLoading(false);
      setShowMarketDetail(false);
    }
  };

  // 处理资产还款操作
  const handleRepayAsset = (asset: Asset, amount: number) => {
    setLoading(true);
    try {
      // 创建还款交易记录
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'repay',
        asset: asset.symbol,
        amount,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 5)}`,
        status: 'pending'
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // 更新资产借贷金额和钱包余额
      setAssets(prev => prev.map(a => 
        a.id === asset.id 
          ? { ...a, borrowed: a.borrowed - amount, balance: a.balance - amount }
          : a
      ));

      setTimeout(() => {
        setTransactions(prev => prev.map(tx => 
          tx.id === newTransaction.id 
            ? { ...tx, status: 'success' }
            : tx
        ));
      }, 3000);

    } catch (error) {
      onError("Failed to repay asset");
    } finally {
      setLoading(false);
      setShowMarketDetail(false);
    }
  };

  // 处理资产提取操作
  const handleWithdrawAsset = (asset: Asset, amount: number) => {
    setLoading(true);
    try {
      // 创建提取交易记录
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'withdraw',
        asset: asset.symbol,
        amount,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 5)}`,
        status: 'pending'
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // 更新资产供应金额和钱包余额
      setAssets(prev => prev.map(a => 
        a.id === asset.id 
          ? { ...a, supplied: a.supplied - amount, balance: a.balance + amount }
          : a
      ));

      setTimeout(() => {
        setTransactions(prev => prev.map(tx => 
          tx.id === newTransaction.id 
            ? { ...tx, status: 'success' }
            : tx
        ));
      }, 3000);

    } catch (error) {
      onError("Failed to withdraw asset");
    } finally {
      setLoading(false);
      setShowLiquidityModal(false);
      setShowMarketDetail(false);
    }
  };

  // 打开流动性供应模态框
  const openLiquidityModal = (asset: Asset) => {
    setSelectedAsset(asset); // 设置选中的资产
    setShowLiquidityModal(true); // 显示流动性模态框
  };

  // 打开市场详情模态框
  const openMarketDetail = (asset: Asset) => {
    setSelectedAsset(asset); // 设置选中的资产
    setShowMarketDetail(true); // 显示市场详情模态框
  };

  return (
    // 主容器 - 全屏高度，渐变背景
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      
      {/* 顶部导航栏 - 固定在页面顶部 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧：品牌标识和描述 */}
            <div className="flex items-center space-x-4">
              {/* 品牌名称 - 使用渐变文字效果 */}
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💰 ICP Earn
              </div>
              {/* 品牌描述 - 在小屏幕上隐藏 */}
              <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                Decentralized Lending Protocol
              </div>
            </div>
            
            {/* 右侧：钱包连接器 */}
            <WalletConnector 
              connectedWallet={connectedWallet} 
              onConnect={handleConnectWallet}
            />
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 仪表板组件 - 显示总体统计信息 */}
        <Dashboard 
          totalSupplied={totalSupplied}
          totalEarned={totalEarned}
          avgApy={avgApy}
          connectedWallet={connectedWallet}
        />

        {/* 资产池列表区域 */}
        <div className="mt-8">
          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Available Markets
          </h2>
          
          {/* 资产池网格布局 - 响应式设计 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <AssetPool
                key={asset.id} // React key for list rendering
                asset={asset} // 传递资产数据
                onSupply={() => openLiquidityModal(asset)} // 供应按钮回调
                onViewDetails={() => openMarketDetail(asset)} // 查看详情回调
                disabled={!connectedWallet} // 钱包未连接时禁用
              />
            ))}
          </div>
        </div>

        {/* 交易历史组件 */}
        <div className="mt-8">
          <TransactionHistory 
            transactions={transactions}
            connectedWallet={connectedWallet}
          />
        </div>
      </div>

      {/* 流动性供应模态框 - 条件渲染 */}
      {showLiquidityModal && selectedAsset && (
        <LiquidityProvider
          asset={selectedAsset}
          onSupply={handleSupplyAsset} // 供应操作回调
          onWithdraw={handleWithdrawAsset} // 提取操作回调
          onClose={() => setShowLiquidityModal(false)} // 关闭模态框回调
        />
      )}

      {/* 市场详情模态框 - 条件渲染 */}
      {showMarketDetail && selectedAsset && (
        <MarketDetail
          asset={selectedAsset}
          onClose={() => setShowMarketDetail(false)} // 关闭模态框回调
          onSupply={handleSupplyAsset} // 供应操作回调
          onBorrow={handleBorrowAsset} // 借贷操作回调
          onRepay={handleRepayAsset} // 还款操作回调
          onWithdraw={handleWithdrawAsset} // 提取操作回调
        />
      )}
    </div>
  );
}; 