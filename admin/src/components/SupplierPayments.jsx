import React, { useState, useEffect } from 'react';
import {
  FiSave, FiTrash2, FiDollarSign, FiCalendar, FiTruck,
  FiCreditCard, FiCheckCircle, FiClock, FiAlertCircle, FiFilter,
} from 'react-icons/fi';
import { API_BASE } from '../apiConfig';

const METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Other'];

const initialForm = {
  supplierId: '',
  purchaseId: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  amount: '',
  paymentMethod: 'Cash',
  notes: '',
};

export default function SupplierPaymentsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initSupplierId = urlParams.get('supplierId') || '';

  const [form, setForm] = useState({ ...initialForm, supplierId: initSupplierId });
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filterSupplier, setFilterSupplier] = useState(initSupplierId);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    try {
      const opts = { credentials: 'include' };
      const [sRes, pRes, payRes] = await Promise.all([
        fetch(`${API_BASE}/api/suppliers`, opts),
        fetch(`${API_BASE}/api/purchases`, opts),
        fetch(`${API_BASE}/api/supplier-payments`, opts),
      ]);
      setSuppliers(await sRes.json());
      setPurchases(await pRes.json());
      setPayments(await payRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAll(); }, []);

  // FIX: removed p.status !== 'Paid' — status is computed, not stored on the document
  useEffect(() => {
    if (form.supplierId) {
      setFilteredPurchases(
        purchases.filter((p) => {
          const sid = p.supplierId && (p.supplierId._id || p.supplierId);
          return sid === form.supplierId;
        })
      );
    } else {
      setFilteredPurchases([]);
    }
  }, [form.supplierId, purchases]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) { alert('Select a supplier'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/supplier-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          supplierId: form.supplierId,
          purchaseId: form.purchaseId || null,
          paymentDate: form.paymentDate,
          amount: parseFloat(form.amount),
          paymentMethod: form.paymentMethod,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        setForm(initialForm);
        fetchAll();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed');
      }
    } catch { alert('Error connecting to server.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Reverse this payment? This will update balances.')) return;
    await fetch(`${API_BASE}/api/supplier-payments/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchAll();
  };

  const supplierName = (id) => {
    const sid = id && (id._id || id);
    const s = suppliers.find((s) => s._id === sid);
    return s?.companyName || s?.supplierName || `#${sid}`;
  };

  const displayedPayments = filterSupplier
    ? payments.filter((p) => {
        const sid = p.supplierId && (p.supplierId._id || p.supplierId);
        return sid === filterSupplier;
      })
    : payments;

  const totalPaid = displayedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const selectedSupplierBalance = filterSupplier
    ? suppliers.find((s) => s._id === filterSupplier)?.balance
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-emerald-800">Supplier Payments</h1>
          <p className="text-gray-500 mt-1">Record payments and track outstanding balances</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-emerald-500 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg"><FiCheckCircle className="text-emerald-600 text-xl" /></div>
            <div>
              <p className="text-sm text-gray-500">{filterSupplier ? 'Filtered Payments' : 'Total Paid Out'}</p>
              <p className="text-2xl font-bold text-gray-800">${totalPaid.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-amber-500 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-lg"><FiClock className="text-amber-600 text-xl" /></div>
            <div>
              <p className="text-sm text-gray-500">Suppliers with Debt</p>
              <p className="text-2xl font-bold text-gray-800">{suppliers.filter((s) => Number(s.balance) > 0).length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-400 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-lg"><FiAlertCircle className="text-red-500 text-xl" /></div>
            <div>
              <p className="text-sm text-gray-500">
                {selectedSupplierBalance != null
                  ? `${supplierName(filterSupplier)} Balance`
                  : 'Total Outstanding'}
              </p>
              <p className="text-2xl font-bold text-red-600">
                ${selectedSupplierBalance != null
                  ? Number(selectedSupplierBalance).toFixed(2)
                  : suppliers.reduce((s, sup) => s + Number(sup.balance), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-emerald-800 mb-5 flex items-center gap-2">
            <FiCreditCard /> Record Payment
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier *</label>
                <div className="relative">
                  <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select name="supplierId" value={form.supplierId} onChange={handleChange} required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white">
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.companyName || s.supplierName}{' '}
                        {Number(s.balance) > 0 ? `— owes $${Number(s.balance).toFixed(2)}` : '(paid up)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Apply to Purchase (optional)</label>
                <select name="purchaseId" value={form.purchaseId} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white">
                  <option value="">— General payment —</option>
                  {filteredPurchases.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      #{(p._id || p.id).toString().slice(-6)} · {p.purchaseDate} · $
                      {Number(p.remainingAmount ?? p.totalAmount ?? 0).toFixed(2)} remaining
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Date *</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" name="paymentDate" value={form.paymentDate} onChange={handleChange} required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount ($) *</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" name="amount" value={form.amount} onChange={handleChange}
                    required min="0.01" step="0.01" placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method *</label>
                <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white">
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <input type="text" name="notes" value={form.notes} onChange={handleChange}
                  placeholder="e.g. Invoice #1234"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-lg">
              <FiSave />{loading ? 'Saving...' : 'Record Payment'}
            </button>
          </form>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold text-emerald-800">Payment History ({displayedPayments.length})</h2>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white">
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.companyName || s.supplierName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Supplier', 'Purchase', 'Date', 'Amount', 'Method', 'Notes', 'Action'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedPayments.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-gray-400">No payments recorded.</td></tr>
                ) : displayedPayments.map((p, i) => (
                  <tr key={p._id || p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{supplierName(p.supplierId)}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {p.purchaseId ? `#${p.purchaseId.toString().slice(-6)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{p.paymentDate?.slice(0, 10)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">${Number(p.amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-500">{p.paymentMethod}</td>
                    <td className="py-3 px-4 text-gray-400">{p.notes || '—'}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleDelete(p._id || p.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}