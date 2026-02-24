import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Search, 
  Users, 
  Eye, 
  Calendar, 
  Mail, 
  Shield, 
  UserPlus, 
  KeyRound,
  UserCog,
  Trash2,
  AlertTriangle,
  Check
} from 'lucide-react';

const AdminUsers = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  
  // Edit role modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleUser, setRoleUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  
  // Reset password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Delete user modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [token, searchQuery, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(
        token, 
        0, 
        50, 
        searchQuery, 
        roleFilter === 'all' ? '' : roleFilter
      );
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (userId) => {
    setSelectedUser(userId);
    setDetailsLoading(true);
    try {
      const data = await adminApi.getUserDetails(userId, token);
      setUserDetails(data);
    } catch (err) {
      console.error('Failed to load user details:', err);
      toast.error('Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    
    try {
      await adminApi.createUser(createForm, token);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      console.error('Create user error:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to create user';
      setCreateError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setCreateLoading(false);
    }
  };

  // Update role
  const openRoleModal = (user) => {
    setRoleUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!roleUser || newRole === roleUser.role) return;
    
    setRoleLoading(true);
    try {
      await adminApi.updateUserRole(roleUser.id, newRole, token);
      toast.success(`Role updated to ${newRole}`);
      setShowRoleModal(false);
      loadUsers();
    } catch (err) {
      console.error('Update role error:', err);
      toast.error(err.response?.data?.detail || 'Failed to update role');
    } finally {
      setRoleLoading(false);
    }
  };

  // Reset password
  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setNewPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!passwordUser || !newPassword) return;
    
    // Validate password
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError('Password must contain at least one digit');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError('');
    try {
      await adminApi.resetUserPassword(passwordUser.id, newPassword, token);
      toast.success('Password reset successfully');
      setShowPasswordModal(false);
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to reset password';
      setPasswordError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setPasswordLoading(false);
    }
  };

  // Delete user
  const openDeleteModal = (user) => {
    setDeleteUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    
    setDeleteLoading(true);
    try {
      await adminApi.deleteUser(deleteUser.id, token);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      loadUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div data-testid="admin-users">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600">Create, edit, and manage all users</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-dark"
          data-testid="create-user-btn"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Users ({users.length})
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-users-input"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32" data-testid="role-filter">
                <SelectValue placeholder="Filter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{user.health_records_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewUserDetails(user.id)}
                          data-testid={`view-user-${user.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRoleModal(user)}
                          data-testid={`edit-role-${user.id}`}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPasswordModal(user)}
                          data-testid={`reset-password-${user.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(user)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={user.id === currentUser?.id}
                          data-testid={`delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">
              No users found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Create New User
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              {createError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{createError}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  data-testid="create-user-name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                  data-testid="create-user-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Min 8 chars, uppercase, lowercase, digit"
                  required
                  data-testid="create-user-password"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Must be 8+ chars with uppercase, lowercase, and digit
                </p>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={createForm.role} 
                  onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
                >
                  <SelectTrigger data-testid="create-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading} data-testid="create-user-submit">
                {createLoading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Change User Role
            </DialogTitle>
            <DialogDescription>
              Change role for: <strong>{roleUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-2" data-testid="edit-role-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {roleUser?.id === currentUser?.id && newRole === 'user' && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Warning: You cannot remove your own admin role
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole} 
              disabled={roleLoading || newRole === roleUser?.role || (roleUser?.id === currentUser?.id && newRole === 'user')}
              data-testid="edit-role-submit"
            >
              {roleLoading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Reset password for: <strong>{passwordUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {passwordError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{passwordError}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                data-testid="reset-password-input"
              />
              <p className="text-xs text-slate-500 mt-1">
                Must be 8+ chars with uppercase, lowercase, and digit
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={passwordLoading || !newPassword}
              data-testid="reset-password-submit"
            >
              {passwordLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user: <strong>{deleteUser?.email}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              All user data including health records, image analyses, and chat sessions will be retained but orphaned.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser} 
              disabled={deleteLoading}
              data-testid="delete-user-submit"
            >
              {deleteLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userDetails && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {userDetails.user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{userDetails.user?.name}</h3>
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Mail className="h-4 w-4" />
                      {userDetails.user?.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(userDetails.user?.created_at)}
                    </div>
                    <Badge 
                      variant={userDetails.user?.role === 'admin' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {userDetails.user?.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {userDetails.user?.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{userDetails.health_records?.length || 0}</p>
                  <p className="text-sm text-slate-600">Health Records</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{userDetails.image_analyses?.length || 0}</p>
                  <p className="text-sm text-slate-600">Image Analyses</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{userDetails.chat_sessions?.length || 0}</p>
                  <p className="text-sm text-slate-600">Chat Sessions</p>
                </div>
              </div>

              {/* Recent Records */}
              {userDetails.health_records?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Health Records</h4>
                  <div className="space-y-2">
                    {userDetails.health_records.slice(0, 3).map((record, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{record.full_name}</p>
                          <p className="text-sm text-slate-500">BMI: {record.bmi} • {record.bmi_category}</p>
                        </div>
                        <Badge variant={record.risk_level === 'High' ? 'destructive' : record.risk_level === 'Moderate' ? 'warning' : 'success'}>
                          {record.risk_level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
