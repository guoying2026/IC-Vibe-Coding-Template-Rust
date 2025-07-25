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
import MigratePage from "./views/MigratePage";
import DashboardPage from "./views/DashboardPage";
import {
  internetIdentityService,
  AuthState,
} from "./services/InternetIdentityService"; // 导入II服务

// 主应用组件
function App() {
  // 当前页面路由状态
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentPage");
      if (
        stored === "earn" ||
        stored === "borrow" ||
        stored === "explore" ||
        stored === "migrate" ||
        stored === "dashboard"
      ) {
        return stored as PageRoute;
      }
    }
    return "dashboard";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentPage", currentPage);
    }
  }, [currentPage]);

  // 当前选中的市场，用于显示详情页
  const [selectedMarket, setSelectedMarket] = useState<MarketPair | null>(null);

  // 当前选中的金库，用于显示详情页
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);

  // Internet Identity认证状态
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    principal: null,
    userInfo: null,
  });

  // 加载状态
  const [loading, setLoading] = useState(false);

  // 错误状态
  const [error, setError] = useState<string | undefined>();

  // 初始化Internet Identity服务
  useEffect(() => {
    const initializeII = async () => {
      try {
        setLoading(true);
        await internetIdentityService.initialize();
        const state = internetIdentityService.getAuthState();
        setAuthState(state);
      } catch (error) {
        console.error("初始化Internet Identity失败:", error);
        setError("初始化认证服务失败");
      } finally {
        setLoading(false);
      }
    };

    initializeII();

    // 监听II登录成功事件
    const handleIILogin = async () => {
      const state = internetIdentityService.getAuthState();
      setAuthState(state);
    };
    window.addEventListener('ii-login-success', handleIILogin);
    return () => {
      window.removeEventListener('ii-login-success', handleIILogin);
    };
  }, []);

  // 处理错误显示
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // 清除错误
  const clearError = () => {
    setError(undefined);
  };

  // 处理Internet Identity登录
  const handleConnectWallet = async () => {
    setLoading(true);
    setError(undefined); // 清除之前的错误
    
    try {
      console.log("开始连接Internet Identity...");
      
      // 调用登录方法
      await internetIdentityService.login();
      
      // 获取认证状态
      const state = internetIdentityService.getAuthState();
      console.log("登录成功，认证状态:", state);
      
      // 更新前端状态
      setAuthState(state);
      
      console.log("Internet Identity连接成功");
    } catch (error) {
      console.error("Internet Identity连接失败:", error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = "Internet Identity登录失败";
      if (error instanceof Error) {
        if (error.message.includes("无法连接到后端服务")) {
          errorMessage = "无法连接到后端服务，请确保dfx正在运行";
        } else if (error.message.includes("用户取消")) {
          errorMessage = "用户取消了登录操作";
        } else {
          errorMessage = error.message;
        }
      }
      
      handleError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理Internet Identity登出
  const handleDisconnectWallet = async () => {
    try {
      await internetIdentityService.logout();
      setAuthState({
        isAuthenticated: false,
        principal: null,
        userInfo: null,
      });
    } catch (error) {
      handleError("登出失败");
    }
  };

  // 处理用户信息更新
  const handleUserInfoUpdate = (updatedUserInfo: any) => {
    setAuthState(prevState => ({
      ...prevState,
      userInfo: updatedUserInfo,
    }));
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

  // 格式化Principal显示
  const formatPrincipal = (principal: any) => {
    if (!principal) return "";
    const principalText = principal.toText();
    return `${principalText.slice(0, 6)}...${principalText.slice(-4)}`;
  };

  // 渲染当前页面内容
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "earn":
        // 如果有选中的金库，则显示详情页，否则显示金库列表页
        return selectedVault ? (
          <VaultDetailPage vault={selectedVault} onBack={handleBackToVaults} isAuthenticated={authState.isAuthenticated} />
        ) : (
          <EarnPage 
            walletAddress={authState.principal ? formatPrincipal(authState.principal) : null}
            userInfo={authState.userInfo}
            isAuthenticated={authState.isAuthenticated}
            principal={authState.principal}
            onError={handleError}
            setLoading={setLoading}
            onSelectVault={handleSelectVault}
            onUserInfoUpdate={handleUserInfoUpdate}
          />
        );
      case "borrow":
        // 如果有选中的市场，则显示详情页，否则显示市场列表页
        return selectedMarket ? (
          <MarketDetailPage
            market={selectedMarket}
            onBack={handleBackToMarkets}
            isAuthenticated={authState.isAuthenticated}
          />
        ) : (
          <BorrowPage
            walletAddress={
              authState.principal ? formatPrincipal(authState.principal) : null
            }
            onSelectMarket={handleSelectMarket}
          />
        );
      case "explore":
        return <ExplorePage />;
      case "migrate":
        return <MigratePage />;
      case "dashboard":
        return <DashboardPage 
          userInfo={authState.userInfo}
          isAuthenticated={authState.isAuthenticated}
          principal={authState.principal}
          onUserInfoUpdate={handleUserInfoUpdate}
        />;
      default:
        return <DashboardPage 
          userInfo={authState.userInfo}
          isAuthenticated={authState.isAuthenticated}
          principal={authState.principal}
          onUserInfoUpdate={handleUserInfoUpdate}
        />;
    }
  };

  return (
    // 主应用容器
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <Header
        currentPage={currentPage}
        onPageChange={handlePageChange}
        walletAddress={
          authState.principal ? formatPrincipal(authState.principal) : null
        }
        userInfo={authState.userInfo}
        isAuthenticated={authState.isAuthenticated}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      {/* 主要内容区域 */}
      <main>{renderCurrentPage()}</main>

      {/* 全局加载遮罩 */}
      {loading && !error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      {/* 全局错误显示 */}
      {/* {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <ErrorDisplay message={error} />
            <button
              onClick={clearError}
              className="mt-4 w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )} */}
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
