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
  CardHeader,
  Heading,
  useColorModeValue,
  Link,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiExternalLink, FiSettings } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { ApiConfigurationProps } from '@/types/components';
import { ConfigFormData } from '@/types';

const ApiConfiguration: React.FC<ApiConfigurationProps> = ({ onConfigured, onSkip }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, indigo.50)',
    'linear(to-br, gray.900, blue.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ConfigFormData>();

  const apiId = watch('api_id');
  const apiHash = watch('api_hash');

  const onSubmit = async (data: ConfigFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.auth.configure({
        api_id: data.api_id,
        api_hash: data.api_hash,
      });
      setSuccess('Telegram API configuration saved successfully!');
      setTimeout(() => {
        onConfigured();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConfig = async () => {
    if (!apiId || !apiHash) {
      setError('Please enter both API ID and API Hash before testing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test the configuration without saving
      const response = await api.auth.configure({
        api_id: apiId,
        api_hash: apiHash,
      });
      setSuccess('Configuration test successful! You can now proceed.');
    } catch (err: any) {
      setError(err.message || 'Configuration test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" bgGradient={bgGradient} align="center" justify="center" p={4}>
      <Box w="full" maxW="lg">
        <Card shadow="2xl" bg={cardBg} backdropFilter="blur(10px)">
          <CardHeader>
            <VStack spacing={3}>
              <Icon as={FiSettings} w={8} h={8} color="brand.500" />
              <Heading size="lg" textAlign="center" color="brand.600">
                Telegram API Configuration
              </Heading>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Configure your Telegram API credentials to get started
              </Text>
            </VStack>
          </CardHeader>

          <CardBody pt={0}>
            <VStack spacing={6} align="stretch">
              {/* Instructions */}
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" spacing={2} fontSize="sm">
                  <Text fontWeight="medium">How to get your API credentials:</Text>
                  <VStack align="start" spacing={1} pl={4}>
                    <Text>1. Visit my.telegram.org/apps</Text>
                    <Text>2. Log in with your Telegram account</Text>
                    <Text>3. Create a new application</Text>
                    <Text>4. Copy the API ID and API Hash</Text>
                  </VStack>
                </VStack>
              </Alert>

              {/* Quick Link */}
              <Link
                href="https://my.telegram.org/apps"
                isExternal
                color="brand.500"
                fontWeight="medium"
                fontSize="sm"
                textAlign="center"
                _hover={{ textDecoration: 'none', color: 'brand.600' }}
              >
                <HStack justify="center" spacing={2}>
                  <Text>Open Telegram API Console</Text>
                  <Icon as={FiExternalLink} w={3} h={3} />
                </HStack>
              </Link>

              <Divider />

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

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.api_id}>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      API ID
                    </FormLabel>
                    <Input
                      type="number"
                      placeholder="e.g., 1234567"
                      fontFamily="mono"
                      {...register('api_id', {
                        required: 'API ID is required',
                        min: {
                          value: 1,
                          message: 'API ID must be a positive number',
                        },
                      })}
                    />
                    <FormErrorMessage fontSize="xs">
                      {errors.api_id?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.api_hash}>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      API Hash
                    </FormLabel>
                    <Input
                      type="password"
                      placeholder="32-character API hash"
                      fontFamily="mono"
                      {...register('api_hash', {
                        required: 'API Hash is required',
                        minLength: {
                          value: 32,
                          message: 'API Hash must be exactly 32 characters',
                        },
                        maxLength: {
                          value: 32,
                          message: 'API Hash must be exactly 32 characters',
                        },
                      })}
                    />
                    <FormErrorMessage fontSize="xs">
                      {errors.api_hash?.message}
                    </FormErrorMessage>
                  </FormControl>

                  {/* Action Buttons */}
                  <VStack spacing={3} w="full" pt={2}>
                    <HStack spacing={3} w="full">
                      <Button
                        variant="outline"
                        onClick={handleTestConfig}
                        isLoading={loading}
                        loadingText="Testing..."
                        isDisabled={!apiId || !apiHash}
                        flex={1}
                      >
                        Test Config
                      </Button>
                      <Button
                        type="submit"
                        colorScheme="brand"
                        isLoading={loading}
                        loadingText="Saving..."
                        flex={1}
                      >
                        Save & Continue
                      </Button>
                    </HStack>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSkip}
                      color="gray.600"
                    >
                      Skip for now (limited functionality)
                    </Button>
                  </VStack>
                </VStack>
              </form>

              {/* Security Note */}
              <Alert status="warning" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" fontSize="xs" spacing={1}>
                  <Text fontWeight="medium">Security Notice:</Text>
                  <Text>
                    Your API credentials are encrypted with AES-256 and stored securely in MongoDB.
                    They are never transmitted in plain text or logged.
                  </Text>
                </VStack>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
};

export default ApiConfiguration;