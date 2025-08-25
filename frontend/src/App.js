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
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await checkApiConfiguration();
      if (isApiConfigured) {
        await checkAuthStatus();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApiConfiguration = async () => {
    try {
      const response = await axios.get(`${API}/auth/configuration`);
      const configured = response.data.configured;
      setIsApiConfigured(configured);
      return configured;
    } catch (error) {
      console.error('Error checking API configuration:', error);
      setIsApiConfigured(false);
      return false;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/status`);
      setAuthStatus(response.data);
      setIsAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const handleApiConfigured = async () => {
    setIsApiConfigured(true);
    // After API is configured, check auth status
    await checkAuthStatus();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="card max-w-sm animate-fade-in">
          <div className="p-8 text-center">
            <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading Telegram Automation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show API configuration if not configured
  if (!isApiConfigured) {
    return (
      <ApiConfiguration 
        onConfigured={handleApiConfigured}
        onSkip={handleApiConfigured}
      />
    );
  }

  // Show login if API is configured but not authenticated
  if (!isAuthenticated) {
    return <LoginForm onAuthSuccess={handleAuthSuccess} />;
  }

  // Show main dashboard if authenticated
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white font-display">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
            </h1>
            <AuthStatus authStatus={authStatus} onRefresh={checkAuthStatus} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto custom-scrollbar">
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