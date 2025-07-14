import { useState } from "react";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  apy: number;
  tvl: number;
  supplied: number;
  borrowed: number;
  icon: string;
  collateralFactor: number;
  liquidationThreshold: number;
  borrowRate: number;
  utilization: number;
}

interface LiquidityProviderProps {
  asset: Asset;
  onSupply: (asset: Asset, amount: number) => void;
  onWithdraw: (asset: Asset, amount: number) => void;
  onClose: () => void;
}

export const LiquidityProvider = ({ asset, onSupply, onWithdraw, onClose }: LiquidityProviderProps) => {
  const [activeTab, setActiveTab] = useState<'supply' | 'withdraw'>('supply');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setIsProcessing(true);
    try {
      if (activeTab === 'supply') {
        await onSupply(asset, Number(amount));
      } else {
        await onWithdraw(asset, Number(amount));
      }
      setAmount('');
    } finally {
      setIsProcessing(false);
    }
  };

  const maxAmount = activeTab === 'supply' ? asset.balance : asset.supplied;
  const isValidAmount = amount && !isNaN(Number(amount)) && Number(amount) > 0 && Number(amount) <= maxAmount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{asset.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {asset.symbol}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {asset.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('supply')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'supply'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Supply
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'withdraw'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Asset Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {activeTab === 'supply' ? 'Wallet Balance' : 'Supplied Balance'}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {maxAmount.toFixed(4)} {asset.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                APY
              </span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {asset.apy.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={maxAmount}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAmount(maxAmount.toString())}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    MAX
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {asset.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => setAmount((maxAmount * percentage / 100).toString())}
                  className="py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {percentage}%
                </button>
              ))}
            </div>

            {/* Transaction Summary */}
            {amount && isValidAmount && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Transaction Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      {activeTab === 'supply' ? 'Supplying' : 'Withdrawing'}
                    </span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      {Number(amount).toFixed(4)} {asset.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      Daily Earnings
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      +{(Number(amount) * asset.apy / 100 / 365).toFixed(6)} {asset.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      New Balance
                    </span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      {activeTab === 'supply' 
                        ? (asset.supplied + Number(amount)).toFixed(4)
                        : (asset.supplied - Number(amount)).toFixed(4)
                      } {asset.symbol}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValidAmount || isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                !isValidAmount || isProcessing
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : activeTab === 'supply'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 active:scale-95 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 active:scale-95 shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `${activeTab === 'supply' ? 'Supply' : 'Withdraw'} ${asset.symbol}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}; 