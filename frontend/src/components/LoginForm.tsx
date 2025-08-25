import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { LoginFormProps } from '@/types/components';
import { LoginFormData } from '@/types';

const steps = [
  { title: 'Phone Number' },
  { title: 'Verification' },
  { title: 'Two-Factor Auth' },
];

const LoginForm: React.FC<LoginFormProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [needsTwoFA, setNeedsTwoFA] = useState(false);

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, indigo.50)',
    'linear(to-br, gray.900, blue.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>();

  const handlePhoneSubmit = async (data: { phone: string }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.auth.phone(data.phone);
      setPhoneNumber(data.phone);
      setSuccess('Verification code sent to your phone');
      setActiveStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

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
        setActiveStep(2);
        setSuccess('Please enter your two-factor authentication password');
      } else {
        setSuccess('Login successful!');
        onAuthSuccess();
      }
    } catch (err: any) {
      if (err.message.includes('2FA') || err.message.includes('two-factor')) {
        setNeedsTwoFA(true);
        setActiveStep(2);
        setError(null);
        setSuccess('Please enter your two-factor authentication password');
      } else {
        setError(err.message || 'Invalid verification code');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const resetForm = () => {
    setActiveStep(0);
    setError(null);
    setSuccess(null);
    setPhoneNumber('');
    setVerificationCode('');
    setTwoFACode('');
    setNeedsTwoFA(false);
    reset();
  };

  return (
    <Flex minH="100vh" bgGradient={bgGradient} align="center" justify="center" p={4}>
      <Box w="full" maxW="md">
        <Card shadow="2xl" bg={cardBg} backdropFilter="blur(10px)">
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <VStack spacing={2}>
                <Heading size="lg" textAlign="center" color="brand.600">
                  Telegram Authentication
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Sign in to access the automation platform
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
                      <StepTitle fontSize="xs">{step.title}</StepTitle>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>

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

              {/* Step 1: Phone Number */}
              {activeStep === 0 && (
                <form onSubmit={handleSubmit(handlePhoneSubmit)}>
                  <VStack spacing={4}>
                    <FormControl isInvalid={!!errors.phone}>
                      <FormLabel fontSize="sm" fontWeight="semibold">
                        Phone Number
                      </FormLabel>
                      <Input
                        type="tel"
                        placeholder="+1234567890"
                        fontFamily="mono"
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^\+?[1-9]\d{1,14}$/,
                            message: 'Please enter a valid phone number with country code',
                          },
                        })}
                      />
                      <FormErrorMessage fontSize="xs">
                        {errors.phone?.message}
                      </FormErrorMessage>
                    </FormControl>
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
                  </VStack>
                </form>
              )}

              {/* Step 2: Verification Code */}
              {activeStep === 1 && (
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
                      placeholder=""
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
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Use Different Number
                    </Button>
                  </VStack>
                </VStack>
              )}

              {/* Step 3: Two-Factor Authentication */}
              {activeStep === 2 && needsTwoFA && (
                <VStack spacing={4}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Your account has two-factor authentication enabled
                  </Text>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Two-Factor Password
                    </FormLabel>
                    <Input
                      type="password"
                      placeholder="Enter your 2FA password"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value)}
                      fontFamily="mono"
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
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      Start Over
                    </Button>
                  </VStack>
                </VStack>
              )}

              {/* Info */}
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Make sure your Telegram account has API access enabled.
                Visit{' '}
                <Text as="span" color="brand.500" fontWeight="medium">
                  my.telegram.org/apps
                </Text>{' '}
                to configure.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
};

export default LoginForm;