import { SupabaseClient } from '@supabase/supabase-js';
import type { FsrReading, Session, SessionSummary } from '@stepsense/types';
import { finalizeSessionMetrics } from '@stepsense/core';

export async function getSessionReadings(
  supabase: SupabaseClient,
  sessionId: string
): Promise<FsrReading[]> {
  const { data, error } = await supabase
    .from('fsr_readings')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }
  return (data as FsrReading[]) || [];
}

export async function insertSessionReadings(
  supabase: SupabaseClient,
  readings: Partial<FsrReading>[]
): Promise<FsrReading[]> {
  const { data, error } = await supabase
    .from('fsr_readings')
    .insert(readings)
    .select();

  if (error) {
    throw error;
  }
  return data as FsrReading[];
}

export function subscribeToSessionReadings(
  supabase: SupabaseClient,
  sessionId: string,
  onInsert: (reading: FsrReading) => void
): () => void {
  const channel = supabase
    .channel(`session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'fsr_readings',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onInsert(payload.new as FsrReading);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createSession(
  supabase: SupabaseClient,
  footSide?: 'left' | 'right'
): Promise<Session> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('User must be authenticated to create a session');
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userData.user.id,
      foot_side: footSide || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Session;
}

export async function endSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Session;
}

export async function getSessionSummary(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SessionSummary | null> {
  const { data, error } = await supabase
    .from('session_summary')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }
  return data && data.length > 0 ? (data[0] as SessionSummary) : null;
}

export async function getUserSessions(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }
  return (data as Session[]) || [];
}

export async function finalizeAndStoreSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SessionSummary> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (userId) {
    // Ensure parent sessions row exists for RLS relationship
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    if (!existingSession) {
      await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          started_at: new Date().toISOString(),
        });
    }
  }

  const readings = await getSessionReadings(supabase, sessionId);
  const metrics = finalizeSessionMetrics(readings);

  // Check if summary already exists to decide between update and insert
  const existingSummary = await getSessionSummary(supabase, sessionId);

  if (existingSummary) {
    const { data, error } = await supabase
      .from('session_summary')
      .update(metrics)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as SessionSummary;
  } else {
    const { data, error } = await supabase
      .from('session_summary')
      .insert({
        session_id: sessionId,
        ...metrics,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SessionSummary;
  }
}
