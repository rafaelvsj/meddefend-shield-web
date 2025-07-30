import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { logger } from './logger.ts';

interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

interface SpanData {
  operationName: string;
  metadata?: Record<string, any>;
  status?: 'ok' | 'error' | 'timeout';
}

export class Span {
  private traceId: string;
  private spanId: string;
  private parentSpanId?: string;
  private operationName: string;
  private startTime: number;
  private metadata: Record<string, any>;
  private status: 'ok' | 'error' | 'timeout' = 'ok';
  private supabase: any;
  private finished = false;

  constructor(
    traceId: string, 
    spanId: string, 
    operationName: string, 
    parentSpanId?: string,
    supabase?: any
  ) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentSpanId = parentSpanId;
    this.operationName = operationName;
    this.startTime = Date.now();
    this.metadata = {};
    this.supabase = supabase;
  }

  setStatus(status: 'ok' | 'error' | 'timeout'): void {
    this.status = status;
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  addMetadata(metadata: Record<string, any>): void {
    Object.assign(this.metadata, metadata);
  }

  async finish(error?: Error): Promise<void> {
    if (this.finished) return;
    
    this.finished = true;
    const duration = Date.now() - this.startTime;
    
    if (error) {
      this.status = 'error';
      this.metadata.error = error.message;
      this.metadata.stack = error.stack;
    }

    // Store span in database (sample 10% in production)
    const shouldSample = Deno.env.get('DEBUG') === 'true' || Math.random() < 0.1;
    
    if (shouldSample && this.supabase) {
      try {
        await this.supabase
          .from('trace_spans')
          .insert({
            trace_id: this.traceId,
            span_id: this.spanId,
            parent_span_id: this.parentSpanId,
            operation_name: this.operationName,
            start_time: new Date(this.startTime).toISOString(),
            end_time: new Date().toISOString(),
            duration_ms: duration,
            status: this.status,
            metadata: this.metadata
          });
      } catch (err) {
        logger.warn('Failed to store trace span', { 
          traceId: this.traceId, 
          spanId: this.spanId,
          error: err.message 
        });
      }
    }
  }

  getContext(): TraceContext {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId
    };
  }
}

export class Tracer {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  generateTraceId(): string {
    return crypto.randomUUID().replace(/-/g, '');
  }

  generateSpanId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  startSpan(operationName: string, parentContext?: TraceContext): Span {
    const traceId = parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const parentSpanId = parentContext?.spanId;

    return new Span(traceId, spanId, operationName, parentSpanId, this.supabase);
  }

  extract(headers: Headers): TraceContext | null {
    const traceparent = headers.get('traceparent');
    if (!traceparent) return null;

    // Parse W3C traceparent: version-trace_id-parent_id-trace_flags
    const parts = traceparent.split('-');
    if (parts.length !== 4) return null;

    return {
      traceId: parts[1],
      spanId: parts[2]
    };
  }

  inject(headers: Headers, context: TraceContext): void {
    const traceparent = `00-${context.traceId}-${context.spanId}-01`;
    headers.set('traceparent', traceparent);
  }

  createHeaders(context?: TraceContext): Headers {
    const headers = new Headers();
    if (context) {
      this.inject(headers, context);
    }
    return headers;
  }
}

// Singleton instance
export const tracer = new Tracer();

// Higher-order function to wrap functions with tracing
export function withTracing<T extends any[], R>(
  operationName: string,
  handler: (span: Span, ...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const span = tracer.startSpan(operationName);
    
    try {
      const result = await handler(span, ...args);
      await span.finish();
      return result;
    } catch (error) {
      await span.finish(error);
      throw error;
    }
  };
}