interface WalletConnectorProps {
  connectedWallet: string | null;
  onConnect: () => void;
}

export const WalletConnector = ({ connectedWallet, onConnect }: WalletConnectorProps) => {
  if (connectedWallet) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700 dark:text-green-400 font-medium">
            Connected
          </span>
        </div>
        <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg px-4 py-2 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {connectedWallet.slice(2, 4).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ICP Wallet
            </div>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span>Connect Wallet</span>
    </button>
  );
}; 