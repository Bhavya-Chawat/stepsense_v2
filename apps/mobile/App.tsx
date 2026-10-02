import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  createSupabaseClient,
  subscribeToSessionReadings,
  createSession,
  endSession,
  finalizeAndStoreSession,
  getSessionSummary,
  getUserSessions,
  type User,
} from '@stepsense/supabase-client';
import type { FsrReading, SessionSummary, Session } from '@stepsense/types';
import { getCurrentGaitPhase, finalizeSessionMetrics } from '@stepsense/core';
import { PressureHeatmap2D } from './src/components/PressureHeatmap2D';
import { ZonePressuresCard } from './src/components/ZonePressuresCard';
import { ExportReportButton } from './src/components/ExportReportButton';
import { HealthRisksCard } from './src/components/HealthRisksCard';
import { GaitAnalysisCard } from './src/components/GaitAnalysisCard';
import { ShoeEnvironmentCard } from './src/components/ShoeEnvironmentCard';
import { HomeScreen } from './src/components/HomeScreen';
import { ProfileScreen } from './src/components/ProfileScreen';
import { DiabeticMetricsCard } from './src/components/DiabeticMetricsCard';
import { LoginScreen } from './src/components/LoginScreen';
import { COLORS } from './src/utils/theme';
import { Activity, Footprints, FileText, Settings as SettingsIcon, Home, Clock, X, Moon, Sun, Flame } from 'lucide-react-native';
import { Modal, useColorScheme } from 'react-native';
import { ThemeContext, getTheme } from './src/utils/ThemeContext';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

