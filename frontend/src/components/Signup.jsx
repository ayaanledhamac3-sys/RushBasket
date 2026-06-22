import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
} from 'react-icons/fa';
import { signupStyles } from '../assets/dummyStyles';
import { API_BASE } from '../apiConfig';
import { persistAuthSession } from '../authSession';
import GoogleSignInButton from './GoogleSignInButton';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
        navigate('/dashboard');
      }, 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showToast, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^\+[1-9]\d{7,14}$/.test(formData.phone.trim()))
      newErrors.phone = 'Use international format e.g. +2547XXXXXXXX';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setApiError('Please fix the highlighted fields and try again.');
      return false;
    }
    setApiError('');
    return true;
  };

  const togglePasswordVisibility = () => {
    setShowPassword((v) => !v);
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    setApiError('');
    try {
      const res = await axios.post(
        `${API_BASE}/api/user/google`,
        { credential },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.data.success && res.data.token) {
        persistAuthSession(res.data.token, res.data.user);
        setShowToast(true);
        window.dispatchEvent(new Event('authStateChanged'));
      } else {
        setApiError(res.data.message || 'Google sign-in failed');
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message || err.message || 'Google sign-in failed'
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
    };

    try {
      console.log('[signup] Sending register request', payload);
      const res = await axios.post(
        `${API_BASE}/api/user/register`,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );

      if (res.data.success && res.data.token) {
        persistAuthSession(res.data.token, res.data.user);
        setShowToast(true);
        window.dispatchEvent(new Event('authStateChanged'));
      } else {
        setApiError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('[signup] Registration request failed', err);
      if (err.response && err.response.data) {
        setApiError(err.response.data.message || 'Registration failed');
      } else if (err.code === 'ECONNABORTED') {
        setApiError('Request timed out. Make sure backend is running on port 5000.');
      } else {
        setApiError('Server error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={signupStyles.page}>
      <Link to="/login" className={signupStyles.backLink}>
        <FaArrowLeft className="mr-2" />
        Back to Login
      </Link>

      {showToast && (
        <div className={signupStyles.toast}>
          <FaCheck className="mr-2" />
          You&apos;re signed in!
        </div>
      )}

      <div className={signupStyles.signupCard}>
        {apiError && (
          <p className={`${signupStyles.error} text-center mb-2`}>{apiError}</p>
        )}
        <div className={signupStyles.logoContainer}>
          <div className={signupStyles.logoOuter}>
            <div className={signupStyles.logoInner}>
              <FaUser className={signupStyles.logoIcon} />
            </div>
          </div>
        </div>

        <h2 className={signupStyles.title}>Create Account</h2>

        <div className="mb-4">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <div className="flex items-center gap-3 my-4 text-gray-500 text-sm">
          <span className="flex-1 h-px bg-gray-600" />
          or with email
          <span className="flex-1 h-px bg-gray-600" />
        </div>

        <form onSubmit={handleSubmit} className={signupStyles.form} noValidate>
          <div className={signupStyles.inputContainer}>
            <FaUser className={signupStyles.inputIcon} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className={signupStyles.input}
            />
            {errors.name && <p className={signupStyles.error}>{errors.name}</p>}
          </div>

          <div className={signupStyles.inputContainer}>
            <FaEnvelope className={signupStyles.inputIcon} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className={signupStyles.input}
            />
            {errors.email && (
              <p className={signupStyles.error}>{errors.email}</p>
            )}
          </div>

          <div className={signupStyles.inputContainer}>
            <FaPhone className={signupStyles.inputIcon} />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone (e.g. +2547XXXXXXXX)"
              className={signupStyles.input}
            />
            {errors.phone && <p className={signupStyles.error}>{errors.phone}</p>}
          </div>

          <div className={signupStyles.inputContainer}>
            <FaLock className={signupStyles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password (min 8 characters)"
              className={signupStyles.passwordInput}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={signupStyles.toggleButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && (
              <p className={signupStyles.error}>{errors.password}</p>
            )}
          </div>

          <div className={signupStyles.termsContainer}>
            <label className={signupStyles.termsLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className={signupStyles.termsCheckbox}
              />
              I agree to the Terms and Conditions
            </label>
          </div>

          <button
            type="submit"
            className={signupStyles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className={signupStyles.signinText}>
          Already have an account?{' '}
          <Link to="/login" className={signupStyles.signinLink}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
