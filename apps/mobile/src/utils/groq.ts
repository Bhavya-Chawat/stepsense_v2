import type { SessionSummary } from '@stepsense/types';
import type { ViewMode } from '@stepsense/design-tokens';

import { createSupabaseClient } from '@stepsense/supabase-client';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createSupabaseClient(supabaseUrl, supabaseKey) : null;

export async function generateAIReport(summary: SessionSummary, type: ViewMode) {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }
  
  const sessionId = (summary as any).session_id || summary.id;
  if (!sessionId) {
    throw new Error('No session ID provided.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-ai-report', {
      body: { session_id: sessionId }
    });

    if (error) throw error;
    
    return type === 'doctor' ? (data.ai_report_doctor || 'No doctor report generated.') : (data.ai_report_consumer || 'No consumer report generated.');
  } catch (err: any) {
    console.error('Edge Function Error:', err);
    throw new Error(err.message || 'Error communicating with AI engine.');
  }
}
