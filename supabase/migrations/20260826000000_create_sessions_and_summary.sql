-- 1. Create sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  foot_side text null check (foot_side in ('left', 'right'))
);

-- Enable RLS on sessions
alter table public.sessions enable row level security;

-- Policies for sessions
drop policy if exists "Users can view their own sessions" on public.sessions;
create policy "Users can view their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own sessions" on public.sessions;
create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own sessions" on public.sessions;
create policy "Users can update their own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

-- 2. Create session_summary table
create table if not exists public.session_summary (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  cadence real null,
  avg_stride_time real null,
  fatigue_index real null,
  fatigue_bucket text null,
  asymmetry_percent real null,
  joint_strain_percent real null,
  fall_detected boolean not null default false,
  fall_timestamp timestamptz null,
  fungal_risk boolean not null default false,
  vascular_strain_flag boolean not null default false,
  ulcer_risk_zones jsonb not null default '{}'::jsonb,
  terrain_label text null,
  alerts jsonb not null default '[]'::jsonb,
  baseline_avg_fatigue real null,
  baseline_avg_asymmetry real null,
  ai_report_consumer text null,
  ai_report_doctor text null,
  created_at timestamptz not null default now()
);

-- Enable RLS on session_summary
alter table public.session_summary enable row level security;

-- Policies for session_summary
drop policy if exists "Users can view their own session summaries" on public.session_summary;
create policy "Users can view their own session summaries"
  on public.session_summary for select
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = session_summary.session_id
      and sessions.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert their own session summaries" on public.session_summary;
create policy "Users can insert their own session summaries"
  on public.session_summary for insert
  with check (
    exists (
      select 1 from public.sessions
      where sessions.id = session_summary.session_id
      and sessions.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own session summaries" on public.session_summary;
create policy "Users can update their own session summaries"
  on public.session_summary for update
  using (
    exists (
      select 1 from public.sessions
      where sessions.id = session_summary.session_id
      and sessions.user_id = auth.uid()
    )
  );
