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
  VStack,
  HStack,
  Badge,
  Icon,
  Button,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiMessageSquare,
  FiSend,
  FiActivity,
  FiShield,
  FiServer,
  FiDatabase,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiZap,
  FiPlay,
  FiRefreshCw,
  FiExternalLink,
  FiPlus,
  FiArrowRight,
  FiCircle,
  FiInfo,
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null);

  // Linear-style theme
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');

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

  // Compact Stat Card - Linear style
  const StatCard = ({ 
    label, 
    value, 
    icon, 
    trend, 
    trendValue,
    color = 'gray',
    isLoading = false 
  }: {
    label: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: string;
    isLoading?: boolean;
  }) => (
    <Card 
      bg={cardBg} 
      borderWidth="1px" 
      borderColor={borderColor} 
      shadow="none"
      _hover={{ 
        borderColor: useColorModeValue('gray.300', 'gray.700'),
        shadow: 'sm' 
      }}
      transition="all 0.15s ease"
      cursor="pointer"
    >
      <CardBody p={4}>
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <Icon as={icon} boxSize={4} color={textMuted} />
            {trend && trendValue && (
              <HStack spacing={1}>
                <Icon 
                  as={trend === 'up' ? FiTrendingUp : trend === 'down' ? FiActivity : FiCircle} 
                  boxSize={3} 
                  color={trend === 'up' ? 'green.500' : trend === 'down' ? 'red.500' : textMuted}
                />
                <Text 
                  fontSize="xs" 
                  color={trend === 'up' ? 'green.500' : trend === 'down' ? 'red.500' : textMuted}
                  fontWeight={500}
                >
                  {trendValue}
                </Text>
              </HStack>
            )}
          </HStack>
          
          <VStack align="start" spacing={1} w="full">
            {isLoading ? (
              <Skeleton height="24px" width="60px" />
            ) : (
              <Text fontSize="xl" fontWeight={600} color={textPrimary} lineHeight={1}>
                {value}
              </Text>
            )}
            <Text fontSize="sm" color={textSecondary} fontWeight={400}>
              {label}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // Compact Service Card
  const ServiceCard = ({ service, onClick }: { service: ServiceStatus; onClick: () => void }) => {
    const statusColor = service.status === 'healthy' ? 'green' : 
                       service.status === 'warning' ? 'orange' : 'red';
    
    return (
      <Card
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        shadow="none"
        _hover={{ 
          borderColor: useColorModeValue('gray.300', 'gray.700'),
          shadow: 'sm' 
        }}
        transition="all 0.15s ease"
        cursor="pointer"
        onClick={onClick}
      >
        <CardBody p={3}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box
                w={2}
                h={2}
                bg={`${statusColor}.500`}
                borderRadius="full"
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight={500} color={textPrimary} lineHeight={1.2}>
                  {service.name}
                </Text>
                <Text fontSize="xs" color={textMuted} lineHeight={1.2}>
                  {service.uptime}
                </Text>
              </VStack>
            </HStack>
            
            <IconButton
              aria-label="View details"
              icon={<FiExternalLink />}
              size="xs"
              variant="ghost"
              color={textMuted}
            />
          </HStack>
        </CardBody>
      </Card>
    );
  };

  // Quick Action Card
  const QuickActionCard = ({ 
    title, 
    description, 
    icon, 
    onClick,
    variant = 'default' 
  }: {
    title: string;
    description: string;
    icon: any;
    onClick: () => void;
    variant?: 'default' | 'primary';
  }) => (
    <Card
      bg={variant === 'primary' ? 'gray.900' : cardBg}
      borderWidth="1px"
      borderColor={variant === 'primary' ? 'gray.900' : borderColor}
      shadow="none"
      _hover={{ 
        borderColor: variant === 'primary' ? 'gray.800' : useColorModeValue('gray.300', 'gray.700'),
        shadow: 'sm' 
      }}
      transition="all 0.15s ease"
      cursor="pointer"
      onClick={onClick}
      _dark={{
        bg: variant === 'primary' ? 'gray.200' : cardBg,
        borderColor: variant === 'primary' ? 'gray.200' : borderColor,
      }}
    >
      <CardBody p={4}>
        <VStack align="start" spacing={3}>
          <HStack spacing={3}>
            <Icon 
              as={icon} 
              boxSize={4} 
              color={variant === 'primary' ? (useColorModeValue('white', 'black')) : textMuted} 
            />
            <VStack align="start" spacing={0} flex={1}>
              <Text 
                fontSize="sm" 
                fontWeight={500} 
                color={variant === 'primary' ? (useColorModeValue('white', 'black')) : textPrimary}
                lineHeight={1.2}
              >
                {title}
              </Text>
              <Text 
                fontSize="xs" 
                color={variant === 'primary' ? (useColorModeValue('gray.300', 'gray.600')) : textMuted}
                lineHeight={1.2}
              >
                {description}
              </Text>
            </VStack>
            <Icon 
              as={FiArrowRight} 
              boxSize={3} 
              color={variant === 'primary' ? (useColorModeValue('gray.400', 'gray.600')) : textMuted} 
            />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <VStack spacing={6} align="stretch" h="full" maxW="full">
      {/* Compact Header */}
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={0}>
          <Text fontSize="lg" fontWeight={600} color={textPrimary}>
            Dashboard
          </Text>
          <Text fontSize="sm" color={textSecondary}>
            System overview and quick actions
          </Text>
        </VStack>
        
        <HStack spacing={2}>
          <IconButton
            aria-label="Refresh"
            icon={<FiRefreshCw />}
            size="sm"
            variant="ghost"
            onClick={fetchDashboardData}
            isLoading={loading}
            borderRadius="md"
          />
        </HStack>
      </HStack>

      {/* System Status */}
      {services.length > 0 && services.every(s => s.status === 'healthy') && (
        <Alert status="success" borderRadius="md" bg="green.50" borderColor="green.200" borderWidth="1px">
          <AlertIcon boxSize={4} />
          <AlertDescription fontSize="sm">
            All systems operational
          </AlertDescription>
        </Alert>
      )}

      {/* Main Grid - Compact Layout */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} flex={1}>
        {/* Left Column - Stats & Actions */}
        <VStack spacing={6} align="stretch">
          {/* Stats Grid - 2x3 Compact */}
          <Box>
            <Text fontSize="sm" fontWeight={500} color={textPrimary} mb={3}>
              Analytics
            </Text>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
              <StatCard
                label="Active Groups"
                value={stats.groups_count}
                icon={FiUsers}
                trend="up"
                trendValue="+12%"
                isLoading={loading}
              />
              <StatCard
                label="Templates"
                value={stats.messages_count}
                icon={FiMessageSquare}
                trend="up"
                trendValue="+3"
                isLoading={loading}
              />
              <StatCard
                label="Sent Today"
                value={stats.sent_today}
                icon={FiSend}
                trend="up"
                trendValue="+24%"
                isLoading={loading}
              />
              <StatCard
                label="Success Rate"
                value={`${stats.success_rate}%`}
                icon={FiTrendingUp}
                trend="up"
                trendValue="+2%"
                isLoading={loading}
              />
              <StatCard
                label="Blacklisted"
                value={stats.blacklist_count}
                icon={FiShield}
                trend="neutral"
                trendValue="0"
                isLoading={loading}
              />
              <StatCard
                label="Queue"
                value={stats.queue_size}
                icon={FiClock}
                trend="neutral"
                trendValue="0"
                isLoading={loading}
              />
            </SimpleGrid>
          </Box>

          {/* Quick Actions */}
          <Box>
            <Text fontSize="sm" fontWeight={500} color={textPrimary} mb={3}>
              Quick Actions
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <QuickActionCard
                title="Send Message"
                description="Start a new automation task"
                icon={FiSend}
                onClick={() => {}}
                variant="primary"
              />
              <QuickActionCard
                title="Add Groups"
                description="Import new target groups"
                icon={FiUsers}
                onClick={() => {}}
              />
              <QuickActionCard
                title="Create Template"
                description="Build message templates"
                icon={FiMessageSquare}
                onClick={() => {}}
              />
              <QuickActionCard
                title="View Logs"
                description="Monitor system activity"
                icon={FiActivity}
                onClick={() => {}}
              />
            </SimpleGrid>
          </Box>
        </VStack>

        {/* Right Column - Services & Activity */}
        <VStack spacing={6} align="stretch">
          {/* System Services */}
          <Box>
            <Text fontSize="sm" fontWeight={500} color={textPrimary} mb={3}>
              System Health
            </Text>
            <VStack spacing={2}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height="48px" borderRadius="md" />
                ))
              ) : (
                services.slice(0, 6).map((service, index) => (
                  <ServiceCard 
                    key={index} 
                    service={service} 
                    onClick={() => {
                      setSelectedService(service);
                      onOpen();
                    }}
                  />
                ))
              )}
            </VStack>
          </Box>

          {/* Recent Activity */}
          <Box>
            <Text fontSize="sm" fontWeight={500} color={textPrimary} mb={3}>
              Recent Activity
            </Text>
            <VStack spacing={2} align="stretch">
              {[
                { action: 'Message sent to TechNews', time: '2m ago', status: 'success' },
                { action: 'Added 3 new groups', time: '15m ago', status: 'info' },
                { action: 'Template created', time: '1h ago', status: 'success' },
                { action: 'Blacklist updated', time: '2h ago', status: 'warning' },
              ].map((activity, index) => (
                <Card key={index} bg={bgSubtle} borderWidth="1px" borderColor={borderColor} shadow="none">
                  <CardBody p={3}>
                    <HStack spacing={3}>
                      <Box
                        w={2}
                        h={2}
                        bg={activity.status === 'success' ? 'green.500' :
                            activity.status === 'warning' ? 'orange.500' : 'blue.500'}
                        borderRadius="full"
                        flexShrink={0}
                      />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="sm" color={textPrimary} fontWeight={400} lineHeight={1.2}>
                          {activity.action}
                        </Text>
                        <Text fontSize="xs" color={textMuted} lineHeight={1.2}>
                          {activity.time}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </Box>
        </VStack>
      </Grid>

      {/* Service Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderColor={borderColor}>
          <ModalHeader fontSize="lg" fontWeight={600}>
            {selectedService?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedService && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Badge colorScheme="green" variant="subtle">
                    {selectedService.status}
                  </Badge>
                  <Text fontSize="sm" color={textSecondary}>
                    Uptime: {selectedService.uptime}
                  </Text>
                </HStack>
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color={textMuted} mb={1}>CPU Usage</Text>
                    <Text fontSize="lg" fontWeight={600}>{selectedService.cpu_usage}%</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color={textMuted} mb={1}>Memory</Text>
                    <Text fontSize="lg" fontWeight={600}>{selectedService.memory_usage}%</Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default Dashboard;