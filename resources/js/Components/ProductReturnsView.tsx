import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, RotateCcw } from 'lucide-react';
import { CurrencyOption, Invoice, ProductReturn } from '../types';

interface ProductReturnsViewProps {
  invoices: Invoice[];
  returns: ProductReturn[];
  currency: CurrencyOption;
  onCreateReturn: (data: { invoiceItemId: string; quantity: number; date: string; notes?: string }) => Promise<void>;
}

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const ProductReturnsView: React.FC<ProductReturnsViewProps> = ({ invoices, returns, currency, onCreateReturn }) => {
  const [invoiceItemId, setInvoiceItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const soldItems = useMemo(() => invoices.flatMap((invoice) => invoice.items
    .filter((item) => item.productId && item.itemType !== 'loose_fabric' && item.itemType !== 'fabric_sample_loss')
    .map((item) => ({ invoice, item }))), [invoices]);

  const selectedLine = soldItems.find(({ item }) => item.id === invoiceItemId);
  const alreadyReturned = selectedLine
    ? returns.filter((record) => record.invoiceItemId === selectedLine.item.id).reduce((sum, record) => sum + record.quantity, 0)
    : 0;
  const remaining = selectedLine ? Math.max(0, selectedLine.item.quantity - alreadyReturned) : 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(quantity);
    if (!selectedLine || amount <= 0 || amount > remaining) {
      setError(`Enter a quantity greater than zero and no more than ${remaining} ${selectedLine?.item.productName || 'units'}.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onCreateReturn({ invoiceItemId, quantity: amount, date, notes: notes.trim() || undefined });
      setInvoiceItemId('');
      setQuantity('1');
      setDate(today());
      setNotes('');
    } catch (caught) {
      const responseMessage = (caught as any)?.response?.data?.message;
      const validationMessage = (caught as any)?.response?.data?.errors;
      setError(validationMessage ? Object.values(validationMessage).flat().join(' ') : responseMessage || 'Could not save this return. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
          <RotateCcw className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Product Returns</h1>
          <p className="text-xs text-slate-500">Record returned items from an invoice and restore finished stock.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 border-y border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold text-slate-700 md:col-span-2">
            Sold invoice item
            <select
              required
              value={invoiceItemId}
              onChange={(event) => { setInvoiceItemId(event.target.value); setQuantity('1'); setError(''); }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            >
              <option value="">Choose invoice and product</option>
              {soldItems.map(({ invoice, item }) => {
                const returned = returns.filter((record) => record.invoiceItemId === item.id).reduce((sum, record) => sum + record.quantity, 0);
                const available = Math.max(0, item.quantity - returned);
                return (
                  <option key={item.id} value={item.id} disabled={available <= 0}>
                    {invoice.invoiceNumber} · {invoice.partyName} · {item.productName} ({item.designNumber || 'No design'}) · {available} returnable
                  </option>
                );
              })}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-700">
            Returned quantity {selectedLine && <span className="font-normal text-slate-500">({remaining} available)</span>}
            <input
              required
              type="number"
              min="0.01"
              max={remaining || undefined}
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-700">
            Returned from party
            <input
              readOnly
              value={selectedLine?.invoice.partyName || ''}
              placeholder="Select a sold invoice item"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-normal text-slate-700"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-700">
            Return date
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </label>
          <label className="space-y-1.5 text-xs font-semibold text-slate-700 md:col-span-2">
            Notes
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              placeholder="Optional condition or return details"
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </label>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Stock increases after the return is saved.</p>
          <button
            type="submit"
            disabled={saving || !selectedLine || remaining <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Saving return...' : 'Record return'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Return history</h2>
            <p className="mt-1 text-xs text-slate-500">{returns.length} recorded returns</p>
          </div>
        </div>
        <div className="overflow-x-auto border-y border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Invoice</th>
                <th className="px-4 py-3 font-bold">Returned from party</th>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 text-right font-bold">Quantity</th>
                <th className="px-4 py-3 font-bold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map((record) => (
                <tr key={record.id} className="text-slate-700">
                  <td className="whitespace-nowrap px-4 py-3">{record.date}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{record.invoiceNumber}</td>
                  <td className="px-4 py-3">{record.partyName || '—'}</td>
                  <td className="px-4 py-3"><span className="font-semibold text-slate-900">{record.productName}</span><span className="block text-slate-500">{record.designNumber || 'No design'}</span></td>
                  <td className="px-4 py-3 text-right font-semibold">{record.quantity}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-500" title={record.notes || ''}>{record.notes || '—'}</td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No product returns recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-right text-[11px] text-slate-500">Currency: {currency.code} ({currency.symbol})</p>
      </section>
    </div>
  );
};