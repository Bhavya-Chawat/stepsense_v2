import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createSupabaseClient } from '@stepsense/supabase-client';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);

    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      navigate('/sessions');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 text-ink-primary font-sans">
      <div className="bg-card p-8 rounded-lg border border-border shadow-none-none w-full max-w-md">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="StepSense Logo" className="h-16 w-auto object-contain bg-white rounded-lg p-2" />
        </div>
        <h1 className="text-2xl font-bold font-sans text-accent-teal mb-2 text-center">StepSense</h1>
        <p className="text-sm text-ink-secondary text-center mb-6">Sign in to your account</p>

        {error && (
          <div className="p-3 mb-4 text-xs bg-status-critical/10 text-status-critical rounded border border-status-critical/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-page border border-border rounded focus:outline-none focus:border-accent-teal"
              placeholder="bhavya@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-page border border-border rounded focus:outline-none focus:border-accent-teal"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-accent-teal text-white text-sm font-semibold rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-ink-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent-teal font-semibold underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
