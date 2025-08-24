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
      });

      setMessage(response.data.message);
      setStep('code');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to send verification code');
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
      const response = await axios.post(`${API}/auth/verify`, {
        verification_code: verificationCode
      });

      if (response.data.authenticated) {
        onAuthSuccess();
      } else if (response.data.requires_2fa) {
        setMessage('2FA password required');
        setStep('2fa');
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
      const response = await axios.post(`${API}/auth/2fa`, {
        password: twoFAPassword
      });

      if (response.data.authenticated) {
        onAuthSuccess();
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid 2FA password');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('phone');
    setPhoneNumber('');
    setVerificationCode('');
    setTwoFAPassword('');
    setError('');
    setMessage('');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Telegram Authentication</h2>
        <p className="text-gray-400">Sign in with your Telegram account</p>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-blue-900 border border-blue-700 text-blue-100 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-400 text-xs mt-1">
              Enter your phone number with country code (e.g., +1234567890)
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              maxLength="6"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-400 text-xs mt-1">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>
      )}

      {step === '2fa' && (
        <form onSubmit={handle2FASubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              2FA Password
            </label>
            <input
              type="password"
              value={twoFAPassword}
              onChange={(e) => setTwoFAPassword(e.target.value)}
              placeholder="Enter your 2FA password"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-gray-400 text-xs mt-1">
              Enter your two-factor authentication password
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Make sure you have configured your Telegram API credentials in the config.json file
        </p>
      </div>
    </div>
  );
};

export default LoginForm;