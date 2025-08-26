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
        <VStack spacing={8}>
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Box
              w={16}
              h={16}
              bg="gray.900"
              borderRadius="2xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              _dark={{ bg: "gray.100" }}
              shadow="lg"
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
              <Badge 
                colorScheme="blue" 
                variant="subtle" 
                px={4} 
                py={2} 
                borderRadius="full"
                fontSize="sm"
              >
                🔒 Secure Authentication
              </Badge>
            </VStack>
          </VStack>

          {/* Main Card */}
          <Card 
            w="full" 
            maxW="md" 
            shadow="xl" 
            borderRadius="2xl" 
            border="1px solid" 
            borderColor={borderColor}
            bg={cardBg}
          >
            <CardBody p={8}>
              <VStack spacing={6}>
                {/* Step Header - Clean without progress bar */}
                <VStack spacing={3} w="full" textAlign="center">
                  <HStack spacing={3}>
                    <Icon 
                      as={currentStep === 'telegram' ? FiLock : FiKey} 
                      boxSize={5} 
                      color="blue.500" 
                    />
                    <Text fontSize="lg" fontWeight={600} color={textPrimary}>
                      {stepInfo.title}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={textSecondary} maxW="sm" lineHeight="base">
                    {stepInfo.description}
                  </Text>
                </VStack>

                {/* Messages */}
                {error && (
                  <Alert 
                    status="error" 
                    borderRadius="xl" 
                    bg="red.50" 
                    borderColor="red.200" 
                    borderWidth="1px"
                    _dark={{ bg: "red.900", borderColor: "red.700" }}
                  >
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert 
                    status="success" 
                    borderRadius="xl" 
                    bg="green.50" 
                    borderColor="green.200" 
                    borderWidth="1px"
                    _dark={{ bg: "green.900", borderColor: "green.700" }}
                  >
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Telegram Login Step */}
                {currentStep === 'telegram' && (
                  <VStack spacing={6} w="full">
                    {/* Security Info */}
                    <Box 
                      p={4} 
                      bg={inputBg} 
                      borderRadius="xl" 
                      border="1px solid" 
                      borderColor={borderColor}
                      w="full"
                    >
                      <VStack spacing={3} align="start">
                        <HStack spacing={3}>
                          <Icon as={FiInfo} boxSize={4} color="blue.500" />
                          <Text fontSize="sm" fontWeight={600} color={textPrimary}>
                            Secure Telegram Authentication
                          </Text>
                        </HStack>
                        <VStack spacing={2} align="start" fontSize="sm" color={textSecondary}>
                          <HStack spacing={2}>
                            <Box w={1} h={1} bg="blue.500" borderRadius="full" mt={2} />
                            <Text>Click button below to authenticate with your Telegram account</Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Box w={1} h={1} bg="blue.500" borderRadius="full" mt={2} />
                            <Text>Your identity is verified securely through Telegram servers</Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Box w={1} h={1} bg="blue.500" borderRadius="full" mt={2} />
                            <Text>No passwords or sensitive data required</Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </Box>

                    {/* Telegram Widget Container */}
                    <VStack spacing={4} w="full">
                      <Box w="full" textAlign="center" py={4}>
                        <div 
                          id="telegram-login-container" 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            minHeight: '46px'
                          }}
                        />
                      </Box>
                      
                      {loading && (
                        <Box textAlign="center" py={3}>
                          <HStack spacing={2} justify="center">
                            <Box
                              w={2}
                              h={2}
                              bg="blue.500"
                              borderRadius="full"
                              className="spin"
                            />
                            <Text fontSize="sm" color={textSecondary}>
                              Verifying Telegram authentication...
                            </Text>
                          </HStack>
                        </Box>
                      )}
                    </VStack>
                  </VStack>
                )}

                {/* API Configuration Step */}
                {currentStep === 'api-config' && telegramUser && (
                  <VStack spacing={6} w="full">
                    {/* User Profile */}
                    <Box 
                      p={4} 
                      bg={inputBg} 
                      borderRadius="xl" 
                      border="1px solid" 
                      borderColor={borderColor}
                      w="full"
                    >
                      <VStack spacing={3} align="start">
                        <HStack spacing={3}>
                          <Icon as={FiUser} boxSize={4} color="green.500" />
                          <Text fontSize="sm" fontWeight={600} color={textPrimary}>
                            Successfully Authenticated
                          </Text>
                        </HStack>
                        <HStack spacing={3} w="full">
                          {telegramUser.photo_url && (
                            <Box
                              w={10}
                              h={10}
                              borderRadius="full"
                              bg="gray.300"
                              bgImage={telegramUser.photo_url}
                              bgSize="cover"
                              bgPosition="center"
                              border="2px solid"
                              borderColor={borderColor}
                            />
                          )}
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="md" fontWeight={600} color={textPrimary}>
                              {telegramUser.first_name} {telegramUser.last_name || ''}
                            </Text>
                            {telegramUser.username && (
                              <Text fontSize="sm" color={textSecondary}>
                                @{telegramUser.username}
                              </Text>
                            )}
                          </VStack>
                          <Badge colorScheme="green" variant="subtle">
                            Verified
                          </Badge>
                        </HStack>
                      </VStack>
                    </Box>

                    <Divider />

                    {/* API Setup Guide */}
                    <Box 
                      p={4} 
                      bg={inputBg} 
                      borderRadius="xl" 
                      border="1px solid" 
                      borderColor={borderColor}
                      w="full"
                    >
                      <VStack spacing={3} align="start">
                        <HStack spacing={3}>
                          <Icon as={FiInfo} boxSize={4} color="blue.500" />
                          <Text fontSize="sm" fontWeight={600} color={textPrimary}>
                            Setup API Credentials
                          </Text>
                        </HStack>
                        <VStack spacing={2} align="start" fontSize="sm" color={textSecondary}>
                          <HStack spacing={2}>
                            <Text fontWeight={500} color="blue.500">1.</Text>
                            <Text>Visit <Text as="span" fontWeight={500} color={textPrimary}>my.telegram.org/apps</Text></Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Text fontWeight={500} color="blue.500">2.</Text>
                            <Text>Create a new application with any name</Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Text fontWeight={500} color="blue.500">3.</Text>
                            <Text>Copy your API ID and API Hash to the fields below</Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </Box>

                    {/* API Inputs - Enhanced Layout */}
                    <VStack spacing={4} w="full">
                      <SimpleGrid columns={2} spacing={4} w="full">
                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight={500} color={textSecondary} mb={2}>
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
                              borderRadius="lg"
                              border="1px solid"
                              borderColor={borderColor}
                              _hover={{
                                borderColor: useColorModeValue('gray.400', 'gray.600'),
                              }}
                              _focus={{
                                borderColor: 'blue.500',
                                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                                bg: useColorModeValue('white', 'gray.800'),
                              }}
                            />
                          </InputGroup>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontSize="sm" fontWeight={500} color={textSecondary} mb={2}>
                            API Hash
                          </FormLabel>
                          <InputGroup>
                            <InputLeftElement>
                              <Icon as={FiKey} color={textMuted} boxSize={4} />
                            </InputLeftElement>
                            <Input
                              placeholder="abcd1234ef567890"
                              value={apiHash}
                              onChange={(e) => setApiHash(e.target.value)}
                              variant="filled"
                              fontSize="sm"
                              fontFamily="mono"
                              bg={inputBg}
                              borderRadius="lg"
                              border="1px solid"
                              borderColor={borderColor}
                              _hover={{
                                borderColor: useColorModeValue('gray.400', 'gray.600'),
                              }}
                              _focus={{
                                borderColor: 'blue.500',
                                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                                bg: useColorModeValue('white', 'gray.800'),
                              }}
                            />
                          </InputGroup>
                        </FormControl>
                      </SimpleGrid>

                      <Button
                        onClick={handleApiConfig}
                        isLoading={loading}
                        loadingText="Setting up..."
                        w="full"
                        size="lg"
                        borderRadius="lg"
                        bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        color="white"
                        fontWeight={500}
                        _hover={{
                          bg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                          transform: "translateY(-1px)",
                          shadow: "lg",
                        }}
                        _active={{
                          transform: "translateY(0)",
                        }}
                        rightIcon={<FiArrowRight />}
                        disabled={!apiId || !apiHash}
                      >
                        Complete Setup
                      </Button>
                    </VStack>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <VStack spacing={2} textAlign="center">
            <Text fontSize="sm" color={textMuted} maxW="md">
              Secure authentication powered by Telegram
            </Text>
            <Text fontSize="xs" color={textMuted}>
              Your credentials are encrypted and stored securely
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Flex>
  );
};

export default TelegramLogin;