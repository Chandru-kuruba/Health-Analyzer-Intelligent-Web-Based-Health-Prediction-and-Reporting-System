import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { HeartPulse, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Passwords match', met: password === confirmPassword && confirmPassword.length > 0 }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Panel - Image */}
      <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h2 className="text-4xl font-heading font-bold mb-4">
            Take Control of Your Health
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Create your free account and start your journey to better health 
            with personalized insights and comprehensive analysis.
          </p>
          <ul className="mt-8 space-y-3">
            {['Comprehensive health analysis', 'AI-powered image detection', 'PDF report generation', 'Secure data handling'].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-200" />
                <span className="text-blue-100">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full transform -translate-x-1/3 -translate-y-1/3"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <HeartPulse className="h-6 w-6 text-primary" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900">
              Health<span className="text-primary">Analyzer</span>
            </span>
          </Link>

          <Card className="border-slate-200 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-heading">Create an account</CardTitle>
              <CardDescription>
                Enter your information to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-password-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="register-confirm-password-input"
                    />
                  </div>
                </div>

                {/* Password requirements */}
                <div className="space-y-2">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${req.met ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle2 className="h-4 w-4" />
                      {req.label}
                    </div>
                  ))}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-dark"
                  disabled={loading}
                  data-testid="register-submit-btn"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-xs text-slate-500 text-center">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
