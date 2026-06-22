import { useState, useEffect } from 'react';
import {
  FiPlus, FiTrash2, FiEye, FiX, FiCalendar, FiTruck,
  FiPackage, FiCheckCircle, FiClock, FiAlertCircle,
  FiCreditCard, FiFilter, FiDollarSign, FiFileText,
} from 'react-icons/fi';
import { API_BASE } from '../apiConfig';

const STATUS_STYLE = {
  Paid:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Partial: 'bg-blue-100 text-blue-700 border border-blue-200',
  Pending: 'bg-amber-100 text-amber-700 border border-amber-200',
};
const STATUS_ICON = { Paid: FiCheckCircle, Partial: FiClock, Pending: FiAlertCircle };
const METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Other'];
const emptyDetail = { productName: '', quantity: '', unitPrice: '' };

export default function PurchasesPage() {
  const urlParams      = new URLSearchParams(window.location.search);
  const initSupplierId = urlParams.get('supplierId') || '';

  const [suppliers,         setSuppliers]         = useState([]);
  const [purchases,         setPurchases]         = useState([]);
  const [payments,          setPayments]          = useState([]);
  const [showForm,          setShowForm]          = useState(false);
  const [supplierId,        setSupplierId]        = useState(initSupplierId);
  const [purchaseDate,      setPurchaseDate]      = useState(new Date().toISOString().slice(0, 10));
  const [notes,             setNotes]             = useState('');
  const [details,           setDetails]           = useState([{ ...emptyDetail }]);
  const [loading,           setLoading]           = useState(false);
  const [filterSupplier,    setFilterSupplier]    = useState(initSupplierId);
  const [viewPurchase,      setViewPurchase]      = useState(null);
  const [showPaymentModal,  setShowPaymentModal]  = useState(false);
  const [paymentPurchaseId, setPaymentPurchaseId] = useState(null);
  const [paymentAmount,     setPaymentAmount]     = useState('');
  const [paymentDate,       setPaymentDate]       = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod,     setPaymentMethod]     = useState('Cash');
  const [selectedPayment,   setSelectedPayment]   = useState(null);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const fetchOpts = { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined };
      const [sRes, pRes, payRes] = await Promise.all([
        fetch(`${API_BASE}/api/suppliers`, fetchOpts),
        fetch(`${API_BASE}/api/purchases`, fetchOpts),
        fetch(`${API_BASE}/api/supplier-payments`, fetchOpts),
      ]);
      setSuppliers(await sRes.json());
      setPurchases(await pRes.json());
      setPayments(await payRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const addDetailRow    = () => setDetails((d) => [...d, { ...emptyDetail }]);
  const removeDetailRow = (i) => setDetails((d) => d.filter((_, idx) => idx !== i));
  const updateDetail    = (i, field, val) =>
    setDetails((d) => d.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  const lineTotal  = (d) => (parseFloat(d.quantity) || 0) * (parseFloat(d.unitPrice) || 0);
  const grandTotal = details.reduce((s, d) => s + lineTotal(d), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) { alert('Select a supplier'); return; }
    const validDetails = details.filter((d) => d.productName && d.quantity && d.unitPrice);
    if (validDetails.length === 0) { alert('Add at least one product line'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${API_BASE}/api/purchases`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          supplierId,
          purchaseDate,
          notes: notes || null,
          details: validDetails.map((d) => ({
            productName: d.productName,
            quantity:    parseFloat(d.quantity),
            unitPrice:   parseFloat(d.unitPrice),
          })),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setSupplierId('');
        setNotes('');
        setDetails([{ ...emptyDetail }]);
        setPurchaseDate(new Date().toISOString().slice(0, 10));
        fetchAll();
      } else {
        const text = await res.text();
        let errObj = null;
        try { errObj = JSON.parse(text); } catch (e) { console.error(e); }
        console.error('Create purchase failed', res.status, text);
        alert(errObj?.error || errObj?.message || text || 'Failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    await fetch(`${API_BASE}/api/purchases/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers,
    });
    fetchAll();
  };

  const openView = async (id) => {
    const token = localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await fetch(`${API_BASE}/api/purchases/${id}`, {
      credentials: 'include',
      headers,
    });
    setViewPurchase(await res.json());
  };

  const getPaidAmount = (purchase) => {
    const pid = purchase._id || purchase.id;
    return payments
      .filter((p) => (p.purchaseId?._id || p.purchaseId) === pid)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const getPurchaseStatus = (purchase) => {
    const paid      = getPaidAmount(purchase);
    const total     = Number(purchase.totalAmount || 0);
    const remaining = total - paid;
    if (remaining <= 0) return 'Paid';
    if (paid > 0)       return 'Partial';
    return 'Pending';
  };

  const openPaymentModal = (purchaseId) => {
    setPaymentPurchaseId(purchaseId);
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setShowPaymentModal(true);
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Enter a valid amount');
      return;
    }
    const purchase = purchases.find((p) => (p._id || p.id) === paymentPurchaseId);
    if (!purchase) { alert('Purchase not found. Please refresh.'); return; }
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const res = await fetch(`${API_BASE}/api/supplier-payments`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        purchaseId:    paymentPurchaseId,
        supplierId:    purchase.supplierId?._id || purchase.supplierId,
        amount:        parseFloat(paymentAmount),
        paymentDate,
        paymentMethod,
        notes:         'Purchase payment',
      }),
    });
    if (res.ok) {
      setShowPaymentModal(false);
      setPaymentPurchaseId(null);
      fetchAll();
    } else {
      const text = await res.text();
      let errObj = null;
      try { errObj = JSON.parse(text); } catch (e) { console.error(e); }
      console.error('Add payment failed', res.status, text);
      alert(errObj?.error || text || 'Failed');
    }
  };

  const supplierName = (p) =>
    p.supplierId?.companyName ||
    suppliers.find((s) => s._id === (p.supplierId?._id || p.supplierId))?.companyName ||
    '—';

  const displayedPurchases = filterSupplier
    ? purchases.filter((p) => (p.supplierId?._id || p.supplierId) === filterSupplier)
    : purchases;

  const totalPurchased = purchases.reduce((s, p) => s + Number(p.totalAmount || 0), 0);
  const totalPaidAll   = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDebt      = purchases.reduce(
    (s, p) => s + Math.max(0, Number(p.totalAmount || 0) - getPaidAmount(p)), 0
  );

  const inp = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white text-sm';
  const sel = inp + ' cursor-pointer';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">Purchase Orders</h1>
            <p className="text-gray-500 mt-1 text-sm">Create and track purchases from your suppliers</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <FiPlus /> New Purchase Order
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Purchased', value: totalPurchased, color: 'border-emerald-500', Icon: FiPackage,     iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
            { label: 'Total Paid',      value: totalPaidAll,   color: 'border-blue-500',    Icon: FiCheckCircle,  iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'    },
            { label: 'Remaining Debt',  value: totalDebt,      color: 'border-red-400',     Icon: FiAlertCircle,  iconBg: 'bg-red-100',     iconColor: 'text-red-500'     },
          ].map(({ label, value, color, Icon, iconBg, iconColor }) => (
            <div key={label} className={`bg-white rounded-2xl shadow-sm border-l-4 ${color} p-5 flex items-center gap-4`}>
              <div className={`${iconBg} p-3 rounded-xl`}>
                <Icon className={`${iconColor} text-xl`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">${value.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-800">
              All Orders{' '}
              <span className="ml-2 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {displayedPurchases.length}
              </span>
            </h2>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none bg-white cursor-pointer"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.companyName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['#', 'Supplier', 'Date', 'Total', 'Paid', 'Remaining', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <FiPackage className="mx-auto text-gray-300 mb-3" size={36} />
                      <p className="text-gray-400 font-medium">No purchase orders yet</p>
                      <button onClick={() => setShowForm(true)}
                        className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
                        + Create your first order
                      </button>
                    </td>
                  </tr>
                ) : displayedPurchases.map((p, i) => {
                  const pid        = p._id || p.id;
                  const status     = getPurchaseStatus(p);
                  const StatusIcon = STATUS_ICON[status] || FiClock;
                  const paid       = getPaidAmount(p);
                  const remaining  = Math.max(0, Number(p.totalAmount || 0) - paid);
                  return (
                    <tr key={pid} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                            {supplierName(p).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{supplierName(p)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{p.purchaseDate?.slice(0, 10)}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">${Number(p.totalAmount || 0).toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-medium">${paid.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-red-500 font-medium">${remaining.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
                          <StatusIcon size={11} />{status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openView(pid)} title="View details"
                            className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                            <FiEye size={15} />
                          </button>
                          <button onClick={() => openPaymentModal(pid)} title="Record payment"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors">
                            <FiCreditCard size={15} />
                          </button>
                          <button
                            onClick={() => setSelectedPayment({
                              purchaseId: pid,
                              payments: payments.filter((pay) => (pay.purchaseId?._id || pay.purchaseId) === pid),
                            })}
                            title="Payment history"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <FiClock size={15} />
                          </button>
                          <button onClick={() => handleDelete(pid)} title="Delete"
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: New Purchase Order ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl"><FiPackage className="text-emerald-600 text-lg" /></div>
                <h2 className="text-xl font-bold text-gray-800">New Purchase Order</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supplier <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <FiTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required className={`${sel} pl-9`}>
                      <option value="">Select supplier</option>
                      {suppliers.map((s) => <option key={s._id} value={s._id}>{s.companyName}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Purchase Date <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required className={`${inp} pl-9`} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Urgent restock, Invoice #1234" className={`${inp} pl-9`} />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">Products <span className="text-red-400">*</span></h3>
                  <button type="button" onClick={addDetailRow}
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-sm font-semibold">
                    <FiPlus size={14} /> Add Row
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 mb-1.5 px-1">
                  <p className="col-span-5 text-xs text-gray-400 font-medium">Product Name</p>
                  <p className="col-span-2 text-xs text-gray-400 font-medium">Qty</p>
                  <p className="col-span-3 text-xs text-gray-400 font-medium">Unit Price</p>
                  <p className="col-span-1 text-xs text-gray-400 font-medium text-right">Total</p>
                  <p className="col-span-1"></p>
                </div>
                <div className="space-y-2">
                  {details.map((d, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className="col-span-5 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                        placeholder="e.g. Rice 50kg" value={d.productName}
                        onChange={(e) => updateDetail(i, 'productName', e.target.value)} />
                      <input className="col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                        placeholder="0" type="number" min="1" value={d.quantity}
                        onChange={(e) => updateDetail(i, 'quantity', e.target.value)} />
                      <input className="col-span-3 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                        placeholder="0.00" type="number" min="0" step="0.01" value={d.unitPrice}
                        onChange={(e) => updateDetail(i, 'unitPrice', e.target.value)} />
                      <p className="col-span-1 text-right text-xs font-semibold text-gray-600">${lineTotal(d).toFixed(2)}</p>
                      <button type="button" onClick={() => removeDetailRow(i)}
                        className="col-span-1 flex justify-center text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                        <FiX size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-2.5 flex items-center gap-3">
                    <FiDollarSign className="text-emerald-600" />
                    <div>
                      <p className="text-xs text-gray-500">Grand Total</p>
                      <p className="text-lg font-bold text-emerald-700">${grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  <FiPackage />{loading ? 'Saving...' : 'Create Purchase Order'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: View Purchase Details ── */}
      {viewPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl"><FiEye className="text-blue-600 text-lg" /></div>
                <h2 className="text-xl font-bold text-gray-800">Purchase Details</h2>
              </div>
              <button onClick={() => setViewPurchase(null)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={22} /></button>
            </div>
            <div className="px-7 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Supplier', value: viewPurchase.supplierId?.companyName || '—' },
                  { label: 'Date',     value: viewPurchase.purchaseDate?.slice(0, 10) },
                  { label: 'Total',    value: `$${Number(viewPurchase.totalAmount || 0).toFixed(2)}` },
                  ...(viewPurchase.notes ? [{ label: 'Notes', value: viewPurchase.notes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
                    <p className="font-semibold text-gray-800 text-sm">{value}</p>
                  </div>
                ))}
              </div>
              {viewPurchase.details?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Line Items</h3>
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Product', 'Qty', 'Unit Price', 'Line Total'].map((h) => (
                            <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewPurchase.details.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-medium text-gray-800">{d.productName}</td>
                            <td className="py-2 px-3 text-gray-500">{d.quantity}</td>
                            <td className="py-2 px-3 text-gray-500">${Number(d.unitPrice).toFixed(2)}</td>
                            <td className="py-2 px-3 font-semibold text-emerald-700">
                              ${Number(d.totalPrice || d.quantity * d.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Record Payment ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl"><FiCreditCard className="text-emerald-600 text-lg" /></div>
                <h2 className="text-xl font-bold text-gray-800">Record Payment</h2>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={22} /></button>
            </div>
            <div className="px-7 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount ($) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="number" min="0.01" step="0.01" value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" className={`${inp} pl-9`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date <span className="text-red-400">*</span></label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={`${inp} pl-9`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={sel}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleAddPayment}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  <FiCreditCard /> Save Payment
                </button>
                <button onClick={() => setShowPaymentModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Payment History ── */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-xl"><FiClock className="text-gray-600 text-lg" /></div>
                <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600 p-1"><FiX size={22} /></button>
            </div>
            <div className="px-7 py-6">
              {selectedPayment.payments.length === 0 ? (
                <p className="text-center text-gray-400 py-8 font-medium">No payments for this order yet.</p>
              ) : (
                <>
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Date', 'Amount', 'Method', 'Notes'].map((h) => (
                            <th key={h} className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedPayment.payments.map((p) => (
                          <tr key={p._id || p.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-4 text-gray-500">{p.paymentDate?.slice(0, 10)}</td>
                            <td className="py-2.5 px-4 font-bold text-emerald-700">${Number(p.amount).toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-gray-500">{p.paymentMethod}</td>
                            <td className="py-2.5 px-4 text-gray-400 text-xs">{p.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-700">
                      Total paid:{' '}
                      <span className="text-emerald-600">
                        ${selectedPayment.payments.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}