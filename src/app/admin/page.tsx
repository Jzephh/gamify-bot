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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Add,
  AdminPanelSettings,
  People,
  Star,
  Settings,
  Group
} from '@mui/icons-material';

interface User {
  _id: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  points: number;
  freetimeStartDate?: string;
  freetimeEndDate?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface Membership {
  _id: string;
  name: string;
  duration: number; // in days
  cost: number; // in points
  description: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPoints, setEditingPoints] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [newMembership, setNewMembership] = useState({
    name: '',
    description: '',
    duration: 7,
    cost: 50,
    isActive: true
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUser();
    fetchUsers();
    fetchMemberships();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      
      if (response.ok) {
        setUser(data);
        if (!data.roles?.includes('admin')) {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    } catch {
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch users' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    }
  };

  const fetchMemberships = async () => {
    try {
      const response = await fetch('/api/admin/memberships');
      const data = await response.json();
      
      if (response.ok) {
        setMemberships(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch memberships' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch memberships' });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditingPoints(user.points);
    setShowEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.userId,
          points: editingPoints,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'User updated successfully' });
        fetchUsers();
        setShowEditDialog(false);
        setEditingUser(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update user' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update user' });
    }
  };

  const handleCreateMembership = async () => {
    try {
      const response = await fetch('/api/admin/memberships/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMembership),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Membership created successfully' });
        fetchMemberships();
        setShowMembershipDialog(false);
        setNewMembership({ name: '', description: '', duration: 7, cost: 50, isActive: true });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create membership' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create membership' });
    }
  };

  const handleEditMembership = (membership: Membership) => {
    setEditingMembership(membership);
    setShowMembershipDialog(true);
  };

  const handleUpdateMembership = async () => {
    if (!editingMembership) return;

    try {
      const response = await fetch('/api/admin/memberships', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: editingMembership._id,
          name: editingMembership.name,
          description: editingMembership.description,
          duration: editingMembership.duration,
          cost: editingMembership.cost,
          isActive: editingMembership.isActive,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Membership updated successfully' });
        fetchMemberships();
        setShowMembershipDialog(false);
        setEditingMembership(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update membership' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update membership' });
    }
  };

  const handleDeleteMembership = async (membershipId: string) => {
    if (!confirm('Are you sure you want to delete this membership?')) return;

    try {
      const response = await fetch(`/api/admin/memberships?id=${membershipId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Membership deleted successfully' });
        fetchMemberships();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete membership' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete membership' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFreeTimeStatus = (user: User) => {
    if (!user.freetimeStartDate || !user.freetimeEndDate) return 'No Free Time';
    const now = new Date();
    const endDate = new Date(user.freetimeEndDate);
    if (now > endDate) return 'Expired';
    const startDate = new Date(user.freetimeStartDate);
    if (now >= startDate && now <= endDate) return 'Active';
    return 'Pending';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Container>
    );
  }

  if (!user || !user.roles?.includes('admin')) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => window.location.href = '/'}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings color="primary" />
          <Typography variant="h4" component="h1">
            Admin Dashboard
          </Typography>
        </Box>
      </Box>

      {/* Message Alert */}
      {message && (
        <Alert 
          severity={message.type} 
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People color="primary" />
              <Typography variant="h6">Total Users</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {users.length}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star color="secondary" />
              <Typography variant="h6">Total Points</Typography>
            </Box>
            <Typography variant="h3" color="secondary">
              {users.reduce((sum, user) => sum + user.points, 0)}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminPanelSettings color="success" />
              <Typography variant="h6">Active Memberships</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {users.filter(user => getFreeTimeStatus(user) === 'Active').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content with Sidebar */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left Sidebar - Tabs */}
        <Card sx={{ width: 250, height: 'fit-content' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            orientation="vertical"
            sx={{ borderRight: 1, borderColor: 'divider', minHeight: 400 }}
          >
            <Tab 
              icon={<Group />} 
              label="Users" 
              iconPosition="start"
              sx={{ textTransform: 'none', justifyContent: 'flex-start', px: 3 }}
            />
            <Tab 
              icon={<Star />} 
              label="Memberships" 
              iconPosition="start"
              sx={{ textTransform: 'none', justifyContent: 'flex-start', px: 3 }}
            />
          </Tabs>
        </Card>

        {/* Right Content */}
        <Box sx={{ flex: 1 }}>
          {/* Tab Content */}
          {activeTab === 0 && (
        <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Points</TableCell>
                  <TableCell>Free Time Status</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Expire Date</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={user.avatarUrl} sx={{ width: 32, height: 32 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {user.points}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getFreeTimeStatus(user)}
                        color={
                          getFreeTimeStatus(user) === 'Active' ? 'success' :
                          getFreeTimeStatus(user) === 'Expired' ? 'error' :
                          getFreeTimeStatus(user) === 'Pending' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.freetimeStartDate ? formatDate(user.freetimeStartDate) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.freetimeEndDate ? formatDate(user.freetimeEndDate) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.roles?.map((role) => (
                        <Chip key={role} label={role} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditUser(user)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        </Card>
      )}

      {/* Memberships Tab */}
      {activeTab === 1 && (
        <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Membership Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingMembership(null);
                setNewMembership({ name: '', description: '', duration: 7, cost: 50, isActive: true });
                setShowMembershipDialog(true);
              }}
            >
              Add Membership
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Duration (Days)</TableCell>
                  <TableCell>Cost (Points)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memberships.map((membership) => (
                  <TableRow key={membership._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {membership.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {membership.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {membership.duration}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {membership.cost}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={membership.isActive ? 'Active' : 'Inactive'}
                        color={membership.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditMembership(membership)}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteMembership(membership._id)}
                        color="error"
                        size="small"
                      >
                        <Cancel />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        </Card>
      )}
        </Box>
      </Box>


      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit User Points
        </DialogTitle>
        <DialogContent>
          {editingUser && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Avatar src={editingUser.avatarUrl} />
                <Box>
                  <Typography variant="h6">{editingUser.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{editingUser.username}
                  </Typography>
                </Box>
              </Box>
              
              <TextField
                label="Points"
                type="number"
                value={editingPoints}
                onChange={(e) => setEditingPoints(parseInt(e.target.value) || 0)}
                fullWidth
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button onClick={handleSaveUser} variant="contained" startIcon={<Save />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Membership Dialog */}
      <Dialog open={showMembershipDialog} onClose={() => setShowMembershipDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMembership ? 'Edit Membership' : 'Create New Membership'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              value={editingMembership?.name || newMembership.name}
              onChange={(e) => {
                if (editingMembership) {
                  setEditingMembership({ ...editingMembership, name: e.target.value });
                } else {
                  setNewMembership({ ...newMembership, name: e.target.value });
                }
              }}
              fullWidth
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Description"
              value={editingMembership?.description || newMembership.description}
              onChange={(e) => {
                if (editingMembership) {
                  setEditingMembership({ ...editingMembership, description: e.target.value });
                } else {
                  setNewMembership({ ...newMembership, description: e.target.value });
                }
              }}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Duration (Days)"
                type="number"
                value={editingMembership?.duration || newMembership.duration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  if (editingMembership) {
                    setEditingMembership({ ...editingMembership, duration: value });
                  } else {
                    setNewMembership({ ...newMembership, duration: value });
                  }
                }}
                sx={{ flex: 1 }}
              />
              
              <TextField
                label="Cost (Points)"
                type="number"
                value={editingMembership?.cost || newMembership.cost}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (editingMembership) {
                    setEditingMembership({ ...editingMembership, cost: value });
                  } else {
                    setNewMembership({ ...newMembership, cost: value });
                  }
                }}
                sx={{ flex: 1 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                checked={editingMembership?.isActive ?? newMembership.isActive}
                onChange={(e) => {
                  if (editingMembership) {
                    setEditingMembership({ ...editingMembership, isActive: e.target.checked });
                  } else {
                    setNewMembership({ ...newMembership, isActive: e.target.checked });
                  }
                }}
              />
              <Typography variant="body2">Active</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMembershipDialog(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button 
            onClick={editingMembership ? handleUpdateMembership : handleCreateMembership} 
            variant="contained" 
            startIcon={<Save />}
          >
            {editingMembership ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
