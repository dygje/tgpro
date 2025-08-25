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

interface ConfigFormData {
  api_id: string;
  api_hash: string;
}

interface LoginFormData {
  phone: string;
}

const steps = [
  { 
    id: 'api',
    title: 'API Setup', 
    description: 'Configure credentials',
    icon: FiKey,
    color: 'blue'
  },
  { 
    id: 'phone',
    title: 'Phone', 
    description: 'Enter number',
    icon: FiSmartphone,
    color: 'green'
  },
  { 
    id: 'verify',
    title: 'Verify', 
    description: 'SMS code',
    icon: FiShield,
    color: 'orange'
  },
  { 
    id: '2fa',
    title: '2FA', 
    description: 'Complete login',
    icon: FiLock,
    color: 'purple'
  },
];

const UnifiedAuth: React.FC<UnifiedAuthProps> = ({ onAuthSuccess }) => {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [needsTwoFA, setNeedsTwoFA] = useState(false);

  // Theme colors
  const bgGradient = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Forms
  const configForm = useForm<ConfigFormData>();
  const loginForm = useForm<LoginFormData>();

  // Check API configuration on mount
  useEffect(() => {
    checkApiConfiguration();
  }, []);

  const checkApiConfiguration = async () => {
    try {
      const response = await api.auth.configuration();
      if (response.configured) {
        setIsApiConfigured(true);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error checking API configuration:', error);
    }
  };

  // API Configuration Handler
  const handleApiConfigSubmit = async (data: ConfigFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.auth.configure({
        api_id: Number(data.api_id),
        api_hash: data.api_hash,
      });
      setIsApiConfigured(true);
      setCurrentStep(1);
      setSuccess('API configured successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save API configuration');
    } finally {
      setLoading(false);
    }
  };

  // Phone Submit Handler
  const handlePhoneSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.auth.phone(data.phone);
      setPhoneNumber(data.phone);
      setCurrentStep(2);
      setSuccess('Verification code sent!');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Verification Handler
  const handleVerificationSubmit = async () => {
    if (!verificationCode || verificationCode.length !== 5) {
      setError('Please enter the 5-digit verification code');
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
        setNeedsTwoFA(true);
        setCurrentStep(3);
        setSuccess('Please enter your 2FA password');
      } else {
        setSuccess('Login successful!');
        setTimeout(() => onAuthSuccess(), 1000);
      }
    } catch (err: any) {
      if (err.message.includes('2FA') || err.message.includes('two-factor')) {
        setNeedsTwoFA(true);
        setCurrentStep(3);
        setError(null);
        setSuccess('Please enter your 2FA password');
      } else {
        setError(err.message || 'Invalid verification code');
      }
    } finally {
      setLoading(false);
    }
  };

  // Two-Factor Handler
  const handleTwoFASubmit = async () => {
    if (!twoFACode) {
      setError('Please enter your 2FA password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.auth.twoFactor({ password: twoFACode });
      setSuccess('Authentication successful!');
      setTimeout(() => onAuthSuccess(), 1000);
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA password');
    } finally {
      setLoading(false);
    }
  };

  const resetToStep = (step: number) => {
    setCurrentStep(step);
    setError(null);
    setSuccess(null);
    if (step === 0) {
      setIsApiConfigured(false);
      configForm.reset();
    } else if (step === 1) {
      setPhoneNumber('');
      setVerificationCode('');
      setTwoFACode('');
      setNeedsTwoFA(false);
      loginForm.reset();
    }
  };

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const StepIcon = currentStepData?.icon || FiZap;

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        bgImage="radial-gradient(circle at 20% 80%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 20%, #764ba2 0%, transparent 50%)"
      />

      <Container maxW="md" position="relative">
        <Card 
          shadow="2xl" 
          bg={cardBg} 
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor={borderColor}
        >
          <CardBody p={0}>
            {/* Header Section */}
            <Box p={8} pb={6}>
              <VStack spacing={6}>
                {/* Brand */}
                <VStack spacing={3}>
                  <Box
                    w={12}
                    h={12}
                    bg="brand.500"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="lg"
                  >
                    <FiZap color="white" size={24} />
                  </Box>
                  <VStack spacing={1}>
                    <Heading size="lg" color="text-primary" fontWeight={700}>
                      Welcome to TGPro
                    </Heading>
                    <Text fontSize="sm" color="text-secondary" textAlign="center">
                      Set up your Telegram automation in a few steps
                    </Text>
                  </VStack>
                </VStack>

                {/* Progress Section */}
                <Box w="full">
                  <HStack justify="space-between" mb={3}>
                    <HStack spacing={2}>
                      <Box
                        w={8}
                        h={8}
                        bg={`${currentStepData.color}.100`}
                        color={`${currentStepData.color}.600`}
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <StepIcon size={16} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight={600} color="text-primary">
                          {currentStepData.title}
                        </Text>
                        <Text fontSize="xs" color="text-secondary">
                          {currentStepData.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge variant="subtle" colorScheme={currentStepData.color} borderRadius="full">
                      {currentStep + 1}/{steps.length}
                    </Badge>
                  </HStack>
                  <Progress 
                    value={progressPercentage} 
                    size="sm" 
                    borderRadius="full"
                    colorScheme={currentStepData.color}
                    bg={useColorModeValue('gray.100', 'gray.700')}
                  />
                </Box>

                {/* Status Messages */}
                {error && (
                  <Alert status="error" borderRadius="lg" size="sm">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert status="success" borderRadius="lg" size="sm">
                    <AlertIcon />
                    <AlertDescription fontSize="sm">{success}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </Box>

            <Divider />

            {/* Content Section */}
            <Box p={8} pt={6}>
              {/* Step 1: API Configuration */}
              {currentStep === 0 && (
                <VStack spacing={6} align="stretch">
                  {/* Instructions */}
                  <Box
                    bg={useColorModeValue('blue.50', 'blue.900')}
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={useColorModeValue('blue.200', 'blue.700')}
                  >
                    <VStack spacing={3} align="start">
                      <HStack>
                        <FiKey size={16} />
                        <Text fontSize="sm" fontWeight={600} color={useColorModeValue('blue.800', 'blue.200')}>
                          Get your API credentials
                        </Text>
                      </HStack>
                      <VStack spacing={2} align="start" fontSize="sm" color={useColorModeValue('blue.700', 'blue.300')}>
                        <HStack>
                          <Text>1. Visit</Text>
                          <Link 
                            href="https://my.telegram.org/apps" 
                            isExternal 
                            color="blue.600" 
                            fontWeight={500}
                            _hover={{ textDecoration: 'underline' }}
                          >
                            my.telegram.org/apps
                            <Icon as={FiExternalLink} mx="4px" />
                          </Link>
                        </HStack>
                        <Text>2. Log in and create a new application</Text>
                        <HStack>
                          <Text>3. Copy</Text>
                          <Code fontSize="xs" colorScheme="blue">API ID</Code>
                          <Text>and</Text>
                          <Code fontSize="xs" colorScheme="blue">API Hash</Code>
                        </HStack>
                      </VStack>
                    </VStack>
                  </Box>

                  {/* Form */}
                  <form onSubmit={configForm.handleSubmit(handleApiConfigSubmit)}>
                    <VStack spacing={4}>
                      <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} w="full">
                        <FormControl isInvalid={!!configForm.formState.errors.api_id} flex={{ base: 1, sm: '0 0 120px' }}>
                          <FormLabel fontSize="sm" fontWeight={600} mb={2}>
                            API ID
                          </FormLabel>
                          <Input
                            type="number"
                            placeholder="1234567"
                            fontFamily="mono"
                            size="md"
                            {...configForm.register('api_id', {
                              required: 'Required',
                              min: { value: 1, message: 'Invalid ID' },
                            })}
                          />
                          <FormErrorMessage fontSize="xs">
                            {configForm.formState.errors.api_id?.message}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!configForm.formState.errors.api_hash} flex={1}>
                          <FormLabel fontSize="sm" fontWeight={600} mb={2}>
                            API Hash
                          </FormLabel>
                          <Input
                            type="text"
                            placeholder="abcd1234efgh5678..."
                            fontFamily="mono"
                            size="md"
                            {...configForm.register('api_hash', {
                              required: 'Required',
                              minLength: { value: 32, message: 'Must be 32+ chars' },
                            })}
                          />
                          <FormErrorMessage fontSize="xs">
                            {configForm.formState.errors.api_hash?.message}
                          </FormErrorMessage>
                        </FormControl>
                      </Stack>

                      <Button
                        type="submit"
                        size="lg"
                        w="full"
                        isLoading={loading}
                        loadingText="Saving..."
                        rightIcon={<FiArrowRight />}
                        mt={2}
                      >
                        Save & Continue
                      </Button>
                    </VStack>
                  </form>
                </VStack>
              )}

              {/* Step 2: Phone Authentication */}
              {currentStep === 1 && (
                <VStack spacing={6}>
                  {/* API Config Status */}
                  <HStack
                    w="full"
                    p={3}
                    bg={useColorModeValue('green.50', 'green.900')}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={useColorModeValue('green.200', 'green.700')}
                  >
                    <FiCheck color={useColorModeValue('#059669', '#10b981')} />
                    <Text fontSize="sm" color={useColorModeValue('green.800', 'green.200')} flex={1}>
                      API credentials configured
                    </Text>
                    <IconButton
                      aria-label="Reconfigure"
                      icon={<FiSettings />}
                      size="sm"
                      variant="ghost"
                      onClick={() => resetToStep(0)}
                    />
                  </HStack>

                  <form onSubmit={loginForm.handleSubmit(handlePhoneSubmit)}>
                    <VStack spacing={4} w="full">
                      <FormControl isInvalid={!!loginForm.formState.errors.phone}>
                        <FormLabel fontSize="sm" fontWeight={600} mb={2}>
                          Phone Number
                        </FormLabel>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          fontFamily="mono"
                          size="lg"
                          fontSize="md"
                          {...loginForm.register('phone', {
                            required: 'Phone number is required',
                            pattern: {
                              value: /^\+?[1-9]\d{1,14}$/,
                              message: 'Enter valid phone with country code',
                            },
                          })}
                        />
                        <FormErrorMessage fontSize="xs">
                          {loginForm.formState.errors.phone?.message}
                        </FormErrorMessage>
                      </FormControl>

                      <VStack spacing={3} w="full">
                        <Button
                          type="submit"
                          size="lg"
                          w="full"
                          isLoading={loading}
                          loadingText="Sending..."
                          rightIcon={<FiArrowRight />}
                        >
                          Send Verification Code
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => resetToStep(0)}
                          leftIcon={<FiArrowLeft />}
                        >
                          Change API Settings
                        </Button>
                      </VStack>
                    </VStack>
                  </form>
                </VStack>
              )}

              {/* Step 3: Verification Code */}
              {currentStep === 2 && (
                <VStack spacing={6}>
                  <VStack spacing={2}>
                    <Text fontSize="sm" color="text-secondary" textAlign="center">
                      Verification code sent to
                    </Text>
                    <Text fontSize="md" fontWeight={600} color="text-primary" fontFamily="mono">
                      {phoneNumber}
                    </Text>
                  </VStack>

                  <HStack justify="center" spacing={2}>
                    <PinInput
                      value={verificationCode}
                      onChange={setVerificationCode}
                      size="lg"
                      type="number"
                    >
                      <PinInputField fontFamily="mono" />
                      <PinInputField fontFamily="mono" />
                      <PinInputField fontFamily="mono" />
                      <PinInputField fontFamily="mono" />
                      <PinInputField fontFamily="mono" />
                    </PinInput>
                  </HStack>

                  <VStack spacing={3} w="full">
                    <Button
                      size="lg"
                      w="full"
                      onClick={handleVerificationSubmit}
                      isLoading={loading}
                      loadingText="Verifying..."
                      isDisabled={verificationCode.length !== 5}
                      rightIcon={<FiArrowRight />}
                    >
                      Verify Code
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => resetToStep(1)}
                      leftIcon={<FiArrowLeft />}
                    >
                      Use Different Number
                    </Button>
                  </VStack>
                </VStack>
              )}

              {/* Step 4: Two-Factor Authentication */}
              {currentStep === 3 && needsTwoFA && (
                <VStack spacing={6}>
                  <VStack spacing={2} textAlign="center">
                    <Text fontSize="sm" color="text-secondary">
                      Two-factor authentication is enabled
                    </Text>
                    <Text fontSize="xs" color="text-muted">
                      Enter your cloud password to complete login
                    </Text>
                  </VStack>

                  <VStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight={600} mb={2}>
                        Cloud Password
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="Enter your 2FA password"
                        value={twoFACode}
                        onChange={(e) => setTwoFACode(e.target.value)}
                        fontFamily="mono"
                        size="lg"
                      />
                    </FormControl>

                    <VStack spacing={3} w="full">
                      <Button
                        size="lg"
                        w="full"
                        onClick={handleTwoFASubmit}
                        isLoading={loading}
                        loadingText="Authenticating..."
                        isDisabled={!twoFACode}
                        rightIcon={<FiCheck />}
                      >
                        Complete Login
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => resetToStep(1)}
                        leftIcon={<FiRefreshCw />}
                      >
                        Start Over
                      </Button>
                    </VStack>
                  </VStack>
                </VStack>
              )}
            </Box>

            {/* Footer */}
            <Box
              p={6}
              pt={4}
              borderTop="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue('gray.50', 'gray.750')}
            >
              <HStack justify="center" spacing={2}>
                <FiShield size={14} color={useColorModeValue('#71717a', '#a1a1aa')} />
                <Text fontSize="xs" color="text-muted" textAlign="center">
                  Your credentials are encrypted and stored securely
                </Text>
              </HStack>
            </Box>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default UnifiedAuth;