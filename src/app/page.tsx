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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Star,
  StarBorder,
  CheckCircle,
  Close,
  AdminPanelSettings,
  People,
  Settings
} from '@mui/icons-material';

interface User {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  points: number;
  freetimeStartDate?: string;
  freetimeEndDate?: string;
  roles: string[];
}

interface Membership {
  _id: string;
  name: string;
  description: string;
  duration: number;
  cost: number;
  isActive: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    membershipType: string;
    remainingPoints: number;
    freetimeStartDate?: string;
    freetimeEndDate?: string;
  } | null>(null);

  // Helper function to check if user has active free time
  const hasActiveFreeTime = (user: User) => {
    if (!user.freetimeStartDate || !user.freetimeEndDate) return false;
    const now = new Date();
    const startDate = new Date(user.freetimeStartDate);
    const endDate = new Date(user.freetimeEndDate);
    return now >= startDate && now <= endDate;
  };

  // Helper function to get free time status text
  const getFreeTimeStatus = (user: User) => {
    if (!user.freetimeStartDate || !user.freetimeEndDate) return 'No Free Time';
    const now = new Date();
    const endDate = new Date(user.freetimeEndDate);
    if (now > endDate) return 'Expired';
    if (hasActiveFreeTime(user)) return 'Active';
    return 'Pending';
  };

  // Helper function to check if user is admin
  const isAdmin = (user: User) => {
    return user.roles && user.roles.includes('admin');
  };

  useEffect(() => {
    // Fetch user data - authentication is handled by Whop SDK in the API
    fetchUser();
    fetchMemberships();
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

  const fetchMemberships = async () => {
    try {
      const response = await fetch('/api/memberships');
      const data = await response.json();
      
      if (response.ok) {
        setMemberships(data);
      } else {
        console.error('Failed to fetch memberships:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    }
  };

  const purchaseMembership = async (membershipId: string) => {
    if (!user) return;
    
    setPurchasing(membershipId);
    setMessage(null);
    
    try {
      const response = await fetch('/api/membership/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          membershipType: membershipId,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store purchase details for modal
        setPurchaseDetails({
          membershipType: data.membershipType,
          remainingPoints: data.remainingPoints,
          freetimeStartDate: data.freetimeStartDate,
          freetimeEndDate: data.freetimeEndDate
        });
        
        // Show success modal
        setShowSuccessModal(true);
        
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box />
          <Typography variant="h3" component="h1">
            Membership Dashboard
          </Typography>
          {isAdmin(user) && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AdminPanelSettings />}
              href="/admin"
              sx={{ minWidth: 'auto' }}
            >
              Admin
            </Button>
          )}
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Use your points to purchase memberships
        </Typography>
      </Box>

      {/* Admin Dashboard Card */}
      {isAdmin(user) && (
        <Card sx={{ mb: 4, background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminPanelSettings sx={{ fontSize: 32, mr: 2, color: 'white' }} />
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Admin Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Manage users, memberships, and system settings
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                color="inherit"
                size="large"
                startIcon={<AdminPanelSettings />}
                href="/admin"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                Go to Admin Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

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
                {getFreeTimeStatus(user)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Free Time Status
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
        {memberships.map((membership, index) => (
          <Box key={membership._id} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Star 
                    color={index === 0 ? 'primary' : 'secondary'} 
                    sx={{ fontSize: 48, mb: 1 }} 
                  />
                  <Typography variant="h5" component="h3" gutterBottom>
                    {membership.name}
                  </Typography>
                  <Chip 
                    label={`${membership.cost} Points`} 
                    color={index === 0 ? 'primary' : 'secondary'} 
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {membership.description}
                </Typography>
                
                <Box sx={{ mt: 'auto' }}>
                  <Button
                    variant="contained"
                    color={index === 0 ? 'primary' : 'secondary'}
                    fullWidth
                    size="large"
                    disabled={user.points < membership.cost || purchasing === membership._id}
                    onClick={() => purchaseMembership(membership._id)}
                    startIcon={purchasing === membership._id ? <CircularProgress size={20} /> : <StarBorder />}
                  >
                    {purchasing === membership._id ? 'Purchasing...' : `Purchase ${membership.name}`}
                  </Button>
                  
                  {user.points < membership.cost && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      Insufficient points. Need {membership.cost - user.points} more points.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Success Modal */}
      <Dialog 
        open={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          Purchase Successful!
          <IconButton
            onClick={() => setShowSuccessModal(false)}
            sx={{ ml: 'auto' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {purchaseDetails && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6">
                  Congratulations! Your free time membership has been activated.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {purchaseDetails.membershipType === '7days' ? '7 Days' : '1 Month'} Free Time
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valid from {new Date(purchaseDetails.freetimeStartDate || '').toLocaleDateString()} 
                  {' '}to {new Date(purchaseDetails.freetimeEndDate || '').toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Remaining Points:</strong> {purchaseDetails.remainingPoints}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                You now have access to all premium features during your free time period!
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setShowSuccessModal(false)}
            variant="contained"
            color="primary"
            fullWidth
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}