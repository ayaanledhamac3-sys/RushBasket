import React, { useState, useEffect } from 'react';
import { FiSave, FiTrash2, FiEdit2, FiMail, FiPhone, FiMapPin, FiDollarSign, FiX, FiCheck } from 'react-icons/fi';
import { API_BASE } from '../apiConfig';

const initialForm = { companyName: '', contactPerson: '', phone: '', email: '', location: '' };

export default function SuppliersPage() {
  const [form, setForm] = useState(initialForm);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers`, { credentials: 'include' });
      setSuppliers(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url    = editId ? `${API_BASE}/api/suppliers/${editId}` : `${API_BASE}/api/suppliers`;
      const method = editId ? 'PATCH' : 'POST';
        const res    = await fetch(url, {
        method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setForm(initialForm); setEditId(null); fetchSuppliers(); }
      else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setForm({ companyName: s.companyName||'', contactPerson: s.contactPerson||'', phone: s.phone||'', email: s.email||'', location: s.location||'' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditId(null); setForm(initialForm); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
      await fetch(`${API_BASE}/api/suppliers/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchSuppliers();
  };

  const totalBalance = suppliers.reduce((s, sup) => s + Number(sup.balance || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">Suppliers</h1>
            <p className="text-gray-500 mt-1">Manage your supplier directory and track balances</p>
          </div>
          <div className="bg-white rounded-xl shadow px-5 py-3 border-l-4 border-red-400 text-right">
            <p className="text-xs text-gray-500">Total Outstanding</p>
            <p className="text-xl font-bold text-red-600">${totalBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-emerald-800 mb-5">
            {editId ? '✏️ Edit Supplier' : '➕ Add New Supplier'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name *</label>
                <input type="text" name="companyName" value={form.companyName} onChange={handleChange} required placeholder="e.g. Somali Fresh Goods Ltd."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person *</label>
                <input type="text" name="contactPerson" value={form.contactPerson} onChange={handleChange} required placeholder="e.g. Ahmed Ali"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} required placeholder="+252 61 111 2233"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="supplier@example.com"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address / Location *</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="location" value={form.location} onChange={handleChange} required placeholder="Mogadishu, Somalia"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                {editId ? <FiCheck /> : <FiSave />}
                {loading ? 'Saving...' : editId ? 'Update Supplier' : 'Add Supplier'}
              </button>
              {editId && (
                <button type="button" onClick={cancelEdit}
                  className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-lg transition-colors">
                  <FiX /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-emerald-800 mb-4">Supplier List ({suppliers.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['#','Name','Contact','Address','Balance','Actions'].map((h) => (
                    <th key={h} className="py-3 px-4 text-left font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400">No suppliers yet.</td></tr>
                ) : suppliers.map((s, i) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{s.companyName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-500"><FiMail size={12} />{s.email}</div>
                      <div className="flex items-center gap-1 text-gray-500 mt-0.5"><FiPhone size={12} />{s.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      <div className="flex items-center gap-1"><FiMapPin size={12} />{s.location}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold flex items-center gap-1 ${Number(s.balance) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        <FiDollarSign size={13} />{Number(s.balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(s)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"><FiEdit2 size={16} /></button>
                        <button onClick={() => handleDelete(s._id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><FiTrash2 size={16} /></button>
                        <button onClick={() => window.location.assign(`/admin/purchases?supplierId=${s._id}`)} title="Purchases" className="p-1 rounded hover:bg-gray-100">📦</button>
                        <button onClick={() => window.location.assign(`/admin/supplier-payments?supplierId=${s._id}`)} title="Payments" className="p-1 rounded hover:bg-gray-100">💳</button>
                      </div>
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