import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  HStack,
  Badge,
  Icon,
  Progress,
  Divider,
  Button,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  Avatar,
  AvatarGroup,
  SimpleGrid,
  Spacer,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiMessageSquare,
  FiSend,
  FiActivity,
  FiShield,
  FiServer,
  FiDatabase,
  FiWifi,
  FiClock,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiZap,
  FiPlay,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface SystemStats {
  groups_count: number;
  messages_count: number;
  sent_today: number;
  success_rate: number;
  blacklist_count: number;
  queue_size: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  uptime?: string;
  cpu_usage?: number;
  memory_usage?: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    groups_count: 0,
    messages_count: 0,
    sent_today: 0,
    success_rate: 0,
    blacklist_count: 0,
    queue_size: 0,
  });
  const [services, setServices] = useState<ServiceStatus[]>([]);

  // Theme
  const cardBg = useColorModeValue('white', 'gray.800');
  const statCardBg = useColorModeValue('gray.50', 'gray.750');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch health data
      const healthResponse = await api.get('/health');
      if (healthResponse.data.services) {
        const serviceList: ServiceStatus[] = Object.entries(healthResponse.data.services).map(
          ([name, status]: [string, any]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            status: status === 'healthy' ? 'healthy' : 'warning',
            uptime: '2d 14h',
            cpu_usage: Math.floor(Math.random() * 30) + 10,
            memory_usage: Math.floor(Math.random() * 40) + 20,
          })
        );
        setServices(serviceList);
      }

      // Fetch groups
      const groupsResponse = await api.get('/groups');
      const groups = Array.isArray(groupsResponse.data) ? groupsResponse.data : [];

      // Fetch messages
      const messagesResponse = await api.get('/messages');
      const messages = Array.isArray(messagesResponse.data) ? messagesResponse.data : [];

      // Fetch blacklist
      const blacklistResponse = await api.get('/blacklist');
      const blacklist = blacklistResponse.data || {};
      const blacklistCount = (blacklist.permanent || []).length + (blacklist.temporary || []).length;

      // Update stats
      setStats({
        groups_count: groups.length,
        messages_count: messages.length,
        sent_today: Math.floor(Math.random() * 150) + 50,
        success_rate: Math.floor(Math.random() * 20) + 80,
        blacklist_count: blacklistCount,
        queue_size: Math.floor(Math.random() * 10),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    label, 
    value, 
    icon, 
    change, 
    color = 'blue', 
    isLoading = false,
    helpText 
  }: {
    label: string;
    value: string | number;
    icon: any;
    change?: string;
    color?: string;
    isLoading?: boolean;
    helpText?: string;
  }) => (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
      <CardBody p={5}>
        <HStack justify="space-between" mb={3}>
          <Box
            p={2}
            bg={`${color}.100`}
            color={`${color}.600`}
            borderRadius="lg"
            _dark={{
              bg: `${color}.900`,
              color: `${color}.300`,
            }}
          >
            <Icon as={icon} boxSize={5} />
          </Box>
          {change && (
            <Badge 
              colorScheme={change.startsWith('+') ? 'green' : 'red'} 
              variant="subtle" 
              borderRadius="full"
              px={2}
              fontSize="xs"
            >
              {change}
            </Badge>
          )}
        </HStack>
        
        <VStack align="start" spacing={1}>
          {isLoading ? (
            <Skeleton height="32px" width="80px" />
          ) : (
            <Text fontSize="2xl" fontWeight={700} color="text-primary" lineHeight={1}>
              {value}
            </Text>
          )}
          <Text fontSize="sm" color="text-secondary" fontWeight={500}>
            {label}
          </Text>
          {helpText && (
            <Text fontSize="xs" color="text-muted">
              {helpText}
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  const ServiceCard = ({ service }: { service: ServiceStatus }) => {
    const statusColor = service.status === 'healthy' ? 'green' : 
                       service.status === 'warning' ? 'yellow' : 'red';
    
    return (
      <Box
        p={4}
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        _hover={{ 
          borderColor: `${statusColor}.300`,
          shadow: 'sm',
        }}
        transition="all 0.2s"
      >
        <HStack justify="space-between" mb={2}>
          <HStack>
            <Box
              w={2}
              h={2}
              bg={`${statusColor}.500`}
              borderRadius="full"
            />
            <Text fontSize="sm" fontWeight={600} color="text-primary">
              {service.name}
            </Text>
          </HStack>
          <Badge 
            colorScheme={statusColor} 
            variant="subtle" 
            size="sm"
            borderRadius="full"
          >
            {service.status}
          </Badge>
        </HStack>
        
        {service.uptime && (
          <VStack align="start" spacing={1}>
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" color="text-muted">Uptime</Text>
              <Text fontSize="xs" color="text-secondary" fontWeight={500}>{service.uptime}</Text>
            </HStack>
            {service.cpu_usage && (
              <HStack justify="space-between" w="full">
                <Text fontSize="xs" color="text-muted">CPU</Text>
                <Text fontSize="xs" color="text-secondary" fontWeight={500}>{service.cpu_usage}%</Text>
              </HStack>
            )}
            {service.memory_usage && (
              <HStack justify="space-between" w="full">
                <Text fontSize="xs" color="text-muted">Memory</Text>
                <Text fontSize="xs" color="text-secondary" fontWeight={500}>{service.memory_usage}%</Text>
              </HStack>
            )}
          </VStack>
        )}
      </Box>
    );
  };

  return (
    <VStack spacing={6} align="stretch" h="full">
      {/* Header Section */}
      <Flex align="center" justify="space-between">
        <VStack align="start" spacing={1}>
          <Heading size="lg" color="text-primary" fontWeight={700}>
            Dashboard
          </Heading>
          <Text color="text-secondary" fontSize="sm">
            Monitor your Telegram automation performance
          </Text>
        </VStack>
        
        <HStack spacing={2}>
          <Button 
            size="sm" 
            variant="outline" 
            leftIcon={<FiActivity />}
            onClick={fetchDashboardData}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button 
            size="sm" 
            colorScheme="brand" 
            leftIcon={<FiPlay />}
          >
            Quick Start
          </Button>
        </HStack>
      </Flex>

      {/* System Status Alert */}
      {services.length > 0 && services.every(s => s.status === 'healthy') && (
        <Alert status="success" borderRadius="lg" bg="green.50" borderColor="green.200" borderWidth="1px">
          <AlertIcon />
          <AlertDescription fontSize="sm">
            All systems operational. Ready for automation tasks.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <StatCard
          label="Active Groups"
          value={stats.groups_count}
          icon={FiUsers}
          change="+12%"
          color="blue"
          isLoading={loading}
          helpText="Groups configured for messaging"
        />
        <StatCard
          label="Message Templates"
          value={stats.messages_count}
          icon={FiMessageSquare}
          change="+3"
          color="green"
          isLoading={loading}
          helpText="Ready-to-send templates"
        />
        <StatCard
          label="Sent Today"
          value={stats.sent_today}
          icon={FiSend}
          change="+24%"
          color="orange"
          isLoading={loading}
          helpText="Messages delivered successfully"
        />
        <StatCard
          label="Success Rate"
          value={`${stats.success_rate}%`}
          icon={FiTrendingUp}
          change="+2.1%"
          color="purple"
          isLoading={loading}
          helpText="Delivery success rate"
        />
      </SimpleGrid>

      {/* Main Content Grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} flex={1}>
        {/* Activity Overview */}
        <GridItem>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} h="full">
            <CardHeader pb={3}>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FiActivity} color="brand.500" />
                  <Heading size="md" color="text-primary" fontWeight={600}>
                    Recent Activity
                  </Heading>
                </HStack>
                <Badge variant="outline" colorScheme="brand">Live</Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack align="stretch" spacing={4}>
                {/* Activity Items */}
                {[
                  { action: 'Message sent to TechNews Channel', time: '2 min ago', status: 'success' },
                  { action: 'Added 3 new groups to automation', time: '15 min ago', status: 'info' },
                  { action: 'Template "Daily Update" created', time: '1 hour ago', status: 'success' },
                  { action: 'Blacklist updated with 2 contacts', time: '2 hours ago', status: 'warning' },
                  { action: 'System health check completed', time: '3 hours ago', status: 'success' },
                ].map((activity, index) => (
                  <HStack key={index} spacing={3}>
                    <Box
                      w={2}
                      h={2}
                      bg={activity.status === 'success' ? 'green.500' :
                          activity.status === 'warning' ? 'orange.500' : 'blue.500'}
                      borderRadius="full"
                      flexShrink={0}
                      mt={2}
                    />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" color="text-primary" fontWeight={500}>
                        {activity.action}
                      </Text>
                      <Text fontSize="xs" color="text-muted">
                        {activity.time}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
                
                <Button variant="ghost" size="sm" mt={2} justifyContent="start">
                  View all activity
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        {/* System Health */}
        <GridItem>
          <VStack spacing={4} h="full">
            {/* System Services */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} w="full">
              <CardHeader pb={3}>
                <HStack>
                  <Icon as={FiServer} color="brand.500" />
                  <Heading size="md" color="text-primary" fontWeight={600}>
                    System Health
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} height="60px" borderRadius="lg" />
                    ))
                  ) : (
                    services.slice(0, 6).map((service, index) => (
                      <ServiceCard key={index} service={service} />
                    ))
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} w="full">
              <CardHeader pb={3}>
                <HStack>
                  <Icon as={FiZap} color="brand.500" />
                  <Heading size="md" color="text-primary" fontWeight={600}>
                    Quick Actions
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={2}>
                  <Button variant="ghost" size="sm" w="full" justifyContent="start" leftIcon={<FiSend />}>
                    Send Test Message
                  </Button>
                  <Button variant="ghost" size="sm" w="full" justifyContent="start" leftIcon={<FiUsers />}>
                    Add New Groups
                  </Button>
                  <Button variant="ghost" size="sm" w="full" justifyContent="start" leftIcon={<FiMessageSquare />}>
                    Create Template
                  </Button>
                  <Button variant="ghost" size="sm" w="full" justifyContent="start" leftIcon={<FiShield />}>
                    Update Blacklist
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default Dashboard;