type TabType = 'home' | 'pressure' | 'analysis' | 'diabetics' | 'settings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Session State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isWalkActive, setIsWalkActive] = useState<boolean>(false);
  const [liveReadings, setLiveReadings] = useState<FsrReading[]>([]);
  const [latestLeftReading, setLatestLeftReading] = useState<FsrReading | null>(null);
  const [latestRightReading, setLatestRightReading] = useState<FsrReading | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [status, setStatus] = useState<string>('Ready to start walk');
  const systemColorScheme = useColorScheme();
  const [dark, setDark] = useState(systemColorScheme === 'dark');
  const theme = getTheme(dark);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historySessions, setHistorySessions] = useState<{session: Session, summary: SessionSummary | null}[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // True Real-time Subscription to Supabase
  useEffect(() => {
    if (!supabase || !user || !activeSessionId || !isWalkActive) return;

    // Listen to real inserts from hardware
    const unsubscribe = subscribeToSessionReadings(supabase, activeSessionId, (reading) => {
      setLiveReadings((prev) => {
        const next = [reading, ...prev];
        if (next.length > 200) next.splice(200); // Prevent memory leak
        return next;
      });
      if (reading.foot_side === 'left') {
        setLatestLeftReading(reading);
      } else if (reading.foot_side === 'right') {
        setLatestRightReading(reading);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, activeSessionId, isWalkActive]);

  async function handleStartWalk() {
    if (!supabase) return;
    try {
      setStatus('Starting new walk session...');
      const newSession = await createSession(supabase);
      setActiveSessionId(newSession.id);
      setIsWalkActive(true);
      setLiveReadings([]);
      setLatestLeftReading(null);
      setLatestRightReading(null);
      setSessionSummary(null);
      setStatus(`Walk active! Session ID: ${newSession.id.slice(0, 8)}...`);
    } catch (err: any) {
      setStatus(`Start Walk error: ${err.message}`);
    }
  }

  async function handleEndWalk() {
    if (!supabase || !activeSessionId) return;
    try {
      setStatus('Finalizing session & computing summary metrics...');
      setIsWalkActive(false);
      await endSession(supabase, activeSessionId);
      const summary = await finalizeAndStoreSession(supabase, activeSessionId);
      setSessionSummary(summary);
      setStatus('Walk completed & finalized!');
    } catch (err: any) {
      setStatus(`Finalize error: ${err.message}`);
    }
  }

  async function handleAuth() {
    if (!supabase) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthError('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function loadHistory() {
    if (!supabase || !user) return;
    setLoadingHistory(true);
    try {
      const userSessions = await getUserSessions(supabase, user.id, 20);
      const sessionData = await Promise.all(
        userSessions.map(async (s) => {
          const summary = await getSessionSummary(supabase, s.id);
          return { session: s, summary };
        })
      );
      setHistorySessions(sessionData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleSelectHistorical = (sId: string, summary: SessionSummary | null) => {
    setActiveSessionId(sId);
    setSessionSummary(summary);
    setLiveReadings([]);
    setLatestLeftReading(null);
    setLatestRightReading(null);
    setStatus(`Viewing history: ${sId.substring(0,8)}`);
    setShowHistory(false);
    setActiveTab('home');
  };

  if (!supabase) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#B85252' }}>Supabase Config Missing</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ThemeContext.Provider value={{ dark }}>
        <LoginScreen
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          isSignUp={isSignUp}
          setIsSignUp={setIsSignUp}
          authError={authError}
          authLoading={authLoading}
          handleAuth={handleAuth}
          dark={dark}
        />
      </ThemeContext.Provider>
    );
  }

  const latestReading = liveReadings.length > 0 ? liveReadings[0] : null;
  const currentPhase = getCurrentGaitPhase(latestReading);

  // Generate live summary from buffered readings if it's an active session
  const activeSummary = sessionSummary || (liveReadings.length > 0 ? (finalizeSessionMetrics([...liveReadings].reverse()) as unknown as SessionSummary) : null);

  return (
    <ThemeContext.Provider value={{ dark }}>
    <View style={[styles.container, { backgroundColor: theme.page }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.brandTitle, { color: theme.ink.primary }]}>StepSense</Text>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setDark(d => !d)} style={{ padding: 6 }}>
            {dark
              ? <Sun color={theme.ink.secondary} size={18} />
              : <Moon color={theme.ink.secondary} size={18} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowHistory(true); loadHistory(); }} style={{ padding: 6 }}>
            <Clock color={theme.ink.secondary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('settings')} style={{ padding: 6 }}>
            <SettingsIcon color={theme.ink.secondary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.page }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.ink.primary }]}>Session History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <X color={theme.ink.primary} size={22} />
            </TouchableOpacity>
          </View>
          {loadingHistory ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: theme.ink.secondary }}>Loading…</Text>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              {historySessions.map((item) => (
                <TouchableOpacity
                  key={item.session.id}
                  style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => handleSelectHistorical(item.session.id, item.summary)}
                >
                  <Text style={[styles.historyDate, { color: theme.ink.primary }]}>
                    {new Date(item.session.started_at).toLocaleString()}
                  </Text>
                  <Text style={[styles.historyId, { color: theme.ink.secondary }]}>
                    ID: {item.session.id.substring(0, 10)}…
                  </Text>
                  <Text style={[styles.historyScore, { color: theme.accent.teal }]}>
                    Gait Score: {item.summary?.gait_score ?? '—'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Main Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'home' && (
          <HomeScreen 
            summary={sessionSummary}
            isWalkActive={isWalkActive}
            onStartWalk={handleStartWalk}
            onEndWalk={handleEndWalk}
            status={status}
          />
        )}
        
        {activeTab === 'pressure' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.tabHeader}>
              <Text style={[styles.tabTitle, { color: theme.ink.primary }]}>Pressure Map</Text>
              <Text style={[styles.tabSub, { color: theme.liveGreen }]}>{liveReadings.length > 0 ? 'Live Data' : 'Session Data'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
              <PressureHeatmap2D reading={latestLeftReading} footSide="left" width={160} height={320} />
              <PressureHeatmap2D reading={latestRightReading} footSide="right" width={160} height={320} />
            </View>
            <ZonePressuresCard reading={latestReading} />
          </ScrollView>
        )}

        {activeTab === 'analysis' && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.tabHeader}>
              <Text style={[styles.tabTitle, { color: theme.ink.primary }]}>Biomechanics & Health</Text>
            </View>
            <GaitAnalysisCard summary={activeSummary} currentPhase={currentPhase} />
            <HealthRisksCard summary={activeSummary} />
            <ShoeEnvironmentCard summary={activeSummary} latestReading={latestReading} />
            <View style={{ marginTop: 20 }}>
              <ExportReportButton summary={activeSummary} mode="doctor" />
            </View>
          </ScrollView>
        )}

        {activeTab === 'diabetics' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.tabHeader}>
              <Text style={[styles.tabTitle, { color: theme.ink.primary }]}>Diabetics & PTI</Text>
            </View>
            <DiabeticMetricsCard summary={activeSummary} />
          </ScrollView>
        )}



        {activeTab === 'settings' && (
          <ProfileScreen
            supabase={supabase}
            userId={user.id}
            userEmail={user.email}
            onSignOut={handleSignOut}
          />
        )}
      </View>

      {/* 5-Tab Bottom Bar */}
      <View style={[styles.bottomTabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {[
          { id: 'home',     icon: Home,          label: 'Home' },
          { id: 'pressure', icon: Footprints,     label: 'Pressure' },
          { id: 'analysis', icon: Activity,       label: 'Analysis' },
          { id: 'diabetics',icon: Flame,          label: 'Diabetics' },
          { id: 'settings', icon: SettingsIcon,   label: 'Settings' },
        ].map(tab => (
          <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => setActiveTab(tab.id as TabType)}>
            <tab.icon
              color={activeTab === tab.id ? theme.accent.teal : theme.ink.tertiary}
              size={22}
            />
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? theme.accent.teal : theme.ink.tertiary },
              activeTab === tab.id && styles.activeTabLabel,
            ]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.page,
    paddingTop: 50,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.ink.primary,
    letterSpacing: -0.3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.page,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.ink.primary,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink.primary,
  },
  historyId: {
    fontSize: 10,
    color: COLORS.ink.secondary,
    fontFamily: 'monospace',
    marginTop: 3,
  },
  historyScore: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent.teal,
    marginTop: 8,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink.primary,
    letterSpacing: -0.2,
  },
  tabSub: {
    fontSize: 11,
    color: COLORS.liveGreen,
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: COLORS.page,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.status.critical,
    fontSize: 12,
    marginBottom: 12,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 4,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.ink.secondary,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  activeTabLabel: {
    color: COLORS.accent.teal,
    fontWeight: '700',
  },
});
