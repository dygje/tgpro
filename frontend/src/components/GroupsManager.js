import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GroupsManager = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newGroup, setNewGroup] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/groups`);
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post(`${API}/groups`, { group_link: newGroup.trim() });
      setMessage('Group added successfully!');
      setNewGroup('');
      await loadGroups();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to add group');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGroup = async (groupLink) => {
    if (!window.confirm(`Remove group: ${groupLink}?`)) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.delete(`${API}/groups/${encodeURIComponent(groupLink)}`);
      setMessage('Group removed successfully!');
      await loadGroups();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to remove group');
    } finally {
      setLoading(false);
    }
  };

  const validateGroupLink = (link) => {
    const trimmed = link.trim();
    return trimmed.startsWith('https://t.me/') || trimmed.startsWith('@');
  };

  const getGroupDisplayName = (groupLink) => {
    if (groupLink.startsWith('https://t.me/')) {
      return groupLink.replace('https://t.me/', '@');
    }
    return groupLink;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Groups Management</h2>
          <p className="text-gray-400 mt-1">
            Manage your Telegram groups for automated messaging
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
          <span className="text-gray-400 text-sm">Total Groups: </span>
          <span className="text-white font-semibold">{groups.length}</span>
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

      {/* Add New Group Form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Group</h3>
        <form onSubmit={handleAddGroup} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Group Link or Username
            </label>
            <input
              type="text"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="https://t.me/groupname or @groupname"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="mt-2">
              <p className="text-gray-400 text-xs">
                ✓ Valid formats: <span className="text-green-400">https://t.me/groupname</span> or <span className="text-green-400">@groupname</span>
              </p>
              {newGroup && !validateGroupLink(newGroup) && (
                <p className="text-red-400 text-xs mt-1">
                  ⚠️ Invalid format. Use https://t.me/groupname or @groupname
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newGroup.trim() || !validateGroupLink(newGroup)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {loading ? 'Adding...' : 'Add Group'}
          </button>
        </form>
      </div>

      {/* Groups List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Current Groups</h3>
          <p className="text-gray-400 text-sm mt-1">
            Groups where messages will be sent automatically
          </p>
        </div>

        <div className="p-6">
          {loading && groups.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>No groups configured</p>
                <p className="text-sm mt-1">Add your first Telegram group to get started</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {getGroupDisplayName(group).charAt(1).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {getGroupDisplayName(group)}
                      </p>
                      <p className="text-gray-400 text-sm">{group}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveGroup(group)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition duration-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">How to Find Group Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Using Group Links</h4>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Open the Telegram group</li>
              <li>Tap/click on the group name at the top</li>
              <li>Look for "Invite Link" or "Link"</li>
              <li>Copy the link (starts with https://t.me/)</li>
              <li>Paste it in the form above</li>
            </ol>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Using Usernames</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Some groups have public usernames</li>
              <li>• These start with @ (e.g., @groupname)</li>
              <li>• You can use these instead of full links</li>
              <li>• Public groups are easier to find and join</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
          <p className="text-yellow-100 text-sm">
            <strong>Important:</strong> Only add groups where you have permission to send messages. 
            Unauthorized messaging may result in account restrictions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupsManager;