// @ts-nocheck
import React, { useState } from 'react';
import { Party, PaymentTransaction, Invoice, CurrencyOption, FabricLossRecord } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Users, Plus, DollarSign, Phone, MapPin, Edit2, Trash2, FileText, CheckCircle2, Search, Filter, X, Scissors, Zap } from 'lucide-react';

interface PartiesLedgerViewProps {
  parties: Party[];
  payments: PaymentTransaction[];
  invoices: Invoice[];
  currency: CurrencyOption;
  onSavePartiesData: (
    updatedParties: Party[],
    updatedPayments: PaymentTransaction[],
    updatedInvoices?: Invoice[]
  ) => void;
  fabricLosses?: FabricLossRecord[];
  onNavigateTab?: (tab: string) => void;
}

export const PartiesLedgerView: React.FC<PartiesLedgerViewProps> = ({
  parties,
  payments,
  invoices,
  currency,
  onSavePartiesData,
  fabricLosses = [],
  onNavigateTab,
}) => {
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<Party | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [duesFilter, setDuesFilter] = useState<'all' | 'has_dues' | 'clear'>('all');

  const currSym = currency.symbol;

  // Party Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [partyType, setPartyType] = useState<string>('Wholesaler');

  // Payment Form State
  const [paymentPartyId, setPaymentPartyId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(500);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI/Online'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const totalAllDues = parties.reduce((s, p) => s + p.currentDues, 0);
  const totalAllPaid = parties.reduce((s, p) => s + p.totalPaid, 0);

  // Filtering Parties
  const filteredParties = parties.filter((party) => {
    // 1. Party Type Filter
    if (typeFilter !== 'all' && party.partyType !== typeFilter) {
      return false;
    }
    // 2. Dues Filter
    if (duesFilter === 'has_dues' && party.currentDues <= 0) return false;
    if (duesFilter === 'clear' && party.currentDues > 0) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = party.name.toLowerCase().includes(q);
      const matchCompany = party.companyName.toLowerCase().includes(q);
      const matchPhone = (party.phone || '').toLowerCase().includes(q);
      const matchCity = (party.city || '').toLowerCase().includes(q);
      const matchType = party.partyType.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchPhone && !matchCity && !matchType) {
        return false;
      }
    }
    return true;
  });

  const handleOpenAddParty = () => {
    setEditingPartyId(null);
    setName('');
    setCompanyName('');
    setPhone('+92 ');
    setAddress('');
    setCity('Faisalabad');
    setPartyType('Wholesaler');
    setIsPartyModalOpen(true);
  };

  const handleOpenEditParty = (party: Party) => {
    setEditingPartyId(party.id);
    setName(party.name);
    setCompanyName(party.companyName);
    setPhone(party.phone);
    setAddress(party.address);
    setCity(party.city);
    setPartyType(party.partyType);
    setIsPartyModalOpen(true);
  };

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPartyId) {
      const updated = parties.map((p) =>
        p.id === editingPartyId ? { ...p, name, companyName, phone, address, city, partyType } : p
      );
      onSavePartiesData(updated, payments);
    } else {
      const newParty: Party = {
        id: `party-${Date.now()}`,
        name,
        companyName: companyName || name,
        phone,
        address,
        city,
        partyType,
        totalInvoiced: 0,
        totalPaid: 0,
        currentDues: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onSavePartiesData([newParty, ...parties], payments);
    }

    setIsPartyModalOpen(false);
  };

  const handleOpenPaymentModal = (partyId?: string) => {
    setPaymentPartyId(partyId || parties[0]?.id || '');
    setPaymentAmount(500);
    setPaymentMethod('Bank Transfer');
    setPaymentRef(`REC-${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const party = parties.find((p) => p.id === paymentPartyId);
    const payVal = Number(paymentAmount);
    if (!party || !payVal || payVal <= 0) return;

    // Update Party Balance
    const updatedParties = parties.map((p) => {
      if (p.id !== party.id) return p;
      const newPaid = p.totalPaid + payVal;
      const newDues = Math.max(0, p.currentDues - payVal);
      return { ...p, totalPaid: newPaid, currentDues: newDues };
    });

    // Create Payment Record
    const newPayment: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      partyId: party.id,
      partyName: party.name,
      date: new Date().toISOString().split('T')[0],
      amount: payVal,
      paymentMethod,
      referenceNo: paymentRef,
      notes: paymentNotes,
    };

    // Deduct invoice balances FIFO
    let remainingPay = payVal;
    const updatedInvoices = invoices.map((inv) => {
      if (inv.partyId !== party.id || (inv.balanceDue || 0) <= 0 || remainingPay <= 0) {
        return inv;
      }
      const payToInv = Math.min(inv.balanceDue, remainingPay);
      remainingPay -= payToInv;
      const newPaid = (inv.amountPaid || 0) + payToInv;
      const newBal = Math.max(0, inv.grandTotal - newPaid);
      const newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = newBal === 0 ? 'Paid' : 'Partially Paid';
      return {
        ...inv,
        amountPaid: newPaid,
        balanceDue: newBal,
        status: newStatus,
      };
    });

    onSavePartiesData(updatedParties, [newPayment, ...payments], updatedInvoices);
    setIsPaymentModalOpen(false);
  };

  const handleDeleteParty = (partyId: string) => {
    const target = parties.find((p) => p.id === partyId);
    if (target) {
      setPartyToDelete(target);
    }
  };

  const handleConfirmDeleteParty = () => {
    if (partyToDelete) {
      onSavePartiesData(
        parties.filter((p) => p.id !== partyToDelete.id),
        payments.filter((p) => p.partyId !== partyToDelete.id)
      );
      setPartyToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Financial Stat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-900 text-white p-5 rounded-2xl shadow-sm border border-amber-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Total Customer Outstanding Dues</span>
            <DollarSign className="w-5 h-5 text-amber-300" />
          </div>
          <h2 className="text-2xl font-black">{currSym} {totalAllDues.toLocaleString()}</h2>
          <p className="text-xs text-amber-200/80 mt-1">Pending receivable customer balances</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Payments Collected</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{currSym} {totalAllPaid.toLocaleString()}</h2>
          <p className="text-xs text-slate-500 mt-1">Received in cash / bank accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Registered Parties</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{parties.length} <span className="text-sm font-medium text-slate-500">Parties</span></h2>
          <p className="text-xs text-slate-500 mt-1">Wholesalers, dealers & retailers</p>
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Parties & Customer Directory</h2>
            <p className="text-xs text-slate-500">Manage clients, outstanding dues, payment receipts, and customer ledger histories</p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleOpenPaymentModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition shadow cursor-pointer"
            >
              <span>Receive Party Payment</span>
            </button>

            <button
              onClick={handleOpenAddParty}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Party</span>
            </button>
          </div>
        </div>

        {/* Live Search and Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-slate-100 pt-3">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search party by client name, company, phone number, city, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type & Dues Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Party Types ({parties.length})</option>
              <option value="Wholesaler">Wholesalers</option>
              <option value="Dealer">Dealers</option>
              <option value="Retailer">Retailers</option>
              <option value="Customer">General Customers</option>
            </select>

            <select
              value={duesFilter}
              onChange={(e) => setDuesFilter(e.target.value as 'all' | 'has_dues' | 'clear')}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Balance Statuses</option>
              <option value="has_dues">⚠️ Has Pending Dues</option>
              <option value="clear">✅ Zero Balance / Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Party Cards Grid */}
      {filteredParties.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
          No matching party profiles found for your search query. Try clearing filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map((party) => {
            const partyUnbilledLosses = fabricLosses.filter(
              (l) =>
                !l.billed &&
                (l.partyId === party.id ||
                  (l.partyName &&
                    (l.partyName.toLowerCase() === party.name.toLowerCase() ||
                      l.partyName.toLowerCase() === party.companyName.toLowerCase())))
            );
            const looseMeters = partyUnbilledLosses.reduce(
              (sum, l) => sum + (l.metersLost || (l.frontMeters || 0) + (l.reverseMeters || 0)),
              0
            );

            return (
              <div
                key={party.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{party.name}</h3>
                      <span className="text-xs font-semibold text-slate-500">{party.companyName}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                      {party.partyType}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{party.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {party.address}, {party.city}
                      </span>
                    </div>
                  </div>

                  {/* Loose Fabric Badge if pending */}
                  {partyUnbilledLosses.length > 0 && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-900">
                        <Scissors className="w-3.5 h-3.5 text-amber-700" />
                        <span>
                          {partyUnbilledLosses.length} Loose Cut(s) ({looseMeters}m)
                        </span>
                      </div>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('billing')}
                          className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer transition shadow-xs flex items-center space-x-1"
                        >
                          <span>+ Create Bill</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Financial Dues Box */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Invoiced</span>
                      <span className="font-bold text-slate-800">
                        {currSym} {party.totalInvoiced.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 font-bold block uppercase">Current Dues</span>
                      <span className="font-extrabold text-amber-700 text-sm">
                        {currSym} {party.currentDues.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      onClick={() => setSelectedPartyForLedger(party)}
                      className="text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Ledger</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenPaymentModal(party.id)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded border border-amber-200 transition cursor-pointer"
                      >
                        + Payment
                      </button>
                      <button
                        onClick={() => handleOpenEditParty(party)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteParty(party.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Party Modal */}
      {isPartyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingPartyId ? 'Edit Party Profile' : 'Add New Party / Customer'}
            </h3>

            <form onSubmit={handleSaveParty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Party Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mahmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Store Name</label>
                <input
                  type="text"
                  placeholder="e.g. Al-Madina Home Textile Hub"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Party Type</label>
                  <input
                    type="text"
                    list="party-type-suggestions"
                    placeholder="e.g. Wholesaler, Retailer, Supplier"
                    value={partyType}
                    onChange={(e) => setPartyType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                  <datalist id="party-type-suggestions">
                    <option value="Wholesaler" />
                    <option value="Dealer" />
                    <option value="Retailer" />
                    <option value="Customer" />
                    <option value="Supplier" />
                    <option value="Contractor" />
                    <option value="Fabric Mill" />
                    <option value="Dyer & Printer" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloth Market Gate #3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Faisalabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Received Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Party Payment Received</h3>

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Party *</label>
                <select
                  value={paymentPartyId}
                  onChange={(e) => setPaymentPartyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.companyName}) - Current Dues: {currSym} {p.currentDues}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ({currSym}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-extrabold text-emerald-700 bg-emerald-50/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI/Online">UPI / Online</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Cheque Number</label>
                <input
                  type="text"
                  placeholder="e.g. MBL-889012"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received via Meezan Bank Faisalabad Branch"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow"
                >
                  Confirm Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Party Ledger Statement Modal */}
      {selectedPartyForLedger && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPartyForLedger.name} - Party Ledger Statement</h3>
                <p className="text-xs text-slate-500">{selectedPartyForLedger.companyName} | {selectedPartyForLedger.phone}</p>
              </div>
              <button
                onClick={() => setSelectedPartyForLedger(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Invoiced</span>
                <strong className="text-slate-900">{currSym} {selectedPartyForLedger.totalInvoiced.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Received</span>
                <strong className="text-emerald-600">{currSym} {selectedPartyForLedger.totalPaid.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Outstanding Dues</span>
                <strong className="text-amber-700">{currSym} {selectedPartyForLedger.currentDues.toLocaleString()}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Payment Transaction Records</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                {payments
                  .filter((p) => p.partyId === selectedPartyForLedger.id)
                  .map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <span className="font-bold text-slate-800">{p.date}</span>
                        <span className="text-[11px] text-slate-500 block">Method: {p.paymentMethod} (Ref: {p.referenceNo || 'N/A'})</span>
                      </div>
                      <span className="font-extrabold text-emerald-600 text-sm">+{currSym} {p.amount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!partyToDelete}
        title="Delete Party Profile"
        itemName={partyToDelete ? `${partyToDelete.name} (${partyToDelete.companyName || partyToDelete.partyType})` : undefined}
        message="Are you sure you want to delete this party/customer profile? All associated payment transaction records will also be removed."
        onConfirm={handleConfirmDeleteParty}
        onClose={() => setPartyToDelete(null)}
      />
    </div>
  );
};

