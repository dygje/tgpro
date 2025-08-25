import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Badge,
  VStack,
  HStack,
  Spinner,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Heading,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiMessageSquare,
  FiShield,
  FiCheckCircle,
  FiRefreshCw,
  FiSend,
  FiSettings,
  FiFileText,
} from 'react-icons/fi';
import { api } from '@/lib/api';
import { DashboardStats, AuthStatus as AuthStatusType, AccountHealth } from '@/types';

interface ServiceStatusProps {
  name: string;
  status: boolean;
  description: string;
}

const ServiceStatus: React.FC<ServiceStatusProps> = ({ name, status, description }) => {
  const statusColor = status ? 'green' : 'red';
  const statusText = status ? 'Running' : 'Stopped';

  return (
    <Flex align="center" justify="space-between" p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg">
      <HStack spacing={3}>
        <Box
          w={3}
          h={3}
          borderRadius="full"
          bg={`${statusColor}.400`}
        />
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium" color="gray.900" _dark={{ color: 'white' }}>
            {name}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        </VStack>
      </HStack>
      <Badge
        colorScheme={statusColor}
        borderRadius="full"
        px={3}
        py={1}
        fontSize="xs"
        fontWeight="medium"
      >
        {statusText}
      </Badge>
    </Flex>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Partial<DashboardStats>>({
    health: undefined,
    groups: { total: 0, active: 0, blacklisted: 0 },
    messageFiles: { total: 0 },
    blacklist: { permanent_count: 0, temporary_count: 0 },
    templates: { total: 0 }
  });
  const [accountHealth, setAccountHealth] = useState<AccountHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Auto refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [healthRes, groupsRes, messagesRes, blacklistRes, templatesRes, authRes] = await Promise.all([
        api.health(),
        api.groups.list(),
        api.messages.list(),
        api.blacklist.list(),
        api.templates.list(),
        api.auth.status()
      ]);

      setStats({
        health: healthRes,
        groups: groupsRes,
        messageFiles: messagesRes,
        blacklist: blacklistRes,
        templates: templatesRes
      });

      if (authRes.account_health) {
        setAccountHealth(authRes.account_health);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  if (loading && !refreshing) {
    return (
      <Flex align="center" justify="center" h={64}>
        <VStack spacing={4}>
          <Spinner size="lg" color="brand.500" thickness="4px" />
          <Text color="gray.600">Loading dashboard...</Text>
        </VStack>
      </Flex>
    );
  }

  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'degraded':
        return 'yellow';
      case 'unhealthy':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getRiskLevelColor = (level?: string) => {
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

  return (
    <Box p={8} bg="gray.50" _dark={{ bg: 'gray.900' }} minH="full">
      {/* Header */}
      <Flex align="center" justify="space-between" mb={8}>
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="gray.900" _dark={{ color: 'white' }}>
            Dashboard
          </Heading>
          <Text color="gray.600">
            Monitor your Telegram automation system
          </Text>
        </VStack>
        <Button
          onClick={handleRefresh}
          isLoading={refreshing}
          loadingText="Refreshing..."
          leftIcon={<Icon as={FiRefreshCw} />}
          colorScheme="brand"
          variant="solid"
        >
          Refresh
        </Button>
      </Flex>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat>
          <Card>
            <CardBody>
              <Flex align="center" justify="space-between">
                <VStack align="start" spacing={1}>
                  <StatLabel fontSize="sm" color="gray.600">
                    Total Groups
                  </StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="bold" color="blue.600">
                    {stats.groups?.total || 0}
                  </StatNumber>
                  <StatHelpText fontSize="xs" color="gray.500">
                    Telegram groups managed
                  </StatHelpText>
                </VStack>
                <Box
                  w={12}
                  h={12}
                  bg="blue.100"
                  _dark={{ bg: 'blue.900' }}
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiUsers} w={6} h={6} color="blue.600" />
                </Box>
              </Flex>
            </CardBody>
          </Card>
        </Stat>

        <Stat>
          <Card>
            <CardBody>
              <Flex align="center" justify="space-between">
                <VStack align="start" spacing={1}>
                  <StatLabel fontSize="sm" color="gray.600">
                    Message Files
                  </StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="bold" color="green.600">
                    {stats.messageFiles?.total || 0}
                  </StatNumber>
                  <StatHelpText fontSize="xs" color="gray.500">
                    Available message templates
                  </StatHelpText>
                </VStack>
                <Box
                  w={12}
                  h={12}
                  bg="green.100"
                  _dark={{ bg: 'green.900' }}
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiMessageSquare} w={6} h={6} color="green.600" />
                </Box>
              </Flex>
            </CardBody>
          </Card>
        </Stat>

        <Stat>
          <Card>
            <CardBody>
              <Flex align="center" justify="space-between">
                <VStack align="start" spacing={1}>
                  <StatLabel fontSize="sm" color="gray.600">
                    Blocked Groups
                  </StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="bold" color="red.600">
                    {(stats.blacklist?.permanent_count || 0) + (stats.blacklist?.temporary_count || 0)}
                  </StatNumber>
                  <StatHelpText fontSize="xs" color="gray.500">
                    {stats.blacklist?.permanent_count || 0} permanent, {stats.blacklist?.temporary_count || 0} temporary
                  </StatHelpText>
                </VStack>
                <Box
                  w={12}
                  h={12}
                  bg="red.100"
                  _dark={{ bg: 'red.900' }}
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiShield} w={6} h={6} color="red.600" />
                </Box>
              </Flex>
            </CardBody>
          </Card>
        </Stat>

        <Stat>
          <Card>
            <CardBody>
              <Flex align="center" justify="space-between">
                <VStack align="start" spacing={1}>
                  <StatLabel fontSize="sm" color="gray.600">
                    System Health
                  </StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="bold" color={`${getHealthColor(stats.health?.status)}.600`}>
                    {stats.health?.status === 'healthy' ? 'Good' : 'Issues'}
                  </StatNumber>
                  <StatHelpText fontSize="xs" color="gray.500">
                    Overall system status
                  </StatHelpText>
                </VStack>
                <Box
                  w={12}
                  h={12}
                  bg={`${getHealthColor(stats.health?.status)}.100`}
                  _dark={{ bg: `${getHealthColor(stats.health?.status)}.900` }}
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiCheckCircle} w={6} h={6} color={`${getHealthColor(stats.health?.status)}.600`} />
                </Box>
              </Flex>
            </CardBody>
          </Card>
        </Stat>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* System Status */}
        <Card>
          <CardHeader>
            <Heading size="md">System Status</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3}>
              <ServiceStatus
                name="FastAPI Backend"
                status={stats.health?.services?.telegram_service || false}
                description="Main application server"
              />
              <ServiceStatus
                name="MongoDB Database"
                status={stats.health?.services?.config_manager || false}
                description="Data storage and management"
              />
              <ServiceStatus
                name="Telegram Service"
                status={stats.health?.services?.telegram_service || false}
                description="MTProto API connection"
              />
              <ServiceStatus
                name="Blacklist Manager"
                status={stats.health?.services?.blacklist_manager || false}
                description="Group filtering system"
              />
            </VStack>
          </CardBody>
        </Card>

        {/* Account Health */}
        <Card>
          <CardHeader>
            <Heading size="md">Account Health</Heading>
          </CardHeader>
          <CardBody>
            {accountHealth ? (
              <VStack spacing={4}>
                <Flex align="center" justify="space-between" w="full">
                  <Text color="gray.600">Risk Level</Text>
                  <Badge
                    colorScheme={getRiskLevelColor(accountHealth.risk_level)}
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="medium"
                  >
                    {accountHealth.risk_level.toUpperCase()}
                  </Badge>
                </Flex>
                <Flex align="center" justify="space-between" w="full">
                  <Text color="gray.600">Success Rate</Text>
                  <Text fontWeight="semibold" color="gray.900" _dark={{ color: 'white' }}>
                    {accountHealth.success_rate}%
                  </Text>
                </Flex>
                <Flex align="center" justify="space-between" w="full">
                  <Text color="gray.600">Messages Today</Text>
                  <Text fontWeight="semibold" color="gray.900" _dark={{ color: 'white' }}>
                    {accountHealth.messages_sent_today || 0}
                  </Text>
                </Flex>
                <Flex align="center" justify="space-between" w="full">
                  <Text color="gray.600">Last Activity</Text>
                  <Text fontSize="sm" color="gray.500">
                    {accountHealth.last_activity 
                      ? new Date(accountHealth.last_activity).toLocaleString() 
                      : 'Never'}
                  </Text>
                </Flex>
              </VStack>
            ) : (
              <VStack py={8} spacing={4}>
                <Icon as={FiUsers} w={12} h={12} color="gray.300" />
                <Text color="gray.500">No account data available</Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  Connect your Telegram account to see health metrics
                </Text>
              </VStack>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Quick Actions */}
      <Card mt={8}>
        <CardHeader>
          <Heading size="md">Quick Actions</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Button
              variant="outline"
              size="lg"
              h="auto"
              p={4}
              justifyContent="start"
              leftIcon={<Icon as={FiSend} w={5} h={5} color="blue.600" />}
            >
              <VStack align="start" spacing={0} ml={3}>
                <Text fontWeight="medium" color="gray.900" _dark={{ color: 'white' }}>
                  Send Message
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Send messages to groups
                </Text>
              </VStack>
            </Button>

            <Button
              variant="outline"
              size="lg"
              h="auto"
              p={4}
              justifyContent="start"
              leftIcon={<Icon as={FiUsers} w={5} h={5} color="green.600" />}
            >
              <VStack align="start" spacing={0} ml={3}>
                <Text fontWeight="medium" color="gray.900" _dark={{ color: 'white' }}>
                  Manage Groups
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Add or remove groups
                </Text>
              </VStack>
            </Button>

            <Button
              variant="outline"
              size="lg"
              h="auto"
              p={4}
              justifyContent="start"
              leftIcon={<Icon as={FiFileText} w={5} h={5} color="purple.600" />}
            >
              <VStack align="start" spacing={0} ml={3}>
                <Text fontWeight="medium" color="gray.900" _dark={{ color: 'white' }}>
                  View Logs
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Check system activity
                </Text>
              </VStack>
            </Button>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Dashboard;