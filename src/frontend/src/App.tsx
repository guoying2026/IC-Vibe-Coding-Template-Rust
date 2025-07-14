// 主应用组件
// Main application component with multi-page navigation

import { useState, useEffect } from "react";
import { PageRoute, MarketPair, Vault } from "./types";
import { Header } from "./components/Layout/Header";
import { EarnPage } from "./views/EarnPage";
import { VaultDetailPage } from "./views/VaultDetailPage";
import { BorrowPage } from "./views/BorrowPage";
import { MarketDetailPage } from "./views/MarketDetailPage";
import { Loader, ErrorDisplay } from "./components";
import { LanguageProvider } from "./hooks/useLanguage";
import { ExplorePage } from "./views/ExplorePage";

// 主应用组件
function App() {
  // 当前页面路由状态
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentPage');
      if (stored === 'earn' || stored === 'borrow' || stored === 'explore' || stored === 'migrate' || stored === 'dashboard') {
        return stored as PageRoute;
      }
    }
    return 'earn';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage]);
  
  // 当前选中的市场，用于显示详情页
  const [selectedMarket, setSelectedMarket] = useState<MarketPair | null>(null);
  
  // 当前选中的金库，用于显示详情页
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

  // 钱包连接状态
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  
  // 错误状态
  const [error, setError] = useState<string | undefined>();

  // 处理错误显示
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // 清除错误
  const clearError = () => {
    setError(undefined);
  };

  // 处理钱包连接
  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      // 模拟钱包连接过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      // 生成模拟钱包地址
      const mockAddress = `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
      setWalletAddress(mockAddress);
    } catch (error) {
      handleError("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  // 处理钱包断开连接
  const handleDisconnectWallet = () => {
    setWalletAddress(null);
  };

  // 处理页面切换
  const handlePageChange = (page: PageRoute) => {
    setCurrentPage(page);
    setSelectedMarket(null); // 切换主页面时，清除选中的市场
    setSelectedVault(null); // 切换主页面时，清除选中的金库
    clearError(); // 切换页面时清除错误
  };
  
  // 处理选择市场，进入详情页
  const handleSelectMarket = (market: MarketPair) => {
    setSelectedMarket(market);
  };

  // 从市场详情页返回市场列表
  const handleBackToMarkets = () => {
    setSelectedMarket(null);
  };
  
  // 处理选择金库，进入详情页
  const handleSelectVault = (vault: Vault) => {
    setSelectedVault(vault);
  };

  // 从金库详情页返回金库列表
  const handleBackToVaults = () => {
    setSelectedVault(null);
  };

  // 渲染当前页面内容
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'earn':
        // 如果有选中的金库，则显示详情页，否则显示金库列表页
        return selectedVault ? (
          <VaultDetailPage vault={selectedVault} onBack={handleBackToVaults} />
        ) : (
          <EarnPage 
            walletAddress={walletAddress}
            onError={handleError}
            setLoading={setLoading}
            onSelectVault={handleSelectVault}
          />
        );
      case 'borrow':
        // 如果有选中的市场，则显示详情页，否则显示市场列表页
        return selectedMarket ? (
          <MarketDetailPage market={selectedMarket} onBack={handleBackToMarkets} />
        ) : (
          <BorrowPage 
            walletAddress={walletAddress}
            onSelectMarket={handleSelectMarket}
          />
        );
      case 'explore':
        return <ExplorePage />;
      case 'migrate':
        return (
          // 迁移页面占位符
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                  Migrate Positions
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                  Coming Soon - Move your positions to better protocols
                </p>
                <div className="text-6xl mb-4">🔄</div>
                <p className="text-gray-500 dark:text-gray-400">
                  This page is under development
                </p>
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          // 仪表板页面占位符
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent mb-4">
                  Your Portfolio Dashboard
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                  Coming Soon - Manage your Bitcoin DeFi positions
                </p>
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500 dark:text-gray-400">
                  This page is under development
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <EarnPage 
            walletAddress={walletAddress}
            onError={handleError}
            setLoading={setLoading}
            onSelectVault={handleSelectVault}
          />
        );
    }
  };

  return (
    // 主应用容器
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* 顶部导航栏 */}
      <Header 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      {/* 主要内容区域 */}
      <main>
        {renderCurrentPage()}
      </main>

      {/* 全局加载遮罩 */}
      {loading && !error && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <Loader />
            <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
              Processing...
            </p>
          </div>
        </div>
      )}

      {/* 全局错误显示 */}
      {error && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-md w-full">
            <ErrorDisplay message={error} />
            <button
              onClick={clearError}
              className="w-full mt-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppWithLanguageProvider() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
