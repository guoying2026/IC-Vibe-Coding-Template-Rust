// ckBTC余额显示组件
// ckBTC balance display component

import { useState, useEffect } from "react";
import {
  internetIdentityService,
} from "../services/InternetIdentityService";

interface CkbtcBalanceManagerProps {
  currentBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
}

export const CkbtcBalanceManager = ({
  currentBalance,
  onBalanceUpdate,
}: CkbtcBalanceManagerProps) => {
  // 定时刷新ckBTC余额
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latest = await internetIdentityService.getCkbtcBalance();
        if (typeof latest === "number" && latest !== currentBalance) {
          onBalanceUpdate(latest);
        }
      } catch (e) {}
    }, 30000);
    return () => clearInterval(interval);
  }, [currentBalance, onBalanceUpdate]);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      {/* 当前余额显示 */}
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <div className="text-sm text-blue-600 dark:text-blue-400">当前 ckBTC 余额</div>
        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          {currentBalance.toFixed(8)} ckBTC
        </div>
      </div>
    </div>
  );
};
