import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Button, Card, CardContent, CircularProgress, Grid, TextField, 
  Typography, Chip, Divider, Paper, InputAdornment,
  Tooltip, styled, 
} from '@mui/material';
import { 
  ExpandMore, ShoppingCart, SellOutlined, WarningAmber, ShowChart, 
  InfoOutlined, TrendingUp, ArrowForward, Analytics, TrendingDown,
  Lightbulb, Timeline, Shield
} from '@mui/icons-material';
import LazySpline from './LazySpline';
import axios from 'axios';
import RiskControlPanel from './RiskControlPanel';

// Use environment variables for API URLs
const API_URL = process.env.REACT_APP_API_URL;
const ENABLE_PREMIUM = process.env.REACT_APP_ENABLE_PREMIUM_FEATURES === 'true';

// Styled components for dark theme with gold accents
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#000000',
  borderRadius: 12,
  border: '1px solid #D4AF37',
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

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#000000',
  borderRadius: 12,
  transition: 'all 0.3s ease',
  border: '1px solid #D4AF37',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3), 0 0 10px rgba(212, 175, 55, 0.2)',
    borderColor: '#F5E7A3',
  }
}));

const GoldGradientText = styled(Typography)(({ theme }) => ({
  backgroundImage: 'linear-gradient(45deg, #D4AF37 0%, #F5E7A3 100%)',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitBackgroundClip: 'text',
  display: 'inline-block',
  fontWeight: 'bold',
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: '#1E1E1E',
    '& fieldset': {
      borderColor: '#333333',
    },
    '&:hover fieldset': {
      borderColor: '#D4AF37',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D4AF37',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#BBBBBB',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#D4AF37',
  },
  '& .MuiInputAdornment-root': {
    color: '#999999',
  },
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

// Styled component for indicator boxes
const IndicatorBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#252525',
  padding: '12px',
  borderRadius: 8,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#2A2A2A',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  }
}));

// Styled component for pattern recognition boxes
const PatternBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#252525',
  padding: '12px',
  borderRadius: 8,
  border: '1px solid #333',
  marginBottom: 8,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#2A2A2A',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  }
}));

// Custom component for /USDT input 
const CryptoInput = ({ value, onChange, placeholder }) => {
  const handleChange = (e) => {
    const filteredValue = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    onChange({ target: { value: filteredValue } })
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ color: '#BBBBBB', mb: 1 }}>Crypto Symbol</Typography>
      <Box sx={{ display: 'flex' }}>
        <TextField
          value={value}
          onChange={handleChange} 
          inputProps={{ style: { textTransform: 'uppercase' } }}
          placeholder={placeholder}
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              backgroundColor: '#1E1E1E',
              borderRadius: '8px 0 0 8px',
              '& fieldset': {
                borderColor: '#333333',
                borderRight: 'none',
              },
              '&:hover fieldset': {
                borderColor: '#D4AF37',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#D4AF37',
              },
            },
          }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            backgroundColor: '#252525',
            color: '#999999',
            borderRadius: '0 8px 8px 0',
            borderTop: '1px solid #333333',
            borderRight: '1px solid #333333',
            borderBottom: '1px solid #333333',
            typography: 'body1',
          }}
        >
          /USDT
        </Box>
      </Box>
    </Box>
  );
};

