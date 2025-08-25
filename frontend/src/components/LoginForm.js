import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginForm = ({ onAuthSuccess }) => {
  const [step, setStep] = useState('phone'); // 'phone', 'code', '2fa'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFAPassword, setTwoFAPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/phone`, {
        phone_number: phoneNumber
      }, {
        headers: {
          'Authorization': 'Bearer telegram-automation-key-2025'
        }
      });

      setMessage(response.data.message);
      setStep('code');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to send verification code';
      
      // Provide more helpful error messages
      if (errorMessage.includes('api_id') || errorMessage.includes('api_hash')) {
        setError('Telegram API credentials not configured. Please configure them in the settings first.');
      } else if (errorMessage.includes('phone')) {
        setError('Invalid phone number format. Please include country code (e.g., +1234567890)');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/verify-code`, {
        verification_code: verificationCode
      }, {
        headers: {
          'Authorization': 'Bearer telegram-automation-key-2025'
        }
      });

      if (response.data.requires_2fa) {
        setStep('2fa');
        setMessage('Two-factor authentication required');
      } else {
        onAuthSuccess(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!twoFAPassword.trim()) {
      setError('Please enter your 2FA password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/verify-2fa`, {
        password: twoFAPassword
      }, {
        headers: {
          'Authorization': 'Bearer telegram-automation-key-2025'
        }
      });

      onAuthSuccess(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid 2FA password');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    setMessage('');
    if (step === 'code') {
      setStep('phone');
      setVerificationCode('');
    } else if (step === '2fa') {
      setStep('code');
      setTwoFAPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-display">Telegram Authentication</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              {step === 'phone' && 'Sign in with your Telegram account'}
              {step === 'code' && 'Enter the verification code sent to your phone'}
              {step === '2fa' && 'Enter your two-factor authentication password'}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="step-indicator mb-6">
            <div className={`step-dot ${step === 'phone' ? 'active' : step !== 'phone' ? 'completed' : 'inactive'}`}></div>
            <div className={`step-line ${step !== 'phone' ? (step === 'code' ? 'active' : 'completed') : 'inactive'}`}></div>
            <div className={`step-dot ${step === 'code' ? 'active' : step === '2fa' ? 'completed' : 'inactive'}`}></div>
            <div className={`step-line ${step === '2fa' ? 'active' : 'inactive'}`}></div>
            <div className={`step-dot ${step === '2fa' ? 'active' : 'inactive'}`}></div>
          </div>

          {message && (
            <div className="alert alert-success mb-4 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Phone Step */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="layout-compact">
              <div className="field">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="enhanced-input">
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+628229814752"
                    className="phone-input"
                    required
                    disabled={loading}
                    data-mono="true"
                  />
                </div>
                <p className="help-text">Enter your phone number with country code (e.g., +62 for Indonesia)</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          )}

          {/* Verification Code Step */}
          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="layout-compact">
              <div className="field">
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="enhanced-input">
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="verification-input text-center text-lg tracking-wider"
                    required
                    disabled={loading}
                    maxLength="6"
                    data-mono="true"
                  />
                </div>
                <p className="help-text">Enter the 6-digit code sent to {phoneNumber}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="loading-spinner w-4 h-4"></div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 2FA Step */}
          {step === '2fa' && (
            <form onSubmit={handle2FASubmit} className="layout-compact">
              <div className="field">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Two-Factor Authentication Password
                </label>
                <div className="enhanced-input">
                  <input
                    id="password"
                    type="password"
                    value={twoFAPassword}
                    onChange={(e) => setTwoFAPassword(e.target.value)}
                    placeholder="Enter your 2FA password"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="help-text">This is the password you set for two-factor authentication in Telegram</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                >
                  {loading ? (
                    <div className="loading-spinner w-4 h-4"></div>
                  ) : (
                    'Complete Login'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200/60">
            <div className="alert alert-info text-xs">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Make sure you have configured your Telegram API credentials first</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;