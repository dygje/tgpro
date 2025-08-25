import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
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
  Card,
  CardBody,
  Heading,
  useColorModeValue,
  PinInput,
  PinInputField,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepSeparator,
  useSteps,
  Link,
  Code,
  Icon,
  Divider,
  Collapse,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { FiExternalLink, FiCheck, FiSettings } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
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
  { title: 'API Setup', description: 'Configure Telegram API' },
  { title: 'Phone Auth', description: 'Verify your number' },
  { title: 'Verification', description: 'Enter SMS code' },
  { title: 'Two-Factor', description: 'Complete login' },
];

const UnifiedAuth: React.FC<UnifiedAuthProps> = ({ onAuthSuccess }) => {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [needsTwoFA, setNeedsTwoFA] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(true);

  // Stepper
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  // Theme
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, indigo.50)',
    'linear(to-br, gray.900, blue.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');

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
        setShowApiConfig(false);
        setActiveStep(1);
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
      setShowApiConfig(false);
      setActiveStep(1);
      setSuccess('API configuration saved! Now enter your phone number.');
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
      setActiveStep(2);
      setSuccess('Verification code sent to your phone');
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
        setActiveStep(3);
        setSuccess('Please enter your two-factor authentication password');
      } else {
        setSuccess('Login successful!');
        onAuthSuccess();
      }
    } catch (err: any) {
      if (err.message.includes('2FA') || err.message.includes('two-factor')) {
        setNeedsTwoFA(true);
        setActiveStep(3);
        setError(null);
        setSuccess('Please enter your two-factor authentication password');
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
      setError('Please enter your two-factor authentication password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.auth.twoFactor({ password: twoFACode });
      setSuccess('Login successful!');
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid two-factor authentication password');
    } finally {
      setLoading(false);
    }
  };

  // Reset to API Config
  const resetToApiConfig = () => {
    setActiveStep(0);
    setShowApiConfig(true);
    setIsApiConfigured(false);
    setError(null);
    setSuccess(null);
    configForm.reset();
  };

  // Reset to Phone Auth
  const resetToPhoneAuth = () => {
    setActiveStep(1);
    setError(null);
    setSuccess(null);
    setPhoneNumber('');
    setVerificationCode('');
    setTwoFACode('');
    setNeedsTwoFA(false);
    loginForm.reset();
  };

  return (
    <Flex minH="100vh" bgGradient={bgGradient} align="center" justify="center" p={4}>
      <Box w="full" maxW="xl">
        <Card shadow="2xl" bg={cardBg} backdropFilter="blur(10px)">
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <VStack spacing={2}>
                <Heading size="lg" textAlign="center" color="brand.600">
                  Telegram Automation Setup
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Configure API credentials and authenticate your account
                </Text>
              </VStack>

              {/* Progress Stepper */}
              <Box>
                <Stepper index={activeStep} size="sm" colorScheme="brand">
                  {steps.map((step, index) => (
                    <Step key={index}>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepIcon />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle fontSize="xs">{step.title}</StepTitle>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* API Configuration Status */}
              {isApiConfigured && (
                <Alert status="success" borderRadius="lg" size="sm">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    API credentials configured successfully
                  </AlertDescription>
                  <IconButton
                    aria-label="Reconfigure API"
                    icon={<FiSettings />}
                    size="sm"
                    ml="auto"
                    variant="ghost"
                    onClick={resetToApiConfig}
                  />
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert status="error" borderRadius="lg">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert status="success" borderRadius="lg">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">{success}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: API Configuration */}
              <Collapse in={showApiConfig && activeStep === 0}>
                <VStack spacing={4} align="stretch">
                  <Box
                    bg="blue.50"
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="blue.200"
                    _dark={{ bg: 'blue.900', borderColor: 'blue.700' }}
                  >
                    <VStack spacing={3} align="start">
                      <Text fontSize="sm" fontWeight="semibold" color="blue.800" _dark={{ color: 'blue.200' }}>
                        Get your API credentials:
                      </Text>
                      <VStack spacing={1} align="start" fontSize="sm" color="blue.700" _dark={{ color: 'blue.300' }}>
                        <Text>1. Visit <Link href="https://my.telegram.org/apps" isExternal color="blue.600" fontWeight="medium">
                          my.telegram.org/apps <Icon as={FiExternalLink} mx="2px" />
                        </Link></Text>
                        <Text>2. Log in and create a new application</Text>
                        <Text>3. Copy your <Code>API ID</Code> and <Code>API Hash</Code></Text>
                      </VStack>
                    </VStack>
                  </Box>

                  <form onSubmit={configForm.handleSubmit(handleApiConfigSubmit)}>
                    <VStack spacing={4}>
                      <HStack spacing={4} w="full">
                        <FormControl isInvalid={!!configForm.formState.errors.api_id} flex="1">
                          <FormLabel fontSize="sm" fontWeight="semibold">API ID</FormLabel>
                          <Input
                            type="number"
                            placeholder="1234567"
                            fontFamily="mono"
                            {...configForm.register('api_id', {
                              required: 'API ID is required',
                              min: { value: 1, message: 'Must be positive' },
                            })}
                          />
                          <FormErrorMessage fontSize="xs">
                            {configForm.formState.errors.api_id?.message}
                          </FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!configForm.formState.errors.api_hash} flex="2">
                          <FormLabel fontSize="sm" fontWeight="semibold">API Hash</FormLabel>
                          <Input
                            type="text"
                            placeholder="abcd1234..."
                            fontFamily="mono"
                            {...configForm.register('api_hash', {
                              required: 'API Hash is required',
                              minLength: { value: 32, message: 'Must be 32+ characters' },
                            })}
                          />
                          <FormErrorMessage fontSize="xs">
                            {configForm.formState.errors.api_hash?.message}
                          </FormErrorMessage>
                        </FormControl>
                      </HStack>

                      <Button
                        type="submit"
                        colorScheme="brand"
                        size="lg"
                        w="full"
                        isLoading={loading}
                        loadingText="Saving..."
                      >
                        Save & Continue
                      </Button>
                    </VStack>
                  </form>
                </VStack>
              </Collapse>

              {/* Step 2: Phone Authentication */}
              {isApiConfigured && activeStep === 1 && (
                <form onSubmit={loginForm.handleSubmit(handlePhoneSubmit)}>
                  <VStack spacing={4}>
                    <FormControl isInvalid={!!loginForm.formState.errors.phone}>
                      <FormLabel fontSize="sm" fontWeight="semibold">Phone Number</FormLabel>
                      <Input
                        type="tel"
                        placeholder="+1234567890"
                        fontFamily="mono"
                        size="lg"
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
                        colorScheme="brand"
                        size="lg"
                        w="full"
                        isLoading={loading}
                        loadingText="Sending..."
                      >
                        Send Verification Code
                      </Button>
                      <Button variant="ghost" size="sm" onClick={resetToApiConfig}>
                        Change API Configuration
                      </Button>
                    </VStack>
                  </VStack>
                </form>
              )}

              {/* Step 3: Verification Code */}
              {activeStep === 2 && (
                <VStack spacing={4}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Enter the 5-digit code sent to {phoneNumber}
                  </Text>
                  <HStack justify="center">
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
                      colorScheme="brand"
                      size="lg"
                      w="full"
                      onClick={handleVerificationSubmit}
                      isLoading={loading}
                      loadingText="Verifying..."
                      isDisabled={verificationCode.length !== 5}
                    >
                      Verify Code
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetToPhoneAuth}>
                      Use Different Number
                    </Button>
                  </VStack>
                </VStack>
              )}

              {/* Step 4: Two-Factor Authentication */}
              {activeStep === 3 && needsTwoFA && (
                <VStack spacing={4}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Your account has two-factor authentication enabled
                  </Text>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">Two-Factor Password</FormLabel>
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
                      colorScheme="brand"
                      size="lg"
                      w="full"
                      onClick={handleTwoFASubmit}
                      isLoading={loading}
                      loadingText="Authenticating..."
                      isDisabled={!twoFACode}
                    >
                      Complete Login
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetToPhoneAuth}>
                      Start Over
                    </Button>
                  </VStack>
                </VStack>
              )}

              {/* Security Notice */}
              <Alert status="info" borderRadius="lg" size="sm">
                <AlertIcon />
                <AlertDescription fontSize="xs">
                  All credentials are encrypted and stored securely. Never share your API credentials.
                </AlertDescription>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
};

export default UnifiedAuth;