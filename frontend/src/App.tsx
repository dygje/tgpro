import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { api } from './lib/api';
import { AuthStatus as AuthStatusType, TelegramConfig } from './types';

// Components
import UnifiedAuth from './components/UnifiedAuth';
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Theme colors
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, indigo.50)', 
    'linear(to-br, gray.900, blue.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await api.auth.status();
      setAuthStatus(response);
      setIsAuthenticated(response.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
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

  // Loading state
  if (loading) {
    return (
      <Flex
        minH="100vh"
        bgGradient={bgGradient}
        align="center"
        justify="center"
      >
        <Box
          bg={cardBg}
          p={8}
          borderRadius="xl"
          shadow="xl"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <VStack spacing={4}>
            <Spinner size="lg" color="brand.500" thickness="4px" />
            <Text color="gray.600" fontSize="sm">
              Loading Telegram Automation...
            </Text>
          </VStack>
        </Box>
      </Flex>
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
    <Flex minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <Flex flex={1} direction="column">
        {/* Header */}
        <Box
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          px={6}
          py={4}
          _dark={{ 
            bg: 'gray.800',
            borderColor: 'gray.700'
          }}
        >
          <Flex align="center" justify="space-between">
            <Text fontSize="xl" fontWeight="semibold" color="gray.800" _dark={{ color: 'white' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
            </Text>
            <AuthStatus authStatus={authStatus} onRefresh={checkAuthStatus} />
          </Flex>
        </Box>

        {/* Main Content */}
        <Box flex={1} p={6} overflowY="auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'messageSender' && <MessageSender />}
          {activeTab === 'groupsManager' && <GroupsManager />}
          {activeTab === 'messagesManager' && <MessagesManager />}
          {activeTab === 'templateManager' && <TemplateManager />}
          {activeTab === 'blacklistManager' && <BlacklistManager />}
          {activeTab === 'configManager' && <ConfigManager />}
          {activeTab === 'logViewer' && <LogViewer />}
        </Box>
      </Flex>
    </Flex>
  );
}

export default App;