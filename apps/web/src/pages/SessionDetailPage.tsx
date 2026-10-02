import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Printer, Activity, Footprints, Flame, ShieldAlert, FileText, Zap, Play, Pause } from 'lucide-react';
import { createSupabaseClient, getSessionReadings, getSessionSummary, subscribeToSessionReadings } from '@stepsense/supabase-client';
import type { FsrReading, SessionSummary } from '@stepsense/types';
import { isDemoModeEnabled, getMockSessions, generateMockReading } from '../lib/mockData';
import { detectHeelStrikes, detectToeOffs, computeGaitPhases, getCurrentGaitPhase, finalizeSessionMetrics } from '@stepsense/core';
import type { ViewMode } from '@stepsense/design-tokens';
import { COLORS } from '@stepsense/design-tokens';
import { PressureHeatmap2D } from '../components/PressureHeatmap2D';
import { ModeToggle } from '../components/ModeToggle';
import { AlertsLog } from '../components/AlertsLog';
import { GaitAnalysisCard } from '../components/GaitAnalysisCard';
import { HealthRisksCard } from '../components/HealthRisksCard';
import { ShoeEnvironmentCard } from '../components/ShoeEnvironmentCard';
import { DiabeticMetricsCard } from '../components/DiabeticMetricsCard';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { PressureSurface3D } from '../components/PressureSurface3D';
import { generateAiReport } from '../lib/groq';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export default function SessionDetailPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [readings, setReadings] = useState<FsrReading[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrubIndex, setScrubIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'pressure'|'gait'|'health'|'diabetic'|'shoe'|'alerts'>('pressure');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExportingUser, setIsExportingUser] = useState(false);
  const [isExportingDoctor, setIsExportingDoctor] = useState(false);

  const handleExport = async (mode: 'user' | 'doctor') => {
    if (!summary || !supabase) return;
    const isUser = mode === 'user';
    const setExporting = isUser ? setIsExportingUser : setIsExportingDoctor;
    const reportField = isUser ? 'ai_report_consumer' : 'ai_report_doctor';
    
    setExporting(true);
    setShowExportMenu(false);
    try {
      let reportExists = !!(summary as any)[reportField];
      if (!reportExists && !isDemoModeEnabled()) {
        const generated = await generateAiReport(summary, isUser ? 'basic' : 'clinical');
        await supabase
          .from('session_summary')
          .update({ [reportField]: generated })
          .eq('session_id', summary.session_id);
      }
      navigate(`/sessions/${sessionId}/doctor-print?mode=${mode}`);
    } catch (err) {
      console.error('Failed to generate AI report for export', err);
      // Navigate anyway to show the report without AI if it failed
      navigate(`/sessions/${sessionId}/doctor-print?mode=${mode}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && readings.length > 0) {
      interval = setInterval(() => {
        setScrubIndex((prev) => {
          if (prev >= readings.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, readings.length]);

  useEffect(() => {
    if (isDemoModeEnabled()) {
      const mock = getMockSessions().find(s => s.id === sessionId);
      if (mock) {
        setSummary(mock);
      }
      setLoading(false);
      
      let timeIndex = 0;
      const interval = setInterval(() => {
        setReadings((prev) => {
          const newL = generateMockReading(sessionId || 'demo', 'left', timeIndex) as FsrReading;
          const newR = generateMockReading(sessionId || 'demo', 'right', timeIndex) as FsrReading;
          timeIndex++;
          
          const next = [...prev, newL, newR];
          // Keep only the last 200 readings to avoid memory leak
          if (next.length > 200) {
            next.splice(0, next.length - 200);
          }
          
          // Auto-scroll
          setScrubIndex((currentScrub) => {
            if (currentScrub >= prev.length - 1) {
              return next.length - 1;
            }
            return currentScrub;
          });
          
          return next;
        });
      }, 100);

      return () => clearInterval(interval);
    }
    
    if (!supabase || !sessionId) return;

    let unsubscribe: (() => void) | undefined;

    async function loadData() {
      try {
        setLoading(true);
        const [sum, raw] = await Promise.all([
          getSessionSummary(supabase!, sessionId!),
          getSessionReadings(supabase!, sessionId!),
        ]);
        setSummary(sum);
        setReadings(raw);
        if (raw.length > 0) {
          setScrubIndex(raw.length - 1); // Start at the latest reading for live feel
        }

        // Subscribe to live inserts
        unsubscribe = subscribeToSessionReadings(supabase!, sessionId!, (reading) => {
          setReadings((prev) => {
            const newReadings = [...prev, reading];
            // If the user was already looking at the latest reading, auto-scroll to the new one
            setScrubIndex((currentScrub) => {
              if (currentScrub >= prev.length - 1) {
                return newReadings.length - 1;
              }
              return currentScrub;
            });
            return newReadings;
          });
        });

        // Subscribe to summary updates
        const summaryChannel = supabase!.channel(`session_summary_${sessionId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'session_summary', filter: `id=eq.${sessionId}` },
            (payload) => {
              setSummary(payload.new as SessionSummary);
            }
          )
          .subscribe();

        const oldUnsubscribe = unsubscribe;
        unsubscribe = () => {
          if (oldUnsubscribe) oldUnsubscribe();
          supabase!.removeChannel(summaryChannel);
        };

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionId]);

  const currentReading = readings.length > 0 ? readings[scrubIndex] : null;
  
  // Bilateral buffering: Find the most recent left and right reading at or before the scrub index
  let currentLeftReading = null;
  let currentRightReading = null;
  if (readings.length > 0) {
    for (let i = scrubIndex; i >= 0; i--) {
      if (!currentLeftReading && readings[i].foot_side === 'left') currentLeftReading = readings[i];
      if (!currentRightReading && readings[i].foot_side === 'right') currentRightReading = readings[i];
      if (currentLeftReading && currentRightReading) break;
    }
  }

  const currentPhase = getCurrentGaitPhase(currentReading);

  const heelStrikes = readings.length > 0 ? detectHeelStrikes(readings) : [];
  const toeOffs = readings.length > 0 ? detectToeOffs(readings) : [];
  const gaitPhases = computeGaitPhases(heelStrikes, toeOffs);
  const chartData = gaitPhases.map((gp, i) => {
    const durSec = (new Date(gp.endTime).getTime() - new Date(gp.startTime).getTime()) / 1000;
    return {
      name: `Step ${i + 1}`,
      duration: Number(durSec.toFixed(2)),
      phase: gp.phase,
    };
  });

  // Generate live summary from buffered readings if it's an active session
  const activeSummary = summary || (readings.length > 0 ? (finalizeSessionMetrics(readings) as unknown as SessionSummary) : null);

  const zoneData = currentReading ? [
    { zone: 'Z1 Big Toe', pressure: currentReading.s1_big_toe, percent: Math.round((currentReading.s1_big_toe / 4095) * 100) },
    { zone: 'Z2 2nd Toe', pressure: currentReading.s2_second_toe, percent: Math.round((currentReading.s2_second_toe / 4095) * 100) },
    { zone: 'Z3 Ball-In', pressure: currentReading.s3_ball_in, percent: Math.round((currentReading.s3_ball_in / 4095) * 100) },
    { zone: 'Z4 Ball-Out', pressure: currentReading.s4_ball_out, percent: Math.round((currentReading.s4_ball_out / 4095) * 100) },
    { zone: 'Z5 Arch', pressure: currentReading.s5_midfoot, percent: Math.round((currentReading.s5_midfoot / 4095) * 100) },
    { zone: 'Z6 Heel', pressure: currentReading.s6_heel, percent: Math.round((currentReading.s6_heel / 4095) * 100) },
  ] : [];

  return (
    <div className="min-h-screen bg-page text-ink-primary font-sans">
      <div className="bg-card border-b border-border shadow-none-none">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-border">
            <div>
              <button 
                onClick={() => navigate('/sessions')}
                className="text-xs font-semibold text-accent-blue hover:text-ink-primary transition-colors flex items-center space-x-1 mb-2"
              >
                <ArrowLeft size={14} />
                <span>Back to Sessions</span>
              </button>
              <h1 className="text-3xl font-bold font-sans text-accent-teal tracking-tight">Session Analysis</h1>
              <div className="flex items-center space-x-3 mt-1 text-xs text-ink-secondary">
                <span>ID: <code className="bg-page px-1.5 py-0.5 rounded border border-border font-mono">{sessionId}</code></span>
                <span>{readings.length > 0 ? new Date(readings[0].created_at).toLocaleDateString() : ''} · {readings.length} readings</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent-blue hover:bg-opacity-90 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <Printer size={14} />
                  <span>Export PDF</span>
                  <svg className={`w-3 h-3 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button 
                      onClick={() => handleExport('user')}
                      disabled={isExportingUser || isExportingDoctor}
                      className="w-full text-left px-4 py-3 text-xs font-semibold text-ink-primary hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="group-hover:text-accent-blue transition-colors">
                        {isExportingUser ? 'Generating AI...' : 'Patient Version'}
                      </span>
                      {!isExportingUser && <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium tracking-wide">Friendly</span>}
                    </button>
                    <button 
                      onClick={() => handleExport('doctor')}
                      disabled={isExportingUser || isExportingDoctor}
                      className="w-full text-left px-4 py-3 text-xs font-semibold text-accent-teal hover:bg-teal-50 transition-colors flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="group-hover:text-teal-700 transition-colors">
                        {isExportingDoctor ? 'Generating AI...' : 'Clinical Version'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-1 border-b border-border mb-6 overflow-x-auto pb-1">
            {[
              { id: 'pressure', label: 'Pressure Map', icon: <Footprints size={14} /> },
              { id: 'gait', label: 'Gait Phase', icon: <Activity size={14} /> },
              { id: 'health', label: 'Clinical Risk', icon: <Flame size={14} /> },
              { id: 'diabetic', label: 'Diabetic & PTI', icon: <Activity size={14} /> },
              { id: 'shoe', label: 'Microclimate', icon: <Zap size={14} /> },
              { id: 'alerts', label: 'Alerts', icon: <ShieldAlert size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-bold rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-page border-t border-l border-r border-border text-accent-blue -mb-px'
                    : 'text-ink-secondary hover:bg-page hover:text-ink-primary border-t border-l border-r border-transparent -mb-px'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="py-12 text-center text-ink-secondary">Loading session details...</div>
        ) : (
          <>
            {activeTab === 'pressure' && (
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border border-border shadow-none-none">
                  <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
                    <h3 className="font-sans font-bold text-accent-teal text-base">Pressure Map</h3>
                    <span className="text-xs text-ink-secondary">
                      {currentReading ? new Date(currentReading.created_at).toLocaleTimeString() : '-'} | Frame {scrubIndex + 1} of {readings.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex justify-center h-[500px]">
                      <PressureHeatmap2D reading={currentLeftReading} footSide="left" width={240} height={480} refreshRate="500ms" />
                    </div>
                    <div className="flex justify-center h-[500px]">
                      <PressureHeatmap2D reading={currentRightReading} footSide="right" width={240} height={480} refreshRate="500ms" />
                    </div>
                    <div className="flex justify-center h-[500px]">
                      <PressureSurface3D reading={currentReading} width={400} height={480} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-none-none space-y-4">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Zone Pressures</h4>
                      {zoneData.map((z) => (
                        <div key={z.zone} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">{z.zone}</span>
                            <span className="text-slate-500 font-medium">{z.percent}% - {z.pressure} ADC</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${z.percent}%`,
                                backgroundColor: z.percent > 85 ? COLORS.statusCritical
                                  : z.percent > 60 ? COLORS.statusModerate
                                  : COLORS.accentClay,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {readings.length > 1 && (
                    <div className="mt-6 flex items-center space-x-4">
                      <button 
                        onClick={() => {
                          if (scrubIndex >= readings.length - 1) setScrubIndex(0);
                          setIsPlaying(!isPlaying);
                        }}
                        className="p-2 rounded-full bg-accent-teal text-white hover:bg-opacity-90 transition-colors shadow-sm flex-shrink-0"
                      >
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={readings.length - 1}
                        value={scrubIndex}
                        onChange={(e) => {
                          setIsPlaying(false);
                          setScrubIndex(Number(e.target.value));
                        }}
                        className="flex-1 accent-accent-teal cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'gait' && (
              <div className="space-y-6">
                <GaitAnalysisCard summary={activeSummary} currentPhase={currentPhase} />
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-none-none space-y-4">
                  <h3 className="font-sans font-bold text-slate-800 text-base border-b border-slate-100 pb-2 flex items-center space-x-2">
                    <Activity size={16} className="text-accent-teal" />
                    <span>Gait Phase Duration Timeline</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke={COLORS.inkSecondary} fontSize={10} />
                        <YAxis stroke={COLORS.inkSecondary} fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="duration">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.phase === 'stance' ? COLORS.accentClay : COLORS.statusGood} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'health' && (
              <HealthRisksCard summary={activeSummary} />
            )}
            {activeTab === 'diabetic' && (
              <DiabeticMetricsCard summary={activeSummary} />
            )}
            {activeTab === 'shoe' && (
              <ShoeEnvironmentCard summary={activeSummary} latestReading={currentReading} />
            )}
            {activeTab === 'alerts' && activeSummary?.alerts && (
              <AlertsLog alerts={activeSummary.alerts} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
