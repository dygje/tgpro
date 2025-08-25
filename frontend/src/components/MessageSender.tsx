import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
  Badge,
  Divider,
  SimpleGrid,
  Icon,
  Checkbox,
  CheckboxGroup,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import {
  FiSend,
  FiUsers,
  FiMessageSquare,
  FiClock,
  FiTarget,
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface Template {
  id: string;
  name: string;
  content: string;
}

interface Group {
  name: string;
  url: string;
}

interface MessageTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  template: string;
  groups: string[];
  created_at: string;
}

const MessageSender: React.FC = () => {
  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [messageDelay, setMessageDelay] = useState(30);
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  
  // Data state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tasks, setTasks] = useState<MessageTask[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load templates
      const templatesRes = await api.get('/templates');
      setTemplates(templatesRes.data || []);

      // Load groups
      const groupsRes = await api.get('/groups');
      if (Array.isArray(groupsRes.data)) {
        setGroups(groupsRes.data.map((url: string) => ({
          name: url.replace('https://t.me/', '').replace('@', ''),
          url
        })));
      }

      // Load recent tasks (mock for now)
      setTasks([
        {
          id: '1',
          status: 'completed',
          progress: 100,
          template: 'Welcome Message',
          groups: ['techgroup', 'devgroup'],
          created_at: '2 hours ago'
        },
        {
          id: '2', 
          status: 'running',
          progress: 65,
          template: 'Daily Update',
          groups: ['newsgroup'],
          created_at: '30 minutes ago'
        }
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    }
  };

  const handleSendMessage = async () => {
    if ((!selectedTemplate && !customMessage) || selectedGroups.length === 0) {
      setError('Please select a message and target groups');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messageContent = isCustomMessage ? customMessage : selectedTemplate;
      
      // Create task via API
      const taskData = {
        message: messageContent,
        groups: selectedGroups,
        delay: messageDelay
      };

      // Mock API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(`Message task created successfully! Sending to ${selectedGroups.length} groups.`);
      
      // Reset form
      setSelectedTemplate('');
      setCustomMessage('');
      setSelectedGroups([]);
      setIsCustomMessage(false);
      
      // Reload tasks
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const TaskCard = ({ task }: { task: MessageTask }) => {
    const statusColors = {
      pending: 'blue',
      running: 'orange', 
      completed: 'green',
      failed: 'red'
    };

    const statusIcons = {
      pending: FiClock,
      running: FiPlay,
      completed: FiCheckCircle,
      failed: FiAlertTriangle
    };

    return (
      <Card variant="elevated" className="scale-in">
        <CardBody p={4}>
          <VStack align="start" spacing={3}>
            <HStack justify="space-between" w="full">
              <HStack spacing={2}>
                <Icon 
                  as={statusIcons[task.status]} 
                  color={`${statusColors[task.status]}.500`}
                  boxSize={4}
                />
                <Badge colorScheme={statusColors[task.status]} variant="subtle">
                  {task.status.toUpperCase()}
                </Badge>
              </HStack>
              <Text fontSize="xs" color={textMuted}>
                {task.created_at}
              </Text>
            </HStack>

            <VStack align="start" spacing={1} w="full">
              <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                {task.template}
              </Text>
              <Text fontSize="xs" color={textSecondary}>
                {task.groups.length} groups • {task.groups.join(', ')}
              </Text>
            </VStack>

            {task.status === 'running' && (
              <Box w="full">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" color={textMuted}>Progress</Text>
                  <Text fontSize="xs" color={textMuted}>{task.progress}%</Text>
                </HStack>
                <Progress value={task.progress} size="sm" borderRadius="full" />
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <VStack spacing={8} align="stretch" className="fade-in">
      {/* Header Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                <Icon as={FiMessageSquare} color="blue.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {templates.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Templates Available
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                <Icon as={FiUsers} color="green.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {groups.length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Target Groups
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.100">
                <Icon as={FiTarget} color="orange.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {tasks.filter(t => t.status === 'running').length}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Active Tasks
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* Left Column - Message Composer */}
        <VStack spacing={6} align="stretch">
          <Card variant="elevated">
            <CardHeader>
              <HStack spacing={3}>
                <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                  <Icon as={FiSend} color="blue.600" boxSize={5} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                    Compose Message
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    Create and send automated messages
                  </Text>
                </VStack>
              </HStack>
            </CardHeader>

            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Message Source Selection */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Message Source</FormLabel>
                  <HStack spacing={4}>
                    <Button
                      variant={!isCustomMessage ? "solid" : "outline"}
                      size="sm"
                      onClick={() => setIsCustomMessage(false)}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant={isCustomMessage ? "solid" : "outline"} 
                      size="sm"
                      onClick={() => setIsCustomMessage(true)}
                    >
                      Custom Message
                    </Button>
                  </HStack>
                </FormControl>

                {/* Template Selection */}
                {!isCustomMessage && (
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight={500}>Select Template</FormLabel>
                    <Select
                      placeholder="Choose a message template..."
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.name}>
                          {template.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Custom Message */}
                {isCustomMessage && (
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight={500}>Custom Message</FormLabel>
                    <Textarea
                      placeholder="Enter your message..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={6}
                      resize="vertical"
                    />
                  </FormControl>
                )}

                {/* Target Groups */}
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>
                    Target Groups ({selectedGroups.length} selected)
                  </FormLabel>
                  <Box
                    maxH="200px"
                    overflowY="auto"
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="lg"
                    p={4}
                    bg={bgSubtle}
                  >
                    <CheckboxGroup
                      value={selectedGroups}
                      onChange={(values) => setSelectedGroups(values as string[])}
                    >
                      <Stack spacing={2}>
                        {groups.map((group) => (
                          <Checkbox key={group.url} value={group.name}>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight={500}>
                                {group.name}
                              </Text>
                              <Text fontSize="xs" color={textMuted}>
                                {group.url}
                              </Text>
                            </VStack>
                          </Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </Box>
                </FormControl>

                {/* Message Settings */}
                <Card variant="compact" bg={bgSubtle}>
                  <CardBody p={4}>
                    <VStack align="start" spacing={4}>
                      <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                        Sending Settings
                      </Text>
                      
                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight={500}>
                          Delay Between Messages (seconds)
                        </FormLabel>
                        <NumberInput
                          value={messageDelay}
                          onChange={(_, val) => setMessageDelay(val || 30)}
                          min={5}
                          max={300}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

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

                {/* Send Button */}
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={handleSendMessage}
                  isLoading={loading}
                  loadingText="Creating Task..."
                  isDisabled={(!selectedTemplate && !customMessage) || selectedGroups.length === 0}
                  rightIcon={<FiSend />}
                >
                  Send Message
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        {/* Right Column - Task History */}
        <VStack spacing={6} align="stretch">
          <Card variant="elevated">
            <CardHeader>
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Box p={2} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
                    <Icon as={FiClock} color="purple.600" boxSize={5} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                      Task History
                    </Text>
                    <Text fontSize="sm" color={textSecondary}>
                      Recent message campaigns
                    </Text>
                  </VStack>
                </HStack>
                
                <IconButton
                  aria-label="Refresh"
                  icon={<FiRefreshCw />}
                  size="sm"
                  variant="ghost"
                  onClick={loadData}
                />
              </HStack>
            </CardHeader>

            <CardBody>
              <VStack spacing={4} align="stretch">
                {tasks.length === 0 ? (
                  <VStack spacing={4} py={8}>
                    <Icon as={FiMessageSquare} boxSize={12} color={textMuted} />
                    <VStack spacing={1}>
                      <Text fontSize="md" fontWeight={500} color={textPrimary}>
                        No tasks yet
                      </Text>
                      <Text fontSize="sm" color={textMuted} textAlign="center">
                        Send your first message to see task history
                      </Text>
                    </VStack>
                  </VStack>
                ) : (
                  tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>
    </VStack>
  );
};

export default MessageSender;