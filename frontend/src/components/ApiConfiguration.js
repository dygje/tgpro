import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ApiConfiguration = ({ onConfigured, onSkip }) => {
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await axios.get(`${API}/auth/configuration`, {
        headers: {
          'Authorization': 'Bearer telegram-automation-key-2025'
        }
      });
      
      setConfigured(response.data.configured);
      
      if (response.data.configured) {
        onConfigured();
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!apiId.trim() || !apiHash.trim() || !phoneNumber.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/auth/configure`, {
        api_id: apiId,
        api_hash: apiHash,
        phone_number: phoneNumber
      }, {
        headers: {
          'Authorization': 'Bearer telegram-automation-key-2025'
        }
      });

      if (response.data.configured) {
        setConfigured(true);
        onConfigured();
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to configure API credentials');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="card max-w-sm animate-fade-in">
          <div className="p-8 text-center">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Checking configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (configured) {
    return null; // Configuration is already done
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg animate-fade-in">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-display">Setup Telegram API</h1>
            <p className="text-sm text-gray-600 leading-relaxed">Configure your Telegram API credentials to get started</p>
          </div>

          <div className="alert alert-info mb-6 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold mb-1">Get your API credentials:</div>
              <ol className="list-decimal list-inside space-y-1 text-xs opacity-90">
                <li>Visit <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">my.telegram.org/apps</a></li>
                <li>Log in with your Telegram account</li>
                <li>Create a new application</li>
                <li>Copy your api_id and api_hash</li>
              </ol>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="layout-compact">
            <div className="field">
              <label htmlFor="api_id" className="block text-sm font-semibold text-gray-700 mb-2">
                API ID <span className="text-red-500">*</span>
              </label>
              <div className="enhanced-input">
                <input
                  id="api_id"
                  type="text"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  placeholder="12345678"
                  className="api-input"
                  required
                  disabled={loading}
                  data-mono="true"
                />
              </div>
              <p className="help-text">Numeric API ID from my.telegram.org</p>
            </div>

            <div className="field">
              <label htmlFor="api_hash" className="block text-sm font-semibold text-gray-700 mb-2">
                API Hash <span className="text-red-500">*</span>
              </label>
              <div className="enhanced-input">
                <input
                  id="api_hash"
                  type="password"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder="abcd1234efgh5678..."
                  className="api-input"
                  required
                  disabled={loading}
                  data-mono="true"
                />
              </div>
              <p className="help-text">32-character API hash string</p>
            </div>

            <div className="field">
              <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="enhanced-input">
                <input
                  id="phone_number"
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
              <p className="help-text">Include country code (e.g., +62 for Indonesia)</p>
            </div>

            {error && (
              <div className="alert alert-error text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center order-2 sm:order-1"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Configuring...
                  </>
                ) : (
                  'Configure API'
                )}
              </button>
              
              <button
                type="button"
                onClick={onSkip}
                className="btn-secondary flex-1 order-1 sm:order-2"
              >
                Skip for now
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200/60">
            <div className="alert alert-warning text-xs">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Your API credentials are stored securely and used only for Telegram server connections.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfiguration;