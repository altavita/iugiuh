// frontend/src/components/Profile.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
  BarChart as   ChartIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell
} from 'recharts';
import { getUser, getUserProfile, getUserActivity, getUserCourseProgress } from '../lib/supabaseClient';

const Profile = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [courseProgress, setCourseProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    completedCourses: 0,
    currentStreak: 0,
    totalLessons: 0,
    averageProgress: 0,
    achievements: []
  });

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await getUser();
      
      if (currentUser) {
        setUser(currentUser);
        
        const [profileData, activityData, progressData] = await Promise.all([
          getUserProfile(currentUser.id),
          getUserActivity(currentUser.id),
          getUserCourseProgress(currentUser.id)
        ]);
        
        setProfile(profileData);
        setActivity(activityData);
        setCourseProgress(progressData);
        
        // Calcola statistiche
        calculateStats(activityData, progressData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (activityData, progressData) => {
    // Calcola ore totali studiate
    const totalHours = progressData.reduce((acc, course) => {
      const courseHours = parseInt(course.courses?.duration || 0);
      return acc + (courseHours * course.progress / 100);
    }, 0);

    // Corsi completati
    const completedCourses = progressData.filter(course => course.progress === 100).length;

    // Calcola streak (giorni consecutivi)
    const currentStreak = calculateStreak(activityData);

    // Lezioni totali completate
    const totalLessons = progressData.reduce((acc, course) => {
      const lessonsInCourse = course.courses?.total_lessons || 0;
      return acc + Math.floor(lessonsInCourse * course.progress / 100);
    }, 0);

    // Media progresso
    const averageProgress = progressData.length > 0
      ? progressData.reduce((acc, course) => acc + course.progress, 0) / progressData.length
      : 0;

    // Achievements
    const achievements = calculateAchievements(totalHours, completedCourses, currentStreak);

    setStats({
      totalHours: Math.round(totalHours),
      completedCourses,
      currentStreak,
      totalLessons,
      averageProgress: Math.round(averageProgress),
      achievements
    });
  };

  const calculateStreak = (activityData) => {
    // Implementazione semplificata del calcolo streak
    if (!activityData || activityData.length === 0) return 0;
    
    let streak = 1;
    const sortedActivity = [...activityData].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    for (let i = 0; i < sortedActivity.length - 1; i++) {
      const current = new Date(sortedActivity[i].created_at);
      const next = new Date(sortedActivity[i + 1].created_at);
      const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateAchievements = (hours, courses, streak) => {
    const achievements = [];
    
    // Achievement basati sulle ore
    if (hours >= 10) achievements.push({ id: 1, name: 'Principiante', icon: '🎯', color: '#4CAF50' });
    if (hours >= 50) achievements.push({ id: 2, name: 'Studente Dedicato', icon: '📚', color: '#2196F3' });
    if (hours >= 100) achievements.push({ id: 3, name: 'Esperto', icon: '🏆', color: '#D4AF37' });
    
    // Achievement basati sui corsi
    if (courses >= 1) achievements.push({ id: 4, name: 'Primo Corso', icon: '🎓', color: '#9C27B0' });
    if (courses >= 5) achievements.push({ id: 5, name: 'Collezionista', icon: '📖', color: '#FF9800' });
    
    // Achievement basati sullo streak
    if (streak >= 7) achievements.push({ id: 6, name: 'Settimana di Fuoco', icon: '🔥', color: '#F44336' });
    if (streak >= 30) achievements.push({ id: 7, name: 'Mese Perfetto', icon: '💎', color: '#00BCD4' });
    
    return achievements;
  };

  // Dati per i grafici
  const activityChartData = activity.slice(0, 7).reverse().map(item => ({
    date: new Date(item.created_at).toLocaleDateString('it-IT', { weekday: 'short' }),
    minuti: item.duration_minutes || 0
  }));

  const skillsRadarData = [
    { skill: 'Analisi Tecnica', value: 85 },
    { skill: 'Risk Management', value: 72 },
    { skill: 'Trading Psicologia', value: 68 },
    { skill: 'Algoritmi', value: 45 },
    { skill: 'Fondamentali', value: 60 },
    { skill: 'Pattern', value: 78 }
  ];

  const courseDistributionData = courseProgress.map(course => ({
    name: course.courses?.title || 'Corso',
    value: course.progress
  }));

  const COLORS = ['#D4AF37', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];

  const StatCard = ({ icon, title, value, subtitle, color }) => (
    <Card
      sx={{
        backgroundColor: '#000000',
        border: '1px solid #D4AF37',
        borderRadius: 3,
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(212, 175, 55, 0.2)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ color: color || '#D4AF37', fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color || '#D4AF37', opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#D4AF37' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Profile */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          backgroundColor: '#000000',
          border: '1px solid #D4AF37',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(245, 231, 163, 0.05) 100%)',
            zIndex: 0,
          },
        }}
      >
        <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: '#D4AF37',
                      color: '#000',
                      '&:hover': { backgroundColor: '#F5E7A3' },
                    }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              >
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    border: '4px solid #D4AF37',
                    fontSize: '3rem',
                    backgroundColor: '#1A1A1A',
                  }}
                >
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Avatar>
              </Badge>
              {stats.currentStreak > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -10,
                    right: -10,
                    backgroundColor: '#F44336',
                    borderRadius: '50%',
                    width: 50,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #000',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <FireIcon sx={{ fontSize: 20, color: '#FFF' }} />
                    <Typography variant="caption" sx={{ color: '#FFF', fontWeight: 'bold', display: 'block', lineHeight: 1 }}>
                      {stats.currentStreak}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Box>
              <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 1 }}>
                {profile?.full_name || 'Trader'}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                {user?.email}
              </Typography>
              
              {/* Achievements */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {stats.achievements.map((achievement) => (
                  <Tooltip key={achievement.id} title={achievement.name} arrow>
                    <Chip
                      label={achievement.icon}
                      sx={{
                        backgroundColor: `${achievement.color}20`,
                        border: `1px solid ${achievement.color}`,
                        fontSize: '1.2rem',
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
              
              {/* Quick Stats */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                      {stats.totalHours}h
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Ore Studiate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {stats.completedCourses}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Corsi Completati
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                      {stats.totalLessons}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Lezioni Completate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                      {stats.averageProgress}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Progresso Medio
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 'bold',
              '&.Mui-selected': {
                color: '#D4AF37',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#D4AF37',
            },
          }}
        >
          <Tab label="Dashboard" icon={<ChartIcon />} iconPosition="start" />
          <Tab label="Attività Recente" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Corsi e Progress" icon={<SchoolIcon />} iconPosition="start" />
          <Tab label="Impostazioni" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Statistiche Principali */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TimeIcon sx={{ fontSize: 40 }} />}
              title="Tempo Totale"
              value={`${stats.totalHours}h`}
              subtitle="di formazione"
              color="#D4AF37"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<SchoolIcon sx={{ fontSize: 40 }} />}
              title="Corsi Completati"
              value={stats.completedCourses}
              subtitle={`su ${courseProgress.length} totali`}
              color="#4CAF50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<FireIcon sx={{ fontSize: 40 }} />}
              title="Streak Attuale"
              value={`${stats.currentStreak} giorni`}
              subtitle="consecutivi"
              color="#F44336"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TrophyIcon sx={{ fontSize: 40 }} />}
              title="Achievement"
              value={stats.achievements.length}
              subtitle="sbloccati"
              color="#9C27B0"
            />
          </Grid>

          {/* Grafico Attività */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: '#000000',
                border: '1px solid #D4AF37',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#D4AF37', mb: 3 }}>
                Attività Ultima Settimana
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityChartData}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#999" />
                  <YAxis stroke="#999" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #D4AF37',
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minuti"
                    stroke="#D4AF37"
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Radar Skills */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: '#000000',
                border: '1px solid #D4AF37',
                borderRadius: 3,
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ color: '#D4AF37', mb: 3 }}>
                Competenze
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={skillsRadarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="skill" stroke="#999" />
                  <PolarRadiusAxis stroke="#333" />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke="#D4AF37"
                    fill="#D4AF37"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: '#000000',
                border: '1px solid #D4AF37',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#D4AF37', mb: 3 }}>
                Attività Recente
              </Typography>
              <List>
                {activity.slice(0, 10).map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: '1px solid #333',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: '#1A1A1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #D4AF37',
                        }}
                      >
                        <AssignmentIcon sx={{ color: '#D4AF37', fontSize: 20 }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.activity_type || 'Lezione Completata'}
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {new Date(item.created_at).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                          {item.duration_minutes && (
                            <Chip
                              label={`${item.duration_minutes} min`}
                              size="small"
                              sx={{
                                ml: 1,
                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                color: '#D4AF37',
                                border: '1px solid #D4AF37',
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedTab === 2 && (
        <Grid container spacing={3}>
          {/* Progress Corsi */}
          {courseProgress.map((course, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper
                sx={{
                  p: 3,
                  backgroundColor: '#000000',
                  border: '1px solid #D4AF37',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(212, 175, 55, 0.2)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#D4AF37' }}>
                    {course.courses?.title || 'Corso'}
                  </Typography>
                  {course.progress === 100 && (
                    <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                  )}
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Progresso
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                      {course.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={course.progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: course.progress === 100 ? '#4CAF50' : '#D4AF37',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {Math.floor((course.courses?.total_lessons || 0) * course.progress / 100)} di {course.courses?.total_lessons || 0} lezioni
                  </Typography>
                  <Button
                    size="small"
                    sx={{
                      color: '#D4AF37',
                      '&:hover': {
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      },
                    }}
                  >
                    Continua
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
          
          {/* Grafico distribuzione corsi */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: '#000000',
                border: '1px solid #D4AF37',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#D4AF37', mb: 3 }}>
                Distribuzione Progress Corsi
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {courseDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #D4AF37',
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {selectedTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                backgroundColor: '#000000',
                border: '1px solid #D4AF37',
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" sx={{ color: '#D4AF37', mb: 3 }}>
                Impostazioni Profilo
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Le impostazioni del profilo saranno disponibili a breve.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Profile;