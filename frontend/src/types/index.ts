// Core data types for the application

export interface TelegramConfig {
  api_id: number;
  api_hash: string;
  configured: boolean;
}

export interface AuthStatus {
  authenticated: boolean;
  phone_number?: string;
  user_id?: string;
  username?: string;
  account_health?: AccountHealth;
}

export interface AccountHealth {
  risk_level: 'low' | 'medium' | 'high';
  success_rate: number;
  messages_sent_today: number;
  last_activity: string;
}

export interface Group {
  id: string;
  name: string;
  link: string;
  members_count?: number;
  status: 'active' | 'inactive' | 'blacklisted';
}

export interface MessageFile {
  filename: string;
  content: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface BlacklistItem {
  id: string;
  group_link: string;
  reason?: string;
  type: 'permanent' | 'temporary';
  expires_at?: string;
  added_at: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  component: string;
  details?: any;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: {
    telegram_service: boolean;
    config_manager: boolean;
    blacklist_manager: boolean;
    database: boolean;
  };
  uptime: string;
  version: string;
}

export interface DashboardStats {
  health: ServiceHealth;
  groups: {
    total: number;
    active: number;
    blacklisted: number;
  };
  messageFiles: {
    total: number;
  };
  blacklist: {
    permanent_count: number;
    temporary_count: number;
  };
  templates: {
    total: number;
  };
}

export interface SendMessageTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  template_id: string;
  groups: string[];
  variables: Record<string, string>;
  progress: number;
  total: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

// Form data interfaces
export interface LoginFormData {
  phone: string;
  verification_code?: string;
  two_fa_code?: string;
}

export interface ConfigFormData {
  api_id: number;
  api_hash: string;
}

export interface MessageFormData {
  filename: string;
  content: string;
}

export interface GroupFormData {
  link: string;
}

export interface TemplateFormData {
  name: string;
  content: string;
}