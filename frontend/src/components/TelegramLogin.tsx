import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  Heading,
  Badge,
  useColorModeValue,
  Container,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { 
  FiShield, 
  FiKey, 
  FiHash, 
  FiArrowRight, 
  FiUser,
  FiCheck,
  FiInfo,
  FiLock,
} from 'react-icons/fi';
import { api } from '../lib/api';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginProps {
  onAuthSuccess: () => void;
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onAuthSuccess }) => {
  // States
  const [currentStep, setCurrentStep] = useState<'telegram' | 'api-config'>('telegram');
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [telegramWidgetLoaded, setTelegramWidgetLoaded] = useState(false);

  // Theme colors - Linear + Vercel style
  const bgColor = useColorModeValue('white', 'gray.950');
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');

  // Load Telegram Login Widget
  useEffect(() => {
    if (currentStep === 'telegram' && !telegramWidgetLoaded) {
      loadTelegramWidget();
    }
  }, [currentStep, telegramWidgetLoaded]);

  const loadTelegramWidget = () => {
    // Remove existing script if any
    const existingScript = document.getElementById('telegram-login-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Clear the container
    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
    }

    // Create new script
    const script = document.createElement('script');
    script.id = 'telegram-login-script';
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'TGProAuthBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    // Define the callback function
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      console.log('Telegram user authenticated:', user);
      setTelegramUser(user);
      handleTelegramAuth(user);
    };

    document.getElementById('telegram-login-container')?.appendChild(script);
    setTelegramWidgetLoaded(true);
  };

  const handleTelegramAuth = async (user: TelegramUser) => {
    setLoading(true);
    setError(null);

    try {
      // Verify Telegram authentication with backend
      const response = await api.auth.telegramLogin({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
        auth_date: user.auth_date,
        hash: user.hash,
      });

      setSuccess(`Welcome, ${user.first_name}! Please configure your Telegram API credentials.`);
      setCurrentStep('api-config');
    } catch (err: any) {
      const errorMessage = err?.message || err?.details?.message || 'Telegram authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApiConfig = async () => {
    if (!apiId || !apiHash) {
      setError('Please enter both API ID and API Hash');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.auth.configure({
        api_id: Number(apiId),
        api_hash: apiHash,
        telegram_user: telegramUser,
      });
      
      setSuccess('Configuration complete! Redirecting to dashboard...');
      setTimeout(() => onAuthSuccess(), 1500);
    } catch (err: any) {
      const errorMessage = err?.message || err?.details?.message || 'API configuration failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'telegram':
        return {
          title: 'Login with Telegram',
          description: 'Secure authentication via Telegram',
        };
      case 'api-config':
        return {
          title: 'API Configuration',
          description: 'Connect your Telegram API credentials',
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <Flex minH="100vh" bg={bgColor} align="center" justify="center" p={6}>
      <Container maxW="lg">
        <VStack spacing={10}>
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Box
              w={16}
              h={16}
              bg="gray.900"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              _dark={{ bg: "gray.100" }}
            >
              <FiShield color={useColorModeValue("white", "black")} size={32} />
            </Box>
            <VStack spacing={2}>
              <Heading size="xl" color={textPrimary} fontWeight={700}>
                TGPro
              </Heading>
              <Text fontSize="lg" color={textSecondary} fontWeight={500}>
                Telegram Automation Platform
              </Text>
              <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
                Secure Telegram Authentication
              </Badge>
            </VStack>
          </VStack>

          {/* Main Card */}
          <Card w="full" maxW="md" shadow="xl" borderRadius="2xl" border="1px solid" borderColor={borderColor}>
            <CardBody p={8}>
              <VStack spacing={8}>
                {/* Progress */}
                <Box w="full">
                  <HStack justify="space-between" mb={3}>
                    <Text fontSize="md" fontWeight={600} color={textPrimary}>
                      {stepInfo.title}
                    </Text>
                    <Text fontSize="sm" color={textMuted}>
                      {stepInfo.progress}%
                    </Text>
                  </HStack>
                  <Progress 
                    value={stepInfo.progress} 
                    size="lg"
                    borderRadius="full" 
                    bg={useColorModeValue('gray.100', 'gray.800')}
                    sx={{
                      '& > div': {
                        bg: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
                      }
                    }}
                  />
                  <Text fontSize="sm" color={textSecondary} mt={3}>
                    {stepInfo.description}
                  </Text>
                </Box>

                {/* Messages */}
                {error && (
                  <Alert status="error" borderRadius="xl" bg="red.50" borderColor="red.200" borderWidth="1px">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert status="success" borderRadius="xl" bg="green.50" borderColor="green.200" borderWidth="1px">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Telegram Login Step */}
                {currentStep === 'telegram' && (
                  <VStack spacing={6} w="full">
                    {/* Info Box */}
                    <Box 
                      p={4} 
                      bg={inputBg} 
                      borderRadius="xl" 
                      border="1px solid" 
                      borderColor={borderColor}
                      w="full"
                    >
                      <HStack spacing={3} mb={3}>
                        <Icon as={FiInfo} boxSize={4} color="blue.500" />
                        <Text fontSize="sm" fontWeight={600} color={textPrimary}>
                          Secure Login
                        </Text>
                      </HStack>
                      <VStack spacing={2} align="start" fontSize="sm" color={textSecondary}>
                        <Text>• Click the button below to login with Telegram</Text>
                        <Text>• Your identity will be verified securely</Text>
                        <Text>• No passwords or sensitive data required</Text>
                      </VStack>
                    </Box>

                    {/* Telegram Widget Container */}
                    <Box w="full" textAlign="center">
                      <div 
                        id="telegram-login-container" 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'center',
                          minHeight: '40px'
                        }}
                      />
                    </Box>

                    {loading && (
                      <Box textAlign="center" p={4}>
                        <Text fontSize="sm" color={textSecondary}>
                          Verifying Telegram authentication...
                        </Text>
                      </Box>
                    )}
                  </VStack>
                )}

                {/* API Configuration Step */}
                {currentStep === 'api-config' && telegramUser && (
                  <VStack spacing={6} w="full">
                    {/* User Info */}
                    <Box 
                      p={4} 
                      bg={inputBg} 
                      borderRadius="xl" 
                      border="1px solid" 
                      borderColor={borderColor}
                      w="full"
                    >
                      <HStack spacing={3} mb={3}>
                        <Icon as={FiUser} boxSize={4} color="green.500" />
                        <Text fontSize="sm" fontWeight={600} color={textPrimary}>
                          Logged in as
                        </Text>
                      </HStack>
                      <HStack spacing={3}>
                        {telegramUser.photo_url && (
                          <Box
                            w={8}
                            h={8}
                            borderRadius="full"
                            bg="gray.300"
                            bgImage={telegramUser.photo_url}
                            bgSize="cover"
                            bgPosition="center"
                          />
                        )}
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight={600} color={textPrimary}>
                            {telegramUser.first_name} {telegramUser.last_name || ''}
                          </Text>
                          {telegramUser.username && (
                            <Text fontSize="xs" color={textSecondary}>
                              @{telegramUser.username}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    </Box>

                    <Divider />

                    {/* API Configuration Info */}
                    <Box 
                      p={4} 
                      bg={inputBg} 
                      borderRadius="xl" 
                      border="1px solid" 
                      borderColor={borderColor}
                      w="full"
                    >
                      <HStack spacing={3} mb={3}>
                        <Icon as={FiInfo} boxSize={4} color="blue.500" />
                        <Text fontSize="sm" fontWeight={600} color={textPrimary}>
                          Setup API Credentials
                        </Text>
                      </HStack>
                      <VStack spacing={2} align="start" fontSize="sm" color={textSecondary}>
                        <Text>1. Visit my.telegram.org/apps</Text>
                        <Text>2. Create a new application</Text>
                        <Text>3. Copy your API ID and API Hash below</Text>
                      </VStack>
                    </Box>

                    {/* API Inputs */}
                    <SimpleGrid columns={2} spacing={4} w="full">
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight={600} color={textSecondary}>
                          API ID
                        </FormLabel>
                        <InputGroup>
                          <InputLeftElement>
                            <Icon as={FiHash} color={textMuted} boxSize={4} />
                          </InputLeftElement>
                          <Input
                            placeholder="12345678"
                            value={apiId}
                            onChange={(e) => setApiId(e.target.value)}
                            variant="filled"
                            fontSize="sm"
                            fontFamily="mono"
                            bg={inputBg}
                            borderRadius="xl"
                          />
                        </InputGroup>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight={600} color={textSecondary}>
                          API Hash
                        </FormLabel>
                        <InputGroup>
                          <InputLeftElement>
                            <Icon as={FiKey} color={textMuted} boxSize={4} />
                          </InputLeftElement>
                          <Input
                            placeholder="abcd1234..."
                            value={apiHash}
                            onChange={(e) => setApiHash(e.target.value)}
                            variant="filled"
                            fontSize="sm"
                            fontFamily="mono"
                            bg={inputBg}
                            borderRadius="xl"
                          />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>

                    <Button
                      onClick={handleApiConfig}
                      isLoading={loading}
                      loadingText="Configuring..."
                      w="full"
                      size="lg"
                      borderRadius="xl"
                      bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      color="white"
                      _hover={{
                        bg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                        transform: "translateY(-1px)",
                      }}
                      _active={{
                        transform: "translateY(0)",
                      }}
                      rightIcon={<FiCheck />}
                    >
                      Complete Setup
                    </Button>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <Text fontSize="sm" color={textMuted} textAlign="center" maxW="md">
            Secure authentication powered by Telegram. 
            Your credentials are encrypted and stored securely.
          </Text>
        </VStack>
      </Container>
    </Flex>
  );
};

export default TelegramLogin;