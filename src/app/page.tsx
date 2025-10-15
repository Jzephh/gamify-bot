'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Paper
} from '@mui/material';
import {
  Star,
  StarBorder
} from '@mui/icons-material';

interface User {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  points: number;
  freeTimeEarned: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Fetch user data - authentication is handled by Whop SDK in the API
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch user data' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch user data' });
    } finally {
      setLoading(false);
    }
  };

  const purchaseMembership = async (type: '7days' | '1month') => {
    if (!user) return;
    
    setPurchasing(type);
    setMessage(null);
    
    try {
      const response = await fetch('/api/membership/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          membershipType: type,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        // Refresh user data
        fetchUser();
      } else {
        setMessage({ type: 'error', text: data.error || 'Purchase failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Purchase failed' });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          User not found. Please check your user ID.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Membership Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Use your points to purchase memberships
        </Typography>
      </Box>

      {/* User Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={user.avatarUrl} 
              alt={user.name}
              sx={{ width: 56, height: 56, mr: 2 }}
            />
            <Box>
              <Typography variant="h5" component="h2">
                {user.name || user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="h4" color="primary">
                {user.points}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Points Available
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="h4" color="secondary">
                {user.freeTimeEarned}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Free Time Earned
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Message Alert */}
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Membership Options */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* 7 Days Free Membership */}
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Star color="primary" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  7 Days Free
                </Typography>
                <Chip 
                  label="50 Points" 
                  color="primary" 
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get 7 days of free membership access to all premium features.
              </Typography>
              
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={user.points < 50 || purchasing === '7days'}
                  onClick={() => purchaseMembership('7days')}
                  startIcon={purchasing === '7days' ? <CircularProgress size={20} /> : <StarBorder />}
                >
                  {purchasing === '7days' ? 'Purchasing...' : 'Purchase 7 Days'}
                </Button>
                
                {user.points < 50 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Insufficient points. Need {50 - user.points} more points.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 1 Month Free Membership */}
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Star color="secondary" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  1 Month Free
                </Typography>
                <Chip 
                  label="150 Points" 
                  color="secondary" 
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get 1 month of free membership access to all premium features.
              </Typography>
              
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  size="large"
                  disabled={user.points < 150 || purchasing === '1month'}
                  onClick={() => purchaseMembership('1month')}
                  startIcon={purchasing === '1month' ? <CircularProgress size={20} /> : <Star />}
                >
                  {purchasing === '1month' ? 'Purchasing...' : 'Purchase 1 Month'}
                </Button>
                
                {user.points < 150 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Insufficient points. Need {150 - user.points} more points.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Instructions */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          How it works:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. Earn points by participating in the community (posting images, etc.)<br/>
          2. Use your points to purchase free memberships<br/>
          3. Memberships give you access to premium features<br/>
          4. Points are automatically deducted when you make a purchase
        </Typography>
      </Box>
    </Container>
  );
}