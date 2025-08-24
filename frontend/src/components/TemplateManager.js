import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TemplateManager = () => {
  const [templates, setTemplates] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    template_id: '',
    content: '',
    variables: {}
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        template_id: formData.template_id,
        content: formData.content,
        variables: Object.keys(formData.variables).length > 0 ? formData.variables : null
      };

      await axios.post(`${API}/templates`, payload);
      
      setMessage(`Template "${formData.template_id}" created successfully!`);
      setShowCreateForm(false);
      setFormData({ template_id: '', content: '', variables: {} });
      
      // Reload templates
      await loadTemplates();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleVariableChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value.split(',').map(v => v.trim()).filter(v => v)
      }
    }));
  };

  const addVariableField = () => {
    const key = prompt('Enter variable name:');
    if (key && key.trim()) {
      setFormData(prev => ({
        ...prev,
        variables: {
          ...prev.variables,
          [key.trim()]: []
        }
      }));
    }
  };

  const removeVariable = (key) => {
    setFormData(prev => {
      const newVariables = { ...prev.variables };
      delete newVariables[key];
      return { ...prev, variables: newVariables };
    });
  };

  const getPreviewContent = () => {
    let preview = formData.content;
    Object.keys(formData.variables).forEach(key => {
      const values = formData.variables[key];
      if (values.length > 0) {
        preview = preview.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), `[${values[0]}]`);
      }
    });
    return preview;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Message Templates</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          {showCreateForm ? 'Cancel' : '+ New Template'}
        </button>
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

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Template</h3>
          
          <form onSubmit={handleCreateTemplate}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Template ID *
                  </label>
                  <input
                    type="text"
                    value={formData.template_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_id: e.target.value }))}
                    placeholder="e.g., welcome_message, promotion_1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Hello {{ name }}! Welcome to our {{ product }}. Use code {{ discount_code }} for {{ discount }}% off!"
                    rows="6"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    Use {{ variable_name }} for dynamic content
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-300 text-sm font-medium">
                      Template Variables
                    </label>
                    <button
                      type="button"
                      onClick={addVariableField}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      + Add Variable
                    </button>
                  </div>
                  
                  {Object.keys(formData.variables).length === 0 ? (
                    <p className="text-gray-500 text-sm">No variables defined</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(formData.variables).map(([key, values]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <div className="flex-1">
                            <label className="block text-gray-400 text-xs">{key}</label>
                            <input
                              type="text"
                              value={values.join(', ')}
                              onChange={(e) => handleVariableChange(key, e.target.value)}
                              placeholder="option1, option2, option3"
                              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariable(key)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Enter comma-separated values for each variable
                  </p>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Preview
                  </label>
                  <div className="bg-gray-700 border border-gray-600 rounded-md p-3 min-h-[150px]">
                    <p className="text-white whitespace-pre-wrap">
                      {getPreviewContent() || 'Enter content to see preview...'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-md p-4">
                  <h4 className="text-sm font-medium text-white mb-2">💡 Template Tips</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Use {{ variable_name }} for dynamic content</li>
                    <li>• Variables will be randomly selected from options</li>
                    <li>• Keep messages natural and conversational</li>
                    <li>• Avoid spam keywords and excessive punctuation</li>
                    <li>• Test templates before using in campaigns</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Available Templates</h3>
          <button
            onClick={loadTemplates}
            className="text-gray-400 hover:text-white transition duration-200"
            title="Refresh templates"
          >
            🔄 Refresh
          </button>
        </div>

        {Object.keys(templates).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No templates created yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Create Your First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(templates).map(([id, template]) => (
              <div key={id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium">{id}</h4>
                  <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs">
                    {template.message_type}
                  </span>
                </div>
                
                <div className="text-gray-400 text-sm mb-3">
                  Variables: {template.variable_count || 0}
                  {template.has_variables && (
                    <span className="ml-2 text-green-400">✓</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition duration-200">
                    Use Template
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1 rounded transition duration-200">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;