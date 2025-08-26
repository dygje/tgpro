import React, { useState } from 'react';
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
  FiChevronLeft,
  FiChevronRight,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Precision colors
  const bgColor = useColorModeValue('white', 'gray.950');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const activeBg = useColorModeValue('gray.100', 'gray.800');
  const activeColor = useColorModeValue('gray.900', 'gray.100');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.850');

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: FiHome },
        { id: 'messageSender', label: 'Send Messages', icon: FiSend },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'groupsManager', label: 'Groups', icon: FiUsers },
        { id: 'messagesManager', label: 'Messages', icon: FiMessageSquare },
        { id: 'templateManager', label: 'Templates', icon: FiFileText },
        { id: 'blacklistManager', label: 'Blacklist', icon: FiShield },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'configManager', label: 'Settings', icon: FiSettings },
        { id: 'logViewer', label: 'Logs', icon: FiActivity, badge: 'Live' },
      ]
    }
  ];

  const MenuItem = ({ item, isCollapsed }: { item: any; isCollapsed: boolean }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    const button = (
      <Button
        variant="ghost"
        size="sm"
        w="full"
        h="36px"
        px={isCollapsed ? 3 : 3}
        justifyContent={isCollapsed ? "center" : "flex-start"}
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : textColor}
        borderRadius="lg"
        fontWeight={isActive ? 500 : 400}
        fontSize="sm"
        transition="all 0.15s ease"
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: isActive ? activeColor : useColorModeValue('gray.900', 'gray.100'),
        }}
        _active={{
          bg: activeBg,
        }}
        onClick={() => setActiveTab(item.id)}
        className={isActive ? '' : 'interactive'}
      >
        {isCollapsed ? (
          <Icon size={16} />
        ) : (
          <HStack spacing={3} w="full">
            <Icon size={16} />
            <Text fontSize="sm" flex={1} textAlign="left">
              {item.label}
            </Text>
            {item.badge && (
              <Badge 
                size="sm" 
                colorScheme="green" 
                variant="subtle"
                borderRadius="md"
                px={2}
                py={0.5}
                fontSize="xs"
                fontWeight={500}
              >
                {item.badge}
              </Badge>
            )}
          </HStack>
        )}
      </Button>
    );

    return isCollapsed ? (
      <Tooltip label={item.label} placement="right" hasArrow>
        {button}
      </Tooltip>
    ) : button;
  };

  const sidebarWidth = isCollapsed ? "72px" : "256px";

  return (
    <Box
      w={sidebarWidth}
      h="100vh"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
      left={0}
      zIndex={20}
      display="flex"
      flexDirection="column"
      transition="width 0.2s ease"
      className="slide-in"
    >
      {/* Header - Precision Layout */}
      <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
        <Flex align="center" justify="space-between" h="32px">
          {!isCollapsed && (
            <HStack spacing={3} flex={1}>
              <Box
                w={8}
                h={8}
                bg="gray.900"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                _dark={{ bg: 'gray.100' }}
                shadow="sm"
              >
                <FiZap color={useColorModeValue('white', 'black')} size={16} />
              </Box>
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="md" fontWeight={600} color={textColor} lineHeight="shorter">
                  TGPro
                </Text>
                <Text fontSize="xs" color={mutedColor} lineHeight="shorter">
                  Automation Platform
                </Text>
              </VStack>
            </HStack>
          )}
          
          <HStack spacing={1}>
            {!isCollapsed && (
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                size="sm"
                variant="ghost"
                onClick={toggleColorMode}
                borderRadius="md"
              />
            )}
            <IconButton
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              icon={isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              borderRadius="md"
            />
          </HStack>
        </Flex>
        
        {/* Collapsed header */}
        {isCollapsed && (
          <VStack spacing={3} mt={4}>
            <Tooltip label="TGPro" placement="right">
              <Box
                w={8}
                h={8}
                bg="gray.900"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _dark={{ bg: 'gray.100' }}
                shadow="sm"
              >
                <FiZap color={useColorModeValue('white', 'black')} size={16} />
              </Box>
            </Tooltip>
            <Tooltip label="Toggle theme" placement="right">
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                size="sm"
                variant="ghost"
                onClick={toggleColorMode}
                borderRadius="md"
              />
            </Tooltip>
          </VStack>
        )}
      </Box>

      {/* Navigation Menu - Precision Grid */}
      <Box flex={1} p={3} overflowY="auto" className="custom-scrollbar">
        <VStack spacing={6} align="stretch">
          {menuSections.map((section, sectionIndex) => (
            <Box key={section.title}>
              {!isCollapsed && (
                <Text 
                  fontSize="xs" 
                  fontWeight={600} 
                  color={mutedColor} 
                  textTransform="uppercase" 
                  letterSpacing="wide"
                  mb={3}
                  px={3}
                >
                  {section.title}
                </Text>
              )}
              
              <VStack spacing={1} align="stretch">
                {section.items.map((item) => (
                  <MenuItem key={item.id} item={item} isCollapsed={isCollapsed} />
                ))}
              </VStack>
              
              {/* Precision dividers when collapsed */}
              {isCollapsed && sectionIndex < menuSections.length - 1 && (
                <Divider my={4} />
              )}
            </Box>
          ))}
        </VStack>
      </Box>

      {/* User Profile & Logout - Precision Layout */}
      <Box p={3} borderTop="1px solid" borderColor={borderColor}>
        {!isCollapsed ? (
          <VStack spacing={3}>
            {/* User Profile Card */}
            <Box
              w="full"
              p={3}
              bg={hoverBg}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
            >
              <HStack spacing={3}>
                <Avatar 
                  size="sm" 
                  name="TG User" 
                  bg="gray.600" 
                  color="white"
                  w={7}
                  h={7}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" fontWeight={500} color={textColor} lineHeight="shorter">
                    Telegram User
                  </Text>
                  <HStack spacing={2}>
                    <Badge 
                      colorScheme="green" 
                      variant="subtle" 
                      size="sm"
                      borderRadius="md"
                    >
                      Online
                    </Badge>
                    <Text fontSize="xs" color={mutedColor} lineHeight="shorter">
                      Authenticated
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
            </Box>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              w="full"
              h="36px"
              justifyContent="flex-start"
              color={mutedColor}
              fontWeight={400}
              fontSize="sm"
              _hover={{
                bg: useColorModeValue('red.50', 'red.900'),
                color: useColorModeValue('red.600', 'red.300'),
              }}
              onClick={onLogout}
              borderRadius="lg"
              className="interactive"
            >
              <HStack spacing={3}>
                <FiLogOut size={16} />
                <Text fontSize="sm">Sign Out</Text>
              </HStack>
            </Button>
          </VStack>
        ) : (
          <VStack spacing={3}>
            <Tooltip label="User profile" placement="right">
              <Avatar 
                size="md" 
                name="TG User" 
                bg="gray.600" 
                color="white"
                w={8}
                h={8}
                cursor="pointer"
                className="interactive"
              />
            </Tooltip>
            <Tooltip label="Sign out" placement="right">
              <IconButton
                aria-label="Sign out"
                icon={<FiLogOut />}
                size="sm"
                variant="ghost"
                color={mutedColor}
                _hover={{
                  bg: useColorModeValue('red.50', 'red.900'),
                  color: useColorModeValue('red.600', 'red.300'),
                }}
                onClick={onLogout}
                borderRadius="md"
                className="interactive"
              />
            </Tooltip>
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;