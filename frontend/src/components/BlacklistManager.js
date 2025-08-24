import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BlacklistManager = () => {
  const [blacklist, setBlacklist] = useState({
    permanent_blacklist: [],
    temporary_blacklist: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroupLink, setNewGroupLink] = useState('');
  const [newGroupReason, setNewGroupReason] = useState('');

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/blacklist`);
      setBlacklist(response.data);
    } catch (error) {
      console.error('Error loading blacklist:', error);
      setError('Failed to load blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPermanentBlacklist = async (e) => {
    e.preventDefault();
    if (!newGroupLink.trim()) return;

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/blacklist/permanent`, {
        group_link: newGroupLink.trim(),
        reason: newGroupReason.trim() || 'Manual addition'
      });

      setMessage(`Added ${newGroupLink} to permanent blacklist`);
      setNewGroupLink('');
      setNewGroupReason('');
      setShowAddForm(false);
      
      // Reload blacklist
      await loadBlacklist();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to add to blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromPermanentBlacklist = async (groupLink) => {
    if (!window.confirm(`Remove ${groupLink} from permanent blacklist?`)) return;

    setLoading(true);
    setError('');

    try {
      await axios.delete(`${API}/blacklist/permanent/${encodeURIComponent(groupLink)}`);
      setMessage(`Removed ${groupLink} from permanent blacklist`);
      
      // Reload blacklist
      await loadBlacklist();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to remove from blacklist');
    } finally {
      setLoading(false);
    }
  };

  const getTemporaryBlacklistArray = () => {
    return Object.entries(blacklist.temporary_blacklist || {}).map(([groupLink, details]) => ({
      groupLink,
      ...details
    }));
  };

  const formatTimeRemaining = (expiresInMinutes) => {
    if (expiresInMinutes <= 0) return 'Expired';
    if (expiresInMinutes < 60) return `${expiresInMinutes}m`;
    const hours = Math.floor(expiresInMinutes / 60);
    const mins = expiresInMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'FloodWait': return 'text-yellow-400';
      case 'SlowModeWait': return 'text-orange-400';
      case 'ChatForbidden': return 'text-red-400';
      case 'ChatIdInvalid': return 'text-red-400';
      case 'UserBlocked': return 'text-red-400';
      case 'Manual': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getReasonIcon = (reason) => {
    switch (reason) {
      case 'FloodWait': return '⏱️';
      case 'SlowModeWait': return '🐌';
      case 'ChatForbidden': return '🚫';
      case 'ChatIdInvalid': return '❌';
      case 'UserBlocked': return '🚨';
      case 'Manual': return '👤';
      default: return '❓';
    }
  };

  if (loading && Object.keys(blacklist).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const permanentCount = blacklist.permanent_blacklist?.length || 0;
  const temporaryCount = Object.keys(blacklist.temporary_blacklist || {}).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Blacklist Management</h2>
          <p className="text-gray-400 mt-1">
            {permanentCount} permanent, {temporaryCount} temporary
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadBlacklist}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {showAddForm ? 'Cancel' : '+ Add to Blacklist'}
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

      {/* Add to Blacklist Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add to Permanent Blacklist</h3>
          
          <form onSubmit={handleAddToPermanentBlacklist}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Group Link/Username *
                </label>
                <input
                  type="text"
                  value={newGroupLink}
                  onChange={(e) => setNewGroupLink(e.target.value)}
                  placeholder="@groupname or https://t.me/groupname"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={newGroupReason}
                  onChange={(e) => setNewGroupReason(e.target.value)}
                  placeholder="Manual addition, Spam, etc."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                {loading ? 'Adding...' : 'Add to Blacklist'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permanent Blacklist */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="text-red-500 mr-2">🚫</span>
            Permanent Blacklist ({permanentCount})
          </h3>
          
          {permanentCount === 0 ? (
            <p className="text-gray-400 text-center py-4">No permanently blacklisted groups</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {blacklist.permanent_blacklist.map((groupLink, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium truncate">{groupLink}</p>
                    <p className="text-red-400 text-sm">Permanently blocked</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromPermanentBlacklist(groupLink)}
                    className="text-red-400 hover:text-red-300 ml-2"
                    title="Remove from blacklist"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Temporary Blacklist */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="text-yellow-500 mr-2">⏰</span>
            Temporary Blacklist ({temporaryCount})
          </h3>
          
          {temporaryCount === 0 ? (
            <p className="text-gray-400 text-center py-4">No temporarily blacklisted groups</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getTemporaryBlacklistArray().map((item, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium truncate">{item.groupLink}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-sm ${getReasonColor(item.reason)}`}>
                          {getReasonIcon(item.reason)} {item.reason}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-yellow-400 text-sm font-medium">
                        {formatTimeRemaining(item.expires_in_minutes)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(item.added_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Blacklist Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Automatic Blacklisting</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• <strong>Permanent:</strong> ChatForbidden, ChatIdInvalid, UserBlocked, PeerIdInvalid</li>
              <li>• <strong>Temporary:</strong> FloodWait, SlowModeWait (auto-expires)</li>
              <li>• Groups are checked before each message attempt</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Manual Management</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Add groups manually to permanent blacklist</li>
              <li>• Remove groups from permanent blacklist</li>
              <li>• Temporary blacklist entries auto-expire</li>
              <li>• Blacklist is checked before every message</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlacklistManager;