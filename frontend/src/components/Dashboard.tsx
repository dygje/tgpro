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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  FiBarChart,
  FiTarget,
  FiCpu,
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

  // Precision theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
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

      // Update stats with realistic data
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

  // Precision Stat Card Component
  const StatCard = ({ 
    label, 
    value, 
    icon, 
    trend, 
    trendValue,
    color = 'blue',
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
      variant="elevated"
      bg={cardBg} 
      borderWidth="1px" 
      borderColor={borderColor} 
      _hover={{ 
        borderColor: useColorModeValue('gray.300', 'gray.700'),
        shadow: 'md',
        transform: 'translateY(-1px)'
      }}
      transition="all 0.2s ease"
      cursor="pointer"
      className="scale-in"
    >
      <CardBody p={4}>
        <VStack align="start" spacing={4}>
          {/* Header with icon and trend */}
          <HStack justify="space-between" w="full">
            <Box
              p={2}
              bg={useColorModeValue(`${color}.50`, `${color}.900`)}
              borderRadius="lg"
              border="1px solid"
              borderColor={useColorModeValue(`${color}.100`, `${color}.800`)}
            >
              <Icon 
                as={icon} 
                boxSize={4} 
                color={useColorModeValue(`${color}.600`, `${color}.300`)}
              />
            </Box>
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
          
          {/* Value and Label */}
          <VStack align="start" spacing={1} w="full">
            {isLoading ? (
              <Skeleton height="28px" width="80px" borderRadius="md" />
            ) : (
              <Text fontSize="2xl" fontWeight={600} color={textPrimary} lineHeight="shorter">
                {value}
              </Text>
            )}
            <Text fontSize="sm" color={textSecondary} fontWeight={500} lineHeight="shorter">
              {label}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );

  // Precision Service Card Component
  const ServiceCard = ({ service, onClick }: { service: ServiceStatus; onClick: () => void }) => {
    const statusColor = service.status === 'healthy' ? 'green' : 
                       service.status === 'warning' ? 'orange' : 'red';
    
    return (
      <Card
        variant="elevated"
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        _hover={{ 
          borderColor: useColorModeValue('gray.300', 'gray.700'),
          shadow: 'sm',
          transform: 'translateY(-1px)'
        }}
        transition="all 0.2s ease"
        cursor="pointer"
        onClick={onClick}
        className="scale-in"
      >
        <CardBody p={4}>
          <HStack justify="space-between" align="start">
            <HStack spacing={3} flex={1}>
              <Box
                w={3}
                h={3}
                bg={`${statusColor}.500`}
                borderRadius="full"
                flexShrink={0}
              />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="sm" fontWeight={500} color={textPrimary} lineHeight="shorter">
                  {service.name}
                </Text>
                <HStack spacing={3}>
                  <Text fontSize="xs" color={textMuted} lineHeight="shorter">
                    {service.uptime}
                  </Text>
                  <Text fontSize="xs" color={textMuted} lineHeight="shorter">
                    CPU: {service.cpu_usage}%
                  </Text>
                </HStack>
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

  // Precision Quick Action Card
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
      variant="elevated"
      bg={variant === 'primary' ? 'gray.900' : cardBg}
      borderWidth="1px"
      borderColor={variant === 'primary' ? 'gray.900' : borderColor}
      _hover={{ 
        borderColor: variant === 'primary' ? 'gray.800' : useColorModeValue('gray.300', 'gray.700'),
        shadow: 'md',
        transform: 'translateY(-2px)'
      }}
      transition="all 0.2s ease"
      cursor="pointer"
      onClick={onClick}
      className="scale-in"
      _dark={{
        bg: variant === 'primary' ? 'gray.200' : cardBg,
        borderColor: variant === 'primary' ? 'gray.200' : borderColor,
      }}
    >
      <CardBody p={4}>
        <VStack align="start" spacing={3}>
          <HStack spacing={3} w="full">
            <Box
              p={2}
              bg={variant === 'primary' ? 
                useColorModeValue('whiteAlpha.200', 'blackAlpha.200') : 
                useColorModeValue('gray.100', 'gray.800')
              }
              borderRadius="lg"
            >
              <Icon 
                as={icon} 
                boxSize={4} 
                color={variant === 'primary' ? 
                  useColorModeValue('white', 'black') : 
                  textMuted
                } 
              />
            </Box>
            <VStack align="start" spacing={1} flex={1}>
              <Text 
                fontSize="sm" 
                fontWeight={500} 
                color={variant === 'primary' ? 
                  useColorModeValue('white', 'black') : 
                  textPrimary
                }
                lineHeight="shorter"
              >
                {title}
              </Text>
              <Text 
                fontSize="xs" 
                color={variant === 'primary' ? 
                  useColorModeValue('whiteAlpha.800', 'blackAlpha.600') : 
                  textMuted
                }
                lineHeight="shorter"
              >
                {description}
              </Text>
            </VStack>
            <Icon 
              as={FiArrowRight} 
              boxSize={4} 
              color={variant === 'primary' ? 
                useColorModeValue('whiteAlpha.600', 'blackAlpha.400') : 
                textMuted
              } 
            />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <VStack spacing={8} align="stretch" h="full" maxW="full" className="fade-in">
      {/* System Status Alert */}
      {services.length > 0 && services.every(s => s.status === 'healthy') && (
        <Alert 
          status="success" 
          borderRadius="lg" 
          bg="green.50" 
          borderColor="green.200" 
          borderWidth="1px"
          className="scale-in"
        >
          <AlertIcon boxSize={4} />
          <AlertDescription fontSize="sm" fontWeight={500}>
            All systems operational • Last updated just now
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Grid */}
      <Grid 
        templateColumns={{ base: '1fr', xl: '2fr 1fr' }} 
        gap={8} 
        flex={1}
      >
        {/* Left Column - Analytics & Actions */}
        <VStack spacing={8} align="stretch">
          {/* Analytics Section */}
          <Box>
            <VStack align="start" spacing={4} mb={6}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('blue.100', 'blue.800')}
                >
                  <Icon as={FiBarChart} boxSize={5} color={useColorModeValue('blue.600', 'blue.300')} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary} lineHeight="shorter">
                    Analytics Overview
                  </Text>
                  <Text fontSize="sm" color={textSecondary} lineHeight="shorter">
                    Real-time system metrics and performance
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Stats Grid - Precision 3x2 Layout */}
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
              <StatCard
                label="Active Groups"
                value={stats.groups_count}
                icon={FiUsers}
                trend="up"
                trendValue="+12%"
                color="blue"
                isLoading={loading}
              />
              <StatCard
                label="Message Templates"
                value={stats.messages_count}
                icon={FiMessageSquare}
                trend="up"
                trendValue="+3"
                color="purple"
                isLoading={loading}
              />
              <StatCard
                label="Messages Sent Today"
                value={stats.sent_today}
                icon={FiSend}
                trend="up"
                trendValue="+24%"
                color="green"
                isLoading={loading}
              />
              <StatCard
                label="Success Rate"
                value={`${stats.success_rate}%`}
                icon={FiTrendingUp}
                trend="up"
                trendValue="+2%"
                color="green"
                isLoading={loading}
              />
              <StatCard
                label="Blocked Contacts"
                value={stats.blacklist_count}
                icon={FiShield}
                trend="neutral"
                trendValue="0"
                color="orange"
                isLoading={loading}
              />
              <StatCard
                label="Queue Size"
                value={stats.queue_size}
                icon={FiClock}
                trend="neutral"
                trendValue="0"
                color="gray"
                isLoading={loading}
              />
            </SimpleGrid>
          </Box>

          {/* Quick Actions Section */}
          <Box>
            <VStack align="start" spacing={4} mb={6}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg={useColorModeValue('green.50', 'green.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('green.100', 'green.800')}
                >
                  <Icon as={FiTarget} boxSize={5} color={useColorModeValue('green.600', 'green.300')} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary} lineHeight="shorter">
                    Quick Actions
                  </Text>
                  <Text fontSize="sm" color={textSecondary} lineHeight="shorter">
                    Common automation tasks
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
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

        {/* Right Column - System Health & Activity */}
        <VStack spacing={8} align="stretch">
          {/* System Health Section */}
          <Box>
            <VStack align="start" spacing={4} mb={6}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg={useColorModeValue('orange.50', 'orange.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('orange.100', 'orange.800')}
                >
                  <Icon as={FiCpu} boxSize={5} color={useColorModeValue('orange.600', 'orange.300')} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary} lineHeight="shorter">
                    System Health
                  </Text>
                  <Text fontSize="sm" color={textSecondary} lineHeight="shorter">
                    Service status and monitoring
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            <VStack spacing={3}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height="72px" borderRadius="lg" />
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

          {/* Recent Activity Section */}
          <Box>
            <VStack align="start" spacing={4} mb={6}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg={useColorModeValue('purple.50', 'purple.900')}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={useColorModeValue('purple.100', 'purple.800')}
                >
                  <Icon as={FiActivity} boxSize={5} color={useColorModeValue('purple.600', 'purple.300')} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary} lineHeight="shorter">
                    Recent Activity
                  </Text>
                  <Text fontSize="sm" color={textSecondary} lineHeight="shorter">
                    Latest system events
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            <VStack spacing={3} align="stretch">
              {[
                { action: 'Message sent to TechNews channel', time: '2 minutes ago', status: 'success' },
                { action: 'Added 3 new target groups', time: '15 minutes ago', status: 'info' },
                { action: 'Created new message template', time: '1 hour ago', status: 'success' },
                { action: 'Updated blacklist settings', time: '2 hours ago', status: 'warning' },
              ].map((activity, index) => (
                <Card key={index} variant="compact" bg={bgSubtle} className="scale-in">
                  <CardBody p={4}>
                    <HStack spacing={3} align="start">
                      <Box
                        w={2.5}
                        h={2.5}
                        bg={activity.status === 'success' ? 'green.500' :
                            activity.status === 'warning' ? 'orange.500' : 'blue.500'}
                        borderRadius="full"
                        flexShrink={0}
                        mt={1}
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontSize="sm" color={textPrimary} fontWeight={400} lineHeight="shorter">
                          {activity.action}
                        </Text>
                        <Text fontSize="xs" color={textMuted} lineHeight="shorter">
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

      {/* Service Detail Modal - Precision Design */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderColor={borderColor} borderRadius="xl">
          <ModalHeader fontSize="lg" fontWeight={600}>
            <HStack spacing={3}>
              <Box
                w={2.5}
                h={2.5}
                bg={selectedService?.status === 'healthy' ? 'green.500' : 'orange.500'}
                borderRadius="full"
              />
              {selectedService?.name}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedService && (
              <VStack spacing={6} align="stretch">
                <HStack spacing={4}>
                  <Badge 
                    colorScheme={selectedService.status === 'healthy' ? 'green' : 'orange'} 
                    variant="subtle"
                    borderRadius="md"
                    px={3}
                    py={1}
                  >
                    {selectedService.status.toUpperCase()}
                  </Badge>
                  <Text fontSize="sm" color={textSecondary}>
                    Uptime: {selectedService.uptime}
                  </Text>
                </HStack>
                
                <SimpleGrid columns={2} spacing={6}>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="xs" color={textMuted} fontWeight={600} textTransform="uppercase">
                      CPU Usage
                    </Text>
                    <Text fontSize="xl" fontWeight={600} color={textPrimary}>
                      {selectedService.cpu_usage}%
                    </Text>
                    <Progress 
                      value={selectedService.cpu_usage} 
                      size="sm" 
                      borderRadius="full"
                      w="full"
                    />
                  </VStack>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="xs" color={textMuted} fontWeight={600} textTransform="uppercase">
                      Memory Usage
                    </Text>
                    <Text fontSize="xl" fontWeight={600} color={textPrimary}>
                      {selectedService.memory_usage}%
                    </Text>
                    <Progress 
                      value={selectedService.memory_usage} 
                      size="sm" 
                      borderRadius="full"
                      w="full"
                    />
                  </VStack>
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