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
  Link,
  Code,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiExternalLink } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { ApiConfigurationProps } from '../types/components';
import { ConfigFormData } from '../types';

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

  const watchedValues = watch();
  const hasChanges = watchedValues.api_id || watchedValues.api_hash;

  const onSubmit = async (data: ConfigFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.auth.configure({
        api_id: Number(data.api_id),
        api_hash: data.api_hash,
      });
      setSuccess('API configuration saved successfully!');
      setTimeout(() => {
        onConfigured();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save API configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" bgGradient={bgGradient} align="center" justify="center" p={4}>
      <Box w="full" maxW="lg">
        <Card shadow="2xl" bg={cardBg} backdropFilter="blur(10px)">
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <VStack spacing={2}>
                <Heading size="lg" textAlign="center" color="brand.600">
                  Telegram API Configuration
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Configure your Telegram API credentials to get started
                </Text>
              </VStack>

              {/* Instructions */}
              <Box
                bg="blue.50"
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="blue.200"
                _dark={{ 
                  bg: 'blue.900',
                  borderColor: 'blue.700'
                }}
              >
                <VStack spacing={3} align="start">
                  <Text fontSize="sm" fontWeight="semibold" color="blue.800" _dark={{ color: 'blue.200' }}>
                    How to get your API credentials:
                  </Text>
                  <VStack spacing={2} align="start" fontSize="sm" color="blue.700" _dark={{ color: 'blue.300' }}>
                    <Text>1. Visit <Link href="https://my.telegram.org/apps" isExternal color="blue.600" fontWeight="medium">
                      my.telegram.org/apps <Icon as={FiExternalLink} mx="2px" />
                    </Link></Text>
                    <Text>2. Log in with your Telegram account</Text>
                    <Text>3. Create a new application</Text>
                    <Text>4. Copy the <Code>API ID</Code> and <Code>API Hash</Code></Text>
                  </VStack>
                </VStack>
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

              {/* Configuration Form */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.api_id}>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      API ID
                    </FormLabel>
                    <Input
                      type="number"
                      placeholder="Enter your API ID (e.g., 1234567)"
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
                      type="text"
                      placeholder="Enter your API Hash (e.g., abcd1234...)"
                      fontFamily="mono"
                      {...register('api_hash', {
                        required: 'API Hash is required',
                        minLength: {
                          value: 32,
                          message: 'API Hash must be at least 32 characters',
                        },
                      })}
                    />
                    <FormErrorMessage fontSize="xs">
                      {errors.api_hash?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <VStack spacing={3} w="full" pt={2}>
                    <Button
                      type="submit"
                      colorScheme="brand"
                      size="lg"
                      w="full"
                      isLoading={loading}
                      loadingText="Saving..."
                      isDisabled={!hasChanges}
                    >
                      Save Configuration
                    </Button>

                    <Divider />

                    <Button
                      variant="ghost"
                      size="md"
                      onClick={onSkip}
                      isDisabled={loading}
                    >
                      Skip for now
                    </Button>
                  </VStack>
                </VStack>
              </form>

              {/* Warning */}
              <Alert status="warning" borderRadius="lg">
                <AlertIcon />
                <AlertDescription fontSize="xs">
                  Your API credentials are encrypted and stored securely. Never share them with anyone.
                </AlertDescription>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Flex>
  );
};

export default ApiConfiguration;