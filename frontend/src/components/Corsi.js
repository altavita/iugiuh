// frontend/src/components/Corsi.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tab,
  Tabs,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  BookmarkBorder as BookmarkIcon,
  Close as CloseIcon,
  YouTube as YouTubeIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { getUser, getUserCourseProgress, updateCourseProgress } from '../lib/supabaseClient';

// YouTube Data API configuration
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY';
const YOUTUBE_CHANNEL_ID = process.env.REACT_APP_YOUTUBE_CHANNEL_ID || 'YOUR_CHANNEL_ID';

const Corsi = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProgress, setUserProgress] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadYouTubeContent();
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getUser();
      if (currentUser) {
        setUser(currentUser);
        const progress = await getUserCourseProgress(currentUser.id);
        // Converti progress in oggetto per accesso rapido
        const progressMap = {};
        progress.forEach(p => {
          progressMap[p.course_id] = p;
        });
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadYouTubeContent = async () => {
    try {
      setLoading(true);
      
      // Fetch playlists
      const playlistsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=50&key=${YOUTUBE_API_KEY}`
      );
      const playlistsData = await playlistsResponse.json();
      
      if (playlistsData.items) {
        const formattedPlaylists = playlistsData.items.map(playlist => ({
          id: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          thumbnail: playlist.snippet.thumbnails.high.url,
          videoCount: playlist.contentDetails.itemCount,
          publishedAt: playlist.snippet.publishedAt,
        }));
        setPlaylists(formattedPlaylists);
      }
      
      // Fetch recent videos
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=20&order=date&type=video&key=${YOUTUBE_API_KEY}`
      );
      const videosData = await videosResponse.json();
      
      if (videosData.items) {
        // Fetch video details for duration
        const videoIds = videosData.items.map(item => item.id.videoId).join(',');
        const detailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const detailsData = await detailsResponse.json();
        
        const formattedVideos = videosData.items.map((video, index) => {
          const details = detailsData.items[index];
          return {
            id: video.id.videoId,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.high.url,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            duration: parseDuration(details?.contentDetails?.duration),
            viewCount: details?.statistics?.viewCount || 0,
            likeCount: details?.statistics?.likeCount || 0,
          };
        });
        setVideos(formattedVideos);
      }
    } catch (error) {
      console.error('Error loading YouTube content:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseDuration = (duration) => {
    if (!duration) return 'N/A';
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 'N/A';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    let result = '';
    if (hours) result += `${hours}h `;
    if (minutes) result += `${minutes}m `;
    if (seconds && !hours) result += `${seconds}s`;
    
    return result.trim() || 'N/A';
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setVideoDialogOpen(true);
    
    // Aggiorna il progresso dell'utente
    if (user) {
      updateCourseProgress(user.id, video.id, 0, video.id);
    }
  };

  const handleCloseVideo = () => {
    setVideoDialogOpen(false);
    setSelectedVideo(null);
  };

  const getLevelFromDuration = (duration) => {
    // Estrai i minuti dalla durata
    const minutes = parseInt(duration.match(/(\d+)m/)?.[1] || 0);
    
    if (minutes < 15) return { level: 'Principiante', color: '#4CAF50' };
    if (minutes < 30) return { level: 'Intermedio', color: '#FF9800' };
    return { level: 'Avanzato', color: '#F44336' };
  };

  const getCategoryFromTitle = (title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('analisi tecnica')) return 'Analisi Tecnica';
    if (titleLower.includes('risk') || titleLower.includes('rischio')) return 'Risk Management';
    if (titleLower.includes('psicolog')) return 'Psicologia';
    if (titleLower.includes('algoritm') || titleLower.includes('bot')) return 'Algoritmi';
    if (titleLower.includes('crypto') || titleLower.includes('bitcoin')) return 'Crypto';
    if (titleLower.includes('forex')) return 'Forex';
    if (titleLower.includes('fundamental') || titleLower.includes('fondamental')) return 'Analisi Fondamentale';
    
    return 'Trading';
  };

  const formatViewCount = (count) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const VideoCard = ({ video, isPlaylist = false }) => {
    const levelInfo = getLevelFromDuration(video.duration);
    const category = getCategoryFromTitle(video.title);
    const progress = userProgress[video.id]?.progress || 0;
    const isCompleted = progress === 100;
    
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000000',
          border: '1px solid #D4AF37',
          borderRadius: 3,
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
            transform: 'translateY(-4px)',
          },
        }}
        onClick={() => !isPlaylist && handleVideoClick(video)}
      >
        {/* Thumbnail con overlay */}
        <Box sx={{ position: 'relative' }}>
          <Box
            component="img"
            src={video.thumbnail}
            alt={video.title}
            sx={{
              width: '100%',
              height: 200,
              objectFit: 'cover',
              borderRadius: '12px 12px 0 0',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.8) 100%)',
              borderRadius: '12px 12px 0 0',
            }}
          />
          
          {/* Badges */}
          <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 1 }}>
            <Chip
              label={levelInfo.level}
              size="small"
              sx={{
                backgroundColor: levelInfo.color,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem',
              }}
            />
            {isCompleted && (
              <Chip
                icon={<CheckIcon sx={{ fontSize: '0.9rem' }} />}
                label="Completato"
                size="small"
                sx={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>
          
          {/* Play button overlay */}
          {!isPlaylist && (
            <IconButton
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#D4AF37',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  transform: 'translate(-50%, -50%) scale(1.1)',
                },
              }}
            >
              <PlayIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}
          
          {/* Duration */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
              {video.duration}
            </Typography>
          </Box>
        </Box>
        
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Category */}
          <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
            {category}
          </Typography>
          
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              color: '#D4AF37',
              fontWeight: 'bold',
              mb: 1,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {video.title}
          </Typography>
          
          {/* Description */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 2,
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {video.description || 'Nessuna descrizione disponibile.'}
          </Typography>
          
          {/* Stats */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: 16, color: '#D4AF37' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {new Date(video.publishedAt).toLocaleDateString('it-IT')}
              </Typography>
            </Box>
            {video.viewCount && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <YouTubeIcon sx={{ fontSize: 16, color: '#D4AF37' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {formatViewCount(video.viewCount)} views
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Progress Bar (se presente) */}
          {progress > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Progresso
                </Typography>
                <Typography variant="caption" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#D4AF37',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}
          
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                sx={{
                  color: '#D4AF37',
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Implementa funzione bookmark
                }}
              >
                <BookmarkIcon />
              </IconButton>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayIcon />}
              sx={{
                color: '#D4AF37',
                borderColor: '#D4AF37',
                fontWeight: 'bold',
                '&:hover': {
                  borderColor: '#F5E7A3',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleVideoClick(video);
              }}
            >
              Guarda
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const PlaylistCard = ({ playlist }) => (
    <Card
      sx={{
        height: '100%',
        backgroundColor: '#000000',
        border: '1px solid #D4AF37',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 8px 25px rgba(212, 175, 55, 0.3)',
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={playlist.thumbnail}
          alt={playlist.title}
          sx={{
            width: '100%',
            height: 200,
            objectFit: 'cover',
            borderRadius: '12px 12px 0 0',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
            p: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            {playlist.videoCount} video
          </Typography>
        </Box>
      </Box>
      
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            color: '#D4AF37',
            fontWeight: 'bold',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {playlist.title}
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {playlist.description || 'Raccolta di video su trading e investimenti.'}
        </Typography>
        
        <Button
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: '#D4AF37',
            color: '#000',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#F5E7A3',
            },
          }}
        >
          Esplora Playlist
        </Button>
      </CardContent>
    </Card>
  );

  const StatCard = ({ icon, title, value, color }) => (
    <Card
      sx={{
        backgroundColor: '#000000',
        border: '1px solid #D4AF37',
        borderRadius: 3,
        p: 2,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: color || '#D4AF37', mb: 1 }}>
        {icon}
      </Box>
      <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        {title}
      </Typography>
    </Card>
  );

  // Filtra video in base alla ricerca
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcola statistiche
  const totalVideos = videos.length;
  const completedVideos = Object.values(userProgress).filter(p => p.progress === 100).length;
  const totalHours = videos.reduce((acc, video) => {
    const minutes = parseInt(video.duration.match(/(\d+)m/)?.[1] || 0);
    return acc + minutes / 60;
  }, 0);

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: '#D4AF37',
            fontWeight: 'bold',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <SchoolIcon sx={{ fontSize: 40 }} />
          Video Corsi di Trading
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: 600,
          }}
        >
          Accedi alla nostra libreria completa di video corsi su trading, analisi tecnica e strategie di investimento.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Cerca video corsi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#D4AF37' }} />
              </InputAdornment>
            ),
            sx: {
              color: 'white',
              backgroundColor: '#1A1A1A',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D4AF37',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#F5E7A3',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D4AF37',
              },
            },
          }}
        />
      </Box>

      {/* Statistiche */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<YouTubeIcon sx={{ fontSize: 32 }} />}
            title="Video Disponibili"
            value={totalVideos}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckIcon sx={{ fontSize: 32 }} />}
            title="Video Completati"
            value={completedVideos}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TimeIcon sx={{ fontSize: 32 }} />}
            title="Ore di Contenuto"
            value={Math.round(totalHours)}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
            title="Playlist"
            value={playlists.length}
            color="#2196F3"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
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
          <Tab label="Video Recenti" />
          <Tab label="Playlist" />
          <Tab label="In Corso" />
          <Tab label="Completati" />
        </Tabs>
      </Box>

      {/* Content */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} lg={4} key={item}>
              <Card sx={{ backgroundColor: '#000000', border: '1px solid #D4AF37' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {selectedTab === 0 && filteredVideos.map((video) => (
            <Grid item xs={12} sm={6} lg={4} key={video.id}>
              <VideoCard video={video} />
            </Grid>
          ))}
          
          {selectedTab === 1 && playlists.map((playlist) => (
            <Grid item xs={12} sm={6} lg={4} key={playlist.id}>
              <PlaylistCard playlist={playlist} />
            </Grid>
          ))}
          
          {selectedTab === 2 && filteredVideos
            .filter(video => {
              const progress = userProgress[video.id]?.progress || 0;
              return progress > 0 && progress < 100;
            })
            .map((video) => (
              <Grid item xs={12} sm={6} lg={4} key={video.id}>
                <VideoCard video={video} />
              </Grid>
            ))}
          
          {selectedTab === 3 && filteredVideos
            .filter(video => userProgress[video.id]?.progress === 100)
            .map((video) => (
              <Grid item xs={12} sm={6} lg={4} key={video.id}>
                <VideoCard video={video} />
              </Grid>
            ))}
        </Grid>
      )}

      {/* Video Dialog */}
      <Dialog
        open={videoDialogOpen}
        onClose={handleCloseVideo}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#000000',
            border: '1px solid #D4AF37',
          },
        }}
      >
        <DialogTitle sx={{ color: '#D4AF37', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedVideo?.title}
          <IconButton onClick={handleCloseVideo} sx={{ color: '#D4AF37' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedVideo && (
            <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Corsi;