import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiPackage, FiPlusCircle, FiShoppingBag, FiUsers,
  FiTruck, FiX, FiMenu, FiShoppingCart, FiCreditCard,
} from 'react-icons/fi';
import { adminNavbarStyles as styles } from '../assets/adminStyles';

const AdminNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem('authToken')));
    const onAuth = () => setHasToken(Boolean(localStorage.getItem('authToken')));
    window.addEventListener('authStateChanged', onAuth);
    return () => window.removeEventListener('authStateChanged', onAuth);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu  = () => setIsMobileMenuOpen(false);

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.mainFlex}>

          {/* Logo */}
          <div className={styles.logoContainer}>
            <div className={styles.logoIconContainer}>
              <FiPackage className={styles.logoIcon} />
            </div>
            <h1 className={styles.logoText}>
              <span className={styles.logoAccent}>Adeeg Organize Market</span> Admin
            </h1>
          </div>

          {/* Desktop Navigation Links */}
          <div className={styles.desktopNavLinks}>
            <NavLink to="/admin/add-item" className={styles.navLink}>
              <FiPlusCircle className="mr-2" /> Add Products
            </NavLink>

            <NavLink to="/admin/list-items" className={styles.navLink}>
              <FiPackage className="mr-2" /> List Items
            </NavLink>

            <NavLink to="/admin/orders" className={styles.navLink}>
              <FiShoppingBag className="mr-2" /> Orders
            </NavLink>

            

            <NavLink to="/admin/suppliers" className={styles.navLink}>
              <FiTruck className="mr-2" /> Suppliers
            </NavLink>

            {/* ✅ NEW */}
            <NavLink to="/admin/purchases" className={styles.navLink}>
              <FiShoppingCart className="mr-2" /> Purchases
            </NavLink>

            {/* ✅ NEW */}
            <NavLink to="/admin/supplier-payments" className={styles.navLink}>
              <FiCreditCard className="mr-2" /> Supplier Payments
            </NavLink>
            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={() => {
                  const token = window.prompt('Paste admin JWT token (or leave empty to cancel):');
                  if (token) {
                    localStorage.setItem('authToken', token.trim());
                    window.dispatchEvent(new Event('authStateChanged'));
                    setHasToken(true);
                    alert('Token saved for admin actions.');
                  }
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded"
              >
                Set Token
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  window.dispatchEvent(new Event('authStateChanged'));
                  setHasToken(false);
                  alert('Token cleared.');
                }}
                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
              >
                Clear Token
              </button>
              <div className="text-xs text-gray-100 ml-2 px-2 py-1 rounded" style={{background: hasToken ? '#059669' : '#6b7280'}}>
                {hasToken ? 'Token: set' : 'Token: none'}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className={styles.mobileMenuButton}>
            <button onClick={toggleMobileMenu} className={styles.menuButton}>
              {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenuContainer} ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className={styles.mobileMenuInner}>
          <NavLink to="/admin/add-item" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            <FiPlusCircle className="mr-3 ml-1" size={20} /> Manage Products
          </NavLink>

          <NavLink to="/admin/list-items" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            <FiPackage className="mr-3 ml-1" size={20} /> Inventory
          </NavLink>

          <NavLink to="/admin/orders" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            <FiShoppingBag className="mr-3 ml-1" size={20} /> Orders
          </NavLink>

          

          <NavLink to="/admin/suppliers" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            <FiTruck className="mr-3 ml-1" size={20} /> Suppliers
          </NavLink>

          {/* ✅ NEW */}
          <NavLink to="/admin/purchases" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            <FiShoppingCart className="mr-3 ml-1" size={20} /> Purchases
          </NavLink>

          {/* ✅ NEW */}
          <NavLink to="/admin/supplier-payments" onClick={closeMobileMenu} className={styles.mobileNavLink}>
            <FiCreditCard className="mr-3 ml-1" size={20} /> Supplier Payments
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;