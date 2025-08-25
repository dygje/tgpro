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
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!authStatus) {
    return (
      <Box
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        p={2}
      >
        <HStack spacing={2}>
          <Icon as={FiXCircle} color="red.500" boxSize={3} />
          <Text fontSize="xs" color="text-secondary">
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
    <HStack spacing={3}>
      <Badge
        colorScheme="green"
        variant="subtle"
        borderRadius="full"
        px={2}
        py={1}
        fontSize="xs"
      >
        <HStack spacing={1}>
          <Icon as={FiUser} boxSize={2.5} />
          <Text>
            {authStatus.username || authStatus.phone_number || 'Authenticated'}
          </Text>
        </HStack>
      </Badge>
      
      {authStatus.account_health && (
        <Badge
          colorScheme={getHealthColor(authStatus.account_health.risk_level)}
          variant="subtle"
          borderRadius="full"
          px={2}
          py={1}
          fontSize="xs"
        >
          <HStack spacing={1}>
            <Icon as={getHealthIcon(authStatus.account_health.risk_level)} boxSize={2.5} />
            <Text>{authStatus.account_health.success_rate}%</Text>
          </HStack>
        </Badge>
      )}
      </Flex>
    </Box>
  );
};

export default AuthStatus;