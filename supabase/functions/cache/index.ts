import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger, withLogging } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CacheEntry<T = any> {
  key: string;
  value: T;
  expires_at: string;
  created_at: string;
  access_count: number;
  size_bytes: number;
}

interface CacheConfig {
  defaultTTL: number; // seconds
  maxEntrySize: number; // bytes
  maxTotalSize: number; // bytes
  cleanupInterval: number; // seconds
}

class DistributedCache {
  private supabaseClient: any;
  private config: CacheConfig;
  private localCache: Map<string, CacheEntry> = new Map();
  private totalLocalSize: number = 0;

  constructor(supabaseClient: any, config: Partial<CacheConfig> = {}) {
    this.supabaseClient = supabaseClient;
    this.config = {
      defaultTTL: 3600, // 1 hour
      maxEntrySize: 1024 * 1024, // 1MB
      maxTotalSize: 50 * 1024 * 1024, // 50MB
      cleanupInterval: 300, // 5 minutes
      ...config
    };

    // Setup periodic cleanup
    this.startCleanupScheduler();
  }

  async get<T>(key: string): Promise<T | null> {
    logger.debug('Cache get request', {
      function_name: 'cache',
      key: key.substring(0, 50), // Log truncated key for privacy
      operation: 'get'
    });

    try {
      // Check local cache first
      const localEntry = this.localCache.get(key);
      if (localEntry && new Date(localEntry.expires_at) > new Date()) {
        // Update access count
        localEntry.access_count++;
        this.localCache.set(key, localEntry);
        
        logger.debug('Cache hit (local)', {
          function_name: 'cache',
          key: key.substring(0, 50),
          access_count: localEntry.access_count
        });
        
        return localEntry.value as T;
      }

      // Check database cache
      const { data: dbEntry, error } = await this.supabaseClient
        .from('cache_entries')
        .select('*')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.warn('Cache database error', {
          function_name: 'cache',
          key: key.substring(0, 50)
        }, error);
        return null;
      }

      if (dbEntry && new Date(dbEntry.expires_at) > new Date()) {
        // Update access count in database
        await this.supabaseClient
          .from('cache_entries')
          .update({ 
            access_count: dbEntry.access_count + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('key', key);

        // Store in local cache if there's space
        if (this.canStoreLocally(dbEntry.size_bytes)) {
          this.storeLocalEntry(key, dbEntry);
        }

        logger.debug('Cache hit (database)', {
          function_name: 'cache',
          key: key.substring(0, 50),
          access_count: dbEntry.access_count + 1
        });

        return dbEntry.value as T;
      }

      logger.debug('Cache miss', {
        function_name: 'cache',
        key: key.substring(0, 50)
      });

      return null;
    } catch (error) {
      logger.error('Cache get error', {
        function_name: 'cache',
        key: key.substring(0, 50)
      }, error as Error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const ttl = ttlSeconds || this.config.defaultTTL;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    const createdAt = new Date().toISOString();
    const serializedValue = JSON.stringify(value);
    const sizeBytes = new TextEncoder().encode(serializedValue).length;

    logger.debug('Cache set request', {
      function_name: 'cache',
      key: key.substring(0, 50),
      ttl_seconds: ttl,
      size_bytes: sizeBytes,
      operation: 'set'
    });

    if (sizeBytes > this.config.maxEntrySize) {
      logger.warn('Cache entry too large', {
        function_name: 'cache',
        key: key.substring(0, 50),
        size_bytes: sizeBytes,
        max_size: this.config.maxEntrySize
      });
      return false;
    }

    try {
      const cacheEntry: CacheEntry<T> = {
        key,
        value,
        expires_at: expiresAt,
        created_at: createdAt,
        access_count: 1,
        size_bytes: sizeBytes
      };

      // Store in database
      const { error } = await this.supabaseClient
        .from('cache_entries')
        .upsert({
          key,
          value: serializedValue,
          expires_at: expiresAt,
          created_at: createdAt,
          access_count: 1,
          size_bytes: sizeBytes,
          last_accessed: createdAt
        });

      if (error) {
        logger.error('Cache database set error', {
          function_name: 'cache',
          key: key.substring(0, 50)
        }, error);
        return false;
      }

      // Store in local cache if there's space
      if (this.canStoreLocally(sizeBytes)) {
        this.storeLocalEntry(key, cacheEntry);
      }

      logger.debug('Cache set successful', {
        function_name: 'cache',
        key: key.substring(0, 50),
        stored_locally: this.localCache.has(key)
      });

      return true;
    } catch (error) {
      logger.error('Cache set error', {
        function_name: 'cache',
        key: key.substring(0, 50)
      }, error as Error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    logger.debug('Cache delete request', {
      function_name: 'cache',
      key: key.substring(0, 50),
      operation: 'delete'
    });

    try {
      // Remove from local cache
      const localEntry = this.localCache.get(key);
      if (localEntry) {
        this.totalLocalSize -= localEntry.size_bytes;
        this.localCache.delete(key);
      }

      // Remove from database
      const { error } = await this.supabaseClient
        .from('cache_entries')
        .delete()
        .eq('key', key);

      if (error) {
        logger.error('Cache delete error', {
          function_name: 'cache',
          key: key.substring(0, 50)
        }, error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Cache delete error', {
        function_name: 'cache',
        key: key.substring(0, 50)
      }, error as Error);
      return false;
    }
  }

  async clear(pattern?: string): Promise<number> {
    logger.info('Cache clear request', {
      function_name: 'cache',
      pattern: pattern?.substring(0, 50),
      operation: 'clear'
    });

    try {
      let deletedCount = 0;

      if (pattern) {
        // Clear entries matching pattern
        const { data: entries } = await this.supabaseClient
          .from('cache_entries')
          .select('key')
          .like('key', pattern);

        if (entries) {
          for (const entry of entries) {
            await this.delete(entry.key);
            deletedCount++;
          }
        }

        // Clear matching local entries
        for (const [key] of this.localCache) {
          if (new RegExp(pattern.replace('%', '.*')).test(key)) {
            this.localCache.delete(key);
          }
        }
      } else {
        // Clear all
        const { error } = await this.supabaseClient
          .from('cache_entries')
          .delete()
          .gte('id', 0); // Delete all rows

        if (error) throw error;

        // Clear local cache
        this.localCache.clear();
        this.totalLocalSize = 0;
        deletedCount = -1; // Indicate full clear
      }

      logger.info('Cache cleared', {
        function_name: 'cache',
        deleted_count: deletedCount,
        pattern
      });

      return deletedCount;
    } catch (error) {
      logger.error('Cache clear error', {
        function_name: 'cache',
        pattern
      }, error as Error);
      return 0;
    }
  }

  async getStats(): Promise<any> {
    try {
      const { data: dbStats } = await this.supabaseClient
        .from('cache_entries')
        .select('access_count, size_bytes, created_at')
        .gte('expires_at', new Date().toISOString());

      const localStats = {
        entries: this.localCache.size,
        total_size: this.totalLocalSize,
        average_size: this.localCache.size > 0 ? this.totalLocalSize / this.localCache.size : 0
      };

      const dbEntries = dbStats || [];
      const databaseStats = {
        entries: dbEntries.length,
        total_size: dbEntries.reduce((sum: number, entry: any) => sum + entry.size_bytes, 0),
        total_access_count: dbEntries.reduce((sum: number, entry: any) => sum + entry.access_count, 0),
        average_size: dbEntries.length > 0 ? dbEntries.reduce((sum: number, entry: any) => sum + entry.size_bytes, 0) / dbEntries.length : 0
      };

      return {
        local: localStats,
        database: databaseStats,
        config: this.config,
        hit_rate: this.calculateHitRate()
      };
    } catch (error) {
      logger.error('Cache stats error', {
        function_name: 'cache'
      }, error as Error);
      return null;
    }
  }

  private canStoreLocally(sizeBytes: number): boolean {
    return (this.totalLocalSize + sizeBytes) <= this.config.maxTotalSize;
  }

  private storeLocalEntry(key: string, entry: CacheEntry): void {
    // Make room if needed
    while (!this.canStoreLocally(entry.size_bytes) && this.localCache.size > 0) {
      this.evictLeastUsed();
    }

    this.localCache.set(key, entry);
    this.totalLocalSize += entry.size_bytes;
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastAccessCount = Infinity;

    for (const [key, entry] of this.localCache) {
      if (entry.access_count < leastAccessCount) {
        leastAccessCount = entry.access_count;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      const entry = this.localCache.get(leastUsedKey);
      if (entry) {
        this.totalLocalSize -= entry.size_bytes;
        this.localCache.delete(leastUsedKey);
      }
    }
  }

  private calculateHitRate(): number {
    // Simple hit rate calculation based on local cache usage
    const totalRequests = Array.from(this.localCache.values())
      .reduce((sum, entry) => sum + entry.access_count, 0);
    
    const hits = this.localCache.size;
    return totalRequests > 0 ? hits / totalRequests : 0;
  }

  private startCleanupScheduler(): void {
    setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval * 1000);
  }

  private async cleanup(): Promise<void> {
    try {
      // Clean expired entries from database
      const { error } = await this.supabaseClient
        .from('cache_entries')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.warn('Cache cleanup error', {
          function_name: 'cache'
        }, error);
      }

      // Clean expired entries from local cache
      const now = new Date();
      for (const [key, entry] of this.localCache) {
        if (new Date(entry.expires_at) <= now) {
          this.totalLocalSize -= entry.size_bytes;
          this.localCache.delete(key);
        }
      }

      logger.debug('Cache cleanup completed', {
        function_name: 'cache',
        local_entries: this.localCache.size,
        local_size: this.totalLocalSize
      });
    } catch (error) {
      logger.error('Cache cleanup error', {
        function_name: 'cache'
      }, error as Error);
    }
  }
}

// Cache key generators for common use cases
export const CacheKeys = {
  ANALYSIS: (text: string, specialty: string) => 
    `analysis:${specialty}:${crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))}`,
  
  EMBEDDING: (text: string) => 
    `embedding:${crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))}`,
  
  SEARCH: (query: string, limit: number) => 
    `search:${query.toLowerCase().replace(/\s+/g, '_')}:${limit}`,
  
  TEMPLATES: (category?: string) => 
    `templates:${category || 'all'}`,
  
  USER_PROFILE: (userId: string) => 
    `profile:${userId}`,
    
  KNOWLEDGE_BASE: (fileId: string) => 
    `knowledge:${fileId}`
};

const FUNCTION_NAME = 'cache';

serve(withLogging(FUNCTION_NAME, async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const context = { function_name: FUNCTION_NAME, request_id: requestId };

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const cache = new DistributedCache(supabaseClient);
    const { action, key, value, ttl, pattern } = await req.json();

    logger.info('Cache request received', { ...context, action });

    let result;

    switch (action) {
      case 'get':
        result = await cache.get(key);
        break;

      case 'set':
        result = await cache.set(key, value, ttl);
        break;

      case 'delete':
        result = await cache.delete(key);
        break;

      case 'clear':
        result = await cache.clear(pattern);
        break;

      case 'stats':
        result = await cache.getStats();
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error in cache function', context, error as Error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));