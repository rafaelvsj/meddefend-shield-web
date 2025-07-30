import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { logger } from './logger.ts';

export interface Job {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdBy?: string;
}

export interface JobHandler {
  (payload: Record<string, any>): Promise<void>;
}

export class Queue {
  private supabase: any;
  private handlers: Map<string, JobHandler> = new Map();

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  // Register a job handler
  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
    logger.info('Registered job handler', { jobType });
  }

  // Add a job to the queue
  async enqueue(
    type: string, 
    payload: Record<string, any>, 
    options: {
      priority?: number;
      scheduledAt?: Date;
      maxAttempts?: number;
      createdBy?: string;
    } = {}
  ): Promise<string> {
    const {
      priority = 0,
      scheduledAt = new Date(),
      maxAttempts = 3,
      createdBy
    } = options;

    const { data, error } = await this.supabase
      .from('job_queue')
      .insert({
        type,
        payload,
        priority,
        scheduled_at: scheduledAt.toISOString(),
        max_attempts: maxAttempts,
        created_by: createdBy
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to enqueue job', { type, error: error.message });
      throw new Error(`Failed to enqueue job: ${error.message}`);
    }

    logger.info('Job enqueued', { jobId: data.id, type, priority });
    return data.id;
  }

  // Process pending jobs
  async processJobs(batchSize: number = 10): Promise<number> {
    // Fetch pending jobs ordered by priority and scheduled time
    const { data: jobs, error } = await this.supabase
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(batchSize);

    if (error) {
      logger.error('Failed to fetch jobs', { error: error.message });
      return 0;
    }

    if (!jobs || jobs.length === 0) {
      return 0;
    }

    logger.info('Processing jobs batch', { count: jobs.length });

    let processed = 0;
    for (const job of jobs) {
      try {
        await this.processJob(job);
        processed++;
      } catch (error) {
        logger.error('Failed to process job', { 
          jobId: job.id, 
          jobType: job.type,
          error: error.message 
        });
      }
    }

    return processed;
  }

  // Process a single job
  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      await this.failJob(job.id, `No handler registered for job type: ${job.type}`);
      return;
    }

    // Mark job as processing
    const { error: updateError } = await this.supabase
      .from('job_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1
      })
      .eq('id', job.id);

    if (updateError) {
      logger.error('Failed to mark job as processing', { 
        jobId: job.id, 
        error: updateError.message 
      });
      return;
    }

    const startTime = Date.now();
    
    try {
      // Execute the job handler
      await handler(job.payload);
      
      const duration = Date.now() - startTime;
      
      // Mark job as completed
      await this.supabase
        .from('job_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      logger.info('Job completed successfully', { 
        jobId: job.id, 
        jobType: job.type,
        duration 
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message;
      
      // Check if we should retry
      if (job.attempts + 1 < job.maxAttempts) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, job.attempts) * 1000; // 1s, 2s, 4s, 8s...
        const retryAt = new Date(Date.now() + retryDelay);
        
        await this.supabase
          .from('job_queue')
          .update({
            status: 'pending',
            scheduled_at: retryAt.toISOString(),
            error_message: errorMessage
          })
          .eq('id', job.id);

        logger.warn('Job failed, scheduling retry', { 
          jobId: job.id, 
          jobType: job.type,
          attempt: job.attempts + 1,
          maxAttempts: job.maxAttempts,
          retryAt: retryAt.toISOString(),
          duration,
          error: errorMessage
        });
      } else {
        // Max attempts reached, mark as failed
        await this.failJob(job.id, errorMessage);
        
        logger.error('Job failed permanently', { 
          jobId: job.id, 
          jobType: job.type,
          attempts: job.attempts + 1,
          duration,
          error: errorMessage
        });
      }
    }
  }

  // Mark job as failed
  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    await this.supabase
      .from('job_queue')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .eq('id', jobId);
  }

  // Get job statistics
  async getStats(): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from('job_queue')
      .select('status, type')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

    if (error) {
      logger.error('Failed to get job stats', { error: error.message });
      return {};
    }

    const stats: Record<string, number> = {
      total: data.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    const typeStats: Record<string, number> = {};

    for (const job of data) {
      stats[job.status]++;
      
      const typeKey = `${job.type}_total`;
      typeStats[typeKey] = (typeStats[typeKey] || 0) + 1;
    }

    return { ...stats, ...typeStats };
  }

  // Cleanup old completed/failed jobs
  async cleanup(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const { data, error } = await this.supabase
      .from('job_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      logger.error('Failed to cleanup old jobs', { error: error.message });
      return 0;
    }

    const cleaned = data?.length || 0;
    if (cleaned > 0) {
      logger.info('Cleaned up old jobs', { count: cleaned, olderThanDays });
    }

    return cleaned;
  }
}

// Singleton instance
export const queue = new Queue();