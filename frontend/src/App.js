import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import LoginForm from './components/LoginForm';
import ApiConfiguration from './components/ApiConfiguration';
import Dashboard from './components/Dashboard';
import AuthStatus from './components/AuthStatus';
import MessageSender from './components/MessageSender';
import GroupsManager from './components/GroupsManager';
import MessagesManager from './components/MessagesManager';
import TemplateManager from './components/TemplateManager';
import BlacklistManager from './components/BlacklistManager';
import ConfigManager from './components/ConfigManager';
import LogViewer from './components/LogViewer';
import Sidebar from './components/Sidebar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API Key for authentication
const API_KEY = 'telegram-automation-key-2025';

// Configure axios defaults
axios.defaults.headers.common['Authorization'] = `Bearer ${API_KEY}`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/status`);
      setAuthStatus(response.data);
      setIsAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    checkAuthStatus();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthStatus(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Telegram Automation...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Telegram Automation</h1>
              <p className="text-gray-400">MTProto API Message Sender</p>
            </div>
            <LoginForm onAuthSuccess={handleAuthSuccess} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
            </h1>
            <AuthStatus authStatus={authStatus} onRefresh={checkAuthStatus} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'messageSender' && <MessageSender />}
          {activeTab === 'groupsManager' && <GroupsManager />}
          {activeTab === 'messagesManager' && <MessagesManager />}
          {activeTab === 'templateManager' && <TemplateManager />}
          {activeTab === 'blacklistManager' && <BlacklistManager />}
          {activeTab === 'configManager' && <ConfigManager />}
          {activeTab === 'logViewer' && <LogViewer />}
        </main>
      </div>
    </div>
  );
}

export default App;