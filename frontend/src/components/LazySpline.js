import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Lazy load del componente Spline
const Spline = lazy(() => import('@splinetool/react-spline'));

const LazySpline = ({ scene, onLoad, ...props }) => {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Ritarda il caricamento di Spline di 1 secondo per permettere al resto dell'app di caricarsi
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%" 
        width="100%"
      >
        <CircularProgress sx={{ color: '#D4AF37' }} size={40} />
      </Box>
    );
  }

  return (
    <Suspense 
      fallback={
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="100%" 
          width="100%"
        >
          <CircularProgress sx={{ color: '#D4AF37' }} size={40} />
        </Box>
      }
    >
      <Spline scene={scene} onLoad={onLoad} {...props} />
    </Suspense>
  );
};

export default LazySpline; 