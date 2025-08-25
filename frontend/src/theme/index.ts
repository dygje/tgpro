import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Linear + Vercel Inspired Color Palette - Minimal & Clean
const colors = {
  brand: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#171717', // Primary brand color - dark like Linear
    600: '#0a0a0a',
    700: '#000000',
    800: '#000000',
    900: '#000000',
  },
  gray: {
    25: '#fdfdfd',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    850: '#1a1a1a',
    900: '#171717',
    950: '#0a0a0a',
  },
  // Subtle accent colors
  blue: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    500: '#0ea5e9',
    600: '#0284c7',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    500: '#f97316',
    600: '#ea580c',
  },
  // Linear-style surfaces
  surface: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
    quaternary: '#e5e5e5',
  }
};

// Linear-style Typography - Ultra Clean & Minimal
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
};

// Tight Spacing System - More compact like Linear
const space = {
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
};

// Linear-style Component Styles - Minimal & Clean
const components = {
  // Linear-inspired Card Design
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        boxShadow: 'none',
        borderRadius: '6px', // Smaller radius like Linear
        border: '1px solid',
        borderColor: 'gray.200',
        overflow: 'hidden',
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
          boxShadow: 'none',
          borderRadius: '4px',
          _dark: {
            bg: 'gray.850',
            borderColor: 'gray.800',
          }
        }
      },
      subtle: {
        container: {
          bg: 'transparent',
          border: 'none',
          boxShadow: 'none',
          borderRadius: '4px',
        }
      }
    }
  },

  // Linear-style Button Design
  Button: {
    baseStyle: {
      fontWeight: 500,
      borderRadius: '4px', // Tighter radius
      fontSize: '13px',    // Smaller text
      lineHeight: '1.4',
      transition: 'all 0.15s ease',
      _focus: {
        boxShadow: '0 0 0 2px rgba(23, 23, 23, 0.1)',
      },
      _focusVisible: {
        outline: '2px solid',
        outlineColor: 'gray.900',
        outlineOffset: '1px',
      }
    },
    variants: {
      solid: {
        bg: 'gray.900',
        color: 'white',
        _hover: {
          bg: 'gray.800',
          _disabled: {
            bg: 'gray.900',
          }
        },
        _active: {
          bg: 'gray.950',
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
      }
    },
    sizes: {
      xs: {
        h: 6,
        px: 2,
        fontSize: '11px',
      },
      sm: {
        h: 7,
        px: 3,
        fontSize: '12px',
      },
      md: {
        h: 8,
        px: 3,
        fontSize: '13px',
      },
      lg: {
        h: 9,
        px: 4,
        fontSize: '14px',
      }
    }
  },

  // Linear-style Input Design
  Input: {
    baseStyle: {
      field: {
        borderRadius: '4px',
        fontSize: '13px',
        transition: 'all 0.15s ease',
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
            borderColor: 'gray.900',
            boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)',
            _invalid: {
              borderColor: 'red.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-red-500)',
            }
          },
          _placeholder: {
            color: 'gray.400',
            fontSize: '13px',
          },
          _dark: {
            borderColor: 'gray.700',
            bg: 'gray.900',
            _hover: {
              borderColor: 'gray.600',
            },
            _focus: {
              borderColor: 'gray.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-gray-400)',
            }
          }
        }
      },
      filled: {
        field: {
          bg: 'gray.50',
          border: '1px solid',
          borderColor: 'gray.200',
          _hover: {
            bg: 'gray.100',
            borderColor: 'gray.300',
          },
          _focus: {
            bg: 'white',
            borderColor: 'gray.900',
            boxShadow: '0 0 0 1px var(--chakra-colors-gray-900)',
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
              borderColor: 'gray.400',
            }
          }
        }
      }
    },
    sizes: {
      sm: {
        field: {
          h: 7,
          px: 3,
          fontSize: '12px',
        }
      },
      md: {
        field: {
          h: 8,
          px: 3,
          fontSize: '13px',
        }
      },
      lg: {
        field: {
          h: 9,
          px: 4,
          fontSize: '14px',
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

// Linear-style Semantic Tokens
const semanticTokens = {
  colors: {
    // Backgrounds
    'bg-canvas': {
      default: 'white',      // Pure white like Linear
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
    // Text colors
    'text-primary': {
      default: 'gray.900',    // Strong black
      _dark: 'gray.50',
    },
    'text-secondary': {
      default: 'gray.700',    // Medium gray
      _dark: 'gray.300',
    },
    'text-muted': {
      default: 'gray.500',    // Light gray
      _dark: 'gray.400',
    },
    'text-placeholder': {
      default: 'gray.400',
      _dark: 'gray.500',
    },
    // Borders
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
    // Interactive states
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

// Linear-style Global Styles
const styles = {
  global: (props: any) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.950' : 'white', // Pure white like Linear
      color: props.colorMode === 'dark' ? 'gray.50' : 'gray.900',
      fontSize: '13px', // Smaller default font
      lineHeight: 1.4,   // Tighter line height
      fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"', // Inter font features
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    '*': {
      borderColor: props.colorMode === 'dark' ? 'gray.800' : 'gray.200',
    },
    // Typography improvements
    'h1, h2, h3, h4, h5, h6': {
      fontWeight: 600,
      letterSpacing: '-0.02em', // Tighter letter spacing
    },
    // Scrollbar styling
    '::-webkit-scrollbar': {
      width: '6px',
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
  // Linear-style shadows - More subtle
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
    md: '0 2px 6px 0 rgb(0 0 0 / 0.07)',
    lg: '0 4px 12px 0 rgb(0 0 0 / 0.08)',
    xl: '0 8px 24px 0 rgb(0 0 0 / 0.1)',
    // Linear-specific shadows
    border: '0 0 0 1px rgb(0 0 0 / 0.08)',
    focus: '0 0 0 2px rgb(0 0 0 / 0.1)',
  },
  // Smaller border radius like Linear
  radii: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    '2xl': '12px',
    full: '9999px',
  },
  // Linear-style font sizes
  fontSizes: {
    xs: '11px',
    sm: '12px',
    md: '13px',
    lg: '14px',
    xl: '16px',
    '2xl': '18px',
    '3xl': '24px',
    '4xl': '32px',
  },
  // Tighter line heights
  lineHeights: {
    shorter: 1.2,
    short: 1.3,
    base: 1.4,
    tall: 1.5,
    taller: 1.6,
  },
});

export default theme;