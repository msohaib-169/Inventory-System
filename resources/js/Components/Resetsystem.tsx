// @ts-nocheck
import React from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface ResetSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
}

export const ResetSystemModal: React.FC<ResetSystemModalProps> = ({
  isOpen,
  onClose,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onClearAll();
    onClose();
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

        <div className="p-4 rounded-xl border-2 border-red-600 bg-red-50/50 shadow-sm flex items-start space-x-3">
          <div className="p-2 rounded-lg mt-0.5 shrink-0 bg-red-600 text-white">
              <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-900">Clear All System Data</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Permanently removes all factory records and resets stock quantities to zero.
            </p>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Warning: This permanently deletes all existing stock, parties, and transaction records.</span>
        </div>

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
            onClick={handleConfirm}
            className="px-5 py-2 font-bold text-xs rounded-xl text-white transition shadow bg-red-600 hover:bg-red-700 cursor-pointer"
          >
            Yes, Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

