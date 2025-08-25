import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

// Theme configuration
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// Custom colors
const colors = {
  brand: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Custom fonts
const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  mono: `'JetBrains Mono', 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', 'Source Code Pro', monospace`,
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
    },
    variants: {
      solid: (props: any) => ({
        bg: mode('brand.600', 'brand.500')(props),
        color: 'white',
        _hover: {
          bg: mode('brand.700', 'brand.600')(props),
          transform: 'translateY(-1px)',
          shadow: 'lg',
        },
        _active: {
          bg: mode('brand.800', 'brand.700')(props),
          transform: 'translateY(0)',
        },
        transition: 'all 0.2s',
      }),
      ghost: (props: any) => ({
        color: mode('gray.600', 'gray.300')(props),
        _hover: {
          bg: mode('gray.100', 'gray.700')(props),
          color: mode('gray.800', 'white')(props),
        },
      }),
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        border: '1px solid',
        borderColor: 'gray.200',
        _dark: {
          borderColor: 'gray.700',
          bg: 'gray.800',
        },
        shadow: 'sm',
        _hover: {
          shadow: 'lg',
        },
        transition: 'all 0.2s',
      },
    },
  },
  Input: {
    variants: {
      filled: (props: any) => ({
        field: {
          bg: mode('gray.50', 'gray.700')(props),
          borderColor: 'transparent',
          _hover: {
            bg: mode('gray.100', 'gray.600')(props),
          },
          _focus: {
            bg: mode('white', 'gray.800')(props),
            borderColor: 'brand.500',
            shadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      }),
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  FormLabel: {
    baseStyle: {
      fontWeight: 'semibold',
      color: 'gray.700',
      _dark: {
        color: 'gray.200',
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      fontWeight: 'semibold',
      fontSize: 'xs',
      px: 3,
      py: 1,
    },
  },
  Stat: {
    baseStyle: {
      container: {
        bg: 'white',
        _dark: {
          bg: 'gray.800',
        },
        p: 6,
        borderRadius: 'xl',
        border: '1px solid',
        borderColor: 'gray.200',
        _dark: {
          borderColor: 'gray.700',
        },
        shadow: 'sm',
        _hover: {
          shadow: 'lg',
        },
        transition: 'all 0.2s',
      },
    },
  },
};

// Global styles
const styles = {
  global: (props: any) => ({
    body: {
      fontFamily: 'body',
      color: mode('gray.800', 'whiteAlpha.900')(props),
      bg: mode('gray.50', 'gray.900')(props),
      lineHeight: 'base',
    },
    '*::placeholder': {
      color: mode('gray.400', 'gray.500')(props),
    },
    '*, *::before, &::after': {
      borderColor: mode('gray.200', 'gray.700')(props),
      wordWrap: 'break-word',
    },
    // Custom scrollbar
    '::-webkit-scrollbar': {
      width: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: mode('gray.100', 'gray.700')(props),
    },
    '::-webkit-scrollbar-thumb': {
      bg: mode('gray.300', 'gray.600')(props),
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: mode('gray.400', 'gray.500')(props),
    },
  }),
};

// Text styles
const textStyles = {
  h1: {
    fontSize: ['2xl', '3xl', '4xl'],
    fontWeight: 'bold',
    lineHeight: '110%',
    letterSpacing: '-2%',
  },
  h2: {
    fontSize: ['xl', '2xl', '3xl'],
    fontWeight: 'semibold',
    lineHeight: '110%',
    letterSpacing: '-1%',
  },
};

// Layer styles
const layerStyles = {
  card: {
    bg: 'white',
    border: '1px solid',
    borderColor: 'gray.200',
    borderRadius: 'xl',
    shadow: 'sm',
    _dark: {
      bg: 'gray.800',
      borderColor: 'gray.700',
    },
    _hover: {
      shadow: 'lg',
    },
    transition: 'all 0.2s',
  },
  sidebar: {
    bg: 'white',
    borderRight: '1px solid',
    borderColor: 'gray.200',
    _dark: {
      bg: 'gray.800',
      borderColor: 'gray.700',
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
  styles,
  textStyles,
  layerStyles,
});

export default theme;