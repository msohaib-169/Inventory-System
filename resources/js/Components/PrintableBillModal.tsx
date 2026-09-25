// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Invoice, CurrencyOption } from '../types';
import { Printer, Download, X, CheckCircle, Zap, Pencil } from 'lucide-react';
import { COMPANY_INFO, PDFGenerator } from '../lib/pdfGenerator';

interface PrintableBillModalProps {
  invoice: Invoice;
  currency: CurrencyOption;
  onClose: () => void;
  onEdit?: () => void;
}

export const PrintableBillModal: React.FC<PrintableBillModalProps> = ({
  invoice,
  currency,
  onClose,
  onEdit,
}) => {
  const currSymbol = invoice.currencySymbol || currency.symbol || 'Rs.';
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  // Automatically trigger print dialog when modal opens if auto-print is enabled
  useEffect(() => {
    if (autoPrintEnabled) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto cursor-pointer"
    >
      <div
        id="printable-bill-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-4 sm:p-6 space-y-5 my-4 sm:my-8 cursor-default"
      >
        {/* Modal Controls Bar (Hidden during printing) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">Printable Invoice Bill Slip</h3>
                <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-200">
                  {invoice.invoiceNumber}
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span>Auto-Print Active</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{COMPANY_INFO.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>

            <button
              onClick={() => PDFGenerator.generateInvoicePDF(invoice)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            {onEdit && (
              <button
                onClick={onEdit}
                title="Edit Invoice"
                className="p-2 text-indigo-600 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BILL SLIP CONTENT */}
        <div
          id="printable-bill"
          className="bg-white p-4 sm:p-6 rounded-xl border border-slate-800 text-slate-900 font-sans space-y-4 sm:space-y-5"
        >
          {/* Slip Header Banner */}
          <div className="border-b-2 border-slate-900 pb-3 text-center relative">
            <div className="bg-slate-900 text-white py-2.5 px-4 rounded-t-lg -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase">{COMPANY_INFO.name}</h1>
              <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Textile & Quilt Manufacturing Industries</p>
            </div>

            <p className="text-xs font-semibold text-slate-700">
              {COMPANY_INFO.address}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Ph: {COMPANY_INFO.phone}
            </p>
          </div>

          {/* Invoice Date & Party Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold border-b border-slate-300 pb-3">
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Party Name:</span>
                <span className="font-extrabold text-sm text-slate-900 underline">{invoice.partyName}</span>
              </div>
              <p className="text-slate-600 text-[11px]">{invoice.partyAddress}</p>
              <p className="text-slate-600 text-[11px]">Ph: {invoice.partyPhone}</p>
            </div>

            <div className="sm:text-right space-y-1 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
              <div className="flex sm:justify-end items-baseline space-x-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Bill No:</span>
                <span className="font-mono font-bold text-sm text-indigo-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex sm:justify-end items-baseline space-x-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Date:</span>
                <span className="font-bold text-slate-800">{invoice.date}</span>
              </div>
              <div className="flex sm:justify-end items-baseline space-x-2">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Status:</span>
                <span className="font-extrabold uppercase text-[11px]">{invoice.status}</span>
              </div>
            </div>
          </div>

          {/* Bill Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-900 text-xs min-w-[480px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 uppercase font-black text-[11px] border-b border-slate-900">
                  <th className="py-2 px-2.5 border-r border-slate-900 w-10 text-center">S.No</th>
                  <th className="py-2 px-2.5 border-r border-slate-900">Particulars / Description</th>
                  <th className="py-2 px-2.5 border-r border-slate-900 w-14 text-center">Qty</th>
                  <th className="py-2 px-2.5 border-r border-slate-900 w-24 text-right">Rate</th>
                  <th className="py-2 px-2.5 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-400">
                    <td className="py-2 px-2.5 border-r border-slate-800 text-center font-bold text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-800">
                      <span className="font-bold text-slate-900 block">{item.productName}</span>
                      {item.designNumber && (
                        <span className="text-[10px] text-slate-600 font-medium block">Design #: {item.designNumber}</span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-800 text-center font-black text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-800 text-right font-semibold text-slate-800">
                      {currSymbol} {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2.5 text-right font-extrabold text-slate-900">
                      {currSymbol} {item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Grand Total Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div className="text-[11px] text-slate-600 space-y-1 w-full sm:w-auto">
              <p className="font-bold text-slate-800 uppercase tracking-wide">Terms & Remarks:</p>
              <p>• Goods once sold will not be returned without bill receipt.</p>
              {invoice.notes && <p className="italic text-slate-500">• {invoice.notes}</p>}
            </div>

            <div className="w-full sm:w-64 border-2 border-slate-900 rounded-lg p-3 space-y-1.5 text-xs bg-slate-50">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span className="font-semibold">{currSymbol} {invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Discount:</span>
                  <span className="font-semibold">-{currSymbol} {invoice.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Tax ({invoice.taxRatePercent}%):</span>
                  <span className="font-semibold">+{currSymbol} {invoice.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black pt-2 border-t-2 border-slate-900 text-slate-900">
                <span>Grand Total:</span>
                <span className="text-base text-indigo-900">{currSymbol} {invoice.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}/-</span>
              </div>

              <div className="flex justify-between text-slate-700 text-[11px] pt-1">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700">{currSymbol} {invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-slate-800 text-[11px] font-bold">
                <span>Balance Due:</span>
                <span className="text-amber-800">{currSymbol} {invoice.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Signature Block */}
          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-3 text-xs">
            <div className="text-slate-400 text-[10px] text-center sm:text-left">
              {COMPANY_INFO.name}
            </div>
            <div className="text-center w-48 border-t border-slate-800 pt-1">
              <span className="font-bold text-slate-800">Authorized Signature</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

