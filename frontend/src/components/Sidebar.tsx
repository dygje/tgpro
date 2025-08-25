import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  useColorModeValue,
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
} from 'react-icons/fi';
import { SidebarProps } from '@/types/components';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'messageSender', label: 'Message Sender', icon: FiSend },
  { id: 'groupsManager', label: 'Groups', icon: FiUsers },
  { id: 'messagesManager', label: 'Messages', icon: FiMessageSquare },
  { id: 'templateManager', label: 'Templates', icon: FiFileText },
  { id: 'blacklistManager', label: 'Blacklist', icon: FiShield },
  { id: 'configManager', label: 'Configuration', icon: FiSettings },
  { id: 'logViewer', label: 'Logs', icon: FiActivity },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.600', 'brand.200');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box
      w="280px"
      bg={bg}
      borderRight="1px solid"
      borderColor={borderColor}
      minH="100vh"
      p={4}
    >
      <VStack align="stretch" spacing={1}>
        {/* Logo/Title */}
        <Box p={4} mb={2}>
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="brand.600"
            textAlign="center"
          >
            Telegram Pro
          </Text>
          <Text
            fontSize="xs"
            color="gray.500"
            textAlign="center"
            mt={1}
          >
            Automation Platform
          </Text>
        </Box>

        <Divider my={2} />

        {/* Menu Items */}
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            justifyContent="flex-start"
            h="auto"
            p={3}
            borderRadius="lg"
            bg={activeTab === item.id ? activeBg : 'transparent'}
            color={activeTab === item.id ? activeColor : 'gray.600'}
            _dark={{
              color: activeTab === item.id ? activeColor : 'gray.300',
            }}
            _hover={{
              bg: activeTab === item.id ? activeBg : hoverBg,
              color: activeTab === item.id ? activeColor : 'gray.800',
              _dark: {
                color: activeTab === item.id ? activeColor : 'white',
              },
            }}
            onClick={() => setActiveTab(item.id)}
          >
            <HStack spacing={3} w="full">
              <Icon as={item.icon} w={4} h={4} />
              <Text fontSize="sm" fontWeight="medium">
                {item.label}
              </Text>
            </HStack>
          </Button>
        ))}

        {/* Spacer */}
        <Box flex={1} />

        {/* Logout */}
        <Divider my={2} />
        <Button
          variant="ghost"
          justifyContent="flex-start"
          h="auto"
          p={3}
          borderRadius="lg"
          color="red.600"
          _hover={{
            bg: 'red.50',
            color: 'red.700',
            _dark: {
              bg: 'red.900',
              color: 'red.200',
            },
          }}
          onClick={onLogout}
        >
          <HStack spacing={3} w="full">
            <Icon as={FiLogOut} w={4} h={4} />
            <Text fontSize="sm" fontWeight="medium">
              Logout
            </Text>
          </HStack>
        </Button>
      </VStack>
    </Box>
  );
};

export default Sidebar;