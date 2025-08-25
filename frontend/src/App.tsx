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

  // Precision theme colors
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

  // Precision loading state
  if (loading) {
    return (
      <Flex
        minH="100vh"
        bg={bgColor}
        align="center"
        justify="center"
        p={4}
      >
        <Box
          bg={surfaceBg}
          p={6}
          borderRadius="lg"
          shadow="sm"
          border="1px solid"
          borderColor={borderColor}
          w="320px"
        >
          <VStack spacing={6}>
            <Box
              w={12}
              h={12}
              bg="gray.900"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              _dark={{ bg: "gray.100" }}
            >
              <Spinner 
                size="md" 
                color={useColorModeValue("white", "black")} 
                thickness="2px"
                className="spin"
              />
            </Box>
            <VStack spacing={2} textAlign="center">
              <Text fontWeight={600} fontSize="lg" color="text-primary">
                TGPro
              </Text>
              <Text color="text-secondary" fontSize="sm" lineHeight="shorter">
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
    <Flex minH="100vh" bg={bgColor} className="fade-in">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <Flex flex={1} direction="column" overflow="hidden">
        {/* Precision Header */}
        <Box
          bg={surfaceBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          px={6}
          py={4}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Flex align="center" justify="space-between" h="32px">
            <VStack align="start" spacing={0}>
              <Text 
                fontSize="md" 
                fontWeight={600} 
                color="text-primary" 
                lineHeight="shorter"
              >
                {getPageTitle(activeTab)}
              </Text>
              <Text 
                fontSize="sm" 
                color="text-secondary" 
                lineHeight="shorter"
              >
                {getPageDescription(activeTab)}
              </Text>
            </VStack>
            
            <HStack spacing={3}>
              <AuthStatus authStatus={authStatus} onRefresh={checkAuthStatus} />
              <IconButton
                aria-label="Refresh"
                icon={<FiRefreshCw />}
                size="sm"
                variant="ghost"
                onClick={checkAuthStatus}
                isLoading={loading}
                borderRadius="md"
              />
            </HStack>
          </Flex>
        </Box>

        {/* Main Content Area - Precision Grid */}
        <Box flex={1} overflow="auto" className="custom-scrollbar">
          <Container maxW="full" p={6} h="full">
            <Box className="fade-in">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'messageSender' && <MessageSender />}
              {activeTab === 'groupsManager' && <GroupsManager />}
              {activeTab === 'messagesManager' && <MessagesManager />}
              {activeTab === 'templateManager' && <TemplateManager />}
              {activeTab === 'blacklistManager' && <BlacklistManager />}
              {activeTab === 'configManager' && <ConfigManager />}
              {activeTab === 'logViewer' && <LogViewer />}
            </Box>
          </Container>
        </Box>
      </Flex>
    </Flex>
  );
}

// Helper functions for page info
function getPageTitle(tab: string): string {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    messageSender: 'Send Messages',
    groupsManager: 'Groups Manager',
    messagesManager: 'Messages Manager',
    templateManager: 'Template Manager',
    blacklistManager: 'Blacklist Manager',
    configManager: 'Configuration',
    logViewer: 'System Logs',
  };
  return titles[tab] || '';
}

function getPageDescription(tab: string): string {
  const descriptions: Record<string, string> = {
    dashboard: 'System overview and analytics',
    messageSender: 'Send automated messages to groups',
    groupsManager: 'Manage target groups and channels',
    messagesManager: 'Create and edit message files',
    templateManager: 'Message templates and variables',
    blacklistManager: 'Block unwanted contacts and groups',
    configManager: 'System settings and preferences',
    logViewer: 'Real-time monitoring and logs',
  };
  return descriptions[tab] || '';
}

export default App;