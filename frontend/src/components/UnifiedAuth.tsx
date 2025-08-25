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
  Code,
  Icon,
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
  FiHash,
  FiLock,
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

  // Precision theme colors
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
      <Flex minH="100vh" bg={bgColor} align="center" justify="center" p={6}>
        <Box
          bg={cardBg}
          p={8}
          borderRadius="2xl"
          shadow="lg"
          border="1px solid"
          borderColor={borderColor}
          w="400px"
          textAlign="center"
        >
          <VStack spacing={6}>
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
              <Box
                w={6}
                h={6}
                border="3px solid"
                borderColor="white"
                borderTopColor="transparent"
                borderRadius="full"
                animation="spin 1s linear infinite"
                _dark={{ borderColor: "black", borderTopColor: "transparent" }}
              />
            </Box>
            <VStack spacing={2}>
              <Text fontWeight={600} fontSize="xl" color={textPrimary}>
                TGPro
              </Text>
              <Text color={textSecondary} fontSize="sm">
                Loading automation platform...
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Flex>
    );
  }

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
                Secure MTProto Authentication
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
                        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

                {/* Step Content */}
                {currentStep === 'setup' && (
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
                          Get API Credentials
                        </Text>
                      </HStack>
                      <VStack spacing={2} align="start" fontSize="sm" color={textSecondary}>
                        <Text>
                          1. Visit{' '}
                          <Link 
                            href="https://my.telegram.org/apps" 
                            isExternal 
                            color="blue.500"
                            _dark={{ color: 'blue.300' }}
                            fontWeight={600}
                          >
                            my.telegram.org/apps <Icon as={FiExternalLink} display="inline" boxSize={3} />
                          </Link>
                        </Text>
                        <Text>2. Create a new application</Text>
                        <Text>3. Copy the API ID and API Hash</Text>
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

                    {/* Phone Number */}
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight={600} color={textSecondary}>
                        Phone Number
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement>
                          <Icon as={FiPhone} color={textMuted} boxSize={4} />
                        </InputLeftElement>
                        <Input
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          variant="filled"
                          fontSize="sm"
                          bg={inputBg}
                          borderRadius="xl"
                        />
                      </InputGroup>
                    </FormControl>

                    <Button
                      onClick={handleApiConfig}
                      isLoading={loading}
                      loadingText="Configuring..."
                      w="full"
                      size="lg"
                      borderRadius="xl"
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      color="white"
                      _hover={{
                        bg: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        transform: "translateY(-1px)",
                      }}
                      _active={{
                        transform: "translateY(0)",
                      }}
                      rightIcon={<FiArrowRight />}
                    >
                      Continue Setup
                    </Button>
                  </VStack>
                )}

                {currentStep === 'phone' && (
                  <VStack spacing={6} w="full">
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight={600} color={textSecondary}>
                        Phone Number
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement>
                          <Icon as={FiPhone} color={textMuted} boxSize={4} />
                        </InputLeftElement>
                        <Input
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          variant="filled"
                          fontSize="sm"
                          bg={inputBg}
                          borderRadius="xl"
                          size="lg"
                        />
                      </InputGroup>
                    </FormControl>

                    <Button
                      onClick={handlePhoneAuth}
                      isLoading={loading}
                      loadingText="Sending code..."
                      w="full"
                      size="lg"
                      borderRadius="xl"
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      color="white"
                      _hover={{
                        bg: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        transform: "translateY(-1px)",
                      }}
                      rightIcon={<FiArrowRight />}
                    >
                      Send Verification Code
                    </Button>
                  </VStack>
                )}

                {currentStep === 'verify' && (
                  <VStack spacing={6} w="full">
                    <Text fontSize="sm" color={textSecondary} textAlign="center">
                      We sent a verification code to <Code fontSize="sm">{phoneNumber}</Code>
                    </Text>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight={600} color={textSecondary}>
                        Verification Code
                      </FormLabel>
                      <Input
                        placeholder="12345"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        variant="filled"
                        fontSize="2xl"
                        fontFamily="mono"
                        textAlign="center"
                        letterSpacing="wider"
                        size="lg"
                        maxLength={6}
                        bg={inputBg}
                        borderRadius="xl"
                      />
                    </FormControl>

                    <Button
                      onClick={handleVerification}
                      isLoading={loading}
                      loadingText="Verifying..."
                      w="full"
                      size="lg"
                      borderRadius="xl"
                      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      color="white"
                      _hover={{
                        bg: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        transform: "translateY(-1px)",
                      }}
                      rightIcon={<FiArrowRight />}
                    >
                      Verify Code
                    </Button>
                  </VStack>
                )}

                {currentStep === '2fa' && (
                  <VStack spacing={6} w="full">
                    <Text fontSize="sm" color={textSecondary} textAlign="center">
                      Your account has two-factor authentication enabled
                    </Text>

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight={600} color={textSecondary}>
                        2FA Password
                      </FormLabel>
                      <InputGroup>
                        <InputLeftElement>
                          <Icon as={FiLock} color={textMuted} boxSize={4} />
                        </InputLeftElement>
                        <Input
                          type="password"
                          placeholder="Your 2FA password"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          variant="filled"
                          fontSize="sm"
                          size="lg"
                          bg={inputBg}
                          borderRadius="xl"
                        />
                      </InputGroup>
                    </FormControl>

                    <Button
                      onClick={handleTwoFactor}
                      isLoading={loading}
                      loadingText="Authenticating..."
                      w="full"
                      size="lg"
                      borderRadius="xl"
                      bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      color="white"
                      _hover={{
                        bg: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                        transform: "translateY(-1px)",
                      }}
                      rightIcon={<FiCheck />}
                    >
                      Complete Authentication
                    </Button>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <Text fontSize="sm" color={textMuted} textAlign="center" maxW="md">
            Secure authentication powered by Telegram MTProto protocol. 
            Your credentials are encrypted and stored securely.
          </Text>
        </VStack>
      </Container>
    </Flex>
  );
};

export default UnifiedAuth;