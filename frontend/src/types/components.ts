// Component prop types
import { ReactNode } from 'react';
import { AuthStatus, Group, MessageFile, Template, BlacklistItem, LogEntry } from './index';

export interface AppProps {}

export interface DashboardProps {}

export interface LoginFormProps {
  onAuthSuccess: () => void;
}

export interface ApiConfigurationProps {
  onConfigured: () => void;
  onSkip: () => void;
}

export interface AuthStatusProps {
  authStatus: AuthStatus | null;
  onRefresh: () => void;
}

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export interface GroupsManagerProps {}

export interface MessagesManagerProps {}

export interface TemplateManagerProps {}

export interface BlacklistManagerProps {}

export interface ConfigManagerProps {}

export interface LogViewerProps {}

export interface MessageSenderProps {}

// Generic component props
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  trend?: {
    type: 'up' | 'down' | 'stable';
    value: string;
  };
}

export interface ServiceStatusProps {
  name: string;
  status: boolean;
  description: string;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}