import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function MigratePage() {
  const { t, language } = useLanguage();
  // 跳转函数（假设用 window.location.hash 或其它路由方式）
  const goToEarn = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPage', 'earn');
      window.location.reload();
    }
  };
  const goToBorrow = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentPage', 'borrow');
      window.location.reload();
    }
  };
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 pt-24">
      <h1 className="text-4xl font-bold mb-4">
        {language === 'zh' ? '教程' : 'Guide'}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('This page explains the underlying logic and advantages of the Earn and Borrow features on our platform.')}
      </p>

      {/* Earn 机制介绍 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold">{t('Earn: How You Earn Yield')}</h2>
          <button
            className="px-4 py-1 min-w-[140px] rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition text-base"
            onClick={goToEarn}
          >
            {t('Go to Earn')}
          </button>
        </div>
        <ol className="space-y-6">
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-400/60 text-white font-bold text-lg">1</span>
            </div>
            <div>
              <div className="font-semibold text-base mb-1">{t('Deposit Assets')}</div>
              <div className="text-gray-700">{t("You supply supported assets (e.g., BTC, ETH) into the platform's vaults.")}</div>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-400/60 text-white font-bold text-lg">2</span>
            </div>
            <div>
              <div className="font-semibold text-base mb-1">{t('Assets are Matched to Borrowers')}</div>
              <div className="text-gray-700">{t('Your supplied assets are algorithmically matched to borrowers, maximizing utilization and yield.')}</div>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-400/60 text-white font-bold text-lg">3</span>
            </div>
            <div>
              <div className="font-semibold text-base mb-1">{t('Earn Interest')}</div>
              <div className="text-gray-700">{t('You earn interest paid by borrowers, with rates determined by market supply and demand.')}</div>
            </div>
          </li>
        </ol>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mt-4 text-blue-800">
          {t('Advantages')}:<br />
          {t('Non-custodial, assets always in your control.')}<br />
          {t('Competitive yields, optimized by smart matching.')}<br />
          {t('Transparent, on-chain operations.')}
        </div>
      </section>

      {/* Borrow 机制介绍 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold">{t('Borrow: How You Borrow Assets')}</h2>
          <button
            className="px-4 py-1 min-w-[140px] rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition text-base"
            onClick={goToBorrow}
          >
            {t('Go to Borrow')}
          </button>
        </div>
        <ol className="space-y-6">
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-400/60 text-white font-bold text-lg">1</span>
            </div>
            <div>
              <div className="font-semibold text-base mb-1">{t('Provide Collateral')}</div>
              <div className="text-gray-700">{t('Deposit supported assets as collateral (e.g., BTC, ETH).')}</div>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-400/60 text-white font-bold text-lg">2</span>
            </div>
            <div>
              <div className="font-semibold text-base mb-1">{t('Borrow Against Collateral')}</div>
              <div className="text-gray-700">{t('Borrow other assets up to a safe loan-to-value (LTV) ratio.')}</div>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-400/60 text-white font-bold text-lg">3</span>
            </div>
            <div>
              <div className="font-semibold text-base mb-1">{t('Repay and Withdraw')}</div>
              <div className="text-gray-700">{t('Repay your loan to unlock and withdraw your collateral.')}</div>
            </div>
          </li>
        </ol>
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded mt-4 text-purple-800">
          {t('Advantages')}:<br />
          {t('Flexible borrowing, multiple supported assets.')}<br />
          {t('Over-collateralized, reducing risk of bad debt.')}<br />
          {t('Transparent interest rates and liquidation rules.')}
        </div>
      </section>

      {/* FAQ区 */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-2">{t('FAQ')}</h2>
        <ul className="space-y-2">
          <li>
            <div className="font-medium text-blue-700">{t('Is my asset safe?')}</div>
            <div className="text-gray-600 text-sm">{t('All operations are non-custodial and on-chain. You always control your assets.')}</div>
          </li>
          <li>
            <div className="font-medium text-blue-700">{t('How is the interest rate determined?')}</div>
            <div className="text-gray-600 text-sm">{t('Interest rates are dynamically adjusted based on market supply and demand.')}</div>
          </li>
          <li>
            <div className="font-medium text-blue-700">{t('What happens if my collateral value drops?')}</div>
            <div className="text-gray-600 text-sm">{t('If your collateral value falls below the liquidation threshold, your position may be liquidated to protect the protocol.')}</div>
          </li>
        </ul>
      </section>
    </div>
  );
}