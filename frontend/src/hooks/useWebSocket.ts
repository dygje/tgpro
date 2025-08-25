import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '@/types/api';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

/**
 * WebSocket hook for real-time communication
 */
export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Open' | 'Closed'>('Closed');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([]);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const reconnectCount = useRef(0);
  
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const connect = useCallback(() => {
    try {
      if (ws.current?.readyState === WebSocket.OPEN) {
        return;
      }

      setConnectionStatus('Connecting');
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setConnectionStatus('Open');
        reconnectCount.current = 0;
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          setMessageHistory(prev => [message, ...prev].slice(0, 100)); // Keep last 100 messages
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setConnectionStatus('Closed');
        onDisconnect?.();
        
        // Attempt to reconnect
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++;
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('Closed');
    }
  }, [url, onConnect, onDisconnect, onError, onMessage, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setConnectionStatus('Closed');
    reconnectCount.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const clearHistory = useCallback(() => {
    setMessageHistory([]);
    setLastMessage(null);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    lastMessage,
    messageHistory,
    sendMessage,
    connect,
    disconnect,
    clearHistory,
  };
}

/**
 * Hook for connecting to specific WebSocket endpoints
 */
export function useWebSocketEndpoint(
  endpoint: 'logs' | 'monitoring' | 'tasks',
  options?: UseWebSocketOptions
) {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const wsUrl = `${backendUrl?.replace('http', 'ws')}/api/ws/${endpoint}?api_key=telegram-automation-key-2025`;
  
  return useWebSocket(wsUrl, options);
}