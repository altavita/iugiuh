// Components/RiskControlPanel.js
import React, { useState } from 'react';
import {
  Box, Typography, Slider, Divider, Paper,
  FormControlLabel, Switch, Grid, Tooltip
} from '@mui/material';
import { Shield, WarningAmber, HelpOutline } from '@mui/icons-material';

const RiskControlPanel = ({ onChange }) => {
  const [risk, setRisk] = useState({
    maxRiskPerTrade: 1.0, // 1% del capitale
    stopLossType: 'fixed', // fixed o atr
    stopLossPercentage: 2.0, // 2% del prezzo di entrata
    takeProfitRatio: 2.0, // Rapporto 1:2 (rischio:rendimento)
    enableTrailingStop: false,
    trailingStopPercentage: 1.0,
    maxOpenPositions: 3,
    enableHedging: false
  });
  
  const handleRiskChange = (key, value) => {
    const newRisk = { ...risk, [key]: value };
    setRisk(newRisk);
    if (onChange) onChange(newRisk);
  };
  
  return (
    <Paper sx={{ 
      p: 3, 
      bgcolor: '#1A1A1A', 
      border: '1px solid #333',
      borderRadius: 2,
      mb: 3
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Shield sx={{ color: '#D4AF37', mr: 1 }} />
        <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
          Controllo del Rischio
        </Typography>
      </Box>
      <Divider sx={{ mb: 3, bgcolor: '#333' }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: '#CCCCCC' }}>
                Rischio Massimo per Trade (% del capitale)
              </Typography>
              <Tooltip title="La percentuale massima del tuo capitale che sei disposto a rischiare su un singolo trade" arrow>
                <HelpOutline sx={{ ml: 1, color: '#999', fontSize: '0.9rem' }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={risk.maxRiskPerTrade}
                onChange={(e, newValue) => handleRiskChange('maxRiskPerTrade', newValue)}
                step={0.1}
                marks={[
                  { value: 0.5, label: '0.5%' },
                  { value: 1, label: '1%' },
                  { value: 2, label: '2%' },
                  { value: 3, label: '3%' }
                ]}
                min={0.5}
                max={3}
                sx={{
                  color: risk.maxRiskPerTrade > 2 ? '#F44336' : '#D4AF37',
                  '& .MuiSlider-thumb': {
                    bgcolor: 'white',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: '#333',
                  },
                  '& .MuiSlider-mark': {
                    bgcolor: '#555',
                  },
                  '& .MuiSlider-markLabel': {
                    color: '#999',
                  },
                }}
              />
              <Box sx={{ 
                ml: 2, 
                bgcolor: risk.maxRiskPerTrade > 2 ? '#F44336' : '#D4AF37',
                color: 'black',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 'bold',
                minWidth: 50,
                textAlign: 'center'
              }}>
                {risk.maxRiskPerTrade}%
              </Box>
            </Box>
            {risk.maxRiskPerTrade > 2 && (
              <Typography variant="caption" sx={{ color: '#F44336', display: 'flex', alignItems: 'center', mt: 1 }}>
                <WarningAmber sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                Rischio elevato! Si consiglia max 1-2%
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: '#CCCCCC' }}>
                Stop Loss (% dal prezzo di entrata)
              </Typography>
              <Tooltip title="La percentuale di distanza dal prezzo di entrata a cui posizionare lo stop loss" arrow>
                <HelpOutline sx={{ ml: 1, color: '#999', fontSize: '0.9rem' }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={risk.stopLossPercentage}
                onChange={(e, newValue) => handleRiskChange('stopLossPercentage', newValue)}
                step={0.5}
                marks={[
                  { value: 1, label: '1%' },
                  { value: 2, label: '2%' },
                  { value: 3, label: '3%' },
                  { value: 5, label: '5%' }
                ]}
                min={1}
                max={5}
                sx={{
                  color: '#D4AF37',
                  '& .MuiSlider-thumb': {
                    bgcolor: 'white',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: '#333',
                  },
                }}
              />
              <Box sx={{ 
                ml: 2, 
                bgcolor: '#D4AF37',
                color: 'black',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 'bold',
                minWidth: 50,
                textAlign: 'center'
              }}>
                {risk.stopLossPercentage}%
              </Box>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: '#CCCCCC' }}>
                Rapporto Rischio/Rendimento
              </Typography>
              <Tooltip title="Il rapporto tra il rischio (stop loss) e il rendimento atteso (take profit)" arrow>
                <HelpOutline sx={{ ml: 1, color: '#999', fontSize: '0.9rem' }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={risk.takeProfitRatio}
                onChange={(e, newValue) => handleRiskChange('takeProfitRatio', newValue)}
                step={0.5}
                marks={[
                  { value: 1, label: '1:1' },
                  { value: 2, label: '1:2' },
                  { value: 3, label: '1:3' }
                ]}
                min={1}
                max={3}
                sx={{
                  color: risk.takeProfitRatio < 1.5 ? '#F44336' : '#D4AF37',
                  '& .MuiSlider-thumb': {
                    bgcolor: 'white',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: '#333',
                  },
                }}
              />
              <Box sx={{ 
                ml: 2, 
                bgcolor: risk.takeProfitRatio < 1.5 ? '#F44336' : '#D4AF37',
                color: 'black',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 'bold',
                minWidth: 50,
                textAlign: 'center'
              }}>
                1:{risk.takeProfitRatio}
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ color: '#CCCCCC' }}>
                Numero Massimo di Posizioni Aperte
              </Typography>
              <Tooltip title="Il numero massimo di trade che il sistema può mantenere aperti contemporaneamente" arrow>
                <HelpOutline sx={{ ml: 1, color: '#999', fontSize: '0.9rem' }} />
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={risk.maxOpenPositions}
                onChange={(e, newValue) => handleRiskChange('maxOpenPositions', newValue)}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' }
                ]}
                min={1}
                max={5}
                sx={{
                  color: '#D4AF37',
                  '& .MuiSlider-thumb': {
                    bgcolor: 'white',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: '#333',
                  },
                }}
              />
              <Box sx={{ 
                ml: 2, 
                bgcolor: '#D4AF37',
                color: 'black',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 'bold',
                minWidth: 50,
                textAlign: 'center'
              }}>
                {risk.maxOpenPositions}
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2, bgcolor: '#333' }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={risk.enableTrailingStop}
                onChange={(e) => handleRiskChange('enableTrailingStop', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#D4AF37',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#D4AF37',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
                  Attiva Trailing Stop
                </Typography>
                <Tooltip title="Lo stop loss si sposta automaticamente a seguire il prezzo" arrow>
                  <HelpOutline sx={{ ml: 1, color: '#999', fontSize: '0.9rem' }} />
                </Tooltip>
              </Box>
            }
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={risk.enableHedging}
                onChange={(e) => handleRiskChange('enableHedging', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#D4AF37',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#D4AF37',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ color: '#CCCCCC', fontSize: '0.9rem' }}>
                  Consenti Hedging
                </Typography>
                <Tooltip title="Permette di aprire posizioni sia long che short sullo stesso asset" arrow>
                  <HelpOutline sx={{ ml: 1, color: '#999', fontSize: '0.9rem' }} />
                </Tooltip>
              </Box>
            }
          />
        </Grid>
      </Grid>
      
      <Typography variant="caption" sx={{ display: 'block', color: '#999', mt: 2, fontStyle: 'italic' }}>
        Nota: Questi parametri controllano solamente le analisi informative. Tutte le decisioni di trading rimangono sotto la tua esclusiva responsabilità.
      </Typography>
    </Paper>
  );
};

export default RiskControlPanel;