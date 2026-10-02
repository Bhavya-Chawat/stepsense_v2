import { Outlet, Navigate } from 'react-router-dom';
import { TopNav } from './TopNav';
import { useState, useEffect } from 'react';
import { createSupabaseClient, type User } from '@stepsense/supabase-client';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export function Layout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-page flex items-center justify-center">Loading...</div>;
  }

  // Require auth
  if (!user && supabase) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-page text-ink-primary flex flex-col font-sans transition-colors duration-300">
      <TopNav />
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
    </div>
  );
}
