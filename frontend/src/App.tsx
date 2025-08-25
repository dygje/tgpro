import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Container,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
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
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const surfaceBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
        bg={bgColor}
        align="center"
        justify="center"
      >
        <Box
          bg={surfaceBg}
          p={8}
          borderRadius="xl"
          shadow="lg"
          border="1px solid"
          borderColor={borderColor}
          minW="300px"
        >
          <VStack spacing={4}>
            <Box
              w={12}
              h={12}
              bg="brand.500"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner size="md" color="white" thickness="3px" />
            </Box>
            <VStack spacing={1}>
              <Text fontWeight={600} fontSize="lg" color="text-primary">
                TGPro
              </Text>
              <Text color="text-secondary" fontSize="sm">
                Loading automation platform...
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Flex>
    );
  }

  // Show unified auth if not authenticated
  if (!isAuthenticated) {
    return <UnifiedAuth onAuthSuccess={handleAuthSuccess} />;
  }

  // Show main dashboard if authenticated
  return (
    <Flex minH="100vh" bg={bgColor}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <Flex flex={1} direction="column" overflow="hidden">
        {/* Modern Header */}
        <Box
          bg={surfaceBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          px={6}
          py={4}
          position="sticky"
          top={0}
          zIndex={5}
          backdropFilter="blur(10px)"
          bg={useColorModeValue('white/95', 'gray.800/95')}
        >
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={700} color="text-primary" lineHeight={1.2}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
                </Text>
                <Text fontSize="xs" color="text-secondary" lineHeight={1.2}>
                  {getPageDescription(activeTab)}
                </Text>
              </VStack>
            </HStack>
            
            <HStack spacing={3}>
              <AuthStatus authStatus={authStatus} onRefresh={checkAuthStatus} />
              <IconButton
                aria-label="Refresh"
                icon={<FiRefreshCw />}
                size="sm"
                variant="ghost"
                onClick={checkAuthStatus}
                borderRadius="md"
              />
            </HStack>
          </Flex>
        </Box>

        {/* Main Content Area */}
        <Box flex={1} overflow="auto">
          <Container maxW="full" p={6} h="full">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'messageSender' && <MessageSender />}
            {activeTab === 'groupsManager' && <GroupsManager />}
            {activeTab === 'messagesManager' && <MessagesManager />}
            {activeTab === 'templateManager' && <TemplateManager />}
            {activeTab === 'blacklistManager' && <BlacklistManager />}
            {activeTab === 'configManager' && <ConfigManager />}
            {activeTab === 'logViewer' && <LogViewer />}
          </Container>
        </Box>
      </Flex>
    </Flex>
  );

  // Helper function for page descriptions
  function getPageDescription(tab: string): string {
    const descriptions: Record<string, string> = {
      dashboard: 'Overview and system status',
      messageSender: 'Send automated messages to groups',
      groupsManager: 'Manage target groups and channels',
      messagesManager: 'Create and edit message templates',
      templateManager: 'Template library and variables',
      blacklistManager: 'Block unwanted contacts',
      configManager: 'System settings and preferences',
      logViewer: 'Real-time logs and monitoring',
    };
    return descriptions[tab] || '';
  }
}

export default App;