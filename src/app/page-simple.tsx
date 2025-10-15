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
    } catch (error) {
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
    } catch (error) {
      setMessage({ type: 'error', text: 'Purchase failed' });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" style={{ marginTop: '1rem' }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" style={{ marginTop: '2rem' }}>
        <Alert severity="error">
          User not found. Please check your user ID.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <Box style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Membership Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Use your points to purchase memberships
        </Typography>
      </Box>

      {/* User Info Card */}
      <Card style={{ marginBottom: '2rem' }}>
        <CardContent>
          <Box style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Avatar 
              src={user.avatarUrl} 
              alt={user.name}
              style={{ width: 56, height: 56, marginRight: '1rem' }}
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
          
          <Box style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Paper style={{ padding: '1rem', textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
              <Typography variant="h4" color="primary">
                {user.points}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Points Available
              </Typography>
            </Paper>
            <Paper style={{ padding: '1rem', textAlign: 'center', flex: '1 1 200px', minWidth: '200px' }}>
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
          style={{ marginBottom: '1.5rem' }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* Membership Options */}
      <Box style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* 7 Days Free Membership */}
        <Box style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ flexGrow: 1 }}>
              <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Star color="primary" style={{ fontSize: 48, marginBottom: '0.5rem' }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  7 Days Free
                </Typography>
                <Chip 
                  label="50 Points" 
                  color="primary" 
                  variant="outlined"
                  style={{ marginBottom: '1rem' }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" style={{ marginBottom: '1.5rem' }}>
                Get 7 days of free membership access to all premium features.
              </Typography>
              
              <Box style={{ marginTop: 'auto' }}>
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
                  <Typography variant="caption" color="error" style={{ marginTop: '0.5rem', display: 'block' }}>
                    Insufficient points. Need {50 - user.points} more points.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 1 Month Free Membership */}
        <Box style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ flexGrow: 1 }}>
              <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Star color="secondary" style={{ fontSize: 48, marginBottom: '0.5rem' }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  1 Month Free
                </Typography>
                <Chip 
                  label="150 Points" 
                  color="secondary" 
                  variant="outlined"
                  style={{ marginBottom: '1rem' }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" style={{ marginBottom: '1.5rem' }}>
                Get 1 month of free membership access to all premium features.
              </Typography>
              
              <Box style={{ marginTop: 'auto' }}>
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
                  <Typography variant="caption" color="error" style={{ marginTop: '0.5rem', display: 'block' }}>
                    Insufficient points. Need {150 - user.points} more points.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Instructions */}
      <Box style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
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
