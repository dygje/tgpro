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
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  Heading,
  Badge,
  Link,
  Divider,
  useColorModeValue,
  Container,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  IconButton,
  Tooltip,
  Progress,
} from '@chakra-ui/react';
import { 
  FiExternalLink, 
  FiPhone, 
  FiKey, 
  FiShield, 
  FiArrowRight, 
  FiCheck,
  FiInfo,
  FiUser,
  FiHash
} from 'react-icons/fi';
import { api } from '../lib/api';

interface UnifiedAuthProps {
  onAuthSuccess: () => void;
}

const UnifiedAuth: React.FC<UnifiedAuthProps> = ({ onAuthSuccess }) => {
  // Form states - all in one streamlined interface
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  // Flow control
  const [currentStep, setCurrentStep] = useState<'setup' | 'phone' | 'verify' | '2fa'>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Configuration check
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [checkingConfig, setCheckingConfig] = useState(true);

  // Linear-style theme colors
  const bgColor = useColorModeValue('white', 'gray.950');
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const inputBg = useColorModeValue('gray.50', 'gray.800');
  const textPrimary = useColorModeValue('gray.900', 'gray.50');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const textMuted = useColorModeValue('gray.500', 'gray.500');

  // Check configuration on mount
  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await api.auth.configuration();
      setConfigStatus(response);
      if (response.configured) {
        setCurrentStep('phone');
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
    } finally {
      setCheckingConfig(false);
    }
  };

  // Handle API configuration
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
      });
      setSuccess('API configured successfully');
      setCurrentStep('phone');
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : (err?.message || err?.details?.message || 'Failed to configure API');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle phone authentication
  const handlePhoneAuth = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.auth.phone(phoneNumber);
      setSuccess('Verification code sent');
      setCurrentStep('verify');
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : (err?.message || err?.details?.message || 'Failed to send verification code');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle verification
  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length < 5) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.verify({
        phone: phoneNumber,
        code: verificationCode,
      });

      if (response.requires_2fa) {
        setCurrentStep('2fa');
        setSuccess('Please enter your 2FA password');
      } else {
        setSuccess('Login successful!');
        setTimeout(() => onAuthSuccess(), 1000);
      }
    } catch (err: any) {
      if (err.message.includes('2FA') || err.message.includes('two-factor')) {
        setCurrentStep('2fa');
        setSuccess('Please enter your 2FA password');
      } else {
        const errorMessage = typeof err === 'string' ? err : (err?.message || err?.details?.message || 'Invalid verification code');
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA
  const handleTwoFactor = async () => {
    if (!twoFactorCode) {
      setError('Please enter your 2FA password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.auth.twoFactor({ password: twoFactorCode });
      setSuccess('Authentication successful!');
      setTimeout(() => onAuthSuccess(), 1000);
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : (err?.message || err?.details?.message || 'Invalid 2FA password');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get current step info
  const getStepInfo = () => {
    switch (currentStep) {
      case 'setup':
        return {
          title: 'API Configuration',
          description: 'Set up your Telegram API credentials',
          progress: 25,
        };
      case 'phone':
        return {
          title: 'Phone Authentication',
          description: 'Enter your phone number',
          progress: 50,
        };
      case 'verify':
        return {
          title: 'Verification',
          description: 'Enter the verification code',
          progress: 75,
        };
      case '2fa':
        return {
          title: 'Two-Factor Authentication',
          description: 'Enter your 2FA password',
          progress: 90,
        };
    }
  };

  const stepInfo = getStepInfo();

  if (checkingConfig) {
    return (
      <Flex minH="100vh" bg={bgColor} align="center" justify="center">
        <VStack spacing={4}>
          <Box 
            w={8} 
            h={8} 
            bg="gray.900" 
            borderRadius="md" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <Box
              w={4}
              h={4}
              border="2px solid"
              borderColor="white"
              borderTopColor="transparent"
              borderRadius="full"
              animation="spin 1s linear infinite"
            />
          </Box>
          <Text fontSize="sm" color={textMuted}>
            Loading TGPro...
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg={bgColor} align="center" justify="center" p={4}>
      <Container maxW="sm">
        <VStack spacing={8}>
          {/* Header */}
          <VStack spacing={3} textAlign="center">
            <Box 
              w={10} 
              h={10} 
              bg="gray.900" 
              borderRadius="md" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
            >
              <FiShield color="white" size={20} />
            </Box>
            <VStack spacing={1}>
              <Heading size="lg" color={textPrimary} fontWeight={600}>
                TGPro
              </Heading>
              <Text fontSize="sm" color={textSecondary}>
                Telegram Automation Dashboard
              </Text>
            </VStack>
          </VStack>

          {/* Main Card */}
          <Card w="full" bg={cardBg} borderColor={borderColor} shadow="sm">
            <CardBody p={6}>
              <VStack spacing={6}>
                {/* Progress */}
                <Box w="full">
                  <HStack justify="space-between" mb={3}>
                    <Text fontSize="sm" fontWeight={500} color={textPrimary}>
                      {stepInfo.title}
                    </Text>
                    <Text fontSize="xs" color={textMuted}>
                      {stepInfo.progress}%
                    </Text>
                  </HStack>
                  <Progress 
                    value={stepInfo.progress} 
                    size="sm" 
                    borderRadius="full" 
                    bg={useColorModeValue('gray.100', 'gray.800')}
                    colorScheme="gray"
                    sx={{
                      '& > div': {
                        bg: 'gray.900',
                        _dark: {
                          bg: 'gray.200',
                        }
                      }
                    }}
                  />
                  <Text fontSize="xs" color={textSecondary} mt={2}>
                    {stepInfo.description}
                  </Text>
                </Box>

                {/* Messages */}
                {error && (
                  <Alert status="error" borderRadius="md" size="sm" fontSize="sm">
                    <AlertIcon boxSize={4} />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert status="success" borderRadius="md" size="sm" fontSize="sm">
                    <AlertIcon boxSize={4} />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {/* Step Content */}
                {currentStep === 'setup' && (
                  <VStack spacing={4} w="full">
                    {/* Info Box */}
                    <Box 
                      p={3} 
                      bg={inputBg} 
                      borderRadius="md" 
                      border="1px solid" 
                      borderColor={borderColor}
                      w="full"
                    >
                      <HStack spacing={2} mb={2}>
                        <FiInfo size={14} />
                        <Text fontSize="xs" fontWeight={500} color={textPrimary}>
                          Get API Credentials
                        </Text>
                      </HStack>
                      <VStack spacing={1} align="start" fontSize="xs" color={textSecondary}>
                        <Text>
                          1. Visit{' '}
                          <Link 
                            href="https://my.telegram.org/apps" 
                            isExternal 
                            color="gray.900"
                            _dark={{ color: 'gray.200' }}
                            fontWeight={500}
                          >
                            my.telegram.org/apps
                          </Link>
                        </Text>
                        <Text>2. Create a new application</Text>
                        <Text>3. Copy the API ID and API Hash</Text>
                      </VStack>
                    </Box>

                    {/* API Inputs */}
                    <SimpleGrid columns={2} spacing={3} w="full">
                      <FormControl>
                        <FormLabel fontSize="xs" color={textSecondary} mb={1}>
                          API ID
                        </FormLabel>
                        <InputGroup size="md">
                          <InputLeftElement pointerEvents="none">
                            <FiHash size={14} color="gray" />
                          </InputLeftElement>
                          <Input
                            placeholder="12345678"
                            value={apiId}
                            onChange={(e) => setApiId(e.target.value)}
                            variant="filled"
                            fontSize="sm"
                            fontFamily="mono"
                          />
                        </InputGroup>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="xs" color={textSecondary} mb={1}>
                          API Hash
                        </FormLabel>
                        <InputGroup size="md">
                          <InputLeftElement pointerEvents="none">
                            <FiKey size={14} color="gray" />
                          </InputLeftElement>
                          <Input
                            placeholder="abcd1234..."
                            value={apiHash}
                            onChange={(e) => setApiHash(e.target.value)}
                            variant="filled"
                            fontSize="sm"
                            fontFamily="mono"
                          />
                        </InputGroup>
                      </FormControl>
                    </SimpleGrid>

                    {/* Phone Number */}
                    <FormControl>
                      <FormLabel fontSize="xs" color={textSecondary} mb={1}>
                        Phone Number
                      </FormLabel>
                      <InputGroup size="md">
                        <InputLeftElement pointerEvents="none">
                          <FiPhone size={14} color="gray" />
                        </InputLeftElement>
                        <Input
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          variant="filled"
                          fontSize="sm"
                        />
                      </InputGroup>
                    </FormControl>

                    <Button
                      onClick={handleApiConfig}
                      isLoading={loading}
                      loadingText="Setting up..."
                      w="full"
                      size="md"
                      rightIcon={<FiArrowRight />}
                    >
                      Continue
                    </Button>
                  </VStack>
                )}

                {currentStep === 'phone' && (
                  <VStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel fontSize="xs" color={textSecondary} mb={1}>
                        Phone Number
                      </FormLabel>
                      <InputGroup size="md">
                        <InputLeftElement pointerEvents="none">
                          <FiPhone size={14} color="gray" />
                        </InputLeftElement>
                        <Input
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          variant="filled"
                          fontSize="sm"
                        />
                      </InputGroup>
                    </FormControl>

                    <Button
                      onClick={handlePhoneAuth}
                      isLoading={loading}
                      loadingText="Sending code..."
                      w="full"
                      size="md"
                      rightIcon={<FiArrowRight />}
                    >
                      Send Verification Code
                    </Button>
                  </VStack>
                )}

                {currentStep === 'verify' && (
                  <VStack spacing={4} w="full">
                    <Text fontSize="sm" color={textSecondary} textAlign="center">
                      We sent a verification code to <strong>{phoneNumber}</strong>
                    </Text>

                    <FormControl>
                      <FormLabel fontSize="xs" color={textSecondary} mb={1}>
                        Verification Code
                      </FormLabel>
                      <Input
                        placeholder="12345"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        variant="filled"
                        fontSize="lg"
                        fontFamily="mono"
                        textAlign="center"
                        letterSpacing="wide"
                        size="lg"
                        maxLength={6}
                      />
                    </FormControl>

                    <Button
                      onClick={handleVerification}
                      isLoading={loading}
                      loadingText="Verifying..."
                      w="full"
                      size="md"
                      rightIcon={<FiArrowRight />}
                    >
                      Verify Code
                    </Button>
                  </VStack>
                )}

                {currentStep === '2fa' && (
                  <VStack spacing={4} w="full">
                    <Text fontSize="sm" color={textSecondary} textAlign="center">
                      Your account has two-factor authentication enabled
                    </Text>

                    <FormControl>
                      <FormLabel fontSize="xs" color={textSecondary} mb={1}>
                        2FA Password
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="Your 2FA password"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        variant="filled"
                        fontSize="sm"
                        size="md"
                      />
                    </FormControl>

                    <Button
                      onClick={handleTwoFactor}
                      isLoading={loading}
                      loadingText="Authenticating..."
                      w="full"
                      size="md"
                      rightIcon={<FiCheck />}
                    >
                      Complete Login
                    </Button>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <Text fontSize="xs" color={textMuted} textAlign="center">
            Secure authentication powered by Telegram MTProto
          </Text>
        </VStack>
      </Container>
    </Flex>
  );
};

export default UnifiedAuth;