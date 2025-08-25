import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    health: null,
    groups: { total: 0 },
    messageFiles: { total: 0 },
    blacklist: { permanent_count: 0, temporary_count: 0 },
    templates: {}
  });
  const [accountHealth, setAccountHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Auto refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [healthRes, groupsRes, messagesRes, blacklistRes, templatesRes, authRes] = await Promise.all([
        axios.get(`${API}/health`, {
          headers: { 'Authorization': 'Bearer telegram-automation-key-2025' }
        }),
        axios.get(`${API}/groups`, {
          headers: { 'Authorization': 'Bearer telegram-automation-key-2025' }
        }),
        axios.get(`${API}/messages`, {
          headers: { 'Authorization': 'Bearer telegram-automation-key-2025' }
        }),
        axios.get(`${API}/blacklist`, {
          headers: { 'Authorization': 'Bearer telegram-automation-key-2025' }
        }),
        axios.get(`${API}/templates`, {
          headers: { 'Authorization': 'Bearer telegram-automation-key-2025' }
        }),
        axios.get(`${API}/auth/status`, {
          headers: { 'Authorization': 'Bearer telegram-automation-key-2025' }
        })
      ]);

      setStats({
        health: healthRes.data,
        groups: groupsRes.data,
        messageFiles: messagesRes.data,
        blacklist: blacklistRes.data,
        templates: templatesRes.data
      });

      if (authRes.data.account_health) {
        setAccountHealth(authRes.data.account_health);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, description, color = "blue", trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${
              trend.type === 'up' ? 'text-green-600' : trend.type === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend.type === 'up' && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend.type === 'down' && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trend.value}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const ServiceStatus = ({ name, status, description }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          status ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        status 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {status ? 'Running' : 'Stopped'}
      </span>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your Telegram automation system</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Groups"
          value={stats.groups.total || 0}
          description="Telegram groups managed"
          color="blue"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <StatCard
          title="Message Files"
          value={stats.messageFiles.total || 0}
          description="Available message templates"
          color="green"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />

        <StatCard
          title="Blocked Groups"
          value={(stats.blacklist.permanent_count || 0) + (stats.blacklist.temporary_count || 0)}
          description={`${stats.blacklist.permanent_count || 0} permanent, ${stats.blacklist.temporary_count || 0} temporary`}
          color="red"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          }
        />

        <StatCard
          title="System Health"
          value={stats.health?.status === 'healthy' ? 'Good' : 'Issues'}
          description="Overall system status"
          color={stats.health?.status === 'healthy' ? 'green' : 'yellow'}
          icon={
            <svg className={`w-6 h-6 ${stats.health?.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <ServiceStatus
              name="FastAPI Backend"
              status={stats.health?.services?.telegram_service}
              description="Main application server"
            />
            <ServiceStatus
              name="MongoDB Database"
              status={stats.health?.services?.config_manager}
              description="Data storage and management"
            />
            <ServiceStatus
              name="Telegram Service"
              status={stats.health?.services?.telegram_service}
              description="MTProto API connection"
            />
            <ServiceStatus
              name="Blacklist Manager"
              status={stats.health?.services?.blacklist_manager}
              description="Group filtering system"
            />
          </div>
        </div>

        {/* Account Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Health</h2>
          {accountHealth ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Risk Level</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  accountHealth.risk_level === 'low' 
                    ? 'bg-green-100 text-green-800'
                    : accountHealth.risk_level === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {accountHealth.risk_level.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold text-gray-900">{accountHealth.success_rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Messages Today</span>
                <span className="font-semibold text-gray-900">{accountHealth.messages_sent_today || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Activity</span>
                <span className="text-sm text-gray-500">
                  {accountHealth.last_activity ? new Date(accountHealth.last_activity).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-gray-500">No account data available</p>
              <p className="text-sm text-gray-400 mt-1">Connect your Telegram account to see health metrics</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Send Message</p>
              <p className="text-sm text-gray-500">Send messages to groups</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Manage Groups</p>
              <p className="text-sm text-gray-500">Add or remove groups</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">View Logs</p>
              <p className="text-sm text-gray-500">Check system activity</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;