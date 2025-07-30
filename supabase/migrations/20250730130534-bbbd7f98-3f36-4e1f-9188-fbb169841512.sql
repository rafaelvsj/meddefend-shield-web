-- Create cache_entries table for distributed cache system
CREATE TABLE IF NOT EXISTS public.cache_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER NOT NULL DEFAULT 1,
  size_bytes INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON public.cache_entries(key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires_at ON public.cache_entries(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_entries_access_count ON public.cache_entries(access_count);

-- Enable RLS
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

-- Policy for system access to cache
CREATE POLICY "System can manage cache entries"
ON public.cache_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- Create backup storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Create policy for backup storage access
CREATE POLICY "Admins can manage backups"
ON storage.objects 
FOR ALL 
USING (bucket_id = 'backups' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'backups' AND has_role(auth.uid(), 'admin'::app_role));

-- Function to automatically cleanup expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.cache_entries 
  WHERE expires_at < NOW();
$$;

-- Create automatic cleanup trigger (runs daily)
-- Note: In production, this would be better handled by a cron job
CREATE OR REPLACE FUNCTION public.trigger_cache_cleanup()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only run cleanup once per hour to avoid excessive calls
  IF (EXTRACT(MINUTE FROM NOW()) = 0) THEN
    PERFORM public.cleanup_expired_cache();
  END IF;
  RETURN NEW;
END;
$$;