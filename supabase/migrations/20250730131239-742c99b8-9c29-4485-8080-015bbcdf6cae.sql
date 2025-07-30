-- Sprint 3: Queue System, Metrics, API Keys & Tracing

-- 1. Job Queue System
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for job queue performance
CREATE INDEX IF NOT EXISTS idx_job_queue_status_scheduled ON public.job_queue(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON public.job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON public.job_queue(priority DESC, scheduled_at);

-- Enable RLS for job queue
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Job queue policies
CREATE POLICY "System can manage all jobs"
ON public.job_queue
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view their own jobs"
ON public.job_queue
FOR SELECT
USING (auth.uid() = created_by);

-- 2. Metrics System
CREATE TABLE IF NOT EXISTS public.metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  labels JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for metrics
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON public.metrics_snapshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_name_timestamp ON public.metrics_snapshots(metric_name, timestamp);

-- Enable RLS for metrics
ALTER TABLE public.metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- Metrics policies (admin only)
CREATE POLICY "Admins can manage metrics"
ON public.metrics_snapshots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. API Keys Management
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'revoked')),
  rotation_count INTEGER NOT NULL DEFAULT 0,
  last_rotation TIMESTAMPTZ,
  next_rotation TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for API keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- API keys policies (admin only)
CREATE POLICY "Admins can manage API keys"
ON public.api_keys
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Distributed Tracing
CREATE TABLE IF NOT EXISTS public.trace_spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  parent_span_id TEXT,
  operation_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error', 'timeout')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for tracing
CREATE INDEX IF NOT EXISTS idx_trace_spans_trace_id ON public.trace_spans(trace_id);
CREATE INDEX IF NOT EXISTS idx_trace_spans_start_time ON public.trace_spans(start_time);

-- Enable RLS for traces
ALTER TABLE public.trace_spans ENABLE ROW LEVEL SECURITY;

-- Tracing policies (admin only)
CREATE POLICY "Admins can view traces"
ON public.trace_spans
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create traces"
ON public.trace_spans
FOR INSERT
WITH CHECK (true);

-- Update triggers for updated_at
CREATE TRIGGER update_job_queue_updated_at
  BEFORE UPDATE ON public.job_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_old_metrics()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.metrics_snapshots 
  WHERE timestamp < NOW() - INTERVAL '30 days';
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_traces()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.trace_spans 
  WHERE start_time < NOW() - INTERVAL '7 days';
$$;