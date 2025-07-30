// Logger estruturado para Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface LogContext {
  request_id?: string;
  user_id?: string;
  function_name: string;
  endpoint?: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export class EdgeLogger {
  private supabaseUrl: string;
  private supabaseKey: string;
  private debug: boolean;
  private logSinkUrl?: string;
  private sentryDsn?: string;

  constructor() {
    this.supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.debug = Deno.env.get('DEBUG') === 'true';
    this.logSinkUrl = Deno.env.get('LOG_SINK_URL');
    this.sentryDsn = Deno.env.get('SENTRY_DSN');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const minLevel = this.debug ? 'debug' : 'info';
    return levels.indexOf(level) >= levels.indexOf(minLevel);
  }

  private formatLog(level: LogLevel, message: string, context: LogContext, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      stack_trace: error?.stack,
      hostname: Deno.env.get('HOSTNAME') || 'edge-function',
    };

    // Console log estruturado
    console.log(JSON.stringify(logEntry));
    
    return logEntry;
  }

  private async saveToDatabase(level: LogLevel, message: string, context: LogContext, error?: Error) {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) return;

      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      
      await supabase
        .from('infra.error_logs')
        .insert({
          timestamp: new Date().toISOString(),
          request_id: context.request_id,
          user_id: context.user_id,
          function_name: context.function_name,
          endpoint: context.endpoint,
          error_level: level,
          error_message: message,
          stack_trace: error?.stack,
          context: context
        });
    } catch (err) {
      console.error('Failed to save log to database:', err);
    }
  }

  private async sendToExternalSinks(level: LogLevel, message: string, context: LogContext, error?: Error) {
    const logEntry = this.formatLog(level, message, context, error);

    // Logflare
    if (this.logSinkUrl) {
      try {
        await fetch(this.logSinkUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry),
        });
      } catch (err) {
        console.error('Failed to send to Logflare:', err);
      }
    }

    // Sentry (apenas para errors e fatals)
    if (this.sentryDsn && ['error', 'fatal'].includes(level)) {
      try {
        // Implementação básica do Sentry
        const sentryPayload = {
          message,
          level: level === 'fatal' ? 'error' : level,
          extra: context,
          exception: error ? {
            values: [{
              type: error.name,
              value: error.message,
              stacktrace: {
                frames: error.stack?.split('\n').map(line => ({ filename: 'unknown', lineno: 0, function: line.trim() }))
              }
            }]
          } : undefined
        };

        const sentryUrl = `https://sentry.io/api/0/projects/${this.sentryDsn}/store/`;
        await fetch(sentryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${this.sentryDsn}`
          },
          body: JSON.stringify(sentryPayload),
        });
      } catch (err) {
        console.error('Failed to send to Sentry:', err);
      }
    }
  }

  async log(level: LogLevel, message: string, context: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return;

    this.formatLog(level, message, context, error);

    // Salvar no banco para levels importantes
    if (['warn', 'error', 'fatal'].includes(level)) {
      await this.saveToDatabase(level, message, context, error);
    }

    // Enviar para sinks externos
    await this.sendToExternalSinks(level, message, context, error);
  }

  debug(message: string, context: LogContext) {
    return this.log('debug', message, context);
  }

  info(message: string, context: LogContext) {
    return this.log('info', message, context);
  }

  warn(message: string, context: LogContext, error?: Error) {
    return this.log('warn', message, context, error);
  }

  error(message: string, context: LogContext, error?: Error) {
    return this.log('error', message, context, error);
  }

  fatal(message: string, context: LogContext, error?: Error) {
    return this.log('fatal', message, context, error);
  }
}

// Função wrapper para Edge Functions
export function withLogging<T extends any[], R>(
  functionName: string,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const logger = new EdgeLogger();
    const requestId = crypto.randomUUID();
    
    try {
      logger.info('Function started', {
        function_name: functionName,
        request_id: requestId,
      });

      const result = await handler(...args);

      logger.info('Function completed successfully', {
        function_name: functionName,
        request_id: requestId,
      });

      return result;
    } catch (error) {
      logger.error('Function failed', {
        function_name: functionName,
        request_id: requestId,
      }, error as Error);

      throw error;
    }
  };
}

// Singleton logger instance
export const logger = new EdgeLogger();