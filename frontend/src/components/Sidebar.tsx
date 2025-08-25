import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Divider,
  useColorModeValue,
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
  FiBook,
  FiLogOut,
} from 'react-icons/fi';
import { SidebarProps } from '../types/components';

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome },
  { id: 'messageSender', label: 'Message Sender', icon: FiSend },
  { id: 'groupsManager', label: 'Groups', icon: FiUsers },
  { id: 'messagesManager', label: 'Messages', icon: FiMessageSquare },
  { id: 'templateManager', label: 'Templates', icon: FiFileText },
  { id: 'blacklistManager', label: 'Blacklist', icon: FiShield },
  { id: 'configManager', label: 'Configuration', icon: FiSettings },
  { id: 'logViewer', label: 'Logs', icon: FiBook },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.600', 'brand.200');

  return (
    <Box
      w="280px"
      h="100vh"
      bg={bgColor}
      borderRight="1px solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
    >
      <Flex direction="column" h="full">
        {/* Header */}
        <Box p={6} borderBottom="1px solid" borderColor={borderColor}>
          <VStack spacing={2} align="start">
            <Text fontSize="xl" fontWeight="bold" color="brand.600">
              TGPro
            </Text>
            <Text fontSize="sm" color="gray.500">
              Telegram Automation
            </Text>
          </VStack>
        </Box>

        {/* Navigation */}
        <Box flex={1} p={4}>
          <VStack spacing={1} align="stretch">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                justifyContent="flex-start"
                h="auto"
                p={3}
                bg={activeTab === item.id ? activeBg : 'transparent'}
                color={activeTab === item.id ? activeColor : 'gray.600'}
                _hover={{
                  bg: activeTab === item.id ? activeBg : hoverBg,
                }}
                onClick={() => setActiveTab(item.id)}
              >
                <HStack spacing={3} w="full">
                  <Icon as={item.icon} w={5} h={5} />
                  <Text fontSize="sm" fontWeight="medium">
                    {item.label}
                  </Text>
                </HStack>
              </Button>
            ))}
          </VStack>
        </Box>

        {/* Footer */}
        <Box p={4} borderTop="1px solid" borderColor={borderColor}>
          <Button
            variant="ghost"
            justifyContent="flex-start"
            w="full"
            h="auto"
            p={3}
            color="red.500"
            _hover={{ bg: 'red.50', _dark: { bg: 'red.900' } }}
            onClick={onLogout}
          >
            <HStack spacing={3}>
              <Icon as={FiLogOut} w={5} h={5} />
              <Text fontSize="sm" fontWeight="medium">
                Logout
              </Text>
            </HStack>
          </Button>
        </Box>
      </Flex>
    </Box>
  );
};

export default Sidebar;