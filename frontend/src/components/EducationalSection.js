// Components/EducationalSection.js
import React, { useState } from 'react';
import { 
  Box, Typography, Accordion, AccordionSummary, 
  AccordionDetails, Divider, Link
} from '@mui/material';
import { 
  ExpandMore, School, MenuBook, 
  Lightbulb, TipsAndUpdates
} from '@mui/icons-material';

const EducationalSection = () => {
  const [expanded, setExpanded] = useState(false);
  
  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ 
          color: '#D4AF37', 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <School sx={{ mr: 1 }} />
          Materiale Educativo
        </Typography>
        <Divider sx={{ my: 2, bgcolor: '#292929' }} />
      </Box>
      
      <Accordion 
        expanded={expanded === 'panel1'} 
        onChange={handleChange('panel1')}
        sx={{ 
          bgcolor: '#1A1A1A', 
          color: 'white',
          border: '1px solid #333',
          mb: 1,
          '&:before': {
            display: 'none'
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: '#D4AF37' }} />}
          sx={{ borderLeft: '4px solid #D4AF37' }}
        >
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <MenuBook sx={{ mr: 1, color: '#D4AF37' }} />
            Indicatori Tecnici: Guida Completa
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
            Gli indicatori tecnici sono strumenti matematici che aiutano a interpretare i movimenti di prezzo e volume di un asset.
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 1 }}>Indicatori di Trend</Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>Moving Averages (MA)</strong>: Medie dei prezzi che aiutano a identificare la direzione del trend.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>MACD</strong>: Confronta due medie mobili esponenziali per identificare momentum e cambi di trend.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              • <strong>ADX</strong>: Misura la forza di un trend, indipendentemente dalla sua direzione.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 1 }}>Indicatori di Momentum</Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>RSI</strong>: Misura la velocità e il cambiamento dei movimenti di prezzo.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              • <strong>Stochastic Oscillator</strong>: Confronta il prezzo di chiusura con il range di prezzo in un dato periodo.
            </Typography>
          </Box>
          <Link href="#" sx={{ color: '#D4AF37', display: 'block', mt: 2 }}>
            Leggi la guida completa agli indicatori
          </Link>
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expanded === 'panel2'} 
        onChange={handleChange('panel2')}
        sx={{ 
          bgcolor: '#1A1A1A', 
          color: 'white',
          border: '1px solid #333',
          mb: 1,
          '&:before': {
            display: 'none'
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: '#D4AF37' }} />}
          sx={{ borderLeft: '4px solid #D4AF37' }}
        >
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <Lightbulb sx={{ mr: 1, color: '#D4AF37' }} />
            Pattern Candlestick: Come Riconoscerli
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
            I pattern candlestick sono formazioni specifiche che possono indicare potenziali inversioni o continuazioni di trend.
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 1 }}>Pattern Bullish (Rialzisti)</Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>Hammer</strong>: Candela con corpo piccolo e lunga ombra inferiore, indica potenziale inversione rialzista.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              • <strong>Bullish Engulfing</strong>: Due candele dove la seconda (verde) ingloba completamente la prima (rossa).
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 1 }}>Pattern Bearish (Ribassisti)</Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>Shooting Star</strong>: Candela con corpo piccolo in basso e lunga ombra superiore.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              • <strong>Bearish Engulfing</strong>: Due candele dove la seconda (rossa) ingloba completamente la prima (verde).
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expanded === 'panel3'} 
        onChange={handleChange('panel3')}
        sx={{ 
          bgcolor: '#1A1A1A', 
          color: 'white',
          border: '1px solid #333',
          '&:before': {
            display: 'none'
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore sx={{ color: '#D4AF37' }} />}
          sx={{ borderLeft: '4px solid #D4AF37' }}
        >
          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <TipsAndUpdates sx={{ mr: 1, color: '#D4AF37' }} />
            Gestione del Rischio: Principi Fondamentali
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
            La gestione del rischio è fondamentale per il successo nel trading a lungo termine.
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 1 }}>Principi di Money Management</Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>Regola dell'1%</strong>: Non rischiare mai più dell'1-2% del capitale su un singolo trade.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>Rapporto Rischio/Rendimento</strong>: Cercare trade con rapporto di almeno 1:2 (rischio 1, guadagno potenziale 2).
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              • <strong>Diversificazione</strong>: Distribuire il rischio su asset diversi per ridurre l'esposizione.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#D4AF37', mb: 1 }}>Stop Loss e Take Profit</Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              • <strong>Stop Loss</strong>: Sempre impostare un livello di uscita predeterminato per limitare le perdite.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              • <strong>Take Profit</strong>: Definire in anticipo gli obiettivi di profitto per evitare decisioni emotive.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default EducationalSection;