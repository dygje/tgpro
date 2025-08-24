import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lineCount, setLineCount] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadLogs();
  }, [lineCount]);

  useEffect(() => {
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadLogs(true); // silent refresh
      }, 5000); // refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, lineCount]);

  const loadLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API}/logs?lines=${lineCount}`);
      setLogs(response.data.logs || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading logs:', error);
      setError('Failed to load logs');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getLogLevelColor = (line) => {
    if (line.includes('ERROR')) return 'text-red-400';
    if (line.includes('WARNING')) return 'text-yellow-400';
    if (line.includes('INFO')) return 'text-blue-400';
    if (line.includes('DEBUG')) return 'text-gray-400';
    return 'text-gray-300';
  };

  const getLogLevelIcon = (line) => {
    if (line.includes('ERROR')) return '❌';
    if (line.includes('WARNING')) return '⚠️';
    if (line.includes('INFO')) return 'ℹ️';
    if (line.includes('DEBUG')) return '🔍';
    return '📝';
  };

  const clearError = () => setError('');

  const handleDownloadLogs = () => {
    const logContent = logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram_automation_logs_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Application Logs</h2>
          <p className="text-gray-400 mt-1">
            View real-time application logs and debugging information
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={lineCount}
            onChange={(e) => setLineCount(parseInt(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded-md text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={50}>Last 50 lines</option>
            <option value={100}>Last 100 lines</option>
            <option value={200}>Last 200 lines</option>
            <option value={500}>Last 500 lines</option>
          </select>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-300 text-sm">Auto-refresh</span>
          </label>

          <button
            onClick={() => loadLogs()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>

          <button
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            📥 Download
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-300 hover:text-red-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-gray-300 text-sm">
                {autoRefresh ? 'Auto-refreshing' : 'Manual refresh'}
              </span>
            </div>
            
            {lastUpdate && (
              <span className="text-gray-400 text-sm">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="text-gray-400 text-sm">
            Showing {logs.length} log entries
          </div>
        </div>
      </div>

      {/* Log Display */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Log Entries</h3>
        </div>
        
        <div className="p-4">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No logs available</p>
              <button
                onClick={() => loadLogs()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Load Logs
              </button>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.map((line, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 py-1 px-2 rounded hover:bg-gray-700 ${getLogLevelColor(line)}`}
                >
                  <span className="flex-shrink-0 mt-0.5">
                    {getLogLevelIcon(line)}
                  </span>
                  <span className="flex-1 break-all">{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Level Legend */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Log Level Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <span>❌</span>
            <span className="text-red-400">ERROR</span>
            <span className="text-gray-400 text-sm">- Critical errors</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span className="text-yellow-400">WARNING</span>
            <span className="text-gray-400 text-sm">- Important notices</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>ℹ️</span>
            <span className="text-blue-400">INFO</span>
            <span className="text-gray-400 text-sm">- General information</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔍</span>
            <span className="text-gray-400">DEBUG</span>
            <span className="text-gray-400 text-sm">- Debug information</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;