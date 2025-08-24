import React from 'react';

const AuthStatus = ({ authStatus, onRefresh }) => {
  if (!authStatus) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${authStatus.authenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-gray-300 text-sm">
          {authStatus.authenticated ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      {authStatus.authenticated && authStatus.phone_number && (
        <span className="text-gray-400 text-sm">
          {authStatus.phone_number}
        </span>
      )}

      <button
        onClick={onRefresh}
        className="text-gray-400 hover:text-white transition duration-200"
        title="Refresh status"
      >
        🔄
      </button>
    </div>
  );
};

export default AuthStatus;