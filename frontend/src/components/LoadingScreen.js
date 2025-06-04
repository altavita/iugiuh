import React from 'react';
import LazySpline from './LazySpline';
import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingScreen() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', height: '70%', position: 'relative' }}>
                <LazySpline
          scene="https://prod.spline.design/Xo8JSvpgti-beYk3/scene.splinecode" 
        />
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
        <CircularProgress 
          size={40} 
          sx={{ 
            color: '#D4AF37',
            mb: 2
          }} 
        />
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#D4AF37',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #D4AF37 0%, #F5E7A3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Loading Trading Data...
        </Typography>
      </Box>
    </Box>
  );
}

export default LoadingScreen;