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

export const LiquidityProvider = ({
  asset,
  onSupply,
  onWithdraw,
  onClose,
}: LiquidityProviderProps) => {
  const [activeTab, setActiveTab] = useState<"supply" | "withdraw">("supply");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    setIsProcessing(true);
    try {
      if (activeTab === "supply") {
        await onSupply(asset, Number(amount));
      } else {
        await onWithdraw(asset, Number(amount));
      }
      setAmount("");
    } finally {
      setIsProcessing(false);
    }
  };

  const maxAmount = activeTab === "supply" ? asset.balance : asset.supplied;
  const isValidAmount =
    amount &&
    !isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) <= maxAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
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
            className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-6">
          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab("supply")}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                activeTab === "supply"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Supply
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                activeTab === "withdraw"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Asset Info */}
          <div className="mb-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {activeTab === "supply" ? "Wallet Balance" : "Supplied Balance"}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {maxAmount.toFixed(4)} {asset.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
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
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="absolute top-1/2 right-3 flex -translate-y-1/2 transform items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAmount(maxAmount.toString())}
                    className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
            <div className="mb-6 grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() =>
                    setAmount(((maxAmount * percentage) / 100).toString())
                  }
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  {percentage}%
                </button>
              ))}
            </div>

            {/* Transaction Summary */}
            {amount && isValidAmount && (
              <div className="mb-6 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                <h3 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                  Transaction Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      {activeTab === "supply" ? "Supplying" : "Withdrawing"}
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
                      +{((Number(amount) * asset.apy) / 100 / 365).toFixed(6)}{" "}
                      {asset.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      New Balance
                    </span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      {activeTab === "supply"
                        ? (asset.supplied + Number(amount)).toFixed(4)
                        : (asset.supplied - Number(amount)).toFixed(4)}{" "}
                      {asset.symbol}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValidAmount || isProcessing}
              className={`w-full rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
                !isValidAmount || isProcessing
                  ? "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  : activeTab === "supply"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600 hover:shadow-xl active:scale-95"
                    : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:from-orange-600 hover:to-red-600 hover:shadow-xl active:scale-95"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `${activeTab === "supply" ? "Supply" : "Withdraw"} ${asset.symbol}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
