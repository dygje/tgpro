import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from './useToast';

/**
 * Generic API hook with loading states and error handling
 */
export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const toast = useToast();

  const execute = useCallback(
    async (
      apiCall: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
        showToast?: boolean;
        successMessage?: string;
        errorMessage?: string;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setData(result);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        if (options?.showToast && options?.successMessage) {
          toast.success(options.successMessage);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);

        if (options?.onError) {
          options.onError(errorMessage);
        }

        if (options?.showToast) {
          toast.error(
            options?.errorMessage || 'Operation Failed',
            errorMessage
          );
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

/**
 * Hook for handling form submissions with API calls
 */
export function useApiForm<TFormData, TResponse = any>() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const submit = useCallback(
    async (
      formData: TFormData,
      apiCall: (data: TFormData) => Promise<TResponse>,
      options?: {
        onSuccess?: (data: TResponse) => void;
        onError?: (error: string) => void;
        successMessage?: string;
        resetOnSuccess?: boolean;
      }
    ) => {
      setLoading(true);
      setErrors({});

      try {
        const result = await apiCall(formData);

        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Form submission failed';

        // Handle validation errors
        if (err.details && typeof err.details === 'object') {
          setErrors(err.details);
        } else {
          toast.error('Submission Failed', errorMessage);
        }

        if (options?.onError) {
          options.onError(errorMessage);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    loading,
    errors,
    submit,
    clearErrors,
  };
}