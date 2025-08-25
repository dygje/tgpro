// API response types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// API Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'log' | 'status' | 'task_update' | 'system_stats';
  payload: any;
  timestamp: string;
}

export interface WebSocketLogMessage extends WebSocketMessage {
  type: 'log';
  payload: {
    level: string;
    message: string;
    component: string;
    timestamp: string;
  };
}

export interface WebSocketTaskUpdate extends WebSocketMessage {
  type: 'task_update';
  payload: {
    task_id: string;
    status: string;
    progress: number;
    message?: string;
  };
}

export interface WebSocketSystemStats extends WebSocketMessage {
  type: 'system_stats';
  payload: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    active_connections: number;
  };
}