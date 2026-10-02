-- Enable realtime for tables so apps can receive live updates
alter publication supabase_realtime add table public.fsr_readings;
alter publication supabase_realtime add table public.session_summary;
alter publication supabase_realtime add table public.sessions;
