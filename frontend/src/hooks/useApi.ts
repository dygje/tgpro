import { useState, useCallback } from 'react';
import { api } from '../lib/api';

export interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export const useApi = <T = any>(options: UseApiOptions<T> = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const { onSuccess, onError } = options;

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

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
};

// Specific API hooks
export const useHealthCheck = () => {
  return useApi({
    onError: (error) => {
      console.error('Health check failed:', error);
    },
  });
};

export const useAuthStatus = () => {
  return useApi({
    onError: (error) => {
      console.error('Auth status check failed:', error);
    },
  });
};

export const useGroups = () => {
  return useApi({
    onError: (error) => {
      console.error('Groups operation failed:', error);
    },
  });
};

export const useMessages = () => {
  return useApi({
    onError: (error) => {
      console.error('Messages operation failed:', error);
    },
  });
};

export const useTemplates = () => {
  return useApi({
    onError: (error) => {
      console.error('Templates operation failed:', error);
    },
  });
};

export const useBlacklist = () => {
  return useApi({
    onError: (error) => {
      console.error('Blacklist operation failed:', error);
    },
  });
};