// @ts-nocheck
import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, X, Check, ShieldAlert } from 'lucide-react';

interface ResetSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onRestoreDefaults: () => void;
}

export const ResetSystemModal: React.FC<ResetSystemModalProps> = ({
  isOpen,
  onClose,
  onClearAll,
  onRestoreDefaults,
}) => {
  const [selectedAction, setSelectedAction] = useState<'clear' | 'restore' | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedAction === 'clear') {
      onClearAll();
      onClose();
    } else if (selectedAction === 'restore') {
      onRestoreDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">System Reset & Data Management</h3>
            <p className="text-xs text-slate-500">
              Choose how you want to reset your Textile Factory ERP data
            </p>
          </div>
        </div>

        {/* Action Selection Cards */}
        <div className="space-y-3">
          {/* Option 1: Clear All Data */}
          <div
            onClick={() => setSelectedAction('clear')}
            className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start space-x-3 ${
              selectedAction === 'clear'
                ? 'border-red-600 bg-red-50/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
              selectedAction === 'clear' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600'
            }`}>
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">1. Clear All System Data (Empty Fresh Start)</h4>
                {selectedAction === 'clear' && <Check className="w-4 h-4 text-red-600 font-extrabold" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Wipes all Fabric Lots, Wadding Stock, Packaging Accessories, Cutting Logs, Production Stitches, Finished Products, Customer Parties, and Invoices. Sets all stock meters & Kg to 0.
              </p>
            </div>
          </div>

          {/* Option 2: Restore Sample Demo Data */}
          <div
            onClick={() => setSelectedAction('restore')}
            className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start space-x-3 ${
              selectedAction === 'restore'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
              selectedAction === 'restore' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'
            }`}>
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">2. Restore Sample Demonstration Data</h4>
                {selectedAction === 'restore' && <Check className="w-4 h-4 text-indigo-600 font-extrabold" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Reloads sample factory dataset (Sunrise Textile Mills, 200 GSM Siliconized Fiber, Sample Customer Ledgers, and Invoices) for testing and demonstration.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        {selectedAction && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {selectedAction === 'clear'
                ? 'Warning: Clearing all system data will delete all existing stock, parties, and transaction records permanently.'
                : 'Notice: Restoring sample demo data will overwrite any current records with default demonstration data.'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedAction}
            onClick={handleConfirm}
            className={`px-5 py-2 font-bold text-xs rounded-xl text-white transition shadow disabled:opacity-40 cursor-pointer ${
              selectedAction === 'clear' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {selectedAction === 'clear'
              ? 'Yes, Clear All Data'
              : selectedAction === 'restore'
              ? 'Yes, Restore Sample Data'
              : 'Select an Option'}
          </button>
        </div>
      </div>
    </div>
  );
};

