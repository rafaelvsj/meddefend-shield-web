-- Criar schema infra para logs de erro
CREATE SCHEMA IF NOT EXISTS infra;

-- Criar tabela error_logs no schema infra
CREATE TABLE IF NOT EXISTS infra.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_id TEXT,
  user_id UUID,
  function_name TEXT NOT NULL,
  endpoint TEXT,
  error_level TEXT NOT NULL CHECK (error_level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON infra.error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_function ON infra.error_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON infra.error_logs(error_level);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON infra.error_logs(user_id);

-- RLS policies para error_logs
ALTER TABLE infra.error_logs ENABLE ROW LEVEL SECURITY;

-- Policy para admins visualizarem todos os logs
CREATE POLICY "Admins can view error logs"
ON infra.error_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy para sistema inserir logs
CREATE POLICY "System can insert error logs"
ON infra.error_logs
FOR INSERT
WITH CHECK (true);

-- Função para logging de erros SQL
CREATE OR REPLACE FUNCTION infra.log_sql_error(
  p_function_name TEXT,
  p_error_message TEXT,
  p_context JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO infra.error_logs (
    function_name,
    error_level,
    error_message,
    context
  ) VALUES (
    p_function_name,
    'error',
    p_error_message,
    p_context
  );
  
  -- Também logar no PostgreSQL log
  RAISE LOG 'SQL Error in %: %', p_function_name, p_error_message;
END;
$$;