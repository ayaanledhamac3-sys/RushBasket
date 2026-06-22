import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { loginStyles } from '../assets/dummyStyles';
import { API_BASE } from '../apiConfig';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset link.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/user/reset-password`, {
        token,
        password,
      });
      navigate('/login', { replace: true, state: { resetOk: true } });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Could not reset password. Request a new link.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={loginStyles.page}>
        <Link to="/forgot-password" className={loginStyles.backLink}>
          <FaArrowLeft className="mr-2" />
          Request reset link
        </Link>
        <div className={loginStyles.loginCard}>
          <p className="text-red-400 text-center text-sm">
            This reset link is invalid. Open the link from your email or request a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={loginStyles.page}>
      <Link to="/login" className={loginStyles.backLink}>
        <FaArrowLeft className="mr-2" />
        Back to Login
      </Link>

      <div className={loginStyles.loginCard}>
        <h2 className={loginStyles.title}>Set new password</h2>

        <form onSubmit={handleSubmit} className={loginStyles.form}>
          <div className={loginStyles.inputContainer}>
            <FaLock className={loginStyles.inputIcon} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              required
              minLength={8}
              className={loginStyles.input}
            />
          </div>
          <div className={loginStyles.inputContainer}>
            <FaLock className={loginStyles.inputIcon} />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              required
              className={loginStyles.input}
            />
          </div>
          {error && <p className={loginStyles.error}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={loginStyles.submitButton}
          >
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
