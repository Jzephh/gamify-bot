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
  membershipStatus: 'none' | 'pending' | 'approved' | 'rejected';
  membershipRequestDate?: string;
  requestedMembershipId?: string;
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
    if (user.membershipStatus === 'pending') return 'Pending Approval';
    if (user.membershipStatus === 'rejected') return 'Rejected';
    if (user.membershipStatus === 'approved') {
      if (!user.freetimeStartDate || !user.freetimeEndDate) return 'Active';
      const now = new Date();
      const endDate = new Date(user.freetimeEndDate);
      if (now > endDate) return 'Expired';
      if (hasActiveFreeTime(user)) return 'Active';
      return 'Pending';
    }
    return 'No Free Time';
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, position: 'relative' }}>
          <Typography variant="h3" component="h1">
          Membership Dashboard
        </Typography>
          {isAdmin(user) && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AdminPanelSettings />}
              href="/admin"
              sx={{ 
                minWidth: 'auto',
                position: 'absolute',
                right: 0
              }}
            >
              Admin
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Star sx={{ color: '#FFD700', fontSize: 24 }} />
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Post success to earn points
        </Typography>
          <Star sx={{ color: '#FFD700', fontSize: 24 }} />
        </Box>
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

      {/* User Profile Hero Card */}
      <Card sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          transform: 'translate(50%, -50%)'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          transform: 'translate(-50%, 50%)'
        }} />
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              src={user.avatarUrl} 
              alt={user.name}
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            />
            <Box>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Welcome back, {user.name || user.username}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                @{user.username}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              flex: '1 1 250px', 
              minWidth: '250px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Star sx={{ fontSize: 32, mr: 1, color: '#FFD700' }} />
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#FFD700' }}>
                {user.points}
              </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Points Available
              </Typography>
            </Paper>
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center', 
              flex: '1 1 250px', 
              minWidth: '250px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px'
            }}>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={getFreeTimeStatus(user)}
                  color={
                    getFreeTimeStatus(user) === 'Active' ? 'success' :
                    getFreeTimeStatus(user) === 'Expired' ? 'error' :
                    getFreeTimeStatus(user) === 'Pending Approval' ? 'warning' :
                    getFreeTimeStatus(user) === 'Rejected' ? 'error' :
                    getFreeTimeStatus(user) === 'Pending' ? 'info' : 'default'
                  }
                  size="medium"
                  sx={{ 
                    fontSize: '1.1rem', 
                    py: 1.5,
                    px: 2,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Membership Status
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
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {memberships.map((membership, index) => {
            // Generate holographic color schemes for each membership card
            const holographicSchemes = [
              { 
                bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff8a80 100%)', 
                shadow: 'rgba(255, 107, 107, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(255, 107, 107, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 50%, #80e5d4 100%)', 
                shadow: 'rgba(78, 205, 196, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(78, 205, 196, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #9c88ff 100%)', 
                shadow: 'rgba(102, 126, 234, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(102, 126, 234, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ff9a9e 100%)', 
                shadow: 'rgba(240, 147, 251, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(240, 147, 251, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #80d8ff 100%)', 
                shadow: 'rgba(79, 172, 254, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(79, 172, 254, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #80f5d4 100%)', 
                shadow: 'rgba(67, 233, 123, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(67, 233, 123, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #ffb74d 100%)', 
                shadow: 'rgba(250, 112, 154, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(250, 112, 154, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #f8bbd9 100%)', 
                shadow: 'rgba(168, 237, 234, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(168, 237, 234, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #ffb3ba 100%)', 
                shadow: 'rgba(255, 154, 158, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(255, 154, 158, 0.6)'
              },
              { 
                bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ffd54f 100%)', 
                shadow: 'rgba(255, 236, 210, 0.4)',
                shimmer: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                glow: 'rgba(255, 236, 210, 0.6)'
              }
            ];
          
          const holographicScheme = holographicSchemes[index % holographicSchemes.length];
          
          return (
            <Box key={membership._id} sx={{ flex: '1 1 350px', minWidth: '350px', maxWidth: '400px' }}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                background: holographicScheme.bg,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                boxShadow: `0 20px 40px ${holographicScheme.shadow}, 0 0 20px ${holographicScheme.glow}`,
                border: `1px solid ${holographicScheme.glow}`,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '&:hover': {
                  transform: 'perspective(1000px) rotateX(5deg) translateY(-10px)',
                  boxShadow: `0 30px 60px ${holographicScheme.shadow}, 0 0 30px ${holographicScheme.glow}`,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: holographicScheme.shimmer,
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none',
                  zIndex: 1,
                },
                '&:hover::before': {
                  opacity: 1,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  background: `linear-gradient(45deg, ${holographicScheme.glow}, transparent, ${holographicScheme.glow})`,
                  borderRadius: 'inherit',
                  zIndex: -1,
                  opacity: 0.7,
                },
              }}>
              {/* Decorative Elements */}
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: '100px',
                height: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '50%'
              }} />
              
              <CardContent sx={{ flexGrow: 1, position: 'relative', zIndex: 1, p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    mb: 2,
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>
                    <img 
                      src="/logo.png" 
                      alt="Logo" 
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
                      }} 
                    />
                  </Box>
                  <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {membership.name}
                  </Typography>
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '25px',
                    px: 3,
                    py: 1,
                    mb: 2,
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}>
                    <img 
                      src="/logo.png" 
                      alt="Logo" 
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        objectFit: 'contain',
                        marginRight: '8px',
                        filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))'
                      }} 
                    />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {membership.cost} Points
                </Typography>
                  </Box>
              </Box>
              
                <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
                  {membership.description}
              </Typography>
              
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                    disabled={user.points < membership.cost || purchasing === membership._id}
                    onClick={() => purchaseMembership(membership._id)}
                    startIcon={purchasing === membership._id ? <CircularProgress size={20} /> : <img src="/logo.png" alt="Logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />}
                    sx={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '15px',
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.3)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 25px rgba(0,0,0,0.3)'
                      },
                      '&:disabled': {
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)'
                      }
                    }}
                  >
                    {purchasing === membership._id ? 'Processing...' : `Get ${membership.name}`}
                </Button>
                
                  {user.points < membership.cost && (
                    <Box sx={{
                      mt: 2,
                      p: 2,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                        You need {membership.cost - user.points} more points to unlock this!
                  </Typography>
                    </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
          );
        })}
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