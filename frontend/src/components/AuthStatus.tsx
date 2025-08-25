import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  HStack,
  VStack,
  Icon,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiUser,
  FiShield,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
} from 'react-icons/fi';
import { AuthStatusProps } from '../types/components';

const AuthStatus: React.FC<AuthStatusProps> = ({ authStatus, onRefresh }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!authStatus) {
    return (
      <Box
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        p={3}
      >
        <HStack spacing={2}>
          <Icon as={FiXCircle} color="red.500" />
          <Text fontSize="sm" color="gray.600">
            Not authenticated
          </Text>
        </HStack>
      </Box>
    );
  }

  const getHealthColor = (level?: string) => {
    switch (level) {
      case 'low':
        return 'green';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getHealthIcon = (level?: string) => {
    switch (level) {
      case 'low':
        return FiCheckCircle;
      case 'medium':
        return FiAlertCircle;
      case 'high':
        return FiXCircle;
      default:
        return FiShield;
    }
  };

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={3}
    >
      <Flex align="center" justify="space-between">
        <HStack spacing={3}>
          <Icon as={FiUser} color="green.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="medium" color="gray.900" _dark={{ color: 'white' }}>
              {authStatus.username || authStatus.phone_number || 'Authenticated'}
            </Text>
            {authStatus.account_health && (
              <HStack spacing={2}>
                <Icon
                  as={getHealthIcon(authStatus.account_health.risk_level)}
                  w={3}
                  h={3}
                  color={`${getHealthColor(authStatus.account_health.risk_level)}.500`}
                />
                <Text fontSize="xs" color="gray.500">
                  Risk: {authStatus.account_health.risk_level}
                </Text>
                <Badge
                  size="sm"
                  colorScheme={getHealthColor(authStatus.account_health.risk_level)}
                  borderRadius="full"
                >
                  {authStatus.account_health.success_rate}%
                </Badge>
              </HStack>
            )}
          </VStack>
        </HStack>

        <Tooltip label="Refresh status" placement="left">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            leftIcon={<Icon as={FiRefreshCw} w={3} h={3} />}
          >
            Refresh
          </Button>
        </Tooltip>
      </Flex>
    </Box>
  );
};

export default AuthStatus;