// src/pages/CheckoutPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiCreditCard, FiTruck, FiUser, FiPackage } from 'react-icons/fi';
import { useCart } from '../CartContext';
import { checkoutStyles } from '../assets/dummyStyles';
import axios from 'axios';
import { API_BASE } from '../apiConfig';

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'COD',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const normalizedPhone = formData.phone.replace(/[^\d]/g, '');
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (normalizedPhone.length < 10 || normalizedPhone.length > 15)
      newErrors.phone = 'Invalid phone number (use 10-15 digits, country code allowed)';
    if (!formData.address.trim()) newErrors.address = 'Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitError('');
    setIsSubmitting(true);

    const order = {
      customer: { ...formData },
      items: cart.map(item => ({
        id: item.productId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
      })),
      total: getCartTotal(),
      status: 'Pending',
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === 'COD' ? 'Paid' : 'Unpaid',
      deliveryDate: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
      notes: formData.notes
    };

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setSubmitError('Please log in first to place an order.');
        navigate('/login');
        return;
      }
      const res = await axios.post(
        `${API_BASE}/api/orders`,
        order,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );

      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      if (res.status === 201 || res.status === 200) {
        const createdOrder = res.data.order;
        const displayId = createdOrder.orderId || createdOrder._id;
        clearCart();
        alert(`Order placed successfully! Order ID: ${displayId}`);
        navigate('/');
      } else {
        alert('Order failed. Try again.');
      }
    } catch (err) {
      console.error(err);
      const apiMessage = err.response?.data?.error || err.response?.data?.message;
      if (err.response?.status === 401) {
        setSubmitError('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setSubmitError(apiMessage || 'Failed to place order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = getCartTotal();
  const tax = total * 0.05;
  const grandTotal = total + tax;

  if (!cart.length) {
    return (
      <div className={checkoutStyles.emptyPage}>
        <div className={checkoutStyles.emptyCard}>
          <div className={checkoutStyles.emptyIcon}>🛒</div>
          <h1 className={checkoutStyles.emptyTitle}>Your Cart is Empty</h1>
          <p className={checkoutStyles.emptyText}>
            You don't have any items to checkout.
          </p>
          <Link
            to="/items"
            className={checkoutStyles.emptyButton}
          >
            <FiArrowLeft className="mr-2" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={checkoutStyles.page}>
      <div className={checkoutStyles.container}>
        <Link to="/cart" className={checkoutStyles.backLink}>
          <FiArrowLeft className="mr-2" />
          Back to Cart
        </Link>

        <div className={checkoutStyles.header}>
          <h1 className={checkoutStyles.mainTitle}>Checkout</h1>
          <p className={checkoutStyles.subtitle}>
            Complete your purchase with secure checkout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Info */}
          <div className={checkoutStyles.card}>
            <h2 className={checkoutStyles.sectionTitle}>
              <FiUser className="mr-2 text-emerald-300" />
              Customer Information
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${checkoutStyles.input} ${errors.name ? checkoutStyles.inputError : ''}`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                )}
              </div>
              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${checkoutStyles.input} ${errors.email ? checkoutStyles.inputError : ''}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${checkoutStyles.input} ${errors.phone ? checkoutStyles.inputError : ''}`}
                    placeholder="10-digit phone number"
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-400">{errors.phone}</p>
                  )}
                </div>
              </div>
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className={`${checkoutStyles.input} ${errors.address ? checkoutStyles.inputError : ''}`}
                  placeholder="Full address including landmark"
                ></textarea>
                {errors.address && (
                  <p className="mt-2 text-sm text-red-400">{errors.address}</p>
                )}
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">
                  Delivery Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  className={checkoutStyles.input}
                  placeholder="Special instructions, gate code, etc."
                ></textarea>
              </div>
              {/* Payment Method */}
              <div>
                <h3 className={checkoutStyles.sectionTitle}>
                  <FiCreditCard className="mr-2 text-emerald-300" />
                  Payment Method
                </h3>
                <label className={checkoutStyles.radioCard}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleChange}
                    className="h-5 w-5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-emerald-100">
                      Cash on Delivery
                    </span>
                    <span className="block text-sm text-emerald-400">
                      Pay on delivery
                    </span>
                  </div>
                </label>
                <label className={checkoutStyles.radioCard}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Online"
                    checked={formData.paymentMethod === 'Online'}
                    onChange={handleChange}
                    className="h-5 w-5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-emerald-100">
                      Online Payment
                    </span>
                    <span className="block text-sm text-emerald-400">
                      Pay now via card
                    </span>
                  </div>
                </label>
              </div>
            </form>
          </div>
          {/* Order Summary */}
          <div className={checkoutStyles.card}>
            <h2 className={checkoutStyles.sectionTitle}>
              <FiPackage className="mr-2 text-emerald-300" />
              Order Summary
            </h2>
            <div className="mb-6">
              <h3 className="font-medium text-emerald-300 mb-4">
                Your Items ({cart.length})
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.id} className={checkoutStyles.cartItem}>
                    <div className={checkoutStyles.cartImage}>
                      {item.imageUrl ? (
                        <img
                          src={`${API_BASE}${item.imageUrl}`}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = '/no-image.png';
                          }}
                        />
                      ) : (
                        <FiPackage className="text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-emerald-100">
                        {item.name}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-emerald-400">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </span>
                        <span className="font-medium text-emerald-100">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-emerald-700/50 pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-emerald-300">Subtotal</span>
                <span className="font-medium text-emerald-100">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">Delivery</span>
                <span className="text-emerald-400 font-medium">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">Tax (5%)</span>
                <span className="font-medium text-emerald-100">
                  ${tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-3 mt-3 border-t border-emerald-700/50">
                <span className="text-lg font-bold text-emerald-100">
                  Total
                </span>
                <span className="text-lg font-bold text-emerald-300">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${checkoutStyles.button} ${isSubmitting
                  ? checkoutStyles.disabledButton
                  : checkoutStyles.submitButton
                } mt-6`}
            >
              {isSubmitting ? (
                <FiCheck className="mr-2 animate-spin" />
              ) : (
                <FiCheck className="mr-2" />
              )}
              {isSubmitting ? 'Processing Order' : 'Place Order'}
            </button>
            {submitError && (
              <p className="mt-3 text-sm text-red-400 text-center">{submitError}</p>
            )}
            <p className="mt-4 text-center text-sm text-emerald-400">
              By placing your order you agree to our{' '}
              <a href="#" className={checkoutStyles.link}>
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className={checkoutStyles.link}>
                Privacy
              </a>
            </p>
          </div>
        </div>

        <div className={checkoutStyles.deliveryInfo}>
          <h3 className={checkoutStyles.deliveryTitle}>
            <FiTruck className="mr-2" />
            Delivery Information
          </h3>
          <p className={checkoutStyles.deliveryText}>
            We deliver within 30-45 minutes. Orders placed after 9 PM will be
            delivered the next morning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;