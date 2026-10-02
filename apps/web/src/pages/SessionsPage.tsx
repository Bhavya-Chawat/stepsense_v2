import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createSupabaseClient, getUserSessions, getSessionSummary, type User } from '@stepsense/supabase-client';
import type { Session, SessionSummary } from '@stepsense/types';
import { Activity, Calendar, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { isDemoModeEnabled, getMockSessions } from '../lib/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

interface SessionWithSummary {
  session: Session;
  summary: SessionSummary | null;
}

export function SessionsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionWithSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login');
      } else {
        setUser(data.user);
        loadSessions(data.user.id);
      }
    });
  }, [navigate]);

  async function loadSessions(userId: string) {
    if (isDemoModeEnabled()) {
      const mock = getMockSessions();
      setSessions(mock.map(m => ({ session: m as any, summary: m })));
      setLoading(false);
      return;
    }
    if (!supabase) return;
    try {
      setLoading(true);
      const userSessions = await getUserSessions(supabase, userId, 50);
      
      const sessionData: SessionWithSummary[] = await Promise.all(
        userSessions.map(async (s) => {
          try {
            const summary = await getSessionSummary(supabase, s.id);
            return { session: s, summary };
          } catch (sumErr) {
            return { session: s, summary: null };
          }
        })
      );

      setSessions(sessionData);
    } catch (err) {
      console.error('[DEBUG] Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!supabase || !user || isDemoModeEnabled()) return;

    const channel = supabase
      .channel('sessions_page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session' },
        () => loadSessions(user.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_summary' },
        () => loadSessions(user.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="p-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-6 animate-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <p className="section-label mb-1">Clinical History</p>
            <h1 className="text-2xl font-bold text-ink-primary">All Sessions</h1>
            <p className="text-sm text-ink-secondary mt-1">Detailed EMR-style log of patient activity.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-ink-secondary text-sm">Loading historical sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="card p-8 text-center text-ink-secondary text-sm">
            No completed sessions found. Complete a walk to record data.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-card-subtle border-b border-border text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">
                    <th className="p-4 pl-6">Date & Time</th>
                    <th className="p-4">Session ID</th>
                    <th className="p-4">Gait Score</th>
                    <th className="p-4">Fatigue Level</th>
                    <th className="p-4">Risk Flags</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sessions.map(({ session, summary }, index) => {
                    const s = summary as any;
                    const fatigueBad = s?.fatigue_bucket === 'Severe';
                    
                    const flags = [];
                    if (s?.fall_risk_score >= 60) flags.push('Fall Risk');
                    if (s?.joint_strain_severity === 'HIGH') flags.push('Joint Strain');
                    if (s?.vascular_risk_score >= 60) flags.push('Vascular');
                    if (s?.shoe_bite_detected) flags.push('Shoe Bite');
                    if (s?.tremor_flag) flags.push('Tremor');

                    return (
                      <tr 
                        key={session.id} 
                        onClick={() => navigate(`/sessions/${session.id}`)}
                        className="hover:bg-page transition-colors cursor-pointer group animate-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="p-4 pl-6 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-tealMuted flex items-center justify-center flex-shrink-0">
                              <Activity size={14} className="text-accent-teal" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-ink-primary flex items-center space-x-1.5">
                                <Calendar size={12} className="text-ink-tertiary" />
                                <span>{new Date(session.started_at).toLocaleDateString()}</span>
                              </div>
                              <div className="text-[11px] text-ink-secondary flex items-center space-x-1.5 mt-0.5">
                                <Clock size={12} className="text-ink-tertiary" />
                                <span>{new Date(session.started_at).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-ink-secondary">
                          {session.id.substring(0, 8)}
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-bold text-ink-primary">
                            {s?.gait_score ?? '—'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${fatigueBad ? 'text-status-critical' : 'text-status-good'}`}>
                            {s?.fatigue_bucket ?? 'Normal'}
                          </span>
                        </td>
                        <td className="p-4">
                          {flags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {flags.map((flag, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-status-critical/10 border border-status-critical/20 text-status-critical text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  {flag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-ink-tertiary">None</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <ChevronRight size={16} className="text-accent-teal opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
