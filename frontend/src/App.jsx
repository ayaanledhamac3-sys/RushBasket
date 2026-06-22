import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './CartContext';
import Navbar from './components/Navbar';
import Home from './page/Home';
import Dashboard from './page/Dashboard';
import Contact from './page/Contact';
import Items from './page/Items';
import Cart from './page/Cart';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import OtpVerification from './components/OtpVerification';
import Logout from './components/Logout';
import CheckoutPage from './components/Checkout'
import MyOrders from './components/OrderPage'
import VerifyPaymentPage from './page/VerifyPaymentPage';
import { clearAuthSession, hasValidSession } from './authSession';

// ScrollToTop component: listens to route changes and scrolls window to top
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  // Track auth state here
  const [isAuthenticated, setIsAuthenticated] = useState(
    hasValidSession()
  );

  // Whenever we dispatch the custom event, update this flag
  useEffect(() => {
    const handler = () => {
      const valid = hasValidSession();
      if (!valid && localStorage.getItem('authToken')) {
        clearAuthSession();
      }
      setIsAuthenticated(valid);
    };
    window.addEventListener('authStateChanged', handler);
    handler();
    return () => window.removeEventListener('authStateChanged', handler);
  }, []);

  return (
    <CartProvider>
      <ScrollToTop />
      <Navbar isAuthenticated={isAuthenticated} />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/items" element={<Items />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate replace to="/login" />
          }
        />

        {/* Protected Cart: only /cart checks auth */}
        <Route
          path="/cart"
          element={
            isAuthenticated ? <Cart /> : <Navigate replace to="/login" />
          }
        />
        <Route
          path="/checkout"
          element={
            isAuthenticated ? <CheckoutPage /> : <Navigate replace to="/login" />
          }
        />

        {/* Payment verification */}
        <Route path="/myorders/verify" element={<VerifyPaymentPage />} />
        <Route
          path="/myorders"
          element={
            isAuthenticated ? <MyOrders /> : <Navigate replace to="/login" />
          }
        />

        {/* Auth routes (always available) */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Logout page (if you still want a dedicated route) */}
        <Route path="/logout" element={<Logout />} />

        {/* Fallback: redirect to home */}
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
