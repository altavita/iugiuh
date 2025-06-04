import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Avatar,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

const drawerWidth = 280;
const drawerWidthCollapsed = 65;

const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileToggle = () => {
    setProfileExpanded(!profileExpanded);
  };

  const navigationItems = [
    {
      text: 'Market Scanner',
      icon: <DashboardIcon />,
      path: '/',
    },
    {
      text: 'Trading Analyzer',
      icon: <TrendingUpIcon />,
      path: '/trading-analyzer',
    },
    {
      text: 'Search Charts',
      icon: <SearchIcon />,
      path: '/search-charts',
    },
    {
      text: 'Performance',
      icon: <BarChartIcon />,
      path: '/performance',
    },
    {
      text: 'Corsi',
      icon: <SchoolIcon />,
      path: '/corsi',
    },
    {
      text: 'Profilo',
      icon: <AccountCircleIcon />,
      path: '/profile',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#000000',
        borderRight: '1px solid #D4AF37',
      }}
    >
      {/* Header with toggle button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          minHeight: 64,
        }}
      >
        {open && (
          <Typography
            variant="h6"
            sx={{
              color: '#D4AF37',
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
          >
            TRADING BOT
          </Typography>
        )}
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            color: '#D4AF37',
            '&:hover': {
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
            },
          }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} />

      {/* Profile Section */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleProfileToggle}
          sx={{
            borderRadius: 2,
            mb: 1,
            justifyContent: open ? 'initial' : 'center',
            '&:hover': {
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
            },
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}>
            <Avatar
              sx={{
                bgcolor: '#D4AF37',
                width: open ? 40 : 32,
                height: open ? 40 : 32,
              }}
            >
              <AccountCircleIcon />
            </Avatar>
          </ListItemIcon>
          {open && (
            <>
              <ListItemText
                primary="Profile"
                secondary="Trader"
                primaryTypographyProps={{
                  color: '#D4AF37',
                  fontWeight: 'medium',
                }}
                secondaryTypographyProps={{
                  color: 'rgba(212, 175, 55, 0.7)',
                  fontSize: '0.75rem',
                }}
              />
              {profileExpanded ? <ExpandLess sx={{ color: '#D4AF37' }} /> : <ExpandMore sx={{ color: '#D4AF37' }} />}
            </>
          )}
        </ListItemButton>
        
        {open && (
          <Collapse in={profileExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                sx={{
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  },
                }}
                component={Link}
                to="/profile"
              >
                <ListItemText
                  primary="My Account"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              </ListItemButton>
              <ListItemButton
                sx={{
                  pl: 4,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  },
                }}
              >
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              </ListItemButton>
            </List>
          </Collapse>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.3)' }} />

      {/* Navigation Items */}
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #D4AF37' : '3px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      color: isActive ? '#D4AF37' : 'rgba(255, 255, 255, 0.9)',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      {open && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(212, 175, 55, 0.5)',
              display: 'block',
              textAlign: 'center',
            }}
          >
            Version 1.0.0
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={isMobile ? handleDrawerToggle : undefined}
      sx={{
        width: open ? drawerWidth : drawerWidthCollapsed,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : drawerWidthCollapsed,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          backgroundColor: '#000000',
          borderRight: '1px solid #D4AF37',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;