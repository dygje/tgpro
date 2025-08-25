import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessagesManager = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  
  // Form state
  const [newMessageName, setNewMessageName] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/messages`);
      setMessages(response.data.message_files || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    if (!newMessageName.trim() || !newMessageContent.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post(`${API}/messages`, {
        filename: newMessageName.trim(),
        content: newMessageContent.trim()
      });
      setMessage('Message file created successfully!');
      setNewMessageName('');
      setNewMessageContent('');
      setShowCreateForm(false);
      await loadMessages();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create message file');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    if (!editingMessage || !newMessageContent.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.put(`${API}/messages/${editingMessage.filename}`, {
        content: newMessageContent.trim()
      });
      setMessage('Message file updated successfully!');
      setEditingMessage(null);
      setNewMessageContent('');
      await loadMessages();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update message file');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (filename) => {
    if (!window.confirm(`Delete message file: ${filename}?`)) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.delete(`${API}/messages/${filename}`);
      setMessage('Message file deleted successfully!');
      await loadMessages();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to delete message file');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setNewMessageContent(msg.content);
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessageContent('');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const getPreviewText = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Messages Management</h2>
          <p className="text-gray-400 mt-1">
            Create and manage message templates for automation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
            <span className="text-gray-400 text-sm">Total Messages: </span>
            <span className="text-white font-semibold">{messages.length}</span>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingMessage(null);
              setNewMessageName('');
              setNewMessageContent('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            {showCreateForm ? 'Cancel' : 'New Message'}
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

      {/* Create/Edit Form */}
      {(showCreateForm || editingMessage) && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingMessage ? `Edit: ${editingMessage.filename}` : 'Create New Message'}
          </h3>
          <form onSubmit={editingMessage ? handleUpdateMessage : handleCreateMessage} className="space-y-4">
            {!editingMessage && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Message File Name
                </label>
                <input
                  type="text"
                  value={newMessageName}
                  onChange={(e) => setNewMessageName(e.target.value)}
                  placeholder="my-message (will be saved as my-message.txt)"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Message Content
              </label>
              <textarea
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Enter your message content here..."
                rows="6"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                required
              />
              <p className="text-gray-400 text-xs mt-1">
                Character count: {newMessageContent.length}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !newMessageContent.trim() || (!editingMessage && !newMessageName.trim())}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                {loading ? (editingMessage ? 'Updating...' : 'Creating...') : (editingMessage ? 'Update Message' : 'Create Message')}
              </button>
              <button
                type="button"
                onClick={editingMessage ? cancelEdit : () => setShowCreateForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Message Files</h3>
          <p className="text-gray-400 text-sm mt-1">
            Manage your message templates and content
          </p>
        </div>

        <div className="p-6">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No message files found</p>
                <p className="text-sm mt-1">Create your first message template to get started</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-white font-medium">{msg.filename}</h4>
                        <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                          {formatFileSize(msg.size)}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {getPreviewText(msg.content)}
                        </p>
                      </div>
                      
                      <p className="text-gray-400 text-xs">
                        Last modified: {new Date(msg.modified).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditMessage(msg)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.filename)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Show full content if expanded */}
                  {msg.content.length > 100 && (
                    <details className="mt-3">
                      <summary className="text-blue-400 text-sm cursor-pointer hover:underline">
                        Show full content
                      </summary>
                      <div className="mt-2 p-3 bg-gray-800 rounded border text-gray-300 text-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Message Templates Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Creating Effective Messages</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Keep messages natural and conversational</li>
              <li>• Avoid spam keywords and excessive caps</li>
              <li>• Use varied content to prevent detection</li>
              <li>• Include relevant information for recipients</li>
              <li>• Test messages before automation</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Template Variables</h4>
            <p className="text-gray-400 text-sm mb-2">Use these variables in your templates:</p>
            <ul className="text-gray-400 text-sm space-y-1 font-mono">
              <li>• <span className="text-blue-400">{{ current_time }}</span> - Current time</li>
              <li>• <span className="text-blue-400">{{ current_date }}</span> - Current date</li>
              <li>• <span className="text-blue-400">{{ random_string }}</span> - Random letters</li>
              <li>• <span className="text-blue-400">{{ random_number }}</span> - Random number</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesManager;