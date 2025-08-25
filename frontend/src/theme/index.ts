import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Precision-First Color System - Linear/Vercel/Notion Style
const colors = {
  brand: {
    50: '#fafafa',
    100: '#f5f5f5', 
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#171717', // Primary brand - deep black like Linear
    600: '#0a0a0a',
    700: '#000000',
    800: '#000000',
    900: '#000000',
  },
  gray: {
    25: '#fdfdfd',  // Ultra light backgrounds
    50: '#fafafa',  // Light surfaces
    100: '#f5f5f5', // Subtle surfaces
    200: '#e5e5e5', // Borders
    300: '#d4d4d4', // Muted borders
    400: '#a3a3a3', // Placeholder text
    500: '#737373', // Secondary text
    600: '#525252', // Primary text (light mode)
    700: '#404040', // Stronger text
    800: '#262626', // Dark surfaces
    850: '#1a1a1a', // Darker surfaces  
    900: '#171717', // Primary dark
    950: '#0a0a0a', // Ultra dark
  },
  // Precise accent colors
  blue: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
  },
  green: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  red: {
    50: '#fef2f2',
    500: '#ef4444', 
    600: '#dc2626',
  },
  orange: {
    50: '#fff7ed',
    500: '#f97316',
    600: '#ea580c',
  },
  purple: {
    50: '#faf5ff',
    500: '#a855f7',
    600: '#9333ea',
  }
};

// Precision Typography System
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif', 
  mono: '"JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
};

// Strict 4px Grid System
const space = {
  px: '1px',
  0.5: '2px',   // 2px
  1: '4px',     // 4px  - Base unit
  1.5: '6px',   // 6px
  2: '8px',     // 8px  - Small spacing
  2.5: '10px',  // 10px
  3: '12px',    // 12px - Medium spacing
  3.5: '14px',  // 14px
  4: '16px',    // 16px - Large spacing
  5: '20px',    // 20px
  6: '24px',    // 24px - Extra large spacing
  7: '28px',    // 28px
  8: '32px',    // 32px - Section spacing
  9: '36px',    // 36px
  10: '40px',   // 40px
  12: '48px',   // 48px - Page spacing
  14: '56px',   // 56px
  16: '64px',   // 64px - Major spacing
  20: '80px',   // 80px
  24: '96px',   // 96px - Hero spacing
  32: '128px',  // 128px
};

// Precision Component Styles
const components = {
  // Ultra-precise Card System
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        border: '1px solid',
        borderColor: 'gray.200',
        borderRadius: '8px', // Consistent 8px radius
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        _dark: {
          bg: 'gray.900',
          borderColor: 'gray.800',
        }
      }
    },
    variants: {
      compact: {
        container: {
          bg: 'gray.50',
          border: '1px solid',
          borderColor: 'gray.200',
          borderRadius: '6px',
          _dark: {
            bg: 'gray.850', 
            borderColor: 'gray.800',
          }
        }
      },
      elevated: {
        container: {
          shadow: 'sm',
          _hover: {
            shadow: 'md',
            borderColor: 'gray.300',
            _dark: {
              borderColor: 'gray.700',
            }
          }
        }
      },
      subtle: {
        container: {
          bg: 'transparent',
          border: 'none',
          borderRadius: '6px',
        }
      }
    },
    sizes: {
      sm: {
        container: { borderRadius: '6px' }
      },
      md: {
        container: { borderRadius: '8px' }
      },
      lg: {
        container: { borderRadius: '12px' }
      }
    }
  },

  // Precision Button System
  Button: {
    baseStyle: {
      fontWeight: 500,
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '20px',
      transition: 'all 0.15s ease',
      _focus: {
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '2px',
        boxShadow: 'none',
      },
      _disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
      }
    },
    variants: {
      solid: {
        bg: 'gray.900',
        color: 'white',
        _hover: {
          bg: 'gray.800',
          _disabled: { bg: 'gray.900' }
        },
        _active: {
          bg: 'gray.950',
        }
      },
      outline: {
        border: '1px solid',
        borderColor: 'gray.300',
        color: 'gray.700',
        bg: 'transparent',
        _hover: {
          bg: 'gray.50',
          borderColor: 'gray.400',
          color: 'gray.900',
        },
        _active: {
          bg: 'gray.100',
        },
        _dark: {
          borderColor: 'gray.700',
          color: 'gray.300',
          _hover: {
            bg: 'gray.800',
            borderColor: 'gray.600',
            color: 'gray.100',
          }
        }
      },
      ghost: {
        color: 'gray.700',
        bg: 'transparent',
        _hover: {
          bg: 'gray.100',
          color: 'gray.900',
        },
        _active: {
          bg: 'gray.200',
        },
        _dark: {
          color: 'gray.400',
          _hover: {
            bg: 'gray.800',
            color: 'gray.200',
          },
          _active: {
            bg: 'gray.700',
          }
        }
      }
    },
    sizes: {
      xs: {
        h: '24px',
        px: '8px',
        fontSize: '12px',
        borderRadius: '6px',
      },
      sm: {
        h: '32px',
        px: '12px', 
        fontSize: '13px',
        borderRadius: '6px',
      },
      md: {
        h: '36px',
        px: '16px',
        fontSize: '14px',
        borderRadius: '8px',
      },
      lg: {
        h: '40px',
        px: '20px',
        fontSize: '16px',
        borderRadius: '8px',
      }
    }
  },

  // Precision Input System  
  Input: {
    baseStyle: {
      field: {
        borderRadius: '8px',
        fontSize: '14px',
        transition: 'all 0.15s ease',
        _placeholder: {
          color: 'gray.400',
          fontSize: '14px',
        }
      }
    },
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          bg: 'white',
          _hover: {
            borderColor: 'gray.400',
          },
          _focus: {
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
            _invalid: {
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-red-500)',
            }
          },
          _dark: {
            borderColor: 'gray.700',
            bg: 'gray.900',
            _hover: {
              borderColor: 'gray.600',
            },
            _focus: {
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
            }
          }
        }
      },
      filled: {
        field: {
          bg: 'gray.100',
          border: '1px solid',
          borderColor: 'gray.200',
          _hover: {
            bg: 'gray.50',
            borderColor: 'gray.300',
          },
          _focus: {
            bg: 'white',
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
          },
          _dark: {
            bg: 'gray.800',
            borderColor: 'gray.700',
            _hover: {
              bg: 'gray.750',
              borderColor: 'gray.600',
            },
            _focus: {
              bg: 'gray.900',
              borderColor: 'blue.400',
            }
          }
        }
      }
    },
    sizes: {
      sm: {
        field: {
          h: '32px',
          px: '12px',
          fontSize: '13px',
          borderRadius: '6px',
        }
      },
      md: {
        field: {
          h: '36px',
          px: '12px',
          fontSize: '14px',
          borderRadius: '8px',
        }
      },
      lg: {
        field: {
          h: '40px',
          px: '16px',
          fontSize: '16px',
          borderRadius: '8px',
        }
      }
    }
  },

  // Precision Progress System
  Progress: {
    baseStyle: {
      track: {
        bg: 'gray.200',
        _dark: {
          bg: 'gray.700',
        }
      },
      filledTrack: {
        bg: 'gray.900',
        _dark: {
          bg: 'gray.300',
        }
      }
    },
    sizes: {
      xs: {
        track: { h: '2px' }
      },
      sm: {
        track: { h: '4px' }
      },
      md: {
        track: { h: '6px' }
      },
      lg: {
        track: { h: '8px' }
      }
    }
  },

  // Precision Badge System
  Badge: {
    baseStyle: {
      fontSize: '12px',
      fontWeight: 500,
      borderRadius: '6px',
      textTransform: 'none',
    },
    sizes: {
      sm: {
        px: '6px',
        py: '2px',
        fontSize: '11px',
      },
      md: {
        px: '8px',
        py: '4px', 
        fontSize: '12px',
      },
      lg: {
        px: '10px',
        py: '4px',
        fontSize: '13px',
      }
    }
  },

  // Precision Alert System
  Alert: {
    variants: {
      subtle: {
        container: {
          borderRadius: '8px',
          border: '1px solid',
        }
      }
    }
  }
};

// Precision Semantic Tokens
const semanticTokens = {
  colors: {
    // Background System
    'bg-canvas': {
      default: 'white',
      _dark: 'gray.950',
    },
    'bg-surface': {
      default: 'white', 
      _dark: 'gray.900',
    },
    'bg-muted': {
      default: 'gray.50',
      _dark: 'gray.850',
    },
    'bg-subtle': {
      default: 'gray.25',
      _dark: 'gray.900',
    },
    // Text System
    'text-primary': {
      default: 'gray.900',
      _dark: 'gray.50',
    },
    'text-secondary': {
      default: 'gray.600',
      _dark: 'gray.400',
    },
    'text-muted': {
      default: 'gray.500',
      _dark: 'gray.500',
    },
    'text-placeholder': {
      default: 'gray.400',
      _dark: 'gray.500',
    },
    // Border System  
    'border-primary': {
      default: 'gray.200',
      _dark: 'gray.800',
    },
    'border-secondary': {
      default: 'gray.300',
      _dark: 'gray.700',
    },
    'border-muted': {
      default: 'gray.100',
      _dark: 'gray.850',
    },
    // Interactive System
    'bg-hover': {
      default: 'gray.50',
      _dark: 'gray.800',
    },
    'bg-active': {
      default: 'gray.100',
      _dark: 'gray.700',
    }
  }
};

// Theme Configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

// Global Styles - Precision First
const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.950' : 'white',
      color: props.colorMode === 'dark' ? 'gray.50' : 'gray.900',
      fontSize: '14px',
      lineHeight: '20px',
      fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    '*': {
      borderColor: props.colorMode === 'dark' ? 'gray.800' : 'gray.200',
    },
    // Typography Precision
    'h1, h2, h3, h4, h5, h6': {
      fontWeight: 600,
      letterSpacing: '-0.025em',
      lineHeight: '1.25',
    },
    // Scrollbar Precision
    '::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.300',
      borderRadius: '3px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.400',
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
  // Precision Shadows
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.06)', 
    md: '0 2px 6px 0 rgb(0 0 0 / 0.08)',
    lg: '0 4px 12px 0 rgb(0 0 0 / 0.10)',
    xl: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
    // Focus shadows
    outline: '0 0 0 2px var(--chakra-colors-blue-500)',
    'outline-gray': '0 0 0 2px var(--chakra-colors-gray-500)',
  },
  // Precision Border Radius
  radii: {
    none: '0',
    sm: '4px',
    md: '6px', 
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
  },
  // Precision Font Sizes
  fontSizes: {
    xs: '12px',
    sm: '13px', 
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px',
    '5xl': '48px',
  },
  // Precision Line Heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  // Precision Letter Spacing
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  }
});

export default theme;