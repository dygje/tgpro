import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Modern Color Palette - Inspired by Linear/Notion
const colors = {
  brand: {
    50: '#f0f4ff',
    100: '#e0ebff',
    200: '#c7d8ff',
    300: '#a3bcff',
    400: '#7996ff',
    500: '#5570ff', // Primary brand color
    600: '#4555d9',
    700: '#3741b3',
    800: '#2d3386',
    900: '#1e2359',
  },
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
  // Status colors
  success: {
    50: '#f0fdf4',
    500: '#10b981',
    600: '#059669',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  // Surface colors for modern UI
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  }
};

// Modern Typography - Clean & Readable
const fonts = {
  heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: 'JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

// Compact Spacing System
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

// Modern Component Styles
const components = {
  // Modern Card Design
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        borderRadius: 'lg',
        border: '1px solid',
        borderColor: 'gray.200',
        overflow: 'hidden',
        _dark: {
          bg: 'gray.800',
          borderColor: 'gray.700',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        }
      }
    },
    variants: {
      compact: {
        container: {
          bg: 'surface.secondary',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 'md',
          _dark: {
            bg: 'gray.850',
          }
        }
      }
    }
  },

  // Modern Button Design
  Button: {
    baseStyle: {
      fontWeight: 500,
      borderRadius: 'md',
      fontSize: 'sm',
      _focus: {
        boxShadow: 'none',
        ring: 2,
        ringColor: 'brand.500',
        ringOpacity: 0.3,
      }
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: {
            bg: 'brand.500',
          }
        },
        _active: {
          bg: 'brand.700',
        }
      },
      ghost: {
        color: 'gray.600',
        _hover: {
          bg: 'gray.100',
          color: 'gray.700',
        },
        _dark: {
          color: 'gray.400',
          _hover: {
            bg: 'gray.700',
            color: 'gray.300',
          }
        }
      },
      outline: {
        border: '1px solid',
        borderColor: 'gray.300',
        color: 'gray.700',
        _hover: {
          bg: 'gray.50',
          borderColor: 'gray.400',
        },
        _dark: {
          borderColor: 'gray.600',
          color: 'gray.300',
          _hover: {
            bg: 'gray.700',
            borderColor: 'gray.500',
          }
        }
      }
    },
    sizes: {
      sm: {
        h: 8,
        px: 3,
        fontSize: 'sm',
      },
      md: {
        h: 10,
        px: 4,
        fontSize: 'sm',
      },
      lg: {
        h: 12,
        px: 6,
        fontSize: 'md',
      }
    }
  },

  // Modern Input Design
  Input: {
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _hover: {
            borderColor: 'gray.400',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
          _dark: {
            borderColor: 'gray.600',
            _hover: {
              borderColor: 'gray.500',
            },
            _focus: {
              borderColor: 'brand.500',
            }
          }
        }
      }
    },
    sizes: {
      sm: {
        field: {
          h: 8,
          px: 3,
          fontSize: 'sm',
        }
      },
      md: {
        field: {
          h: 10,
          px: 4,
          fontSize: 'sm',
        }
      }
    }
  },

  // Modern Alert Design
  Alert: {
    variants: {
      subtle: {
        container: {
          borderRadius: 'md',
          border: '1px solid',
        }
      }
    }
  },

  // Modern Tabs Design
  Tabs: {
    variants: {
      line: {
        tablist: {
          borderBottom: '1px solid',
          borderColor: 'gray.200',
          _dark: {
            borderColor: 'gray.700',
          }
        },
        tab: {
          color: 'gray.500',
          fontWeight: 500,
          fontSize: 'sm',
          px: 4,
          py: 3,
          _hover: {
            color: 'gray.700',
          },
          _selected: {
            color: 'brand.500',
            borderBottomColor: 'brand.500',
          },
          _dark: {
            color: 'gray.400',
            _hover: {
              color: 'gray.300',
            },
            _selected: {
              color: 'brand.400',
            }
          }
        }
      }
    }
  }
};

// Modern Semantic Tokens
const semanticTokens = {
  colors: {
    'bg-canvas': {
      default: 'gray.50',
      _dark: 'gray.900',
    },
    'bg-surface': {
      default: 'white',
      _dark: 'gray.800',
    },
    'bg-muted': {
      default: 'gray.100',
      _dark: 'gray.700',
    },
    'text-primary': {
      default: 'gray.900',
      _dark: 'gray.100',
    },
    'text-secondary': {
      default: 'gray.600',
      _dark: 'gray.400',
    },
    'text-muted': {
      default: 'gray.500',
      _dark: 'gray.500',
    },
    'border-primary': {
      default: 'gray.200',
      _dark: 'gray.700',
    },
    'border-secondary': {
      default: 'gray.300',
      _dark: 'gray.600',
    }
  }
};

// Theme Configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

// Global Styles
const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
      fontSize: 'sm',
      lineHeight: 1.5,
    },
    '*': {
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
    }
  })
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  space,
  components,
  semanticTokens,
  styles,
  // Modern shadows
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  // Modern border radius
  radii: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
});

export default theme;