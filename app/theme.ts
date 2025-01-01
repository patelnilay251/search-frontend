import { createTheme } from '@mui/material/styles';

const theme = createTheme({
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
    },
    h5: {
      fontWeight: 400,
      letterSpacing: '0.05em',
    },
    h6: {
      fontWeight: 400,
      letterSpacing: '0.05em',
    },
    body1: {
      letterSpacing: '0.03em',
    },
    body2: {
      letterSpacing: '0.03em',
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

export default theme;

