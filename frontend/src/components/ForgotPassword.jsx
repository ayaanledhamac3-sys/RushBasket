import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { loginStyles } from '../assets/dummyStyles';
import { API_BASE } from '../apiConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/user/forgot-password`, { email });
      setMessage(res.data.message || 'Check your email for next steps.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Something went wrong. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={loginStyles.page}>
      <Link to="/login" className={loginStyles.backLink}>
        <FaArrowLeft className="mr-2" />
        Back to Login
      </Link>

      <div className={loginStyles.loginCard}>
        <h2 className={loginStyles.title}>Forgot password</h2>
        <p className="text-sm text-gray-400 text-center mb-4">
          Enter your email. If an account exists, we send a reset link. Without SMTP
          configured, your developer can see the link in the server console (dev only).
        </p>

        <form onSubmit={handleSubmit} className={loginStyles.form}>
          <div className={loginStyles.inputContainer}>
            <FaEnvelope className={loginStyles.inputIcon} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className={loginStyles.input}
            />
          </div>
          {error && <p className={loginStyles.error}>{error}</p>}
          {message && (
            <p className="text-sm text-emerald-400 text-center">{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={loginStyles.submitButton}
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
