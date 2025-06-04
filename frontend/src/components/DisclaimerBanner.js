// Components/DisclaimerBanner.js
import React, { useState } from 'react';
import { 
  Box, Alert, AlertTitle, Typography, Collapse, 
  IconButton, Link, Divider 
} from '@mui/material';
import { InfoOutlined, Close, ExpandMore } from '@mui/icons-material';

const DisclaimerBanner = () => {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Collapse in={open}>
      <Alert 
        severity="info"
        sx={{ 
          mb: 3, 
          bgcolor: 'rgba(33, 150, 243, 0.05)', 
          border: '1px solid rgba(33, 150, 243, 0.2)',
          '& .MuiAlert-icon': {
            color: '#D4AF37'
          }
        }}
        icon={<InfoOutlined sx={{ color: '#D4AF37' }} />}
        action={
          <Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ mr: 1 }}
            >
              <ExpandMore 
                sx={{ 
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                  color: '#D4AF37'
                }} 
              />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
            >
              <Close />
            </IconButton>
          </Box>
        }
      >
        <AlertTitle sx={{ fontWeight: 'bold', color: '#D4AF37' }}>
          Informativa Importante sull'Analisi Finanziaria
        </AlertTitle>
        <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
          Questa piattaforma fornisce esclusivamente informazioni e analisi a scopo informativo. Non costituisce consulenza finanziaria né raccomandazione di investimento.
        </Typography>
        
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2, bgcolor: '#333333' }} />
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              <strong>Rischi dell'Investimento:</strong> Il trading di criptovalute comporta rischi significativi. I risultati passati non sono indicativi di performance future.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              <strong>Dati ed Analisi:</strong> Gli indicatori tecnici e le previsioni sono generati da algoritmi automatizzati che possono contenere errori.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
              <strong>Decisioni di Trading:</strong> Le decisioni di investimento rimangono di esclusiva responsabilità dell'utente. Si consiglia di consultare un consulente finanziario autorizzato prima di operare.
            </Typography>
            <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
              <strong>Conformità Normativa:</strong> Questo strumento è a solo scopo informativo e non fornisce consulenza su investimenti ai sensi della normativa Consob. <Link href="#" sx={{ color: '#D4AF37' }}>Leggi termini completi</Link>
            </Typography>
          </Box>
        </Collapse>
      </Alert>
    </Collapse>
  );
};

export default DisclaimerBanner;