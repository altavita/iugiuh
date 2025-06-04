// Questo file può essere creato come src/theme.js

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Tema personalizzato con sfondo nero e accenti dorati
export const darkGoldTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
      paper: '#0A0A0A',
    },
    primary: {
      main: '#D4AF37',
    },
    secondary: {
      main: '#F5E7A3',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#BBBBBB',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A0A0A',
          backgroundImage: 'none',
          border: '1px solid #292929',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(212, 175, 55, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A0A0A',
          border: '1px solid #292929',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(212, 175, 55, 0.2)',
            borderColor: 'rgba(212, 175, 55, 0.3)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: '#292929',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(90deg, #D4AF37 0%, #F5E7A3 100%)',
          color: 'black',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(90deg, #F5E7A3 0%, #D4AF37 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 5px 15px rgba(212, 175, 55, 0.3)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid #292929',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#D4AF37',
          },
        },
      },
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
    },
    h5: {
      fontWeight: 'bold',
    },
    h6: {
      fontWeight: 'bold',
      color: '#D4AF37',
    },
  },
});

// Componente che applica il tema all'intera app
export const ThemeWrapper = ({ children }) => {
  return (
    <ThemeProvider theme={darkGoldTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

// Esporta anche gli styled components comuni
export const goldGradientStyle = {
  backgroundImage: 'linear-gradient(45deg, #D4AF37 0%, #F5E7A3 100%)',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitBackgroundClip: 'text',
  display: 'inline-block',
  fontWeight: 'bold',
};