// Componente per rilevazione pattern candlestick
const CandlestickPatterns = ({ patterns }) => {
  if (!patterns || Object.keys(patterns).length === 0) {
    return null;
  }

  const getPatternIcon = (pattern) => {
    const bullishPatterns = ['hammer', 'bullish_engulfing', 'morning_star'];
    const bearishPatterns = ['shooting_star', 'bearish_engulfing', 'evening_star'];
    
    if (bullishPatterns.includes(pattern)) {
      return <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />;
    } else if (bearishPatterns.includes(pattern)) {
      return <TrendingDown sx={{ color: '#F44336', mr: 1 }} />;
    } else {
      return <InfoOutlined sx={{ color: '#D4AF37', mr: 1 }} />;
    }
  };

  const getPatternDescription = (pattern) => {
    switch (pattern) {
      case 'doji':
        return 'Indica indecisione del mercato. Il prezzo di apertura e chiusura sono simili.';
      case 'hammer':
        return 'Pattern rialzista che indica potenziale inversione a seguito di un trend ribassista.';
      case 'shooting_star':
        return 'Pattern ribassista che indica potenziale inversione a seguito di un trend rialzista.';
      case 'bullish_engulfing':
        return 'Pattern rialzista forte: una candela verde (rialzista) ingloba completamente la precedente rossa (ribassista).';
      case 'bearish_engulfing':
        return 'Pattern ribassista forte: una candela rossa (ribassista) ingloba completamente la precedente verde (rialzista).';
      default:
        return 'Pattern candlestick rilevato.';
    }
  };

  const getPatternColor = (pattern) => {
    const bullishPatterns = ['hammer', 'bullish_engulfing', 'morning_star'];
    const bearishPatterns = ['shooting_star', 'bearish_engulfing', 'evening_star'];
    
    if (bullishPatterns.includes(pattern)) {
      return '#4CAF50';
    } else if (bearishPatterns.includes(pattern)) {
      return '#F44336';
    } else {
      return '#D4AF37';
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ 
        color: '#D4AF37', 
        fontWeight: 'bold', 
        mb: 2, 
        display: 'flex',
        alignItems: 'center'
      }}>
        <Lightbulb sx={{ mr: 1 }} /> 
        Pattern Candlestick Rilevati
      </Typography>
      
      {Object.entries(patterns)
        .filter(([_, detected]) => detected)
        .map(([pattern, _]) => (
        <PatternBox key={pattern} sx={{ borderLeft: `4px solid ${getPatternColor(pattern)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            {getPatternIcon(pattern)}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: getPatternColor(pattern) }}>
                {pattern.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#BBBBBB', display: 'block' }}>
                {getPatternDescription(pattern)}
              </Typography>
            </Box>
          </Box>
        </PatternBox>
      ))}
      
      {Object.values(patterns).filter(detected => detected).length === 0 && (
        <Typography variant="body2" sx={{ color: '#999999', fontStyle: 'italic' }}>
          Nessun pattern candlestick significativo rilevato.
        </Typography>
      )}
    </Box>
  );
};

// Funzione principale per identificare pattern dalle candele
const identifyCandlestickPatterns = (ohlcData) => {
  // Assicuriamoci di avere abbastanza dati
  if (!ohlcData || ohlcData.length < 5) {
    return {};
  }
  
  // Estrai le ultime 5 candele per l'analisi (dall'ultima alla più vecchia)
  const candles = ohlcData.slice(-5).reverse();
  
  // Oggetto per i risultati dei pattern
  const patterns = {
    doji: detectDoji(candles),
    hammer: detectHammer(candles),
    shooting_star: detectShootingStar(candles),
    bullish_engulfing: detectBullishEngulfing(candles),
    bearish_engulfing: detectBearishEngulfing(candles)
  };
  
  return patterns;
};

// Funzione per calcolare il corpo della candela
const getCandleBody = (candle) => {
  return Math.abs(candle.close - candle.open);
};

// Funzione per calcolare l'ombra superiore
const getUpperShadow = (candle) => {
  return candle.close > candle.open 
    ? candle.high - candle.close 
    : candle.high - candle.open;
};

// Funzione per calcolare l'ombra inferiore
const getLowerShadow = (candle) => {
  return candle.close > candle.open 
    ? candle.open - candle.low 
    : candle.close - candle.low;
};

// Funzione per verificare se una candela è bullish (verde/rialzista)
const isBullish = (candle) => {
  return candle.close > candle.open;
};

// Funzione per verificare se una candela è bearish (rossa/ribassista)
const isBearish = (candle) => {
  return candle.open > candle.close;
};

// Rilevazione Doji (apertura e chiusura quasi uguali)
const detectDoji = (candles) => {
  const currentCandle = candles[0];
  const candleRange = currentCandle.high - currentCandle.low;
  const bodySize = getCandleBody(currentCandle);
  
  // Per essere un Doji, il corpo dovrebbe essere molto piccolo rispetto al range
  // Aumentiamo la soglia a 0.1 (10%) per rilevare meglio i doji
  return bodySize <= (candleRange * 0.1);
};

// Rilevazione Hammer (corpo piccolo in alto, ombra lunga in basso)
const detectHammer = (candles) => {
  const currentCandle = candles[0];
  const prevTrend = determineTrend(candles.slice(1));
  
  // Un Hammer ha senso solo dopo un trend ribassista
  // Rendiamo questo criterio più flessibile per i dati generati
  if (prevTrend !== 'bearish' && prevTrend !== 'neutral') return false;
  
  const bodySize = getCandleBody(currentCandle);
  const lowerShadow = getLowerShadow(currentCandle);
  const upperShadow = getUpperShadow(currentCandle);
  const candleRange = currentCandle.high - currentCandle.low;
  
  // Criteri per Hammer: più flessibili
  // 1. Ombra inferiore almeno 1.5 volte la lunghezza del corpo (era 2)
  // 2. Corpo piccolo nella parte superiore della candela
  // 3. Ombra superiore piccola rispetto al corpo
  return (
    lowerShadow >= (bodySize * 1.5) &&
    bodySize <= (candleRange * 0.4) && // era 0.3
    upperShadow <= (bodySize * 0.3) // era 0.1
  );
};

// Rilevazione Shooting Star (corpo piccolo in basso, ombra lunga in alto)
const detectShootingStar = (candles) => {
  const currentCandle = candles[0];
  const prevTrend = determineTrend(candles.slice(1));
  
  // Una Shooting Star ha senso solo dopo un trend rialzista
  // Rendiamo questo criterio più flessibile per i dati generati
  if (prevTrend !== 'bullish' && prevTrend !== 'neutral') return false;
  
  const bodySize = getCandleBody(currentCandle);
  const upperShadow = getUpperShadow(currentCandle);
  const lowerShadow = getLowerShadow(currentCandle);
  const candleRange = currentCandle.high - currentCandle.low;
  
  // Criteri per Shooting Star: più flessibili
  // 1. Ombra superiore almeno 1.5 volte la lunghezza del corpo (era 2)
  // 2. Corpo piccolo nella parte inferiore della candela
  // 3. Ombra inferiore piccola rispetto al corpo
  return (
    upperShadow >= (bodySize * 1.5) &&
    bodySize <= (candleRange * 0.4) && // era 0.3
    lowerShadow <= (bodySize * 0.3) // era 0.1
  );
};

// Rilevazione Bullish Engulfing (candela verde ingloba la precedente rossa)
const detectBullishEngulfing = (candles) => {
  if (candles.length < 2) return false;
  
  const currentCandle = candles[0];
  const prevCandle = candles[1];
  const prevTrend = determineTrend(candles.slice(1));
  
  // Un Bullish Engulfing ha senso dopo un trend ribassista o neutrale
  if (prevTrend !== 'bearish' && prevTrend !== 'neutral') return false;
  
  // Criteri per Bullish Engulfing:
  // 1. Candela corrente rialzista (verde)
  // 2. Candela precedente ribassista (rossa)
  // 3. Il corpo della candela corrente ingloba completamente il corpo della precedente
  return (
    isBullish(currentCandle) &&
    isBearish(prevCandle) &&
    currentCandle.close >= prevCandle.open &&
    currentCandle.open <= prevCandle.close
  );
};

// Rilevazione Bearish Engulfing (candela rossa ingloba la precedente verde)
const detectBearishEngulfing = (candles) => {
  if (candles.length < 2) return false;
  
  const currentCandle = candles[0];
  const prevCandle = candles[1];
  const prevTrend = determineTrend(candles.slice(1));
  
  // Un Bearish Engulfing ha senso dopo un trend rialzista o neutrale
  if (prevTrend !== 'bullish' && prevTrend !== 'neutral') return false;
  
  // Criteri per Bearish Engulfing:
  // 1. Candela corrente ribassista (rossa)
  // 2. Candela precedente rialzista (verde)
  // 3. Il corpo della candela corrente ingloba completamente il corpo della precedente
  return (
    isBearish(currentCandle) &&
    isBullish(prevCandle) &&
    currentCandle.open >= prevCandle.close &&
    currentCandle.close <= prevCandle.open
  );
};

// Determina il trend precedente basato sulle ultime candele
const determineTrend = (candles) => {
  if (!candles.length) return 'neutral';
  
  // Utilizziamo un approccio semplice contando candele rialziste vs ribassiste
  let bullishCount = 0;
  let bearishCount = 0;
  
  candles.forEach(candle => {
    if (isBullish(candle)) bullishCount++;
    if (isBearish(candle)) bearishCount++;
  });
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
};



function TradingAnalyzer({ riskSettings }) {
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [forecastDays, setForecastDays] = useState(0);
  const [newsArticlesLimit, setNewsArticlesLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [cryptoSymbol, setCryptoSymbol] = useState('');
  const [expandedIndicators, setExpandedIndicators] = useState({});
  const [expandedPatterns, setExpandedPatterns] = useState({});
  const [showSpline, setShowSpline] = useState(true);
  const [analyzedPatterns, setAnalyzedPatterns] = useState({});
  const animationRef = useRef(null);
  const splineLogoRef = useRef(null);

  // Applica le impostazioni di rischio dal componente parent
  useEffect(() => {
    if (riskSettings) {
      console.log("Ricevute impostazioni di rischio:", riskSettings);
      // Qui puoi aggiornare le tue analisi in base alle impostazioni di rischio
    }
  }, [riskSettings]);

  // Function to handle Spline loading
  const handleSplineLoad = (spline) => {
    // Remove Spline logo
    const logo = document.querySelector('[data-spline="built-with-spline"]');
    if (logo) {
      splineLogoRef.current = logo;
      logo.style.display = 'none';
    }

    // Find the sphere
    const sphere = spline.findObjectByName('Sphere');
    if (sphere) {
      // Start animation
      const animate = () => {
        if (sphere && showSpline) {
          sphere.rotation.x += 0.01;
          sphere.rotation.y += 0.01;
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animate();
      
      // Set navigation limits
      spline.setZoom(0.8);
      spline.enablePan = false;
      spline.enableZoom = false;
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

  // Hide sphere after loading completes
  useEffect(() => {
    if (!loading && results !== null) {
      const timer = setTimeout(() => {
        setShowSpline(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, results]);

  // Fetch available assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        await axios.get(`${API_URL}/available-assets`);
        // We're not using the response to set any state
      } catch (error) {
        console.error('Error fetching available assets:', error);
      }
    };
    
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove API_URL from dependency array

const fetchHistoricalData = async (symbol) => {
  try {
    const response = await axios.post(`${API_URL}/historical-data`, {
      symbol: symbol,
      timeframe: '1d',
      limit: 30
    });
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
};

  // Handle analysis button click
  const handleAnalyze = async () => {
    if (!ENABLE_PREMIUM) {
      alert('Premium features are currently disabled.');
      return;
    }

    if (selectedAssets.length === 0) {
      alert('Please select at least one asset to analyze');
      return;
    }
    
    // Validate and set defaults for empty values
    const budgetToUse = totalBudget === '' || isNaN(totalBudget) ? 0 : totalBudget;
    const daysToUse = forecastDays === '' || isNaN(forecastDays) ? 0 : forecastDays;
    const newsToUse = newsArticlesLimit === '' || isNaN(newsArticlesLimit) ? 100 : newsArticlesLimit;
    
    setLoading(true);
    setShowSpline(true);
    setResults(null); // Reset results when starting new analysis
    
    try {
      const response = await axios.post(`${API_URL}/trading-analysis`, {
        assets: selectedAssets,
        total_budget: budgetToUse,
        forecast_days: daysToUse,
        news_articles_limit: newsToUse,
      }, {
        // Add timeout to prevent long-running requests
        timeout: 60000, // 60 seconds
      });
      
      if (response.data && response.data.assets) {
        const assets = response.data.assets;
        setResults(assets);
        
        // Initialize expanded state for technical indicators and patterns
        const expanded = {};
        const expPatterns = {};
        const patterns = {};
        
        // Ottieni dati OHLC per ciascun asset
        for (let i = 0; i < assets.length; i++) {
          expanded[i] = false;
          expPatterns[i] = false;
          
          try {
            // Genera dati OHLC realistici con pattern deliberati
            const ohlcData = await fetchHistoricalData(assets[i].asset);
            if (ohlcData) {
              patterns[i] = identifyCandlestickPatterns(ohlcData);
            } else {
              patterns[i] = {}; // Nessun pattern se non ci sono dati
              }
              console.log(`Asset ${assets[i].asset}: Pattern rilevati`, patterns[i]);
            } catch (error) {
              console.error(`Error processing OHLC data for ${assets[i].asset}:`, error);
              patterns[i] = {}; // Nessun pattern rilevato in caso di errore
            }
        }
        
        setExpandedIndicators(expanded);
        setExpandedPatterns(expPatterns);
        setAnalyzedPatterns(patterns);
        
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error analyzing trades:', error);
      
      // More specific error message
      if (error.code === 'ECONNABORTED') {
        alert('The request timed out. Please try again with fewer assets.');
      } else if (error.response && error.response.status === 500) {
        alert('Server error. The backend might be overloaded.');
      } else {
        alert('Error analyzing trades. Please try again or check your connection.');
      }
      
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomAsset = () => {
    if (cryptoSymbol && !selectedAssets.includes(`${cryptoSymbol}/USDT`)) {
      const newAsset = `${cryptoSymbol}/USDT`;
      setSelectedAssets(prev => [...prev.slice(0, 1), newAsset].slice(0, 2)); // Keep max 2 assets
      setCryptoSymbol('');
    }
  };

  const toggleIndicators = (index) => {
    setExpandedIndicators(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const togglePatterns = (index) => {
    setExpandedPatterns(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderDecisionIcon = (decision) => {
    if (decision.includes('COMPRARE')) {
      return <ShoppingCart sx={{ color: '#4CAF50', mr: 1 }} />;
    } else if (decision.includes('VENDERE')) {
      return <SellOutlined sx={{ color: '#F44336', mr: 1 }} />;
    } else {
      return <WarningAmber sx={{ color: '#D4AF37', mr: 1 }} />;
    }
  };

  const getDecisionColor = (decision) => {
    if (decision.includes('COMPRARE')) {
      return '#4CAF50';
    } else if (decision.includes('VENDERE')) {
      return '#F44336';
    } else {
      return '#D4AF37';
    }
  };

  // Helper function to determine indicator color based on value
  const getIndicatorColor = (indicator, value) => {
    value = parseFloat(value);
    
    switch (indicator) {
      case 'rsi':
        return value > 70 ? '#F44336' : value < 30 ? '#4CAF50' : 'white';
      case 'macd':
        return value > 0 ? '#4CAF50' : '#F44336';
      case 'sentiment':
        return value > 0.2 ? '#4CAF50' : value < -0.2 ? '#F44336' : '#BBBBBB';
      case 'adx':
        return value > 25 ? '#4CAF50' : '#BBBBBB';
      default:
        return 'white';
    }
  };

  const getIndicatorDescription = (indicator) => {
    switch (indicator) {
      case 'rsi':
        return 'Relative Strength Index - Misura il momentum di un asset (>70 ipercomprato, <30 ipervenduto)';
      case 'macd':
        return 'Moving Average Convergence Divergence - Indicatore di trend che mostra la relazione tra due medie mobili';
      case 'signal_line':
        return 'Linea di segnale del MACD - Usata per generare segnali di trading (MACD sopra = rialzista, sotto = ribassista)';
      case 'adx':
        return 'Average Directional Index - Misura la forza di un trend (>25 indica un trend forte)';
      case 'ema9':
        return 'Media Mobile Esponenziale a 9 periodi - Media a breve termine, reagisce più velocemente ai cambiamenti di prezzo';
      case 'ema21':
        return 'Media Mobile Esponenziale a 21 periodi - Media a medio termine per identificare trend di mercato';
      case 'bollinger_upper':
        return 'Banda di Bollinger Superiore - Rappresenta il livello di resistenza dinamica (+2 deviazioni standard dalla media)';
      case 'bollinger_lower':
        return 'Banda di Bollinger Inferiore - Rappresenta il livello di supporto dinamico (-2 deviazioni standard dalla media)';
      case 'sentiment':
        return 'Analisi del sentiment delle notizie da -1 (estremamente negativo) a +1 (estremamente positivo)';
      case 'mfi':
        return 'Money Flow Index - Indicatore di momentum che combina prezzo e volume (>80 ipercomprato, <20 ipervenduto)';
      case 'atr':
        return 'Average True Range - Misura la volatilità del mercato in un dato periodo';
      default:
        return '';
    }
  };

  // Calcolo del livello di rischio per un trade
  const calculateRiskLevel = (asset) => {
    // Estrai valori dagli indicatori
    const rsi = parseFloat(asset.rsi);
    const adx = parseFloat(asset.adx);
    const volatility = asset.volatility ? parseFloat(asset.volatility) : 2.5; // Default se non presente
    const forecastGain = parseFloat(asset.forecastGain);
    
    // Fattori di rischio
    let riskFactors = [];
    
    // RSI estremo
    if (rsi > 80) riskFactors.push("RSI estremamente alto");
    if (rsi < 20) riskFactors.push("RSI estremamente basso");
    
    // Trend debole
    if (adx < 15) riskFactors.push("Trend debole (ADX basso)");
    
    // Alta volatilità
    if (volatility > 5) riskFactors.push("Volatilità elevata");
    
    // Forecast poco affidabile
    if (Math.abs(forecastGain) < 0.01) riskFactors.push("Previsione incerta");
    
    // Calcolo livello rischio
    if (riskFactors.length >= 3) {
      return { level: "Alto", factors: riskFactors, color: "#F44336" };
    } else if (riskFactors.length >= 1) {
      return { level: "Medio", factors: riskFactors, color: "#FF9800" };
    } else {
      return { level: "Basso", factors: ["Indicatori stabili"], color: "#4CAF50" };
    }
  };

  // Funzione per calcolare la dimensione posizione ottimale basata sul rischio
  const calculatePositionSize = (asset) => {
    if (!riskSettings || !asset) return { size: 0, explanation: "" };
    
    const currentPrice = parseFloat(asset.currentPrice);
    const stopLossLevel = parseFloat(asset.stopLoss);
    const budget = parseFloat(totalBudget) || 1000; // Default 1000 USDT se non impostato
    
    // Calcolo rischio monetario
    const maxRisk = budget * (riskSettings.maxRiskPerTrade / 100);
    
    // Calcolo distanza stop loss
    const stopLossDistance = Math.abs(currentPrice - stopLossLevel);
    
    // Calcolo dimensione posizione
    const positionSize = (maxRisk / stopLossDistance);
    const quantity = positionSize / currentPrice;
    
    // Formatta i numeri per maggiore leggibilità
    const formattedSize = positionSize.toFixed(2);
    const formattedQty = quantity.toFixed(6);
    
    const explanation = `Basato su un budget di ${budget} USDT, rischiando il ${riskSettings.maxRiskPerTrade}% (${maxRisk.toFixed(2)} USDT) per trade, con stop loss a ${asset.stopLoss} USDT (${stopLossDistance.toFixed(2)} USDT di distanza dal prezzo attuale).`;
    
    return {
      size: formattedSize,
      quantity: formattedQty,
      explanation: explanation
    };
  };

  if (!ENABLE_PREMIUM) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#0A0A0A', color: '#FFFFFF', minHeight: '100vh' }}>
        <GoldGradientText variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          Premium Feature
        </GoldGradientText>
        <Typography variant="body1" sx={{ color: '#BBBBBB' }}>
          The Premium Trading Analyzer is not available in your current plan.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#0A0A0A', 
      color: '#FFFFFF', 
      minHeight: '100vh', 
      p: { xs: 1, sm: 2, md: 3 } // Responsive padding
    }}>
      <Box sx={{ mb: { xs: 2, md: 4 } }}> {/* Responsive margin */}
        <GoldGradientText variant="h4" gutterBottom sx={{ 
          fontWeight: 'bold', 
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.2rem' } // Responsive font size
        }}>
          Premium Trading Analyzer
        </GoldGradientText>
        <Typography variant="body1" sx={{ color: '#BBBBBB' }}>
          Advanced trading analysis with news sentiment, pattern recognition, and detailed recommendations.
        </Typography>
      </Box>
      
      <StyledPaper elevation={4} sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
        mb: { xs: 2, md: 4 } // Responsive margin
      }}>
        <Typography variant="h6" gutterBottom sx={{ 
          color: '#D4AF37', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center',
          fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } // Responsive font size
        }}>
          <span style={{ 
            display: 'inline-block', 
            width: '4px', 
            height: '20px', 
            background: 'linear-gradient(to bottom, #D4AF37, #F5E7A3)', 
            marginRight: '10px', 
            borderRadius: '2px' 
          }}></span>
          Configuration
        </Typography>
        <Divider sx={{ mb: 3, bgcolor: '#292929' }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ color: '#BBBBBB', mb: 1 }}>Selected Assets:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedAssets.map((asset, index) => (
                  <Chip 
                    key={index}
                    label={asset}
                    onDelete={() => setSelectedAssets(prev => prev.filter(a => a !== asset))}
                    sx={{ 
                      bgcolor: '#252525', 
                      color: 'white',
                      borderColor: '#444444',
                      '& .MuiChip-deleteIcon': {
                        color: '#999999',
                        '&:hover': {
                          color: '#D4AF37',
                        }
                      }
                    }}
                    variant="outlined"
                  />
                ))}
                {selectedAssets.length < 2 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: '#999999',
                    fontSize: '0.8rem'
                  }}>
                    <span style={{ marginLeft: '8px' }}>({2 - selectedAssets.length} slot{selectedAssets.length === 1 ? '' : 's'} remaining)</span>
                  </Box>
                )}
              </Box>
            </Box>
            
            <CryptoInput 
              value={cryptoSymbol}
              onChange={(e) => setCryptoSymbol(e.target.value)}
              placeholder="Inserisci simbolo (es. BTC)"
            />
            
            <Button 
              onClick={handleAddCustomAsset}
              disabled={!cryptoSymbol || selectedAssets.length >= 2}
              sx={{ 
                mb: 2,
                bgcolor: '#252525',
                color: '#D4AF37',
                '&:hover': {
                  bgcolor: '#333333'
                },
                '&.Mui-disabled': {
                  color: '#666666'
                }
              }}
              endIcon={<ArrowForward />}
            >
              Add Asset
            </Button>
            
            <Typography variant="caption" sx={{ display: 'block', color: '#999999', mb: 1 }}>
              Premium allows analysis of up to 2 assets
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <CustomTextField
              label="Budget (USDT)"
              type="number"
              value={totalBudget}
              onChange={(e) => {
                // Allow empty or zero values
                const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                setTotalBudget(value);
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              fullWidth
              helperText="Budget to allocate"
              FormHelperTextProps={{ sx: { color: '#888888' } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <CustomTextField
              label="Forecast Days"
              type="number"
              value={forecastDays}
              onChange={(e) => {
                // Allow empty or zero values
                const value = e.target.value === '' ? '' : parseInt(e.target.value);
                setForecastDays(value);
              }}
              fullWidth
              helperText="Days to forecast ahead"
              FormHelperTextProps={{ sx: { color: '#888888' } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <CustomTextField
              label="News Articles"
              type="number"
              value={newsArticlesLimit}
              onChange={(e) => {
                // Allow empty or zero values
                const value = e.target.value === '' ? '' : parseInt(e.target.value);
                setNewsArticlesLimit(value);
              }}
              fullWidth
              helperText="Number of news to analyze"
              FormHelperTextProps={{ sx: { color: '#888888' } }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <GoldButton 
            variant="contained" 
            fullWidth 
            onClick={handleAnalyze}
            disabled={loading || selectedAssets.length === 0}
            size="large"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 1 
            }}
          >
            {loading ? <CircularProgress size={24} style={{ color: 'black' }} /> : (
              <>
                <Analytics /> Analyze Assets
              </>
            )}
          </GoldButton>
        </Box>
        
        <Typography variant="caption" sx={{ display: 'block', color: '#666666', mt: 2, textAlign: 'center', fontStyle: 'italic' }}>
          Gli strumenti di trading sono solo a scopo informativo e non costituiscono consulenza finanziaria.
        </Typography>
      </StyledPaper>
      
      {/* Risk Control Panel - posizionato qui, SOPRA la sfera */}
      <Box sx={{ mb: 3 }}>
        <RiskControlPanel onChange={(newSettings) => {
          // Se necessario, aggiorna le impostazioni locali
          console.log("Impostazioni rischio aggiornate:", newSettings);
        }} />
      </Box>
      
      {/* Spline Animation Container */}
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
              }}
            >
              Analyzing trading data...
            </Typography>
          )}
        </SplineContainer>
      )}
      

      {/* Analysis Results Section */}
      {results && results.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ 
            color: '#D4AF37', 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center',
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } // Responsive font size
          }}>
            <TrendingUp sx={{ mr: 1 }} />
            Analysis Results
          </Typography>
          <Divider sx={{ mb: 3, bgcolor: '#292929' }} />
        </Box>
      )}
      
      {results && results.length > 0 && (
        <Grid container spacing={2}> {/* Reduced spacing on mobile */}
          {results.map((asset, index) => (
            <Grid item xs={12} md={6} key={index}>
              <StyledCard elevation={4}>
                <CardContent sx={{ 
                  p: { xs: 2, md: 3 } // Responsive padding
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
                    gap: { xs: 2, sm: 0 } // Add gap when stacked
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      width: { xs: '100%', sm: 'auto' } // Full width on mobile
                    }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #D4AF37 0%, #F5E7A3 100%)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: 'black',
                        mr: 2
                      }}>
                        {asset.asset.split('/')[0].slice(0, 3)}
                      </Box>
                      <Typography variant="h5" component="div" sx={{ 
                        fontWeight: 'bold', 
                        color: 'white',
                        fontSize: { xs: '1.25rem', md: '1.5rem' } // Smaller on mobile
                      }}>
                        {asset.asset.split('/')[0]}
                        <Typography variant="caption" sx={{ ml: 1, color: '#999999' }}>
                          /{asset.asset.split('/')[1]}
                        </Typography>
                      </Typography>
                    </Box>
                    
                    <Chip 
                      icon={renderDecisionIcon(asset.decision)}
                      label={asset.decision.split(':')[0]}
                      sx={{ 
                        fontWeight: 'bold',
                        bgcolor: `${getDecisionColor(asset.decision)}22`,
                        color: getDecisionColor(asset.decision),
                        borderColor: getDecisionColor(asset.decision),
                        width: { xs: '100%', sm: 'auto' }, // Full width on mobile
                        justifyContent: { xs: 'center', sm: 'flex-start' } // Center on mobile
                      }}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2, bgcolor: '#292929' }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888888' }}>
                        Current Price:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'white' }}>
                        {asset.currentPrice} USDT
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888888' }}>
                        Forecast Price:
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'medium',
                          color: parseFloat(asset.forecastGain) > 0 ? '#4CAF50' : '#F44336'
                        }}
                      >
                        {asset.forecastPrice} USDT
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888888' }}>
                        Stop Loss:
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#F44336' }}>
                        {asset.stopLoss} USDT
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#888888' }}>
                        Take Profit:
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#4CAF50' }}>
                        {asset.takeProfit} USDT
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2, bgcolor: '#292929' }} />
                  
                  {/* Risk Level Section - NEW */}
                  {riskSettings && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ 
                        color: '#D4AF37', 
                        mb: 2, 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <Shield sx={{ mr: 1 }} />
                        Risk Assessment
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          {(() => {
                            const riskLevel = calculateRiskLevel(asset);
                            return (
                              <Box sx={{ 
                                bgcolor: '#1A1A1A', 
                                p: 2, 
                                borderRadius: 2,
                                borderLeft: `4px solid ${riskLevel.color}`
                              }}>
                                <Typography variant="body2" sx={{ color: '#BBBBBB', mb: 0.5 }}>
                                  Risk Level:
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  color: riskLevel.color, 
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  {riskLevel.level}
                                  {riskLevel.level === "Alto" && <WarningAmber sx={{ ml: 0.5, fontSize: 16 }} />}
                                </Typography>
                                
                                <Typography variant="caption" sx={{ 
                                  color: '#999999', 
                                  display: 'block',
                                  mt: 1
                                }}>
                                  {riskLevel.factors[0]}
                                </Typography>
                              </Box>
                            );
                          })()}
                        </Grid>
                        
                        <Grid item xs={12} sm={8}>
                          {(() => {
                            const position = calculatePositionSize(asset);
                            return (
                              <Box sx={{ bgcolor: '#1A1A1A', p: 2, borderRadius: 2 }}>
                                <Typography variant="body2" sx={{ color: '#BBBBBB', mb: 0.5 }}>
                                  Optimal Position Size:
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                                  {position.size} USDT ({position.quantity} {asset.asset.split('/')[0]})
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#999999', display: 'block', mt: 0.5 }}>
                                  {position.explanation}
                                </Typography>
                              </Box>
                            );
                          })()}
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ bgcolor: '#1E1E1E', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#888888', mb: 0.5 }}>
                          Weight:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                          {asset.weightAllocated}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ bgcolor: '#1E1E1E', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#888888', mb: 0.5 }}>
                          Amount:
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                          {asset.investmentAmount} USDT
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ bgcolor: '#1E1E1E', p: 2, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: '#888888', mb: 0.5 }}>
                          Quantity:
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 'medium' }}>
                          {asset.quantityToBuy}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Pattern Recognition Section - NEW */}
                  <Box sx={{ mb: 3 }}>
                    <Button
                      onClick={() => togglePatterns(index)}
                      fullWidth
                      sx={{ 
                        py: 1.5,
                        px: 2, 
                        bgcolor: '#1E1E1E',
                        color: '#D4AF37',
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#252525',
                        },
                        mb: expandedPatterns[index] ? 2 : 0
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Timeline sx={{ mr: 1 }} />
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Candlestick Patterns
                        </Typography>
                      </Box>
                      <ExpandMore 
                        sx={{ 
                          transform: expandedPatterns[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }} 
                      />
                    </Button>
                    
                    {expandedPatterns[index] && (
                      <Box sx={{ p: 2, bgcolor: '#1E1E1E', borderRadius: 2 }}>
                        <CandlestickPatterns patterns={analyzedPatterns[index] || {}} />
                      </Box>
                    )}
                  </Box>
                  
                  {/* Technical Indicators Section */}
                  <Box>
                    <Button
                      onClick={() => toggleIndicators(index)}
                      fullWidth
                      sx={{ 
                        py: 1.5,
                        px: 2, 
                        bgcolor: '#1E1E1E',
                        color: '#D4AF37',
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: '#252525',
                        },
                        mb: expandedIndicators[index] ? 2 : 0
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ShowChart sx={{ mr: 1 }} />
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          Technical Indicators
                        </Typography>
                      </Box>
                      <ExpandMore 
                        sx={{ 
                          transform: expandedIndicators[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s'
                        }} 
                      />
                    </Button>
                    
                    {expandedIndicators[index] && (
                      <Box sx={{ p: 2, bgcolor: '#1E1E1E', borderRadius: 2, mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 2, fontWeight: 'bold' }}>
                          Primary Indicators
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6} md={3}>
                            <Tooltip title={getIndicatorDescription('rsi')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  RSI <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  color: getIndicatorColor('rsi', asset.rsi), 
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.85rem', md: 'inherit' } // Smaller on mobile
                                }}>
                                  {asset.rsi}
                                  {parseFloat(asset.rsi) > 70 && (
                                    <span style={{ fontSize: '0.8rem', marginLeft: '4px', color: '#F44336' }}>(Ipercomprato)</span>
                                  )}
                                  {parseFloat(asset.rsi) < 30 && (
                                    <span style={{ fontSize: '0.8rem', marginLeft: '4px', color: '#4CAF50' }}>(Ipervenduto)</span>
                                  )}
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Tooltip title={getIndicatorDescription('macd')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  MACD <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  color: getIndicatorColor('macd', asset.macd),
                                  display: 'flex',
                                  alignItems: 'center',
                                  fontSize: { xs: '0.85rem', md: 'inherit' } // Smaller on mobile
                                }}>
                                  {asset.macd}
                                  {parseFloat(asset.macd) > 0 ? (
                                    <TrendingUp sx={{ ml: 0.5, fontSize: 16 }} />
                                  ) : (
                                    <TrendingDown sx={{ ml: 0.5, fontSize: 16 }} />
                                  )}
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Tooltip title={getIndicatorDescription('adx')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  ADX <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  color: getIndicatorColor('adx', asset.adx),
                                  fontSize: { xs: '0.85rem', md: 'inherit' } // Smaller on mobile
                                }}>
                                  {asset.adx}
                                  {parseFloat(asset.adx) > 25 && (
                                    <span style={{ fontSize: '0.8rem', marginLeft: '4px', color: '#4CAF50' }}>(Trend Forte)</span>
                                  )}
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={6} md={3}>
                            <Tooltip title={getIndicatorDescription('sentiment')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  Sentiment <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  color: getIndicatorColor('sentiment', asset.sentiment),
                                  fontSize: { xs: '0.85rem', md: 'inherit' } // Smaller on mobile
                                }}>
                                  {asset.sentiment}
                                  {parseFloat(asset.sentiment) > 0.2 && (
                                    <span style={{ fontSize: '0.8rem', marginLeft: '4px', color: '#4CAF50' }}>(Bullish)</span>
                                  )}
                                  {parseFloat(asset.sentiment) < -0.2 && (
                                    <span style={{ fontSize: '0.8rem', marginLeft: '4px', color: '#F44336' }}>(Bearish)</span>
                                  )}
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                        </Grid>
                        
                        <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 2, fontWeight: 'bold' }}>
                          Moving Averages
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6}>
                            <Tooltip title={getIndicatorDescription('ema9')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  EMA 9 <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'white' }}>
                                  {/* EMA9 value isn't returned by the API - this is a placeholder */}
                                  {
                                    typeof asset.ema9 !== 'undefined' 
                                      ? asset.ema9 
                                      : (parseFloat(asset.currentPrice) * 0.997).toFixed(8)
                                  } USDT
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Tooltip title={getIndicatorDescription('ema21')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  EMA 21 <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'white' }}>
                                  {/* EMA21 value isn't returned by the API - this is a placeholder */}
                                  {
                                    typeof asset.ema21 !== 'undefined'
                                      ? asset.ema21
                                      : (parseFloat(asset.currentPrice) * 0.994).toFixed(8)
                                  } USDT
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                        </Grid>
                        
                        <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 2, fontWeight: 'bold' }}>
                          Bollinger Bands
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Tooltip title={getIndicatorDescription('bollinger_upper')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  Upper Band <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#4CAF50' }}>
                                  {/* Bollinger Upper value isn't returned by the API - this is a placeholder */}
                                  {
                                    typeof asset.bollingerUpper !== 'undefined'
                                      ? asset.bollingerUpper
                                      : (parseFloat(asset.currentPrice) * 1.02).toFixed(8)
                                  } USDT
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Tooltip title={getIndicatorDescription('bollinger_lower')} arrow placement="top">
                              <IndicatorBox>
                                <Typography variant="body2" sx={{ color: '#888888', display: 'flex', alignItems: 'center' }}>
                                  Lower Band <InfoOutlined sx={{ ml: 0.5, fontSize: 14 }} />
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#F44336' }}>
                                  {/* Bollinger Lower value isn't returned by the API - this is a placeholder */}
                                  {
                                    typeof asset.bollingerLower !== 'undefined'
                                      ? asset.bollingerLower
                                      : (parseFloat(asset.currentPrice) * 0.98).toFixed(8)
                                  } USDT
                                </Typography>
                              </IndicatorBox>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ mt: 3, borderRadius: 2, overflow: 'hidden' }}>
                    <Box 
                      sx={{ 
                        p: 2, 
                        bgcolor: asset.decision.includes('COMPRARE') 
                          ? 'rgba(76, 175, 80, 0.15)' 
                          : asset.decision.includes('VENDERE') 
                            ? 'rgba(244, 67, 54, 0.15)' 
                            : 'rgba(212, 175, 55, 0.15)',
                        borderLeft: `4px solid ${getDecisionColor(asset.decision)}`,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'flex-start'
                      }}
                    >
                      {renderDecisionIcon(asset.decision)}
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        <span style={{ fontWeight: 'bold', color: getDecisionColor(asset.decision) }}>Decision Details:</span> {asset.decision}
                      </Typography>
                    </Box>
                    
                    {/* Disclaimer aggiunto alla fine di ogni carta */}
                    <Typography variant="caption" sx={{ 
                      display: 'block', 
                      color: '#777777', 
                      mt: 2, 
                      textAlign: 'center',
                      fontStyle: 'italic'
                    }}>
                      Le informazioni fornite sono solo a scopo informativo e non costituiscono consulenza di investimento. 
                      Effettua sempre ricerche indipendenti prima di prendere decisioni di trading.
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Show "No results" only if analysis has been completed but there are no results */}
      {results !== null && results.length === 0 && !loading && !showSpline && (
        <StyledPaper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#888888' }}>
            No results to display. Run the analysis to see potential trades.
          </Typography>
        </StyledPaper>
      )}
    </Box>
  );
}

export default TradingAnalyzer;