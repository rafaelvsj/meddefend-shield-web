// Security utilities and OWASP-compliant headers for Edge Functions

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableFrameOptions: boolean;
  rateLimitEnabled: boolean;
  inputValidationStrict: boolean;
}

export class SecurityHeaders {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableCSP: true,
      enableHSTS: true, 
      enableFrameOptions: true,
      rateLimitEnabled: true,
      inputValidationStrict: true,
      ...config
    };
  }

  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      // CORS headers
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',

      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };

    if (this.config.enableFrameOptions) {
      headers['X-Frame-Options'] = 'DENY';
    }

    if (this.config.enableHSTS) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
    }

    return headers;
  }

  validateInput(input: any, schema: InputSchema): ValidationResult {
    const errors: string[] = [];
    
    if (!this.config.inputValidationStrict) {
      return { valid: true, errors: [] };
    }

    // Check required fields
    for (const field of schema.required || []) {
      if (!input[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types and constraints
    for (const [field, rules] of Object.entries(schema.fields || {})) {
      const value = input[field];
      
      if (value !== undefined) {
        if (!this.validateField(value, rules)) {
          errors.push(`Invalid field: ${field}`);
        }
      }
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi
    ];

    const inputStr = JSON.stringify(input);
    for (const pattern of dangerousPatterns) {
      if (pattern.test(inputStr)) {
        errors.push('Potentially dangerous content detected');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateField(value: any, rules: FieldRules): boolean {
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      return false;
    }

    // String validation
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) return false;
      if (rules.maxLength && value.length > rules.maxLength) return false;
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) return false;
    }

    // Number validation
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) return false;
      if (rules.max !== undefined && value > rules.max) return false;
    }

    // Array validation
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) return false;
      if (rules.maxItems && value.length > rules.maxItems) return false;
    }

    return true;
  }

  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  checkRateLimit(clientId: string, endpoint: string, windowMs: number = 60000, maxRequests: number = 100): RateLimitResult {
    // Simple in-memory rate limiting - in production would use Redis/database
    const now = Date.now();
    const key = `${clientId}:${endpoint}`;
    
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const currentWindow = Math.floor(now / windowMs);
    const windowKey = `${key}:${currentWindow}`;
    
    const current = this.rateLimitStore.get(windowKey) || 0;
    
    if (current >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date((currentWindow + 1) * windowMs),
        limit: maxRequests
      };
    }

    this.rateLimitStore.set(windowKey, current + 1);

    // Cleanup old entries
    for (const [key] of this.rateLimitStore) {
      const keyWindow = parseInt(key.split(':').pop() || '0');
      if (keyWindow < currentWindow - 1) {
        this.rateLimitStore.delete(key);
      }
    }

    return {
      allowed: true,
      remaining: maxRequests - current - 1,
      resetTime: new Date((currentWindow + 1) * windowMs),
      limit: maxRequests
    };
  }

  private rateLimitStore?: Map<string, number>;
}

export interface InputSchema {
  required?: string[];
  fields?: Record<string, FieldRules>;
}

export interface FieldRules {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

// Common schemas for API validation
export const API_SCHEMAS = {
  ANALYSIS_REQUEST: {
    required: ['text', 'specialty'],
    fields: {
      text: { type: 'string' as const, minLength: 10, maxLength: 50000 },
      specialty: { type: 'string' as const, pattern: '^(cardiologia|neurologia|clinica-geral|pediatria)$' },
      templateId: { type: 'string' as const, pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
    }
  },
  
  SEARCH_REQUEST: {
    required: ['query'],
    fields: {
      query: { type: 'string' as const, minLength: 3, maxLength: 500 },
      limit: { type: 'number' as const, min: 1, max: 20 }
    }
  },

  WEBHOOK_REQUEST: {
    required: ['url', 'events'],
    fields: {
      url: { type: 'string' as const, pattern: '^https?://.+' },
      events: { type: 'array' as const, minItems: 1, maxItems: 10 },
      name: { type: 'string' as const, minLength: 1, maxLength: 100 }
    }
  }
};

// Utility function to create secure response
export function createSecureResponse(data: any, status: number = 200, additionalHeaders: Record<string, string> = {}): Response {
  const security = new SecurityHeaders();
  const headers = {
    ...security.getSecurityHeaders(),
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  return new Response(JSON.stringify(data), { status, headers });
}

// Middleware wrapper for securing Edge Functions
export function withSecurity<T extends any[], R>(
  functionName: string,
  handler: (...args: T) => Promise<R>,
  config: Partial<SecurityConfig> = {}
) {
  const security = new SecurityHeaders(config);

  return async (...args: T): Promise<R> => {
    const req = args[0] as Request;
    
    // Check rate limit
    const clientId = req.headers.get('x-client-id') || req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = security.checkRateLimit(clientId, functionName);
    
    if (!rateLimit.allowed) {
      throw new Error(`Rate limit exceeded. Try again at ${rateLimit.resetTime.toISOString()}`);
    }

    // Add rate limit headers to context for response
    (req as any).rateLimitHeaders = {
      'X-RateLimit-Limit': rateLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(rateLimit.resetTime.getTime() / 1000).toString()
    };

    return await handler(...args);
  };
}