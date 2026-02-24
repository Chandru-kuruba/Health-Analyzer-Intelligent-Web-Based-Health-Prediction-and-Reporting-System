import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  HeartPulse, 
  User, 
  LogOut, 
  LayoutDashboard,
  History,
  Settings,
  Menu,
  X,
  ScanLine,
  MessageCircle,
  Shield
} from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 w-full z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <HeartPulse className="h-6 w-6 text-primary" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900">
              Health<span className="text-primary">Analyzer</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-slate-600 hover:text-primary transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/assess" 
                  className="text-slate-600 hover:text-primary transition-colors font-medium"
                >
                  New Assessment
                </Link>
                <Link 
                  to="/history" 
                  className="text-slate-600 hover:text-primary transition-colors font-medium"
                >
                  History
                </Link>
                <Link 
                  to="/image-analysis" 
                  className="text-slate-600 hover:text-primary transition-colors font-medium"
                  data-testid="nav-image-analysis"
                >
                  Image Analysis
                </Link>
                <Link 
                  to="/chat" 
                  className="text-slate-600 hover:text-primary transition-colors font-medium"
                  data-testid="nav-chat"
                >
                  Health Chat
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-btn">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-slate-700">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm text-slate-500">
                      {user?.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/history')}>
                      <History className="mr-2 h-4 w-4" />
                      Report History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-slate-600 hover:text-primary transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-primary hover:bg-primary-dark text-white"
                  data-testid="get-started-btn"
                >
                  Get Started
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <Link 
                  to="/dashboard" 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/assess" 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New Assessment
                </Link>
                <Link 
                  to="/history" 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  History
                </Link>
                <Link 
                  to="/image-analysis" 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Image Analysis
                </Link>
                <Link 
                  to="/chat" 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Health Chat
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin/dashboard" 
                    className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <hr className="border-slate-200" />
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-primary text-white rounded-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
