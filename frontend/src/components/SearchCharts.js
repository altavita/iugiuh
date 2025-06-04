import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchCharts = () => {
  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          color: '#D4AF37',
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        Search Charts
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: '#000000',
          border: '1px solid #D4AF37',
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for trading pairs, indicators, or strategies..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#D4AF37' }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D4AF37',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D4AF37',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D4AF37',
              },
            },
          }}
        />
      </Paper>

      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item}>
            <Card
              sx={{
                backgroundColor: '#000000',
                border: '1px solid #D4AF37',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.2)',
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ color: '#D4AF37', mb: 1 }}
                >
                  Chart Placeholder {item}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  This is where chart search results will appear.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SearchCharts; 