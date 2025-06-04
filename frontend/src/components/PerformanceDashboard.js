// Components/PerformanceDashboard.js
import React from 'react';
import { 
  Box, Typography, Paper, Grid, Divider,
  LinearProgress, styled
} from '@mui/material';
import { 
  TrendingUp, TrendingDown, BarChart, 
  Timeline, ShowChart 
} from '@mui/icons-material';

// Styled components
const StyledMetricBox = styled(Paper)(({ theme }) => ({
  backgroundColor: '#1A1A1A',
  padding: 16,
  borderRadius: 8,
  border: '1px solid #333333',
  transition: 'all 0.3s ease',
  height: '100%',
  '&:hover': {
    backgroundColor: '#222222',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    borderColor: '#D4AF37',
  }
}));

const PerformanceDashboard = ({ 
  forecastAccuracy = 68.5, 
  trades = { positive: 12, negative: 5, neutral: 3 },
  riskRatio = 2.1,
  patterns = { doji: 3, hammer: 2, engulfing: 4 }
}) => {
  const totalTrades = trades.positive + trades.negative + trades.neutral;
  const successRate = (trades.positive / totalTrades) * 100;
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ 
          color: '#D4AF37', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <BarChart sx={{ mr: 1 }} />
          Statistiche e Performance
        </Typography>
        <Divider sx={{ my: 2, bgcolor: '#292929' }} />
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledMetricBox>
            <Typography variant="body2" sx={{ color: '#999999', mb: 1 }}>
              Precisione Previsioni
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
              <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                {forecastAccuracy.toFixed(1)}%
              </Typography>
              <TrendingUp sx={{ color: '#4CAF50', ml: 1, mb: 0.5 }} />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={forecastAccuracy} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: '#333333',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#D4AF37',
                }
              }} 
            />
          </StyledMetricBox>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StyledMetricBox>
            <Typography variant="body2" sx={{ color: '#999999', mb: 1 }}>
              Tasso di Successo
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
              <Typography variant="h4" sx={{ color: successRate > 60 ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                {successRate.toFixed(1)}%
              </Typography>
              {successRate > 60 ? (
                <TrendingUp sx={{ color: '#4CAF50', ml: 1, mb: 0.5 }} />
              ) : (
                <TrendingDown sx={{ color: '#F44336', ml: 1, mb: 0.5 }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#BBBBBB' }}>
              <Typography variant="caption">
                Positivi: <span style={{ color: '#4CAF50' }}>{trades.positive}</span>
              </Typography>
              <Typography variant="caption">
                Negativi: <span style={{ color: '#F44336' }}>{trades.negative}</span>
              </Typography>
              <Typography variant="caption">
                Neutrali: <span style={{ color: '#D4AF37' }}>{trades.neutral}</span>
              </Typography>
            </Box>
          </StyledMetricBox>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StyledMetricBox>
            <Typography variant="body2" sx={{ color: '#999999', mb: 1 }}>
              Rapporto Rischio/Rendimento
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
              <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                {riskRatio.toFixed(1)}:1
              </Typography>
              <ShowChart sx={{ color: '#D4AF37', ml: 1, mb: 0.5 }} />
            </Box>
            <Typography variant="body2" sx={{ color: '#BBBBBB' }}>
              Un buon rapporto è &gt;2:1
            </Typography>
          </StyledMetricBox>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StyledMetricBox>
            <Typography variant="body2" sx={{ color: '#999999', mb: 1 }}>
              Pattern Rilevati
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1 }}>
              <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                {Object.values(patterns).reduce((a, b) => a + b, 0)}
              </Typography>
              <Timeline sx={{ color: '#D4AF37', ml: 1, mb: 0.5 }} />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(patterns).map(([pattern, count]) => (
                <Typography key={pattern} variant="caption" sx={{ 
                  bgcolor: '#333333', 
                  py: 0.5, 
                  px: 1, 
                  borderRadius: 1,
                  color: '#BBBBBB'
                }}>
                  {pattern}: {count}
                </Typography>
              ))}
            </Box>
          </StyledMetricBox>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceDashboard;