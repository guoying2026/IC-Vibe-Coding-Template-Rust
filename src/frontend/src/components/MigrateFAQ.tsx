import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function MigrateFAQ() {
  const { t } = useLanguage();
  const faqs = [
    {
      q: t('What assets can I migrate?'),
      a: t('You can migrate supported tokens such as ETH, USDC, BTC, and more.'),
    },
    {
      q: t('Is migration safe?'),
      a: t('Yes, migration is non-custodial and uses secure smart contracts.'),
    },
    {
      q: t('What if I have no assets to migrate?'),
      a: t('You can switch wallets or deposit assets first.'),
    },
  ];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold mb-2">{t('FAQ')}</h3>
      <ul>
        {faqs.map((item, idx) => (
          <li key={idx} className="mb-2">
            <button
              className="w-full text-left font-medium text-blue-600 hover:underline"
              onClick={() => setOpen(open === idx ? null : idx)}
            >
              {item.q}
            </button>
            {open === idx && (
              <div className="text-gray-600 text-sm mt-1">{item.a}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}