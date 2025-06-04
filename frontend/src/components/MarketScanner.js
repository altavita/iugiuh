import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Button, Card, CardContent, CircularProgress, Grid, 
  Slider, Typography, Paper, Divider, Chip, styled, 
  FormControl, InputLabel, MenuItem, Select, IconButton,
  FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Alert, AlertTitle,
  FormHelperText  
} from '@mui/material';
import { 
  TrendingUp, TrendingDown, Analytics, 
  ArrowUpward, ArrowDownward, CheckCircle,
  Timeline, Speed, VolumeUp,
  Science, Assessment,
  
} from '@mui/icons-material';
import LazySpline from './LazySpline';
import axios from 'axios';



// Use environment variable for API URL
const API_URL = `${process.env.REACT_APP_API_URL}/market-analysis`;
const BACKTEST_URL = `${process.env.REACT_APP_API_URL}/backtest`;
const CROSS_VALIDATE_URL = `${process.env.REACT_APP_API_URL}/cross-validate`;
const MAX_ASSETS = parseInt(process.env.REACT_APP_MAX_ASSETS_FREE || '200');

// Funzione aggiornata per formattare correttamente il simbolo
const formatSymbol = (symbol) => {
  if (!symbol) return '';
  
  // Verifica lunghezza minima
  const trimmedSymbol = symbol.trim();
  if (trimmedSymbol.length < 3) {
    return ''; // Simbolo troppo corto
  }
  
  // Converti in maiuscolo
  let formatted = trimmedSymbol.toUpperCase();
  
  // Rimuovi "/USDT" se presente per evitare duplicazioni
  if (formatted.endsWith('/USDT')) {
    formatted = formatted.replace('/USDT', '');
  }
  
  // Aggiungi /USDT
  return `${formatted}/USDT`;
};

// Styled components for black theme with gold accents
const GoldGradientText = styled(Typography)(({ theme }) => ({
  backgroundImage: 'linear-gradient(45deg, #D4AF37 0%, #F5E7A3 100%)',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitBackgroundClip: 'text',
  display: 'inline-block',
  fontWeight: 'bold',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#000000',
  borderRadius: 12,
  border: '1px solid #D4AF37',
  boxShadow: '0 0 10px rgba(212, 175, 55, 0.15)', // gold glow
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)',
    borderColor: '#F5E7A3',
  }
}));

const GoldButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(90deg, #D4AF37 0%, #F5E7A3 100%)',
  color: 'black',
  fontWeight: 'bold',
  padding: '12px 0',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(90deg, #F5E7A3 0%, #D4AF37 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(212, 175, 55, 0.3)',
  }
}));

const GoldSlider = styled(Slider)(({ theme }) => ({
  color: '#D4AF37',
  '& .MuiSlider-thumb': {
    backgroundColor: '#D4AF37',
    '&:hover, &.Mui-focusVisible': {
      boxShadow: '0 0 0 8px rgba(212, 175, 55, 0.16)',
    }
  },
  '& .MuiSlider-rail': {
    backgroundColor: '#333333',
  },
  '& .MuiSlider-track': {
    background: 'linear-gradient(90deg, #D4AF37 0%, #F5E7A3 100%)',
  },
  '& .MuiSlider-mark': {
    backgroundColor: '#666666',
  },
  '& .MuiSlider-markLabel': {
    color: '#999999',
    fontSize: { xs: '0.65rem', sm: '0.75rem' }, // Responsive font size for marks
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#000000',
  borderRadius: 12,
  height: '100%',
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s ease',
  border: '1px solid #D4AF37',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(212, 175, 55, 0.2)',
    borderColor: '#F5E7A3',
  }
}));

const QualityChip = styled(Chip)(({ theme, quality }) => ({
  position: 'absolute', 
  top: -10, 
  left: 10,
  fontWeight: 'bold',
  fontSize: '0.65rem',
  backgroundColor: quality === 3 ? 'rgba(46, 125, 50, 0.9)' : // Verde per qualità 3/3
                   quality === 2 ? 'rgba(218, 165, 32, 0.9)' : // Dorato per qualità 2/3 
                   'rgba(144, 144, 144, 0.9)', // Grigio per qualità 1/3
  color: 'white',
  borderColor: quality === 3 ? '#4CAF50' : // Verde per qualità 3/3
              quality === 2 ? '#D4AF37' : // Dorato per qualità 2/3
              '#999999', // Grigio per qualità 1/3
}));

const SplineContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '450px',
  position: 'relative',
  borderRadius: '12px',
  border: '1px solid #D4AF37',
  overflow: 'hidden',
  marginBottom: '20px',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50px',
    background: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))',
    pointerEvents: 'none',
    zIndex: 1
  }
}));

// Component for the decorative gold bar
const GoldBar = () => (
  <span style={{ 
    display: 'inline-block', 
    width: '4px', 
    height: '24px', 
    background: 'linear-gradient(to bottom, #D4AF37, #F5E7A3)', 
    marginRight: '10px', 
    borderRadius: '2px' 
  }}></span>
);

function MarketScanner() {
  const [topAssets, setTopAssets] = useState(20);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null); // Null rather than empty array
  const [showSpline, setShowSpline] = useState(true);
  const [error, setError] = useState(null); // Added error state
  const [includeNegative, setIncludeNegative] = useState(false);
  const [useQualityFilter, setUseQualityFilter] = useState(true); // Nuovo stato per i filtri di qualità
  const [sortBy, setSortBy] = useState('forecastChange');
  const [sortDirection, setSortDirection] = useState('desc');
  const [stats, setStats] = useState({ positive: 0, negative: 0, highQuality: 0 });
  const [forecastThreshold, setForecastThreshold] = useState('balanced'); // default a balanced
  const animationRef = useRef(null);
  const splineLogoRef = useRef(null);
  
  // Stati per il modal di backtest
  const [backTestOpen, setBackTestOpen] = useState(false);
  const [backTestSymbol, setBackTestSymbol] = useState('');
  const [backTestLookback, setBackTestLookback] = useState(30);
  const [backTestPrediction, setBackTestPrediction] = useState(5);
  const [backTestLoading, setBackTestLoading] = useState(false);
  const [backTestResults, setBackTestResults] = useState(null);

  // Stati per il modal di cross-validation
  const [cvOpen, setCvOpen] = useState(false);
  const [cvSymbol, setCvSymbol] = useState('');
  const [cvFolds, setCvFolds] = useState(5);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvResults, setCvResults] = useState(null);

