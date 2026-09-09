import React from 'react';
import { RefreshCw, Calendar, Factory, AlertCircle, Coins } from 'lucide-react';
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
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-inner">
            <Factory className="w-6 h-6" />
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
            <select
              value={currency.code}
              onChange={(e) => {
                const found = CURRENCIES.find((c) => c.code === e.target.value);
                if (found) onCurrencyChange(found);
              }}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
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

