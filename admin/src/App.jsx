// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminNavbar from './components/AdminNavbar';
import AddItemPage from './components/AddItem';
import ListItemsPage from './components/ListItems';
import OrdersPage from './components/Orders';
import SuppliersPage from './components/Suppliers';
import PurchasesPage from './components/Purchases';
import SupplierPaymentsPage from './components/SupplierPayments';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <main className="flex-grow bg-slate-50">
        <Routes>
          <Route path="/admin/add-item"   element={<AddItemPage />} />
          <Route path="/admin/list-items" element={<ListItemsPage />} />
          <Route path="/admin/orders"     element={<OrdersPage />} />
          <Route path="/admin/suppliers"  element={<SuppliersPage />} />
          <Route path="/admin/purchases"  element={<PurchasesPage />} />
          <Route path="/admin/payments"   element={<SupplierPaymentsPage />} />
          <Route path="/admin/supplier-payments" element={<SupplierPaymentsPage />} />
          <Route path="*"                 element={<AddItemPage />} />
        </Routes>
      </main>

      <footer className="bg-emerald-800 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Adeeg Organize Market Admin Panel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;