// Funzione helper per ottenere il valore numerico del threshold in base alla selezione
const getThresholdValue = (strategyType) => {
  switch(strategyType) {
    case 'conservative': return 0.02;  // 2%
    case 'aggressive': return 0.005;   // 0.5%
    case 'balanced':
    default: return 0.01;              // 1%
  }
};
  // Function to handle Spline loading
  const handleSplineLoad = (spline) => {
    // Identify and remove Spline logo
    const logo = document.querySelector('[data-spline="built-with-spline"]');
    if (logo) {
      splineLogoRef.current = logo;
      logo.style.display = 'none';
    }

    // Find the sphere
    const sphere = spline.findObjectByName('Sphere');
    if (sphere) {
      // Start continuous animation
      const animate = () => {
        if (sphere && showSpline) {
          sphere.rotation.x += 0.01;
          sphere.rotation.y += 0.01;
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animate();
      
      // Set navigation limits
      spline.setZoom(0.8); // Fixed zoom
      spline.enablePan = false; // Disable panning
      spline.enableZoom = false; // Disable zooming
    }
  };

  // Cleanup animation when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Hide sphere after loading is complete
  useEffect(() => {
    if (!loading && results !== null) {
      const timer = setTimeout(() => {
        setShowSpline(false);
      }, 1500); // Hide sphere 1.5 seconds after loading completes
      
      return () => clearTimeout(timer);
    }
  }, [loading, results]);
  
  // Funzione per eseguire il backtest
const handleBacktest = async () => {
  const formattedSymbol = formatSymbol(backTestSymbol);
  
  if (!formattedSymbol) {
    alert('Inserisci un simbolo valido (minimo 3 caratteri)');
    return;
  }
  
  setBackTestLoading(true);
  setBackTestResults(null);
  
  try {
    const response = await axios.post(BACKTEST_URL, {
      symbol: formattedSymbol,
      lookback_days: backTestLookback,
      prediction_days: backTestPrediction
    });
    
    setBackTestResults(response.data);
  } catch (error) {
    console.error('Error running backtest:', error);
    setBackTestResults({
      error: 'Errore durante il backtest. ' + 
        (error.response?.data?.error || 'Controlla la console per dettagli.')
    });
  } finally {
    setBackTestLoading(false);
  }
};

// Funzione per eseguire la cross-validation
const handleCrossValidation = async () => {
  const formattedSymbol = formatSymbol(cvSymbol);
  
  if (!formattedSymbol) {
    alert('Inserisci un simbolo valido (minimo 3 caratteri)');
    return;
  }
  
  setCvLoading(true);
  setCvResults(null);
  
  try {
    const response = await axios.post(CROSS_VALIDATE_URL, {
      symbol: formattedSymbol,
      k_folds: cvFolds
    });
    
    setCvResults(response.data);
  } catch (error) {
    console.error('Error running cross-validation:', error);
    setCvResults({
      error: 'Errore durante la cross-validation. ' + 
        (error.response?.data?.error || 'Controlla la console per dettagli.')
    });
  } finally {
    setCvLoading(false);
  }
};

  const handleAnalyze = async () => {
    setLoading(true);
    setShowSpline(true); // Show sphere during loading
    setResults(null); // Reset results when starting new analysis
    setError(null); // Reset any previous errors
    
    try {
      // Set a reasonable max value to avoid timeouts
      const assetsToAnalyze = Math.min(topAssets, 200);
      
      const response = await axios.post(API_URL, {
        top_assets: assetsToAnalyze,
        forecast_threshold: getThresholdValue(forecastThreshold), // valore dinamico
        include_negative: includeNegative,
        quality_filter: useQualityFilter // Nuovo parametro per i filtri di qualità
      }, {
        // Add timeout to prevent long-running requests
        timeout: 200000, // 200 seconds
      });
      
      if (response.data && response.data.assets) {
        setResults(response.data.assets);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error analyzing market:', error);
      
      // More specific error messages
      if (error.code === 'ECONNABORTED') {
        setError('La richiesta è scaduta. Prova con meno asset.');
      } else if (error.response && error.response.status === 500) {
        setError('Errore del server. Il backend potrebbe essere sovraccarico. Prova con meno asset.');
      } else {
        setError('Errore nell\'analisi del mercato. Riprova con meno asset o controlla la connessione.');
      }
      
      setResults([]); // Set empty array in case of error
    } finally {
      setLoading(false);
    }
  };

  // Funzione per visualizzare indicatori di qualità
  const renderQualityIndicators = (asset) => {
    if (!asset.qualityScore && asset.qualityScore !== 0) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
          <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: '#D4AF37' }} />
          Qualità: {asset.qualityScore}/3
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {asset.hasAdxTrend && (
            <Chip
              icon={<Timeline sx={{ fontSize: '0.75rem' }} />}
              label="Trend ADX"
              variant="outlined"
              size="small"
              sx={{ 
                bgcolor: 'rgba(212, 175, 55, 0.1)',
                borderColor: '#D4AF37',
                color: '#D4AF37',
                fontSize: '0.65rem'
              }}
            />
          )}
          {asset.hasRsiSignal && (
            <Chip
              icon={<Speed sx={{ fontSize: '0.75rem' }} />}
              label="Segnale RSI"
              variant="outlined"
              size="small"
              sx={{ 
                bgcolor: 'rgba(212, 175, 55, 0.1)',
                borderColor: '#D4AF37',
                color: '#D4AF37',
                fontSize: '0.65rem'
              }}
            />
          )}
          {asset.hasVolumeSignal && (
            <Chip
              icon={<VolumeUp sx={{ fontSize: '0.75rem' }} />}
              label="Volume Elevato"
              variant="outlined"
              size="small"
              sx={{ 
                bgcolor: 'rgba(212, 175, 55, 0.1)',
                borderColor: '#D4AF37',
                color: '#D4AF37',
                fontSize: '0.65rem'
              }}
            />
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      bgcolor: '#000000', 
      color: '#FFFFFF', 
      minHeight: '100vh', 
      p: { xs: 1.5, sm: 2, md: 3 } // Responsive padding
    }}>
      <Box sx={{ mb: { xs: 2, md: 4 } }}> {/* Responsive margin */}
        <GoldGradientText variant="h4" gutterBottom sx={{ 
          mb: 1, 
          fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' } // Responsive font size
        }}>
          Dove il Tuo Viaggio nel Trading Inizia
        </GoldGradientText>
        <Typography variant="body1" sx={{ color: '#BBBBBB' }}>
          Analizza i migliori asset in trend sul mercato attuale con un potenziale movimento significativo.
        </Typography>
      </Box>
    
      <StyledPaper elevation={4} sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
        mb: { xs: 2, sm: 3, md: 4 } // Responsive margin
      }}>
        <Typography variant="h6" gutterBottom sx={{ 
          color: '#D4AF37', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center',
          fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } // Responsive font size
        }}>
          <GoldBar />
          Scegli il numero di asset da analizzare
        </Typography>
        <Divider sx={{ mb: 3, bgcolor: '#292929' }} />
        
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 1,
            flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile
            gap: { xs: 1, sm: 0 } // Add gap when stacked
          }}>
            <Typography sx={{ 
              color: '#BBBBBB',
              fontSize: { xs: '0.875rem', md: '1rem' } // Responsive font size
            }}>
              Numeri di Asset da Analizzare:
            </Typography>
            <Typography sx={{ 
              color: '#D4AF37', 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', md: '1.5rem' } // Responsive font size  
            }}>
              {topAssets}
            </Typography>
          </Box>
          <GoldSlider
            value={topAssets}
            onChange={(e, newValue) => setTopAssets(newValue)}
            valueLabelDisplay="auto"
            step={10}
            marks={[
              { value: 10, label: '10' },
              { value: 50, label: '50' },
              { value: 100, label: '100' },
              { value: 150, label: '150' },
              { value: MAX_ASSETS, label: `${MAX_ASSETS}` },
            ]}
            min={10}
            max={MAX_ASSETS}
            sx={{ mb: { xs: 2, md: 4 } }} // Responsive margin
          />
          
          {/* Sezione per opzioni aggiuntive */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 2 },
            my: 2 
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeNegative}
                  onChange={(e) => setIncludeNegative(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#D4AF37',
                      '&:hover': {
                        backgroundColor: 'rgba(212, 175, 55, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#D4AF37',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: '#BBBBBB', fontSize: '0.9rem' }}>
                  Includi trend negativi
                </Typography>
              }
            />
            
            {/* Nuova opzione per i filtri di qualità */}
            <FormControlLabel
              control={
                <Switch
                  checked={useQualityFilter}
                  onChange={(e) => setUseQualityFilter(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#D4AF37',
                      '&:hover': {
                        backgroundColor: 'rgba(212, 175, 55, 0.08)',
                      },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#D4AF37',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: '#BBBBBB', fontSize: '0.9rem' }}>
                  Usa filtri di qualità
                </Typography>
              }
            />
          </Box>
          
          {/* Strumenti avanzati */}
          <FormControl variant="outlined" size="small" sx={{ 
            width: '100%', 
            mt: 2,
            mb: 3  // Aggiungi questo margine inferiore di 3 unità
          }}>            
            <InputLabel id="forecast-threshold-label" sx={{ color: '#BBBBBB' }}>
            Sensibilità delle Previsioni
            </InputLabel>
            <Select
              labelId="forecast-threshold-label"
              value={forecastThreshold}
              onChange={(e) => setForecastThreshold(e.target.value)}
              label="Sensibilità delle Previsioni"
              sx={{ 
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#444444',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#D4AF37',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#D4AF37',
                },
              }}
            >
              <MenuItem value="conservative">Conservativo (2%) - Solo movimenti significativi</MenuItem>
              <MenuItem value="balanced">Bilanciato (1%) - Equilibrio affidabilità/opportunità</MenuItem>
              <MenuItem value="aggressive">Aggressivo (0.5%) - Più segnali, possibili falsi positivi</MenuItem>
              </Select>
              <FormHelperText sx={{ color: '#999999' }}>
                Determina la soglia minima di variazione prezzo per considerare un asset
              </FormHelperText>
            </FormControl>
          {/* Strumenti avanzati */}


          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              startIcon={<Assessment />}
              variant="outlined"
              size="small"
              onClick={() => setBackTestOpen(true)}
              sx={{ 
                color: '#D4AF37',
                borderColor: '#D4AF37',
                '&:hover': {
                  borderColor: '#F5E7A3',
                  backgroundColor: 'rgba(212, 175, 55, 0.08)',
                }
              }}
            >
              Backtest
            </Button>
            
            <Button
              startIcon={<Science />}
              variant="outlined"
              size="small"
              onClick={() => setCvOpen(true)}
              sx={{ 
                color: '#D4AF37',
                borderColor: '#D4AF37',
                '&:hover': {
                  borderColor: '#F5E7A3',
                  backgroundColor: 'rgba(212, 175, 55, 0.08)',
                }
              }}
            >
              Cross-Validation
            </Button>
          </Box>
          
          {/* Warning message for high number of assets */}
          {topAssets > 50 && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                color: '#F5E7A3', 
                mb: 2, 
                textAlign: 'center'
              }}
            >
              Avviso: Analizzare più di 50 asset può causare tempi di attesa più lunghi.
            </Typography>
          )}
          
          <GoldButton 
            variant="contained" 
            fullWidth 
            onClick={handleAnalyze}
            disabled={loading}
            size="large"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 1,
              py: { xs: 1.5, md: 2 } // Responsive padding
            }}
          >
            {loading ? <CircularProgress size={24} style={{ color: 'black' }} /> : (
              <>
                <Analytics /> Analizza il Mercato
              </>
            )}
          </GoldButton>
        </Box>
      </StyledPaper>

      {/* Error message display */}
      {error && (
        <StyledPaper elevation={4} sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)'
        }}>
          <Typography sx={{ color: '#F44336' }}>
            {error}
          </Typography>
        </StyledPaper>
      )}

      {/* Spline container - always in DOM but controlled by showSpline */}
      {showSpline && (
        <SplineContainer 
          sx={{ 
            cursor: 'default',
            position: 'relative',
            height: { xs: '300px', sm: '350px', md: '450px' } // Responsive height
          }}
        >
                                <LazySpline
                        scene="https://prod.spline.design/Xo8JSvpgti-beYk3/scene.splinecode"
                        onLoad={handleSplineLoad}
            style={{ 
              width: '100%', 
              height: '100%',
            }}
          />
          {loading && (
            <Typography 
              variant="body1" 
              sx={{ 
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontWeight: 'bold',
                zIndex: 2,
                background: 'linear-gradient(90deg, #D4AF37 0%, #F5E7A3 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                width: '100%',
                textAlign: 'center',
                px: 2
              }}
            >
              Analizzando i Dati di Mercato...
            </Typography>
          )}
        </SplineContainer>
      )}

      {/* Show results only if we've already done an analysis (results !== null) */}
      {results && results.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ 
              color: '#D4AF37', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } // Responsive font size
            }}>
              <GoldBar />
              <TrendingUp sx={{ mr: 1 }} />
              Asset Significativi <span style={{ color: '#D4AF37', marginLeft: '8px' }}>({results.length})</span>
              {stats && (
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    icon={<TrendingUp sx={{ color: '#4CAF50' }} />} 
                    label={`${stats.positive}`} 
                    sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid #4CAF50' }}
                  />
                  <Chip 
                    icon={<TrendingDown sx={{ color: '#F44336' }} />} 
                    label={`${stats.negative}`}
                    sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#F44336', border: '1px solid #F44336' }}
                  />
                  {/* Nuovo chip per contare gli asset di alta qualità */}
                  {stats.highQuality > 0 && (
                    <Chip 
                      icon={<CheckCircle sx={{ color: '#D4AF37' }} />} 
                      label={`${stats.highQuality} Alta Qualità`}
                      sx={{ bgcolor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', border: '1px solid #D4AF37' }}
                    />
                  )}
                </Box>
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 1 }}>
                <InputLabel id="sort-by-label" sx={{ color: '#BBBBBB' }}>Ordina Per</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Ordina Per"
                  sx={{ 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#444444',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D4AF37',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#D4AF37',
                    },
                  }}
                >
                  <MenuItem value="forecastChange">Cambio Previsto</MenuItem>
                  <MenuItem value="currentPrice">Prezzo Attuale</MenuItem>
                  <MenuItem value="rsi">RSI</MenuItem>
                  <MenuItem value="adx">ADX</MenuItem>
                  <MenuItem value="volatility">Volatilità</MenuItem>
                  {useQualityFilter && <MenuItem value="qualityScore">Qualità</MenuItem>}
                </Select>
              </FormControl>
              
              <IconButton 
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                sx={{ color: '#D4AF37' }}
              >
                {sortDirection === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
              </IconButton>
            </Box>
          </Box>
          <Divider sx={{ mb: 3, bgcolor: '#292929' }} />
        </Box>
      )}
      
      {results && results.length > 0 && (
        <Grid container spacing={{ xs: 2, md: 3 }}> {/* Responsive grid spacing */}
          {results
            .slice()
            .sort((a, b) => {
              // Confronta in base al campo selezionato
              const aValue = typeof a[sortBy] === 'number' ? a[sortBy] : parseFloat(a[sortBy] || 0);
              const bValue = typeof b[sortBy] === 'number' ? b[sortBy] : parseFloat(b[sortBy] || 0);
              
              // Moltiplica per -1 se l'ordinamento è discendente
              return sortDirection === 'asc' 
                ? aValue - bValue 
                : bValue - aValue;
            })
            .map((asset, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <StyledCard elevation={4}>
                  {asset.forecastChange > 3 && (
                    <Chip 
                      label="High Potential" 
                      sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: 10,
                        fontWeight: 'bold',
                        bgcolor: 'rgba(46, 125, 50, 0.9)',
                        color: 'white',
                        borderColor: '#4CAF50',
                        fontSize: { xs: '0.65rem', sm: '0.75rem' } // Responsive font size
                      }}
                      variant="outlined"
                    />
                  )}
                  {asset.forecastChange < -3 && (
                    <Chip 
                      label="High Risk" 
                      sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        right: 10,
                        fontWeight: 'bold',
                        bgcolor: 'rgba(244, 67, 54, 0.9)',
                        color: 'white',
                        borderColor: '#F44336',
                        fontSize: { xs: '0.65rem', sm: '0.75rem' } // Responsive font size
                      }}
                      variant="outlined"
                    />
                  )}
                  {useQualityFilter && asset.qualityScore > 0 && (
                    <QualityChip
                      quality={asset.qualityScore}
                      label={`Qualità ${asset.qualityScore}/3`}
                      icon={<CheckCircle sx={{ fontSize: '0.75rem' }} />}
                      variant="outlined"
                    />
                  )}
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}> {/* Responsive padding */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 2
                    }}>
                      <GoldGradientText variant="h6" component="div" sx={{
                        fontSize: { xs: '1.1rem', md: '1.25rem' } // Responsive font size
                      }}>
                        {asset.symbol.split('/')[0]}
                      </GoldGradientText>
                      <Typography variant="body2" sx={{ color: '#888888' }}>
                        {asset.symbol.split('/')[1]}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 2, bgcolor: '#292929' }} />
                    
                    <Typography variant="body2" sx={{ color: '#888888' }} gutterBottom>
                      Prezzo Corrente:
                    </Typography>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: 'white',
                      fontSize: { xs: '1rem', md: '1.25rem' } // Responsive font size
                    }}>
                      {asset.currentPrice} USDT
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                      {asset.forecastChange > 0 ? (
                        <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />
                      ) : (
                        <TrendingDown sx={{ color: '#F44336', mr: 1 }} />
                      )}
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: asset.forecastChange > 0 ? '#4CAF50' : '#F44336',
                          fontSize: { xs: '0.85rem', md: '1rem' } // Responsive font size
                        }}
                      >
                        {asset.forecastChange}% Valore di Previsione
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#888888', mt: 2 }}>
                      Trend: <strong style={{ color: asset.trend === 'Positivo' ? '#4CAF50' : asset.trend === 'Negativo' ? '#F44336' : 'white' }}>
                        {asset.trend}
                      </strong>
                    </Typography>
                    
                    {/* Aggiungi indicatori supplementari */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ color: '#888888' }}>
                        Indicatori:
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        {asset.rsi && (
                          <Grid item xs={6}>
                            <Box sx={{ 
                              bgcolor: '#151515', 
                              p: 1, 
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <Typography variant="caption" sx={{ color: '#AAAAAA' }}>RSI:</Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: asset.rsi > 70 ? '#F44336' : asset.rsi < 30 ? '#4CAF50' : '#FFFFFF'
                                }}
                              >
                                {asset.rsi}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {asset.adx && (
                          <Grid item xs={6}>
                            <Box sx={{ 
                              bgcolor: '#151515', 
                              p: 1, 
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <Typography variant="caption" sx={{ color: '#AAAAAA' }}>ADX:</Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: asset.adx > 25 ? '#4CAF50' : '#FFFFFF'
                                }}
                              >
                                {asset.adx}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {asset.volatility && (
                          <Grid item xs={6}>
                            <Box sx={{ 
                              bgcolor: '#151515', 
                              p: 1, 
                              borderRadius: 1,
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <Typography variant="caption" sx={{ color: '#AAAAAA' }}>Vol:</Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: asset.volatility > 2 ? '#F44336' : '#FFFFFF'
                                }}
                              >
                                {asset.volatility}%
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                    
                    {/* Visualizza indicatori di qualità quando useQualityFilter è attivo */}
                    {useQualityFilter && renderQualityIndicators(asset)}
                    
                    {/* Aggiungi bottoni per azioni avanzate */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Button 
                        size="small" 
                        sx={{ 
                          color: '#D4AF37',
                          fontSize: '0.7rem'
                        }}
                        onClick={() => {
                          setBackTestSymbol(asset.symbol);
                          setBackTestOpen(true);
                        }}
                      >
                        Backtest
                      </Button>
                      <Button 
                        size="small" 
                        sx={{ 
                          color: '#D4AF37',
                          fontSize: '0.7rem'
                        }}
                        onClick={() => {
                          setCvSymbol(asset.symbol);
                          setCvOpen(true);
                        }}
                      >
                        Validation
                      </Button>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
        </Grid>
      )}
      
      {/* Show "No results" only if analysis has been completed but there are no results */}
      {results !== null && results.length === 0 && !loading && !error && (
        <StyledPaper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#888888' }}>
            Nessun Risultato Da Visualizzare. {useQualityFilter ? 
              'Prova a disattivare i filtri di qualità o aumentare il numero di asset.' : 
              'Aumenta i valori da analizzare per vedere gli asset Potenziali.'}
          </Typography>
        </StyledPaper>
      )}
      
      {/* Dialog per il Backtest */}
      <Dialog 
        open={backTestOpen} 
        onClose={() => setBackTestOpen(false)}
        maxWidth="md" // Cambia da "md" a "lg"
        fullWidth={true} // Aggiungi questa proprietà
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            color: '#FFFFFF',
            border: '1px solid #D4AF37',
          }
        }}
        
      >
        <DialogTitle sx={{ color: '#D4AF37', display: 'flex', alignItems: 'center' }}>
          <Assessment sx={{ mr: 1 }} /> Backtest su Asset
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#121212' }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Simbolo (es. BTC o BTC/USDT)"
              value={backTestSymbol}
              onChange={(e) => setBackTestSymbol(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              helperText="Inserisci il simbolo. "
              InputLabelProps={{ sx: { color: '#BBBBBB' } }}
              InputProps={{ 
                sx: { 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#444444',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D4AF37',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D4AF37',
                  },
                }
              }}
            />
            
            <Typography variant="body2" sx={{ color: '#BBBBBB', mt: 2 }}>
              Giorni di lookback:
            </Typography>
            <GoldSlider
              value={backTestLookback}
              onChange={(e, newValue) => setBackTestLookback(newValue)}
              valueLabelDisplay="auto"
              step={5}
              marks={[
                { value: 10, label: '10' },
                { value: 30, label: '30' },
                { value: 60, label: '60' },
              ]}
              min={5}
              max={60}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" sx={{ color: '#BBBBBB', mt: 2 }}>
              Giorni di previsione:
            </Typography>
            <GoldSlider
              value={backTestPrediction}
              onChange={(e, newValue) => setBackTestPrediction(newValue)}
              valueLabelDisplay="auto"
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
              ]}
              min={1}
              max={10}
              sx={{ mb: 3 }}
            />
            
            <GoldButton 
              variant="contained" 
              fullWidth 
              onClick={handleBacktest}
              disabled={backTestLoading}
              size="large"
            >
              {backTestLoading ? <CircularProgress size={24} style={{ color: 'black' }} /> : 'Esegui Backtest'}
            </GoldButton>
          </Box>
          
          {backTestLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress sx={{ color: '#D4AF37' }} />
            </Box>
          )}
          
          {backTestResults && backTestResults.success && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#90CAF9' }}>
                <AlertTitle>Risultati Backtest per {backTestResults.symbol}</AlertTitle>
                <Typography variant="body2">
                  <strong>Precisione di direzione:</strong> {backTestResults.direction_accuracy.toFixed(2)}%
                </Typography>
                <Typography variant="body2">
                  <strong>Errore medio:</strong> {backTestResults.avg_error_pct.toFixed(2)}%
                </Typography>
                <Typography variant="body2">
                  <strong>Periodi testati:</strong> {backTestResults.periods_tested}
                </Typography>
              </Alert>
              
              <Typography variant="body2" sx={{ color: '#BBBBBB', mb: 1 }}>
                Risultati dettagliati:
              </Typography>
              
              <Box sx={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                bgcolor: '#1E1E1E',
                p: 2,
                borderRadius: 1
              }}>
                {backTestResults.detailed_results.map((result, idx) => (
                  <Box key={idx} sx={{ 
                    mb: 1, 
                    p: 1, 
                    borderLeft: '3px solid', 
                    borderColor: result.correct_direction ? '#4CAF50' : '#F44336',
                    bgcolor: 'rgba(18, 18, 18, 0.8)'
                  }}>
                    <Typography variant="caption" sx={{ display: 'block', color: '#AAAAAA' }}>
                      Periodo {result.period}:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                      Previsione: {result.forecast_change_pct.toFixed(2)}% | 
                      Reale: {result.real_change_pct.toFixed(2)}% | 
                      Errore: {result.error_margin_pct.toFixed(2)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {backTestResults && backTestResults.error && (
            <Alert severity="error" sx={{ mt: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#F44336' }}>
              {backTestResults.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#121212' }}>
          <Button onClick={() => setBackTestOpen(false)} sx={{ color: '#BBBBBB' }}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per Cross-Validation */}
      <Dialog 
        open={cvOpen} 
        onClose={() => setCvOpen(false)}
        maxWidth="md" // Imposta a "lg"
        fullWidth={true}
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            color: '#FFFFFF',
            border: '1px solid #D4AF37',
            minWidth: '800px', // Imposta una larghezza minima

          }
        }}
      >
        <DialogTitle sx={{ color: '#D4AF37', display: 'flex', alignItems: 'center' }}>
          <Science sx={{ mr: 1 }} /> Cross-Validation del Modello
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#121212' }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Simbolo (es. BTC o BTC/USDT)"
              value={cvSymbol}
              onChange={(e) => setCvSymbol(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              helperText="Inserisci il simbolo. Verrà convertito automaticamente in formato BTC/USDT"
              InputLabelProps={{ sx: { color: '#BBBBBB' } }}
              InputProps={{ 
                sx: { 
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#444444',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D4AF37',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D4AF37',
                  },
                }
              }}
            />
            
            <Typography variant="body2" sx={{ color: '#BBBBBB', mt: 2 }}>
              Numero di fold (k):
            </Typography>
            <GoldSlider
              value={cvFolds}
              onChange={(e, newValue) => setCvFolds(newValue)}
              valueLabelDisplay="auto"
              step={1}
              marks={[
                { value: 3, label: '3' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
              ]}
              min={3}
              max={10}
              sx={{ mb: 3 }}
            />
            
            <GoldButton 
              variant="contained" 
              fullWidth 
              onClick={handleCrossValidation}
              disabled={cvLoading}
              size="large"
            >
              {cvLoading ? <CircularProgress size={24} style={{ color: 'black' }} /> : 'Esegui Validation'}
            </GoldButton>
          </Box>
          
          {cvLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress sx={{ color: '#D4AF37' }} />
            </Box>
          )}
          
          {cvResults && cvResults.success && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#90CAF9' }}>
                <AlertTitle>Risultati Validation per {cvResults.symbol}</AlertTitle>
                <Typography variant="body2">
                  <strong>Precisione di direzione:</strong> {cvResults.direction_accuracy.toFixed(2)}%
                </Typography>
                <Typography variant="body2">
                  <strong>RMSE:</strong> {cvResults.rmse.toFixed(6)}
                </Typography>
              </Alert>
              
              <Typography variant="body2" sx={{ color: '#BBBBBB', mb: 1 }}>
                Metriche dettagliate:
              </Typography>
              
              <Box sx={{ 
                bgcolor: '#1E1E1E',
                p: 2,
                borderRadius: 1
              }}>
                {cvResults.results && cvResults.results.avg_scores && Object.entries(cvResults.results.avg_scores).map(([key, value]) => (
                  <Box key={key} sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.5,
                    borderBottom: '1px solid #333'
                  }}>
                    <Typography variant="caption" sx={{ color: '#AAAAAA' }}>
                      {key}:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
                      {typeof value === 'number' ? value.toFixed(6) : value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {cvResults && cvResults.error && (
            <Alert severity="error" sx={{ mt: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#F44336' }}>
              {cvResults.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#121212' }}>
          <Button onClick={() => setCvOpen(false)} sx={{ color: '#BBBBBB' }}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MarketScanner;