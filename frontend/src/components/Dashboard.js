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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [healthRes, groupsRes, messagesRes, blacklistRes, templatesRes, authRes] = await Promise.all([
        axios.get(`${API}/health`),
        axios.get(`${API}/groups`),
        axios.get(`${API}/messages`),
        axios.get(`${API}/blacklist`),
        axios.get(`${API}/templates`),
        axios.get(`${API}/auth/status`)
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, color = 'blue', subtitle = null }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold text-${color}-400 mt-1`}>{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Service Status</h2>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${stats.health?.telegram_initialized ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-3 h-3 rounded-full ${stats.health?.telegram_initialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {stats.health?.telegram_initialized ? 'Telegram Service Active' : 'Telegram Service Inactive'}
            </span>
          </div>
          <button
            onClick={loadDashboardData}
            className="text-gray-400 hover:text-white transition duration-200"
            title="Refresh data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Groups"
          value={stats.groups.total}
          icon="👥"
          color="blue"
          subtitle="from groups.txt"
        />
        <StatCard
          title="Message Files"
          value={stats.messageFiles.total}
          icon="📝"
          color="green"
          subtitle="in messages/"
        />
        <StatCard
          title="Templates"
          value={Object.keys(stats.templates).length}
          icon="📋"
          color="purple"
          subtitle="configured"
        />
        <StatCard
          title="Blacklisted"
          value={stats.blacklist.permanent_count + stats.blacklist.temporary_count}
          icon="🚫"
          color="red"
          subtitle={`${stats.blacklist.permanent_count} permanent, ${stats.blacklist.temporary_count} temporary`}
        />
      </div>

      {/* Account Health */}
      {accountHealth && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Account Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Messages Today</p>
              <p className="text-xl font-bold text-white">{accountHealth.account_health?.messages_sent_today || 0}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Messages This Hour</p>
              <p className="text-xl font-bold text-white">{accountHealth.account_health?.messages_sent_this_hour || 0}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-xl font-bold text-green-400">{accountHealth.account_health?.success_rate || 'N/A'}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Risk Level</p>
              <p className={`text-xl font-bold text-${getRiskLevelColor(accountHealth.current_risk_assessment?.risk_level)}-400`}>
                {accountHealth.current_risk_assessment?.risk_level?.toUpperCase() || 'UNKNOWN'}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Account Age</p>
              <p className="text-xl font-bold text-white">{accountHealth.account_health?.account_age_days || 0} days</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Warmup Progress</p>
              <p className="text-xl font-bold text-blue-400">{accountHealth.warmup_status?.progress || '0%'}</p>
            </div>
          </div>

          {/* Recommendations */}
          {accountHealth.recommendations && accountHealth.recommendations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-medium text-white mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {accountHealth.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-400 text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '#messageSender'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2"
          >
            <span>📤</span>
            <span>Send Messages</span>
          </button>
          <button
            onClick={() => window.location.href = '#templateManager'}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2"
          >
            <span>📝</span>
            <span>Manage Templates</span>
          </button>
          <button
            onClick={() => window.location.href = '#blacklistManager'}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-2"
          >
            <span>🚫</span>
            <span>View Blacklist</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;