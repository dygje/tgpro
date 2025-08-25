import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Badge,
  Tooltip,
  useColorModeValue,
  IconButton,
  Divider,
  Flex,
} from '@chakra-ui/react';
import {
  FiHome,
  FiSend,
  FiUsers,
  FiMessageSquare,
  FiFileText,
  FiShield,
  FiSettings,
  FiActivity,
  FiLogOut,
  FiMoon,
  FiSun,
  FiZap,
} from 'react-icons/fi';
import { useColorMode } from '@chakra-ui/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  // Modern color scheme
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.600', 'brand.300');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiHome,
      badge: null,
    },
    {
      id: 'messageSender',
      label: 'Send Messages',
      icon: FiSend,
      badge: null,
    },
    {
      id: 'groupsManager',
      label: 'Groups',
      icon: FiUsers,
      badge: null,
    },
    {
      id: 'messagesManager',
      label: 'Messages',
      icon: FiMessageSquare,
      badge: null,
    },
    {
      id: 'templateManager',
      label: 'Templates',
      icon: FiFileText,
      badge: null,
    },
    {
      id: 'blacklistManager',
      label: 'Blacklist',
      icon: FiShield,
      badge: null,
    },
    {
      id: 'configManager',
      label: 'Settings',
      icon: FiSettings,
      badge: null,
    },
    {
      id: 'logViewer',
      label: 'Logs',
      icon: FiActivity,
      badge: 'Live',
    },
  ];

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <Tooltip label={item.label} placement="right" hasArrow>
        <Button
          variant="ghost"
          size="sm"
          w="full"
          h="44px"
          px={3}
          py={2}
          justifyContent="flex-start"
          bg={isActive ? activeBg : 'transparent'}
          color={isActive ? activeColor : textColor}
          borderRadius="lg"
          fontWeight={isActive ? 600 : 500}
          fontSize="sm"
          _hover={{
            bg: isActive ? activeBg : useColorModeValue('gray.100', 'gray.700'),
            color: isActive ? activeColor : useColorModeValue('gray.800', 'gray.200'),
          }}
          _active={{
            bg: activeBg,
          }}
          onClick={() => setActiveTab(item.id)}
          position="relative"
        >
          <HStack spacing={3} w="full">
            <Box flexShrink={0}>
              <Icon size={18} />
            </Box>
            <Text fontSize="sm" fontWeight="inherit" flex={1} textAlign="left">
              {item.label}
            </Text>
            {item.badge && (
              <Badge 
                size="sm" 
                colorScheme="green" 
                variant="subtle"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
                fontWeight={500}
              >
                {item.badge}
              </Badge>
            )}
          </HStack>
        </Button>
      </Tooltip>
    );
  };

  return (
    <Box
      w="260px"
      h="100vh"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
      left={0}
      zIndex={10}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
        <HStack spacing={3}>
          <Box
            w={8}
            h={8}
            bg="brand.500"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <FiZap color="white" size={16} />
          </Box>
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight={700} color={textColor} lineHeight={1.2}>
              TGPro
            </Text>
            <Text fontSize="xs" color={mutedColor} lineHeight={1.2}>
              Automation
            </Text>
          </VStack>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            size="sm"
            variant="ghost"
            onClick={toggleColorMode}
            borderRadius="md"
          />
        </HStack>
      </Box>

      {/* Navigation Menu */}
      <Box flex={1} p={3} overflowY="auto">
        <VStack spacing={1} align="stretch">
          {/* Main Navigation */}
          <Box>
            <Text 
              fontSize="xs" 
              fontWeight={600} 
              color={mutedColor} 
              textTransform="uppercase" 
              letterSpacing="wider"
              mb={2}
              px={3}
            >
              Main
            </Text>
            <VStack spacing={1}>
              {menuItems.slice(0, 2).map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </VStack>
          </Box>

          {/* Management Section */}
          <Box mt={4}>
            <Text 
              fontSize="xs" 
              fontWeight={600} 
              color={mutedColor} 
              textTransform="uppercase" 
              letterSpacing="wider"
              mb={2}
              px={3}
            >
              Management
            </Text>
            <VStack spacing={1}>
              {menuItems.slice(2, 6).map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </VStack>
          </Box>

          {/* System Section */}
          <Box mt={4}>
            <Text 
              fontSize="xs" 
              fontWeight={600} 
              color={mutedColor} 
              textTransform="uppercase" 
              letterSpacing="wider"
              mb={2}
              px={3}
            >
              System
            </Text>
            <VStack spacing={1}>
              {menuItems.slice(6).map((item) => (
                <MenuItem key={item.id} item={item} />
              ))}
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* User Profile & Logout */}
      <Box p={3} borderTop="1px solid" borderColor={borderColor}>
        <VStack spacing={2}>
          {/* User Profile Compact */}
          <HStack
            w="full"
            p={2.5}
            bg={useColorModeValue('gray.50', 'gray.700')}
            borderRadius="lg"
            spacing={3}
          >
            <Avatar size="sm" name="TG User" bg="brand.500" color="white" />
            <VStack align="start" spacing={0} flex={1}>
              <Text fontSize="sm" fontWeight={600} color={textColor} lineHeight={1.2}>
                Telegram User
              </Text>
              <Text fontSize="xs" color={mutedColor} lineHeight={1.2}>
                Authenticated
              </Text>
            </VStack>
            <Badge 
              colorScheme="green" 
              variant="subtle" 
              size="sm"
              borderRadius="full"
            >
              •
            </Badge>
          </HStack>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            w="full"
            h="40px"
            justifyContent="flex-start"
            color={mutedColor}
            _hover={{
              bg: useColorModeValue('red.50', 'red.900'),
              color: useColorModeValue('red.600', 'red.300'),
            }}
            onClick={onLogout}
            borderRadius="lg"
          >
            <HStack spacing={3}>
              <FiLogOut size={16} />
              <Text fontSize="sm" fontWeight={500}>
                Sign Out
              </Text>
            </HStack>
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Sidebar;