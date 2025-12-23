-- Bullet Journal Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bullet_items table
CREATE TABLE IF NOT EXISTS public.bullet_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  type TEXT NOT NULL CHECK (type IN ('task', 'note', 'event')),
  content TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  original_date DATE,
  migrated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bullet_items_user_id ON public.bullet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_bullet_items_date ON public.bullet_items(date);
CREATE INDEX IF NOT EXISTS idx_bullet_items_order ON public.bullet_items(order_index);

-- Enable Row Level Security
ALTER TABLE public.bullet_items ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (anonymous users)
-- In production, you would want to restrict this to authenticated users
CREATE POLICY "Allow all operations for anonymous users" ON public.bullet_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
DROP TRIGGER IF EXISTS set_updated_at ON public.bullet_items;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bullet_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bullet_items;

-- Insert some sample data (optional)
INSERT INTO public.bullet_items (type, content, date, order_index) VALUES
  ('task', 'Review project requirements', CURRENT_DATE, 0),
  ('task', 'Set up development environment', CURRENT_DATE, 1),
  ('note', 'Remember to take breaks', CURRENT_DATE, 2),
  ('event', 'Team standup at 10am', CURRENT_DATE, 3),
  ('task', 'Plan tomorrow''s tasks', CURRENT_DATE + 1, 0),
  ('event', 'Weekly planning meeting', CURRENT_DATE + 1, 1),
  ('task', 'Research new features', CURRENT_DATE + 7, 0),
  ('note', 'Long-term goals to consider', CURRENT_DATE + 7, 1);

