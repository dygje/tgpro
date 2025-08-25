import React from 'react';
import {
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Icon,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useColorModeValue,
  Box,
} from '@chakra-ui/react';
import { FiRefreshCw, FiUser } from 'react-icons/fi';
import { AuthStatusProps } from '@/types/components';

const AuthStatus: React.FC<AuthStatusProps> = ({ authStatus, onRefresh }) => {
  const popoverBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!authStatus) {
    return (
      <HStack spacing={2}>
        <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>
          Loading...
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          leftIcon={<Icon as={FiRefreshCw} />}
        >
          Refresh
        </Button>
      </HStack>
    );
  }

  const statusColor = authStatus.authenticated ? 'green' : 'red';
  const statusText = authStatus.authenticated ? 'Connected' : 'Disconnected';

  return (
    <HStack spacing={3}>
      <Popover placement="bottom-end">
        <PopoverTrigger>
          <Button variant="ghost" size="sm" p={2}>
            <HStack spacing={2}>
              <Avatar
                size="sm"
                icon={<Icon as={FiUser} />}
                bg={`${statusColor}.500`}
              />
              <VStack spacing={0} align="start" display={{ base: 'none', md: 'flex' }}>
                <Text fontSize="sm" fontWeight="medium" lineHeight="short">
                  {authStatus.username || authStatus.phone_number || 'Unknown'}
                </Text>
                <Badge
                  colorScheme={statusColor}
                  size="xs"
                  borderRadius="full"
                >
                  {statusText}
                </Badge>
              </VStack>
            </HStack>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          w="280px"
          bg={popoverBg}
          borderColor={borderColor}
          shadow="lg"
        >
          <PopoverBody p={4}>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Account Status
                </Text>
                <VStack align="stretch" spacing={2} fontSize="sm">
                  <HStack justify="space-between">
                    <Text color="gray.600">Status:</Text>
                    <Badge colorScheme={statusColor} borderRadius="full">
                      {statusText}
                    </Badge>
                  </HStack>
                  {authStatus.phone_number && (
                    <HStack justify="space-between">
                      <Text color="gray.600">Phone:</Text>
                      <Text>{authStatus.phone_number}</Text>
                    </HStack>
                  )}
                  {authStatus.username && (
                    <HStack justify="space-between">
                      <Text color="gray.600">Username:</Text>
                      <Text>@{authStatus.username}</Text>
                    </HStack>
                  )}
                  {authStatus.user_id && (
                    <HStack justify="space-between">
                      <Text color="gray.600">User ID:</Text>
                      <Text fontFamily="mono" fontSize="xs">
                        {authStatus.user_id}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {authStatus.account_health && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Account Health
                  </Text>
                  <VStack align="stretch" spacing={2} fontSize="sm">
                    <HStack justify="space-between">
                      <Text color="gray.600">Risk Level:</Text>
                      <Badge
                        colorScheme={
                          authStatus.account_health.risk_level === 'low' 
                            ? 'green' 
                            : authStatus.account_health.risk_level === 'medium' 
                            ? 'yellow' 
                            : 'red'
                        }
                        borderRadius="full"
                      >
                        {authStatus.account_health.risk_level.toUpperCase()}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Success Rate:</Text>
                      <Text>{authStatus.account_health.success_rate}%</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.600">Messages Today:</Text>
                      <Text>{authStatus.account_health.messages_sent_today}</Text>
                    </HStack>
                  </VStack>
                </Box>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                leftIcon={<Icon as={FiRefreshCw} />}
                w="full"
              >
                Refresh Status
              </Button>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </HStack>
  );
};

export default AuthStatus;