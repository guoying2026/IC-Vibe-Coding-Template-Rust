import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

const migrateAssets = [
  { id: '1', name: 'ETH', amount: 2.5, icon: '🪙' },
  { id: '2', name: 'USDC', amount: 1200, icon: '💵' },
  { id: '3', name: 'BTC', amount: 0.15, icon: '🟠' },
];

export default function MigrateStepper() {
  const { t } = useLanguage();
  const steps = [
    t('Step 1: Select Assets'),
    t('Step 2: Confirm Migration'),
    t('Step 3: Migration Result'),
  ];
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [migrated, setMigrated] = useState(false);

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMigrate = () => {
    setMigrated(true);
    setStep(2);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* 步骤条 */}
      <div className="flex items-center mb-6">
        {steps.map((label, idx) => (
          <React.Fragment key={label}>
            <div className={`flex items-center ${idx < step ? 'text-blue-500' : idx === step ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${idx <= step ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100'}`}>
                {idx + 1}
              </div>
              <span className="ml-2 text-sm">{label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-gray-200" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 步骤内容 */}
      {step === 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('Select Assets')}</h2>
          {migrateAssets.length === 0 ? (
            <div className="text-gray-400">{t('No assets to migrate')}</div>
          ) : (
            <ul>
              {migrateAssets.map((asset) => (
                <li
                  key={asset.id}
                  className={`flex items-center justify-between p-3 rounded-lg mb-2 border cursor-pointer transition ${
                    selected.includes(asset.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(asset.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{asset.icon}</span>
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  <span className="text-gray-500">{asset.amount}</span>
                  <input
                    type="checkbox"
                    checked={selected.includes(asset.id)}
                    readOnly
                    className="accent-blue-500"
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end mt-6">
            <button
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition"
              disabled={selected.length === 0}
              onClick={() => setStep(1)}
            >
              {t('Continue')}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('Confirm Migration')}</h2>
          <ul>
            {migrateAssets
              .filter((a) => selected.includes(a.id))
              .map((asset) => (
                <li key={asset.id} className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{asset.icon}</span>
                  <span>{asset.name}</span>
                  <span className="text-gray-500">{asset.amount}</span>
                </li>
              ))}
          </ul>
          <div className="flex justify-between mt-6">
            <button className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200 transition" onClick={() => setStep(0)}>
              {t('Back')}
            </button>
            <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition" onClick={handleMigrate}>
              {t('Start Migration')}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="text-center">
          {migrated ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-semibold mb-2">{t('Migration Complete!')}</h2>
              <p className="text-gray-500 mb-4">{t('Your assets have been migrated successfully.')}</p>
              <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:from-blue-600 hover:to-purple-600 transition" onClick={() => setStep(0)}>
                {t('Done')}
              </button>
            </>
          ) : (
            <div className="text-gray-400">{t('No migration performed.')}</div>
          )}
        </div>
      )}
    </div>
  );
}