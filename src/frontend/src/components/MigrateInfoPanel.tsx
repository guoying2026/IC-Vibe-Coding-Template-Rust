import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function MigrateInfoPanel() {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="font-semibold mb-2">{t('Migration Benefits')}</h3>
      <ul className="space-y-2 text-gray-600 text-sm">
        <li>📈 {t('Better yields with curated strategies')}</li>
        <li>🔒 {t('Non-custodial, secure migration')}</li>
        <li>⚡ {t('Fast and easy process')}</li>
        <li>🌐 {t('Support for multiple assets')}</li>
      </ul>
    </div>
  );
}