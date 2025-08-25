import { useToast as useChakraToast, UseToastOptions } from '@chakra-ui/react';

/**
 * Enhanced toast hook with predefined configurations
 */
export const useToast = () => {
  const toast = useChakraToast();

  return {
    success: (title: string, description?: string, options?: UseToastOptions) =>
      toast({
        title,
        description,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        ...options,
      }),

    error: (title: string, description?: string, options?: UseToastOptions) =>
      toast({
        title,
        description,
        status: 'error',
        duration: 7000,
        isClosable: true,
        position: 'top-right',
        ...options,
      }),

    warning: (title: string, description?: string, options?: UseToastOptions) =>
      toast({
        title,
        description,
        status: 'warning',
        duration: 6000,
        isClosable: true,
        position: 'top-right',
        ...options,
      }),

    info: (title: string, description?: string, options?: UseToastOptions) =>
      toast({
        title,
        description,
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        ...options,
      }),

    loading: (title: string, description?: string, options?: UseToastOptions) =>
      toast({
        title,
        description,
        status: 'loading',
        duration: null,
        isClosable: false,
        position: 'top-right',
        ...options,
      }),

    // Custom toast with full control
    custom: (options: UseToastOptions) => toast(options),

    // Close all toasts
    closeAll: () => toast.closeAll(),
  };
};