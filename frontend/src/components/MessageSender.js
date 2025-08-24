import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessageSender = () => {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customVariables, setCustomVariables] = useState('');
  const [specificGroups, setSpecificGroups] = useState('');
  const [useAllGroups, setUseAllGroups] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
    loadTasks();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadTasks = async () => {
    // Load recent tasks from localStorage for demo
    const storedTasks = localStorage.getItem('messageTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  };

  const handleSendMessages = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        template_id: selectedTemplate,
        custom_variables: customVariables ? JSON.parse(customVariables) : null,
        recipients: useAllGroups ? null : specificGroups.split('\n').filter(g => g.trim())
      };

      const response = await axios.post(`${API}/messages/send`, payload);
      
      const newTask = {
        ...response.data,
        created_at: new Date().toISOString(),
        template_id: selectedTemplate
      };

      const updatedTasks = [newTask, ...tasks.slice(0, 9)]; // Keep last 10 tasks
      setTasks(updatedTasks);
      localStorage.setItem('messageTasks', JSON.stringify(updatedTasks));

      setMessage(`Message sending started! Task ID: ${response.data.task_id}`);
      
      // Reset form
      setSelectedTemplate('');
      setCustomVariables('');
      setSpecificGroups('');
      setUseAllGroups(true);

    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to start message sending');
    } finally {
      setLoading(false);
    }
  };

  const checkTaskStatus = async (taskId) => {
    try {
      const response = await axios.get(`${API}/tasks/${taskId}`);
      const updatedTasks = tasks.map(task => 
        task.task_id === taskId ? { ...task, ...response.data } : task
      );
      setTasks(updatedTasks);
      localStorage.setItem('messageTasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error checking task status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      case 'pending': return '⏸️';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Form */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">Send Messages to Groups</h2>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSendMessages}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Message Template *
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a template...</option>
                  {Object.entries(templates).map(([id, template]) => (
                    <option key={id} value={id}>
                      {id} ({template.message_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Target Groups
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useAllGroups}
                      onChange={() => setUseAllGroups(true)}
                      className="mr-2"
                    />
                    <span className="text-gray-300">All groups from groups.txt</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useAllGroups}
                      onChange={() => setUseAllGroups(false)}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Specific groups</span>
                  </label>
                </div>
              </div>

              {!useAllGroups && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Group Links/Usernames
                  </label>
                  <textarea
                    value={specificGroups}
                    onChange={(e) => setSpecificGroups(e.target.value)}
                    placeholder="@group1&#10;https://t.me/group2&#10;@group3"
                    rows="4"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Enter one group per line (usernames or links)
                  </p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Custom Variables (JSON)
                </label>
                <textarea
                  value={customVariables}
                  onChange={(e) => setCustomVariables(e.target.value)}
                  placeholder='{"name": "John", "product": "Amazing Product"}'
                  rows="4"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Optional JSON object with variables for template substitution
                </p>
              </div>

              <div className="bg-gray-700 rounded-md p-4">
                <h3 className="text-sm font-medium text-white mb-2">⚠️ Safety Features</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Random delays between messages (5-10 seconds)</li>
                  <li>• Automatic blacklist checking</li>
                  <li>• Flood wait handling</li>
                  <li>• Account health monitoring</li>
                  <li>• Rate limiting protection</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || !selectedTemplate}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-6 rounded-md transition duration-200"
            >
              {loading ? 'Starting...' : 'Start Sending Messages'}
            </button>
          </div>
        </form>
      </div>

      {/* Task History */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
          <button
            onClick={loadTasks}
            className="text-gray-400 hover:text-white transition duration-200"
            title="Refresh tasks"
          >
            🔄
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No tasks yet</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.task_id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(task.status)}</span>
                    <div>
                      <p className="text-white font-medium">
                        {task.template_id || 'Unknown Template'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        ID: {task.task_id?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`font-medium ${getStatusColor(task.status)}`}>
                      {task.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    
                    {(task.status === 'pending' || task.status === 'running') && (
                      <button
                        onClick={() => checkTaskStatus(task.task_id)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Check Status
                      </button>
                    )}
                  </div>
                </div>

                {task.progress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{task.progress.current || 0}/{task.progress.total || 0}</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{
                          width: `${task.progress.total > 0 ? (task.progress.current / task.progress.total) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Sent: {task.progress.sent || 0}</span>
                      <span>Failed: {task.progress.failed || 0}</span>
                      <span>Skipped: {task.progress.skipped || 0}</span>
                    </div>
                  </div>
                )}

                {task.results && (
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{task.results.sent?.length || 0}</div>
                      <div className="text-gray-400">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 font-bold">{task.results.failed?.length || 0}</div>
                      <div className="text-gray-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold">{task.results.skipped?.length || 0}</div>
                      <div className="text-gray-400">Skipped</div>
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  Created: {new Date(task.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSender;