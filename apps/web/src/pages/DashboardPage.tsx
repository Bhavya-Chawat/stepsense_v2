import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Settings, ShieldAlert, ArrowRight } from 'lucide-react';
import { createSupabaseClient } from '@stepsense/supabase-client';
import type { SessionSummary } from '@stepsense/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { isDemoModeEnabled, getMockSessions } from '../lib/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (isDemoModeEnabled()) {
        setSessions(getMockSessions());
        setLoading(false);
        return;
      }
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('session_summary')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setSessions(data as SessionSummary[]);
      setLoading(false);
    }
    loadData();

    if (!isDemoModeEnabled() && supabase) {
      const channel = supabase
        .channel('dashboard_sessions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'session_summary' },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const totalSessions = sessions.length;
  const avgGaitScore = totalSessions
    ? Math.round(sessions.reduce((acc, s) => acc + (s.gait_score ?? 0), 0) / totalSessions)
    : 0;
  
  // A session is considered high risk if fall risk or vascular risk is >= 60
  const highRiskSessions = sessions.filter(
    s => ((s as any).fall_risk_score ?? 0) >= 60 || ((s as any).vascular_risk_score ?? 0) >= 60
  ).length;

  // Prepare chart data: we want chronological order for the chart
  const chartData = [...sessions]
    .reverse()
    .slice(-14) // take last 14 sessions
    .map((s, i) => {
      const date = new Date(s.created_at);
      return {
        name: `${date.getMonth() + 1}/${date.getDate()}`,
        score: s.gait_score || 0,
        fullDate: date.toLocaleDateString(),
      };
    });

  return (
    <div className="p-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-8 animate-in">

        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="section-label mb-1">Clinical Dashboard</p>
            <h2 className="text-2xl font-bold text-ink-primary">Patient Overview</h2>
            <p className="text-sm text-ink-secondary mt-1">Biomechanical analysis, trends, and risk indicators.</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="btn-ghost text-xs border border-border"
          >
            <Settings size={13} />
            <span>Configure Patient</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Sessions"
            value={String(totalSessions)}
            icon={<FileText size={18} className="text-accent-teal" />}
            accent="teal"
          />
          <StatCard
            label="Avg Gait Score"
            value={`${avgGaitScore}`}
            suffix="/100"
            icon={<Activity size={18} className="text-status-good" />}
            accent="good"
          />
          <StatCard
            label="Critical Flags"
            value={String(highRiskSessions)}
            icon={<ShieldAlert size={18} className="text-status-critical" />}
            accent="critical"
          />
        </div>

        {/* Chart Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <div className="mb-6">
              <h3 className="text-base font-bold text-ink-primary">Gait Score Trend</h3>
              <p className="text-xs text-ink-secondary mt-1">Historical progress over recent sessions</p>
            </div>
            
            {loading ? (
              <div className="h-64 flex items-center justify-center text-ink-secondary text-sm">Loading trends…</div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-ink-secondary text-sm bg-card-subtle rounded-lg border border-dashed border-border">
                No session data available to chart.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent-teal)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-accent-teal)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--color-ink-secondary)', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--color-ink-tertiary)', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-ink-primary)', fontWeight: 'bold' }}
                      labelStyle={{ color: 'var(--color-ink-secondary)', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      name="Gait Score"
                      stroke="var(--color-accent-teal)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                      activeDot={{ r: 6, fill: 'var(--color-accent-teal)', stroke: 'var(--color-card)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card-subtle">
              <h3 className="text-sm font-bold text-ink-primary">Recent Activity</h3>
              <button
                onClick={() => navigate('/sessions')}
                className="text-[11px] font-semibold text-accent-teal hover:text-accent-tealLight transition-colors"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="p-10 flex-1 flex flex-col items-center justify-center text-ink-secondary text-sm">Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div className="p-10 flex-1 flex flex-col items-center justify-center text-center text-ink-secondary text-sm">
                No sessions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border overflow-y-auto max-h-[320px] scrollbar-thin">
                {sessions.slice(0, 6).map((session, i) => (
                  <SessionRow key={session.id} session={session} index={i} onNavigate={() => navigate(`/sessions/${session.id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, icon, accent }: {
  label: string; value: string; suffix?: string; icon: React.ReactNode; accent: 'teal' | 'good' | 'critical';
}) {
  const bgMap = {
    teal:     'var(--color-accent-teal-muted)',
    good:     'var(--color-status-good-bg)',
    critical: 'var(--color-status-critical-bg)',
  };

  return (
    <div className="card p-5 flex items-center justify-between">
      <div>
        <p className="section-label mb-2">{label}</p>
        <p className="text-3xl font-bold text-ink-primary tabular-nums tracking-tight">
          {value}
          {suffix && <span className="text-base font-normal text-ink-tertiary ml-1">{suffix}</span>}
        </p>
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgMap[accent] }}>
        {icon}
      </div>
    </div>
  );
}

function SessionRow({ session, index, onNavigate }: {
  session: SessionSummary; index: number; onNavigate: () => void;
}) {
  const fatigueBad = session.fatigue_bucket === 'Severe';
  return (
    <div
      className="px-5 py-3.5 flex items-center justify-between hover:bg-page transition-colors cursor-pointer group"
      onClick={onNavigate}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-accent-tealMuted flex items-center justify-center flex-shrink-0">
          <Activity size={14} className="text-accent-teal" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-primary">
            {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-[11px] text-ink-tertiary mt-0.5">
            {new Date(session.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-bold text-ink-primary">{session.gait_score ?? '—'}</p>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${fatigueBad ? 'text-status-critical' : 'text-status-good'}`}>
            {session.fatigue_bucket ?? 'Normal'}
          </p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={14} className="text-accent-teal" />
        </div>
      </div>
    </div>
  );
}
