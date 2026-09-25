import React, { useState } from 'react';
import { RefreshCw, Calendar, Factory, AlertCircle, Coins, Plus, Trash2, ChevronDown } from 'lucide-react';
import { CurrencyOption, CURRENCIES } from '../types';

interface HeaderProps {
  activeTab: string;
  onResetData: () => void;
  lowStockCount: number;
  currency: CurrencyOption;
  onCurrencyChange: (currency: CurrencyOption) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onResetData,
  lowStockCount,
  currency,
  onCurrencyChange,
}) => {
  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyOption[]>(CURRENCIES);

  const handleDeleteCurrency = () => {
    if (availableCurrencies.length <= 1) return;

    const remainingCurrencies = availableCurrencies.filter((item) => item.code !== currency.code);
    setAvailableCurrencies(remainingCurrencies);
    onCurrencyChange(remainingCurrencies[0]);
  };

  const handleAddCurrency = () => {
    const input = window.prompt('Add currency as: CODE, SYMBOL, NAME');
    if (!input) return;

    const [rawCode, rawSymbol, ...rawName] = input.split(',');
    const newCurrency: CurrencyOption = {
      code: rawCode?.trim().toUpperCase() || '',
      symbol: rawSymbol?.trim() || '',
      name: rawName.join(',').trim(),
    };

    if (!newCurrency.code || !newCurrency.symbol || !newCurrency.name) return;
    if (availableCurrencies.some((item) => item.code === newCurrency.code)) return;

    setAvailableCurrencies((current) => [...current, newCurrency]);
    onCurrencyChange(newCurrency);
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Overview & Factory KPIs';
      case 'lots':
        return 'Raw Material Lots & Fabric Designs (Front / Reverse Meters)';
      case 'wadding':
        return 'Quilt Wadding (Kg) & Production Estimator';
      case 'raw_materials':
        return 'Packaging & Accessory Stock (Stiffener, Bags, Cards)';
      case 'cutting':
        return 'Daily Cutting Management (Front & Reverse Meters)';
      case 'production':
        return 'Daily Production & Stitching Manufacturing';
      case 'products':
        return 'Product Catalog & Inventory Stock Management';
      case 'parties':
        return 'Parties & Customer Ledger Management';
      case 'billing':
        return 'Billing System, Print Bill Slips & PDF Invoices';
      case 'reports':
        return 'System Reports & Analytics (Daily, Weekly, Monthly, Yearly)';
      default:
        return 'Textile Manufacturing ERP';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-white/10 p-1 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            <img
              src="/images/logo.png"
              alt="Zartab Fatima Collection"
              className="h-full w-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <Factory className="w-5 h-5 text-indigo-400 hidden" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Zartab Fatima Collection
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{getTabTitle(activeTab)}</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/40 border border-indigo-500/40 text-indigo-200 rounded-lg text-xs font-medium">
            <Coins className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] text-indigo-300 font-semibold">Currency:</span>
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <select
                value={currency.code}
                onChange={(e) => {
                  const found = availableCurrencies.find((c) => c.code === e.target.value);
                  if (found) onCurrencyChange(found);
                }}
                className="w-full appearance-none bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-7"
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: 'none',
                }}
              >
                {availableCurrencies.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-indigo-300" />
            </div>
            <button
              type="button"
              onClick={handleAddCurrency}
              title="Add currency"
              aria-label="Add currency"
              className="p-1 text-indigo-300 hover:text-emerald-300 hover:bg-white/10 rounded transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrency}
              disabled={availableCurrencies.length <= 1}
              title="Delete selected currency"
              aria-label="Delete selected currency"
              className="p-1 text-indigo-300 hover:text-rose-300 hover:bg-white/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{lowStockCount} Low Stock Alert{lowStockCount > 1 ? 's' : ''}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentDate}</span>
          </div>

          <button
            onClick={onResetData}
            title="Reset ERP data to factory defaults"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};

