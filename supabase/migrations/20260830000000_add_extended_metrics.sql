-- Migration: Clean up old tables and create unified fsr_readings with extended metrics

-- 1. Drop old tables
DROP TABLE IF EXISTS public.fsr_adc_readings CASCADE;
DROP TABLE IF EXISTS public.fsr_readings2 CASCADE;

-- 2. Create the new unified fsr_readings table
CREATE TABLE public.fsr_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_id uuid NOT NULL,
  s1_big_toe integer NOT NULL CHECK (s1_big_toe >= 0 AND s1_big_toe <= 4095),
  s2_second_toe integer NOT NULL CHECK (s2_second_toe >= 0 AND s2_second_toe <= 4095),
  s3_ball_in integer NOT NULL CHECK (s3_ball_in >= 0 AND s3_ball_in <= 4095),
  s4_ball_out integer NOT NULL CHECK (s4_ball_out >= 0 AND s4_ball_out <= 4095),
  s5_midfoot integer NOT NULL CHECK (s5_midfoot >= 0 AND s5_midfoot <= 4095),
  s6_heel integer NOT NULL CHECK (s6_heel >= 0 AND s6_heel <= 4095),
  step_count integer NOT NULL DEFAULT 0 CHECK (step_count >= 0),
  temperature real DEFAULT 0,
  humidity real DEFAULT 0,
  ax real DEFAULT 0,
  ay real DEFAULT 0,
  az real DEFAULT 0,
  gx real DEFAULT 0,
  gy real DEFAULT 0,
  gz real DEFAULT 0,
  foot_side text CHECK (foot_side IN ('left', 'right')), -- Added per request to set on ESP
  CONSTRAINT fsr_readings_pkey PRIMARY KEY (id),
  CONSTRAINT fsr_readings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE
);

-- Enable RLS on fsr_readings
ALTER TABLE public.fsr_readings ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for ESP32 (since it uses Anon Key without user context)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.fsr_readings;
CREATE POLICY "Enable insert for all" 
  ON public.fsr_readings FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to read their own session readings
DROP POLICY IF EXISTS "Users can read own readings" ON public.fsr_readings;
CREATE POLICY "Users can read own readings"
  ON public.fsr_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = fsr_readings.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- 3. Add extended metrics to session_summary
-- Gait metrics
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS step_time real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS stride_length real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS double_support_percent real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS gait_score real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS gait_type text null;

-- Fatigue
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS fatigue_score real null;

-- Joint strain (extended)
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS joint_strain_score real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS joint_strain_severity text null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS joint_strain_zone text null;

-- Fall & safety
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS fall_risk_score real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS tremor_flag boolean not null default false;

-- Shoe environment
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS fungal_risk_score real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS shoe_bite_detected boolean not null default false;

-- Vascular & ulcer scores
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS vascular_risk_score real null;
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS ulcer_risk_score real null;

-- Terrain confidence
ALTER TABLE public.session_summary ADD COLUMN IF NOT EXISTS terrain_confidence real null;

-- 4. User profiles table for cohort system
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text null,
  age integer null,
  cohort text not null default 'adult' check (cohort in ('child', 'adult', 'elderly', 'athlete')),
  height_cm real null,
  weight_kg real null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);
