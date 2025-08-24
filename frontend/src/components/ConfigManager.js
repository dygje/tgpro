import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConfigManager = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/config`);
      setConfig(response.data);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading config:', error);
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.put(`${API}/config`, config);
      setMessage('Configuration saved successfully!');
      setHasChanges(false);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('Reset all changes? This will reload the configuration from the server.')) {
      loadConfig();
    }
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Failed to load configuration</p>
        <button
          onClick={loadConfig}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Configuration</h2>
          <p className="text-gray-400 mt-1">
            Configure automation settings and API credentials
          </p>
        </div>
        <div className="flex space-x-3">
          {hasChanges && (
            <button
              onClick={handleResetConfig}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Reset Changes
            </button>
          )}
          <button
            onClick={handleSaveConfig}
            disabled={loading || !hasChanges}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {hasChanges && (
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-100 px-4 py-3 rounded">
          ⚠️ You have unsaved changes. Don't forget to save your configuration.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telegram Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Telegram API</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                API ID
              </label>
              <input
                type="text"
                value={config.telegram?.api_id || ''}
                onChange={(e) => handleConfigChange('telegram', 'api_id', e.target.value)}
                placeholder="12345678"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-xs mt-1">
                Get from <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">my.telegram.org/apps</a>
              </p>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                API Hash
              </label>
              <input
                type="password"
                value={config.telegram?.api_hash || ''}
                onChange={(e) => handleConfigChange('telegram', 'api_hash', e.target.value)}
                placeholder="abcdef1234567890abcdef1234567890"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={config.telegram?.phone_number || ''}
                onChange={(e) => handleConfigChange('telegram', 'phone_number', e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Delay Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Message Delays</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Min Delay (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={config.delays?.min_delay_msg || 5}
                  onChange={(e) => handleConfigChange('delays', 'min_delay_msg', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Max Delay (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={config.delays?.max_delay_msg || 10}
                  onChange={(e) => handleConfigChange('delays', 'max_delay_msg', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Min Cycle Delay (hours)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="24"
                  step="0.1"
                  value={config.delays?.min_cycle_delay_hours || 1.1}
                  onChange={(e) => handleConfigChange('delays', 'min_cycle_delay_hours', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Max Cycle Delay (hours)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="24"
                  step="0.1"
                  value={config.delays?.max_cycle_delay_hours || 1.3}
                  onChange={(e) => handleConfigChange('delays', 'max_cycle_delay_hours', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <p className="text-gray-400 text-xs">
              Random delays between messages and cycles help avoid spam detection
            </p>
          </div>
        </div>

        {/* Safety Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Safety Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Max Messages/Hour
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={config.safety?.max_messages_per_hour || 50}
                  onChange={(e) => handleConfigChange('safety', 'max_messages_per_hour', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Max Messages/Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={config.safety?.max_messages_per_day || 200}
                  onChange={(e) => handleConfigChange('safety', 'max_messages_per_day', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.safety?.enable_content_analysis || false}
                  onChange={(e) => handleConfigChange('safety', 'enable_content_analysis', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">Enable content analysis</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.safety?.enable_warmup_schedule || false}
                  onChange={(e) => handleConfigChange('safety', 'enable_warmup_schedule', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">Enable warmup schedule for new accounts</span>
              </label>
            </div>
          </div>
        </div>

        {/* File Paths */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">File Paths</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Groups File
              </label>
              <input
                type="text"
                value={config.paths?.groups_file || ''}
                onChange={(e) => handleConfigChange('paths', 'groups_file', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Messages Directory
              </label>
              <input
                type="text"
                value={config.paths?.messages_dir || ''}
                onChange={(e) => handleConfigChange('paths', 'messages_dir', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
            </div>

            <p className="text-gray-400 text-xs">
              File paths are read-only and managed by the system
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Getting Telegram API Credentials</h4>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">my.telegram.org/apps</a></li>
              <li>Log in with your phone number</li>
              <li>Create a new application</li>
              <li>Copy the API ID and API Hash</li>
              <li>Enter them in the configuration above</li>
            </ol>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Safety Recommendations</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Start with lower message limits for new accounts</li>
              <li>• Enable content analysis to avoid spam detection</li>
              <li>• Use random delays to appear more natural</li>
              <li>• Monitor account health regularly</li>
              <li>• Keep warmup schedule enabled for new accounts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigManager;