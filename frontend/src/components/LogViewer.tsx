import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  IconButton,
  SimpleGrid,
  Icon,
  Select,
  Code,
  Tooltip,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiDownload,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiPause,
  FiPlay,
  FiTrash2,
  FiMaximize2,
  FiMinimize2,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiXCircle,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  details?: string;
}

const LogViewer: React.FC = () => {
  // Data state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    loadLogs();
    if (autoRefresh) {
      startAutoRefresh();
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }, [autoRefresh]);

  useEffect(() => {
    // Filter logs
    let filtered = logs;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.source.toLowerCase().includes(term) ||
        (log.details && log.details.toLowerCase().includes(term))
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source === sourceFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, sourceFilter]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (logsEndRef.current && autoRefresh) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoRefresh]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs');
      
      // Mock data for demonstration - replace with actual API response
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          source: 'telegram_service',
          message: 'Successfully connected to Telegram API',
          details: 'Connection established with user authentication'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'success',
          source: 'message_sender',
          message: 'Message sent successfully to TechNews group',
          details: 'Template: Welcome Message, Recipients: 245 members'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'warning',
          source: 'blacklist_manager',
          message: 'Added user to temporary blacklist',
          details: 'User @spammer123 reported for inappropriate behavior'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'error',
          source: 'config_manager',
          message: 'Failed to load configuration file',
          details: 'Config file not found: ./config/settings.json'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: 'info',
          source: 'groups_manager',
          message: 'Added new group to target list',
          details: 'Group: @developers_hub, Members: ~1500'
        }
      ];

      setLogs(prevLogs => {
        // In real implementation, append only new logs
        return mockLogs;
      });
    } catch (err: any) {
      setError('Failed to load logs');
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    refreshInterval.current = setInterval(() => {
      loadLogs();
    }, 5000); // Refresh every 5 seconds
  };

  const stopAutoRefresh = () => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = null;
    }
  };

  const clearLogs = async () => {
    try {
      await api.delete('/logs');
      setLogs([]);
      setSuccess('Logs cleared successfully');
    } catch (err: any) {
      setError('Failed to clear logs');
    }
  };

  const downloadLogs = () => {
    const logData = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${log.details ? `\nDetails: ${log.details}` : ''}`
    ).join('\n\n');

    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tgpro-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess('Logs downloaded successfully');
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return FiXCircle;
      case 'warning': return FiAlertCircle;
      case 'success': return FiCheckCircle;
      case 'info': 
      default: return FiInfo;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'success': return 'green';
      case 'info':
      default: return 'blue';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getUniqueSources = () => {
    const sources = [...new Set(logs.map(log => log.source))];
    return sources.sort();
  };

  const LogEntry = ({ log }: { log: LogEntry }) => (
    <Card 
      variant="compact" 
      bg={bgSubtle} 
      className="scale-in"
      _hover={{ 
        borderColor: useColorModeValue('gray.300', 'gray.700'),
        shadow: 'sm' 
      }}
      transition="all 0.2s ease"
    >
      <CardBody p={4}>
        <VStack align="start" spacing={3}>
          {/* Header */}
          <HStack justify="space-between" w="full">
            <HStack spacing={3}>
              <Icon 
                as={getLogIcon(log.level)} 
                color={`${getLogColor(log.level)}.500`}
                boxSize={4}
              />
              <Badge 
                colorScheme={getLogColor(log.level)} 
                variant="subtle"
                textTransform="uppercase"
                fontSize="xs"
              >
                {log.level}
              </Badge>
              <Badge variant="outline" fontSize="xs">
                {log.source}
              </Badge>
            </HStack>
            
            <Text fontSize="xs" color={textMuted} fontFamily="mono">
              {formatTimestamp(log.timestamp)}
            </Text>
          </HStack>

          {/* Message */}
          <Text fontSize="sm" color={textPrimary} fontWeight={400}>
            {log.message}
          </Text>

          {/* Details */}
          {log.details && (
            <Box
              w="full"
              p={3}
              bg={useColorModeValue('gray.100', 'gray.800')}
              borderRadius="md"
              border="1px solid"
              borderColor={borderColor}
            >
              <Code 
                fontSize="xs" 
                bg="transparent" 
                color={textSecondary}
                p={0}
                whiteSpace="pre-wrap"
              >
                {log.details}
              </Code>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <VStack spacing={8} align="stretch" className="fade-in">
      {/* Header Stats */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                <Icon as={FiActivity} color="blue.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {logs.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Total Logs
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.100">
                <Icon as={FiXCircle} color="red.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {logs.filter(l => l.level === 'error').length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Errors
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.100">
                <Icon as={FiAlertCircle} color="orange.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {logs.filter(l => l.level === 'warning').length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Warnings
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                <Icon as={FiCheckCircle} color="green.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {logs.filter(l => l.level === 'success').length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Success
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Messages */}
      {error && (
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert status="success" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Log Viewer */}
      <Card variant="elevated">
        <CardHeader>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Box p={2} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
                  <Icon as={FiActivity} color="purple.600" boxSize={5} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                    System Logs
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    Real-time monitoring and activity logs
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={2}>
                <Tooltip label={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}>
                  <IconButton
                    aria-label="Toggle auto-refresh"
                    icon={autoRefresh ? <FiPause /> : <FiPlay />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    colorScheme={autoRefresh ? 'orange' : 'green'}
                  />
                </Tooltip>
                
                <Tooltip label="Refresh logs">
                  <IconButton
                    aria-label="Refresh"
                    icon={<FiRefreshCw />}
                    size="sm"
                    variant="ghost"
                    onClick={loadLogs}
                    isLoading={loading}
                  />
                </Tooltip>

                <Tooltip label="Download logs">
                  <IconButton
                    aria-label="Download"
                    icon={<FiDownload />}
                    size="sm"
                    variant="ghost"
                    onClick={downloadLogs}
                    isDisabled={filteredLogs.length === 0}
                  />
                </Tooltip>

                <Tooltip label="Clear logs">
                  <IconButton
                    aria-label="Clear"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={clearLogs}
                    isDisabled={logs.length === 0}
                  />
                </Tooltip>
              </HStack>
            </HStack>

            {/* Filters */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight={500}>Search</FormLabel>
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                  // leftElement prop doesn't exist in Chakra UI Input
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight={500}>Log Level</FormLabel>
                <Select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  size="sm"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight={500}>Source</FormLabel>
                <Select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  size="sm"
                >
                  <option value="all">All Sources</option>
                  {getUniqueSources().map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>

            {/* Status Bar */}
            <HStack justify="space-between" fontSize="sm" color={textMuted}>
              <Text>
                Showing {filteredLogs.length} of {logs.length} logs
              </Text>
              <HStack spacing={4}>
                {autoRefresh && (
                  <HStack spacing={1}>
                    <Box w={2} h={2} bg="green.500" borderRadius="full" />
                    <Text>Live</Text>
                  </HStack>
                )}
                <Text>
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </CardHeader>

        <CardBody>
          {filteredLogs.length === 0 ? (
            <VStack spacing={4} py={12}>
              <Icon as={FiActivity} boxSize={16} color={textMuted} />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight={500} color={textPrimary}>
                  {searchTerm || levelFilter !== 'all' || sourceFilter !== 'all' 
                    ? 'No matching logs found' 
                    : 'No logs available'
                  }
                </Text>
                <Text fontSize="sm" color={textMuted} textAlign="center">
                  {searchTerm || levelFilter !== 'all' || sourceFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'System logs will appear here when available'
                  }
                </Text>
              </VStack>
            </VStack>
          ) : (
            <Box
              maxH={isExpanded ? "80vh" : "600px"}
              overflowY="auto"
              className="custom-scrollbar"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="lg"
              p={4}
            >
              <VStack spacing={3} align="stretch">
                {filteredLogs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
                <div ref={logsEndRef} />
              </VStack>
            </Box>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
};

export default LogViewer;