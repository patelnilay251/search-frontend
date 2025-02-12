import { createTheme } from '@mui/material/styles';

// Create a base theme with breakpoints and core configurations.
let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#000000',
      paper: '#000000',
    },
    text: {
      primary: '#ffffff',
      secondary: '#888888',
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
    h4: {
      fontWeight: 400,
      letterSpacing: '0.05em',
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 400,
      letterSpacing: '0.05em',
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 400,
      letterSpacing: '0.05em',
      fontSize: '1.125rem',
    },
    body1: {
      letterSpacing: '0.03em',
      fontSize: '1rem',
    },
    body2: {
      letterSpacing: '0.03em',
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          transition: 'border-color 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 400,
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
        contained: {
          backgroundColor: '#000000',
          border: '1px solid #ffffff',
          '&:hover': {
            backgroundColor: '#ffffff',
            color: '#000000',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            '& fieldset': {
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
          },
        },
      },
    },
  },
});

// Extend typography settings with responsive font sizes.
theme = createTheme(theme, {
  typography: {
    h4: {
      ...theme.typography.h4,
      [theme.breakpoints.up('sm')]: {
        fontSize: '1.75rem',
      },
      [theme.breakpoints.up('md')]: {
        fontSize: '2rem',
      },
    },
    h5: {
      ...theme.typography.h5,
      [theme.breakpoints.up('sm')]: {
        fontSize: '1.5rem',
      },
      [theme.breakpoints.up('md')]: {
        fontSize: '1.75rem',
      },
    },
    h6: {
      ...theme.typography.h6,
      [theme.breakpoints.up('sm')]: {
        fontSize: '1.25rem',
      },
      [theme.breakpoints.up('md')]: {
        fontSize: '1.5rem',
      },
    },
    body1: {
      ...theme.typography.body1,
      [theme.breakpoints.up('sm')]: {
        fontSize: '1.125rem',
      },
    },
    body2: {
      ...theme.typography.body2,
      [theme.breakpoints.up('sm')]: {
        fontSize: '1rem',
      },
    },
  },
});

export default theme;