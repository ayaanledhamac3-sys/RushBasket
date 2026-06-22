import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  FaArrowLeft,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginStyles } from "../assets/dummyStyles";
import Logout from "./Logout";
import { API_BASE } from "../apiConfig";
import { clearAuthSession, hasValidSession, persistAuthSession } from "../authSession";
import GoogleSignInButton from "./GoogleSignInButton";

const Login = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    hasValidSession()
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [loginSuccessToast, setLoginSuccessToast] = useState(false);
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const resetBannerShown = useRef(false);

  useEffect(() => {
    if (!location.state?.resetOk || resetBannerShown.current) return undefined;
    resetBannerShown.current = true;
    setBanner("Password updated. Sign in with your new password.");
    navigate(location.pathname, { replace: true, state: {} });
    const t = setTimeout(() => setBanner(""), 5000);
    return () => clearTimeout(t);
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    const handler = () => {
      const valid = hasValidSession();
      if (!valid && localStorage.getItem("authToken")) {
        clearAuthSession();
      }
      setIsAuthenticated(valid);
    };
    window.addEventListener("authStateChanged", handler);
    handler();
    return () => window.removeEventListener("authStateChanged", handler);
  }, []);

  if (isAuthenticated) {
    return <Logout />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const finishLogin = useCallback(
    (token, user) => {
      persistAuthSession(token, user);
      setLoginSuccessToast(true);
      window.dispatchEvent(new Event("authStateChanged"));
      setTimeout(() => navigate("/dashboard"), 800);
    },
    [navigate]
  );

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setError("");
      try {
        const response = await axios.post(
          `${API_BASE}/api/user/google`,
          { credential },
          { headers: { "Content-Type": "application/json" } }
        );
        if (response.data.success && response.data.token) {
          finishLogin(response.data.token, response.data.user);
        } else {
          setError(response.data.message || "Google sign-in failed");
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Google sign-in failed"
        );
      }
    },
    [finishLogin]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE}/api/user/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success && response.data.token) {
        finishLogin(response.data.token, response.data.user);
      } else if (response.data.requires2FA && response.data.otpRequestId) {
        navigate("/verify-otp", {
          state: {
            otpRequestId: response.data.otpRequestId,
            email: formData.email,
          },
        });
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Login error");
      } else {
        setError("Unable to reach server");
      }
    }
  };

  return (
    <div className={loginStyles.page}>
      <Link to="/" className={loginStyles.backLink}>
        <FaArrowLeft className="mr-2" />
        Back to Home
      </Link>

      {banner && (
        <div className={loginStyles.toast}>
          <FaCheck className="mr-2" />
          {banner}
        </div>
      )}
      {loginSuccessToast && (
        <div className={loginStyles.toast}>
          <FaCheck className="mr-2" />
          Login successful!
        </div>
      )}

      <div className={loginStyles.loginCard}>
        <div className={loginStyles.logoContainer}>
          <div className={loginStyles.logoOuter}>
            <div className={loginStyles.logoInner}>
              <FaUser className={loginStyles.logoIcon} />
            </div>
          </div>
        </div>

        <h2 className={loginStyles.title}>Welcome Back</h2>

        <div className="mb-4">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <div className="flex items-center gap-3 my-4 text-gray-500 text-sm">
          <span className="flex-1 h-px bg-gray-600" />
          or with email
          <span className="flex-1 h-px bg-gray-600" />
        </div>

        <form onSubmit={handleSubmit} className={loginStyles.form}>
          <div className={loginStyles.inputContainer}>
            <FaUser className={loginStyles.inputIcon} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className={loginStyles.input}
            />
          </div>

          <div className={loginStyles.inputContainer}>
            <FaLock className={loginStyles.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className={loginStyles.passwordInput}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={loginStyles.toggleButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className={loginStyles.rememberContainer}>
            <label className={loginStyles.rememberLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className={loginStyles.rememberCheckbox}
              />
              Keep me signed in
            </label>
            <Link to="/forgot-password" className={loginStyles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          {error && <p className={loginStyles.error}>{error}</p>}

          <button type="submit" className={loginStyles.submitButton}>
            Sign In
          </button>
        </form>

        <p className={loginStyles.signupText}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className={loginStyles.signupLink}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
