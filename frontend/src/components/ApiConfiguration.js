import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ApiConfiguration = ({ onConfigured, onSkip }) => {
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
      setPhoneNumber(response.data.phone_number || '');
      
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Checking configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  if (configured) {
    return null; // Configuration is already done
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Telegram API</h1>
          <p className="text-gray-600">Configure your Telegram API credentials to get started</p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How to get your API credentials:</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Visit <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">my.telegram.org/apps</a></li>
                  <li>Log in with your Telegram account</li>
                  <li>Create a new application</li>
                  <li>Copy your api_id and api_hash</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="api_id" className="block text-sm font-medium text-gray-700 mb-2">
              API ID <span className="text-red-500">*</span>
            </label>
            <input
              id="api_id"
              type="text"
              value={apiId}
              onChange={(e) => setApiId(e.target.value)}
              placeholder="Your API ID from my.telegram.org"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="api_hash" className="block text-sm font-medium text-gray-700 mb-2">
              API Hash <span className="text-red-500">*</span>
            </label>
            <input
              id="api_hash"
              type="password"
              value={apiHash}
              onChange={(e) => setApiHash(e.target.value)}
              placeholder="Your API Hash from my.telegram.org"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone_number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US, +62 for Indonesia)</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Configuring...
                </>
              ) : (
                'Configure API'
              )}
            </button>
            
            <button
              type="button"
              onClick={onSkip}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Skip for now
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Your API credentials are stored locally and used only for connecting to Telegram's servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiConfiguration;