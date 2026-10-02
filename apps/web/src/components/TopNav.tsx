import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, User, Sun, Moon, LogOut, Beaker } from 'lucide-react';
import { createSupabaseClient } from '@stepsense/supabase-client';
import { isDemoModeEnabled, setDemoModeEnabled } from '../lib/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [demoMode, setDemoModeState] = useState(isDemoModeEnabled());

  const handleDemoToggle = () => {
    const newVal = !demoMode;
    setDemoModeState(newVal);
    setDemoModeEnabled(newVal);
    // Reload to apply demo mode globally simply
    window.location.reload();
  };

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'All Sessions', icon: Activity, path: '/sessions' },
    { label: 'Patient Profile', icon: User, path: '/profile' },
  ];

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 glass">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3">
          <img src="/logo.png" alt="StepSense Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
          <div>
            <h1 className="text-base font-bold text-ink-primary tracking-tight">StepSense</h1>
            <p className="text-[10px] text-ink-tertiary uppercase tracking-widest font-medium">Clinical</p>
          </div>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map(item => {
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-accent-tealMuted text-accent-teal font-semibold' : 'text-ink-secondary hover:text-ink-primary hover:bg-border/30'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Nav */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDemoToggle}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              demoMode ? 'bg-status-critical/10 text-status-critical' : 'bg-page border border-border text-ink-secondary hover:text-ink-primary'
            }`}
            title="Toggle Demo Mode"
          >
            <Beaker size={14} />
            <span>{demoMode ? 'DEMO ON' : 'DEMO OFF'}</span>
          </button>
          
          <div className="h-5 w-px bg-border"></div>

          <button
            onClick={() => setDark(d => !d)}
            className="p-2 text-ink-secondary hover:text-ink-primary hover:bg-border/30 rounded-lg transition-colors"
            title="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="h-5 w-px bg-border"></div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-sm font-medium text-ink-secondary hover:text-status-critical transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
