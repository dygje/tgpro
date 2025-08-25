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
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  SimpleGrid,
  Icon,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Textarea,
  Divider,
  Link,
  Code,
  Badge,
} from '@chakra-ui/react';
import {
  FiSettings,
  FiKey,
  FiClock,
  FiShield,
  FiFolder,
  FiExternalLink,
  FiInfo,
  FiRefreshCw,
  FiSave,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface TelegramConfig {
  api_id?: number;
  api_hash?: string;
  configured: boolean;
}

interface SystemConfig {
  message_delay_min: number;
  message_delay_max: number;
  safety_enabled: boolean;
  max_messages_per_day: number;
  auto_blacklist_enabled: boolean;
  flood_protection: boolean;
  groups_file_path: string;
  messages_folder_path: string;
  logs_folder_path: string;
}

const ConfigManager: React.FC = () => {
  // Config state
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    configured: false
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    message_delay_min: 30,
    message_delay_max: 60,
    safety_enabled: true,
    max_messages_per_day: 1000,
    auto_blacklist_enabled: true,
    flood_protection: true,
    groups_file_path: './groups.txt',
    messages_folder_path: './messages',
    logs_folder_path: './logs'
  });

  // Form state
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');
  const bgSubtle = useColorModeValue('gray.50', 'gray.850');

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      // Load Telegram config
      const telegramRes = await api.auth.configuration();
      setTelegramConfig(telegramRes);
      
      // Load system config from API or use defaults
      const configRes = await api.get('/config');
      if (configRes.data) {
        setSystemConfig(prevConfig => ({
          ...prevConfig,
          ...configRes.data
        }));
      }
    } catch (err: any) {
      console.error('Error loading configurations:', err);
      // Don't show error for config loading - use defaults
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramConfig = async () => {
    if (!apiId || !apiHash) {
      setError('Please provide both API ID and API Hash');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.auth.configure({
        api_id: Number(apiId),
        api_hash: apiHash
      });
      
      setSuccess('Telegram configuration saved successfully!');
      loadConfigurations();
    } catch (err: any) {
      setError(err.message || 'Failed to save Telegram configuration');
    } finally {
      setSaving(false);
    }
  };

  const saveSystemConfig = async () => {
    setSaving(true);
    setError(null);

    try {
      await api.post('/config', systemConfig);
      setSuccess('System configuration saved successfully!');
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save system configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateSystemConfig = (key: keyof SystemConfig, value: any) => {
    setSystemConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  return (
    <VStack spacing={8} align="stretch" className="fade-in">
      {/* Header Stats */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
                <Icon as={FiKey} color="blue.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {telegramConfig.configured ? 'Configured' : 'Not Configured'}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Telegram API Status
                </Text>
              </VStack>
              <Badge colorScheme={telegramConfig.configured ? 'green' : 'red'} variant="subtle" ml="auto">
                {telegramConfig.configured ? 'Active' : 'Inactive'}
              </Badge>
            </HStack>
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody p={4}>
            <HStack spacing={3}>
              <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                <Icon as={FiShield} color="green.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  {systemConfig.safety_enabled ? 'Enabled' : 'Disabled'}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Safety Protection
                </Text>
              </VStack>
              <Badge colorScheme={systemConfig.safety_enabled ? 'green' : 'orange'} variant="subtle" ml="auto">
                {systemConfig.safety_enabled ? 'Protected' : 'Unprotected'}
              </Badge>
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

      {/* Telegram API Configuration */}
      <Card variant="elevated">
        <CardHeader>
          <HStack spacing={3}>
            <Box p={2} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
              <Icon as={FiKey} color="blue.600" boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                Telegram API Configuration
              </Text>
              <Text fontSize="sm" color={textSecondary}>
                Set up your Telegram API credentials
              </Text>
            </VStack>
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* API Info Alert */}
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize="sm" fontWeight={500}>
                  Get your API credentials from Telegram
                </Text>
                <Text fontSize="sm">
                  Visit{' '}
                  <Link 
                    href="https://my.telegram.org/apps" 
                    isExternal 
                    color="blue.500"
                    fontWeight={500}
                  >
                    my.telegram.org/apps <Icon as={FiExternalLink} display="inline" boxSize={3} />
                  </Link>
                  {' '}to create a new application and get your API ID and Hash.
                </Text>
              </VStack>
            </Alert>

            {/* Current Status */}
            {telegramConfig.configured && (
              <Card variant="compact" bg={bgSubtle}>
                <CardBody p={4}>
                  <VStack align="start" spacing={3}>
                    <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                      Current Configuration
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <HStack spacing={2}>
                        <Text fontSize="xs" color={textMuted}>API ID:</Text>
                        <Code fontSize="xs">{telegramConfig.api_id ? '••••••••' : 'Not set'}</Code>
                      </HStack>
                      <HStack spacing={2}>
                        <Text fontSize="xs" color={textMuted}>API Hash:</Text>
                        <Code fontSize="xs">{telegramConfig.api_hash ? '••••••••••••' : 'Not set'}</Code>
                      </HStack>

                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* API Form */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight={500}>API ID</FormLabel>
                <Input
                  placeholder="12345678"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  fontFamily="mono"
                  type="number"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight={500}>API Hash</FormLabel>
                <Input
                  placeholder="abcd1234efgh5678..."
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  fontFamily="mono"
                />
              </FormControl>

            </SimpleGrid>

            <Button
              colorScheme="blue"
              onClick={saveTelegramConfig}
              isLoading={saving}
              loadingText="Saving..."
              isDisabled={!apiId || !apiHash}
              rightIcon={<FiSave />}
              w="fit-content"
            >
              Save Telegram Configuration
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* System Configuration */}
      <Card variant="elevated">
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box p={2} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
                <Icon as={FiSettings} color="green.600" boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                  System Configuration
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Automation and safety settings
                </Text>
              </VStack>
            </HStack>

            {hasChanges && (
              <Badge colorScheme="orange" variant="subtle">
                Unsaved Changes
              </Badge>
            )}
          </HStack>
        </CardHeader>

        <CardBody>
          <VStack spacing={8} align="stretch">
            {/* Message Timing */}
            <Box>
              <HStack spacing={3} mb={4}>
                <Icon as={FiClock} color="orange.500" boxSize={5} />
                <Text fontSize="md" fontWeight={500} color={textPrimary}>
                  Message Timing
                </Text>
              </HStack>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Minimum Delay (seconds)</FormLabel>
                  <NumberInput
                    value={systemConfig.message_delay_min}
                    onChange={(_, val) => updateSystemConfig('message_delay_min', val || 30)}
                    min={5}
                    max={300}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Maximum Delay (seconds)</FormLabel>
                  <NumberInput
                    value={systemConfig.message_delay_max}
                    onChange={(_, val) => updateSystemConfig('message_delay_max', val || 60)}
                    min={systemConfig.message_delay_min}
                    max={600}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Safety Settings */}
            <Box>
              <HStack spacing={3} mb={4}>
                <Icon as={FiShield} color="green.500" boxSize={5} />
                <Text fontSize="md" fontWeight={500} color={textPrimary}>
                  Safety & Protection
                </Text>
              </HStack>

              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                      Safety Protection
                    </Text>
                    <Text fontSize="xs" color={textMuted}>
                      Enable built-in safety measures to prevent spam detection
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={systemConfig.safety_enabled}
                    onChange={(e) => updateSystemConfig('safety_enabled', e.target.checked)}
                    colorScheme="green"
                  />
                </HStack>

                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                      Auto Blacklist
                    </Text>
                    <Text fontSize="xs" color={textMuted}>
                      Automatically blacklist contacts that report spam
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={systemConfig.auto_blacklist_enabled}
                    onChange={(e) => updateSystemConfig('auto_blacklist_enabled', e.target.checked)}
                    colorScheme="orange"
                  />
                </HStack>

                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                      Flood Protection
                    </Text>
                    <Text fontSize="xs" color={textMuted}>
                      Prevent sending too many messages too quickly
                    </Text>
                  </VStack>
                  <Switch
                    isChecked={systemConfig.flood_protection}
                    onChange={(e) => updateSystemConfig('flood_protection', e.target.checked)}
                    colorScheme="red"
                  />
                </HStack>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Daily Message Limit</FormLabel>
                  <NumberInput
                    value={systemConfig.max_messages_per_day}
                    onChange={(_, val) => updateSystemConfig('max_messages_per_day', val || 1000)}
                    min={1}
                    max={10000}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* File Paths */}
            <Box>
              <HStack spacing={3} mb={4}>
                <Icon as={FiFolder} color="purple.500" boxSize={5} />
                <Text fontSize="md" fontWeight={500} color={textPrimary}>
                  File Paths
                </Text>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Groups File Path</FormLabel>
                  <Input
                    value={systemConfig.groups_file_path}
                    onChange={(e) => updateSystemConfig('groups_file_path', e.target.value)}
                    fontFamily="mono"
                    placeholder="./groups.txt"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Messages Folder Path</FormLabel>
                  <Input
                    value={systemConfig.messages_folder_path}
                    onChange={(e) => updateSystemConfig('messages_folder_path', e.target.value)}
                    fontFamily="mono"
                    placeholder="./messages"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight={500}>Logs Folder Path</FormLabel>
                  <Input
                    value={systemConfig.logs_folder_path}
                    onChange={(e) => updateSystemConfig('logs_folder_path', e.target.value)}
                    fontFamily="mono"
                    placeholder="./logs"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            {/* Save Button */}
            <HStack spacing={3}>
              <Button
                colorScheme="green"
                onClick={saveSystemConfig}
                isLoading={saving}
                loadingText="Saving..."
                isDisabled={!hasChanges}
                rightIcon={<FiSave />}
              >
                Save System Configuration
              </Button>
              
              <Button
                variant="outline"
                onClick={loadConfigurations}
                isLoading={loading}
                rightIcon={<FiRefreshCw />}
              >
                Reset to Saved
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default ConfigManager;