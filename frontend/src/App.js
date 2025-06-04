// frontend/src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  Box, ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import Sidebar from './components/Sidebar';
import MarketScanner from './components/MarketScanner';
import TradingAnalyzer from './components/TradingAnalyzer';
import PerformanceDashboard from './components/PerformanceDashboard';
import SearchCharts from './components/SearchCharts';
import DisclaimerBanner from './components/DisclaimerBanner';
import EducationalSection from './components/EducationalSection';
import Corsi from './components/Corsi';
import Profile from './components/Profile';

// Create a dark theme with black background and gold accents
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#D4AF37', // Gold color
    },
    background: {
      default: '#000000', // Pure black background
      paper: '#000000', // Very dark for paper elements
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderRadius: 12,
          border: '1px solid #D4AF37',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#D4AF37', // Gold color for selected tab
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#D4AF37', // Gold color for tab indicator
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          border: '1px solid #D4AF37',
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [riskSettings] = useState({
    maxRiskPerTrade: 1.0,
    stopLossPercentage: 2.0,
    takeProfitRatio: 2.0,
    maxOpenPositions: 3,
    enableTrailingStop: false,
    enableHedging: false
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 0,
              ml: { xs: 0, md: 0 },
              backgroundColor: '#000000',
            }}
          >
            {/* Disclaimer Banner - Always shown */}
            <DisclaimerBanner />
            
            <Box sx={{ mt: 3 }}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <MarketScanner />
                      <EducationalSection />
                    </>
                  }
                />
                <Route
                  path="/trading-analyzer"
                  element={
                    <>
                      <TradingAnalyzer riskSettings={riskSettings} />
                      <EducationalSection />
                    </>
                  }
                />
                <Route
                  path="/search-charts"
                  element={<SearchCharts />}
                />
                <Route
                  path="/performance"
                  element={<PerformanceDashboard />}
                />
                <Route
                  path="/corsi"
                  element={<Corsi />}
                />
                <Route
                  path="/profile"
                  element={<Profile />}
                />
                <Route
                  path="/settings"
                  element={
                    <Box sx={{ color: '#D4AF37', textAlign: 'center', mt: 5 }}>
                      <h2>Settings Page</h2>
                      <p>Settings configuration will be implemented here.</p>
                    </Box>
                  }
                />
              </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;