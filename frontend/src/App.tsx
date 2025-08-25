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

  // Linear-style theme colors
  const bgColor = useColorModeValue('white', 'gray.950');
  const surfaceBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');

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
          p={6}
          borderRadius="md"
          shadow="sm"
          border="1px solid"
          borderColor={borderColor}
          minW="280px"
        >
          <VStack spacing={4}>
            <Box
              w={10}
              h={10}
              bg="gray.900"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              _dark={{
                bg: "gray.100"
              }}
            >
              <Spinner size="sm" color={useColorModeValue("white", "black")} thickness="2px" />
            </Box>
            <VStack spacing={1}>
              <Text fontWeight={600} fontSize="md" color="text-primary">
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
  // Temporarily show dashboard for design preview
  // if (!isAuthenticated) {
  //   return <UnifiedAuth onAuthSuccess={handleAuthSuccess} />;
  // }

  // Show main dashboard if authenticated
  return (
    <Flex minH="100vh" bg={bgColor}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <Flex flex={1} direction="column" overflow="hidden">
        {/* Linear-style Header */}
        <Box
          bg={surfaceBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          px={6}
          py={3}
          position="sticky"
          top={0}
          zIndex={5}
        >
          <Flex align="center" justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="md" fontWeight={600} color="text-primary" lineHeight={1.2}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              <Text fontSize="sm" color="text-secondary" lineHeight={1.2}>
                {getPageDescription(activeTab)}
              </Text>
            </VStack>
            
            <HStack spacing={2}>
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
          <Container maxW="full" p={4} h="full">
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