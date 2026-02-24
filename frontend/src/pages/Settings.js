import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  User, 
  Bell, 
  Shield,
  Save,
  Key,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const { user, token } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reportReminders, setReportReminders] = useState(false);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      await axios.post(
        `${API_URL}/api/auth/change-password?token=${token}`,
        {
          current_password: currentPassword,
          new_password: newPassword
        }
      );
      
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="pt-24 pb-16" data-testid="settings-page">
        <div className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-heading font-bold text-slate-900">
              Settings
            </h1>
            <p className="mt-1 text-slate-600">
              Manage your account preferences
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        defaultValue={user?.name}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Configure how you receive updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Email Notifications</p>
                      <p className="text-sm text-slate-500">Receive health reports via email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Assessment Reminders</p>
                      <p className="text-sm text-slate-500">Monthly reminders for health check-ups</p>
                    </div>
                    <Switch
                      checked={reportReminders}
                      onCheckedChange={setReportReminders}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showPasswordForm ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Password</p>
                        <p className="text-sm text-slate-500">Change your account password</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowPasswordForm(true)}
                        data-testid="change-password-btn"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            data-testid="current-password-input"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            data-testid="new-password-input"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          data-testid="confirm-password-input"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={changingPassword}
                          className="bg-primary hover:bg-primary-dark"
                          data-testid="submit-password-change"
                        >
                          {changingPassword ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                  
                  <Separator />
                  
                  <div>
                    <p className="font-medium text-slate-900 mb-2">Account Created</p>
                    <p className="text-sm text-slate-500">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Unknown'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-end"
            >
              <Button 
                onClick={handleSave}
                className="bg-primary hover:bg-primary-dark"
                data-testid="save-settings-btn"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
