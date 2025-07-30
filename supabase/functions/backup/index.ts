import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger, withLogging } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupConfig {
  tables: string[];
  storageDestination: string;
  retentionDays: number;
  compressionEnabled: boolean;
}

class BackupService {
  private supabaseClient: any;
  private config: BackupConfig;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
    this.config = {
      tables: ['user_analyses', 'knowledge_base', 'profiles', 'document_templates', 'audit_logs'],
      storageDestination: 'backups',
      retentionDays: 30,
      compressionEnabled: true
    };
  }

  async createFullBackup(): Promise<{ success: boolean; backupId: string; size: number }> {
    const backupId = `full-backup-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    
    logger.info('Starting full backup', {
      function_name: 'backup',
      backup_id: backupId,
      tables: this.config.tables
    });

    try {
      const backupData: any = {
        metadata: {
          backup_id: backupId,
          created_at: timestamp,
          type: 'full',
          version: '1.0'
        },
        data: {}
      };

      // Backup each table
      for (const table of this.config.tables) {
        logger.debug(`Backing up table: ${table}`, {
          function_name: 'backup',
          backup_id: backupId,
          table
        });

        const { data, error } = await this.supabaseClient
          .from(table)
          .select('*');

        if (error) {
          logger.error(`Failed to backup table ${table}`, {
            function_name: 'backup',
            backup_id: backupId,
            table
          }, error);
          throw new Error(`Backup failed for table ${table}: ${error.message}`);
        }

        backupData.data[table] = data;
      }

      // Backup storage metadata
      const { data: storageData } = await this.supabaseClient
        .storage
        .from('knowledge-base')
        .list();

      if (storageData) {
        backupData.data.storage_metadata = storageData;
      }

      // Convert to JSON and optionally compress
      let backupContent = JSON.stringify(backupData, null, 2);
      const originalSize = new TextEncoder().encode(backupContent).length;

      if (this.config.compressionEnabled) {
        // Simple compression simulation - in production would use gzip
        logger.debug('Compressing backup data', {
          function_name: 'backup',
          backup_id: backupId,
          original_size: originalSize
        });
      }

      // Save backup to storage
      const fileName = `${backupId}.json`;
      const { error: uploadError } = await this.supabaseClient
        .storage
        .from(this.config.storageDestination)
        .upload(fileName, new TextEncoder().encode(backupContent), {
          contentType: 'application/json'
        });

      if (uploadError) {
        logger.error('Failed to upload backup', {
          function_name: 'backup',
          backup_id: backupId
        }, uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Log backup completion
      await this.logBackupEvent(backupId, 'completed', {
        tables_count: this.config.tables.length,
        size_bytes: originalSize,
        storage_path: fileName
      });

      logger.info('Backup completed successfully', {
        function_name: 'backup',
        backup_id: backupId,
        size_bytes: originalSize,
        tables_count: this.config.tables.length
      });

      return {
        success: true,
        backupId,
        size: originalSize
      };

    } catch (error) {
      await this.logBackupEvent(backupId, 'failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async createIncrementalBackup(lastBackupDate: string): Promise<{ success: boolean; backupId: string; changes: number }> {
    const backupId = `incr-backup-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID()}`;
    
    logger.info('Starting incremental backup', {
      function_name: 'backup',
      backup_id: backupId,
      since: lastBackupDate
    });

    try {
      const changesData: any = {
        metadata: {
          backup_id: backupId,
          created_at: new Date().toISOString(),
          type: 'incremental',
          since: lastBackupDate
        },
        changes: {}
      };

      let totalChanges = 0;

      // Get changes since last backup for each table
      for (const table of this.config.tables) {
        const { data, error } = await this.supabaseClient
          .from(table)
          .select('*')
          .gte('updated_at', lastBackupDate);

        if (error) {
          logger.error(`Failed to get changes for table ${table}`, {
            function_name: 'backup',
            backup_id: backupId,
            table
          }, error);
          continue;
        }

        if (data && data.length > 0) {
          changesData.changes[table] = data;
          totalChanges += data.length;
        }
      }

      // Save incremental backup
      const fileName = `${backupId}.json`;
      const backupContent = JSON.stringify(changesData, null, 2);

      const { error: uploadError } = await this.supabaseClient
        .storage
        .from(this.config.storageDestination)
        .upload(fileName, new TextEncoder().encode(backupContent), {
          contentType: 'application/json'
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      await this.logBackupEvent(backupId, 'completed', {
        type: 'incremental',
        changes_count: totalChanges,
        storage_path: fileName
      });

      logger.info('Incremental backup completed', {
        function_name: 'backup',
        backup_id: backupId,
        changes_count: totalChanges
      });

      return {
        success: true,
        backupId,
        changes: totalChanges
      };

    } catch (error) {
      await this.logBackupEvent(backupId, 'failed', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async restoreBackup(backupId: string, options: { dryRun?: boolean; tablesOnly?: string[] } = {}): Promise<{ success: boolean; restored: string[] }> {
    logger.info('Starting backup restoration', {
      function_name: 'backup',
      backup_id: backupId,
      dry_run: options.dryRun || false
    });

    try {
      // Download backup file
      const fileName = `${backupId}.json`;
      const { data: backupFile, error } = await this.supabaseClient
        .storage
        .from(this.config.storageDestination)
        .download(fileName);

      if (error || !backupFile) {
        throw new Error(`Backup file not found: ${backupId}`);
      }

      const backupContent = await backupFile.text();
      const backupData = JSON.parse(backupContent);

      if (options.dryRun) {
        logger.info('Dry run completed', {
          function_name: 'backup',
          backup_id: backupId,
          available_tables: Object.keys(backupData.data || {})
        });
        return {
          success: true,
          restored: Object.keys(backupData.data || {})
        };
      }

      const restoredTables: string[] = [];
      const tablesToRestore = options.tablesOnly || Object.keys(backupData.data || {});

      // Restore each table
      for (const table of tablesToRestore) {
        if (table === 'storage_metadata') continue;

        const tableData = backupData.data[table];
        if (!tableData || !Array.isArray(tableData)) continue;

        logger.debug(`Restoring table: ${table}`, {
          function_name: 'backup',
          backup_id: backupId,
          records_count: tableData.length
        });

        // Note: In production, this would need more sophisticated restore logic
        // to handle conflicts, foreign keys, etc.
        const { error: restoreError } = await this.supabaseClient
          .from(table)
          .upsert(tableData);

        if (restoreError) {
          logger.error(`Failed to restore table ${table}`, {
            function_name: 'backup',
            backup_id: backupId
          }, restoreError);
        } else {
          restoredTables.push(table);
        }
      }

      await this.logBackupEvent(backupId, 'restored', {
        restored_tables: restoredTables,
        requested_tables: tablesToRestore
      });

      logger.info('Backup restoration completed', {
        function_name: 'backup',
        backup_id: backupId,
        restored_count: restoredTables.length
      });

      return {
        success: true,
        restored: restoredTables
      };

    } catch (error) {
      logger.error('Backup restoration failed', {
        function_name: 'backup',
        backup_id: backupId
      }, error as Error);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<{ deleted: number }> {
    logger.info('Starting backup cleanup', {
      function_name: 'backup',
      retention_days: this.config.retentionDays
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    try {
      const { data: backupFiles } = await this.supabaseClient
        .storage
        .from(this.config.storageDestination)
        .list();

      if (!backupFiles) return { deleted: 0 };

      const filesToDelete = backupFiles.filter((file: any) => {
        return new Date(file.created_at) < cutoffDate;
      });

      let deletedCount = 0;
      for (const file of filesToDelete) {
        const { error } = await this.supabaseClient
          .storage
          .from(this.config.storageDestination)
          .remove([file.name]);

        if (!error) {
          deletedCount++;
          logger.debug(`Deleted old backup: ${file.name}`, {
            function_name: 'backup',
            file_name: file.name
          });
        }
      }

      logger.info('Backup cleanup completed', {
        function_name: 'backup',
        deleted_count: deletedCount,
        total_checked: backupFiles.length
      });

      return { deleted: deletedCount };

    } catch (error) {
      logger.error('Backup cleanup failed', {
        function_name: 'backup'
      }, error as Error);
      throw error;
    }
  }

  async listBackups(): Promise<any[]> {
    const { data: backupFiles } = await this.supabaseClient
      .storage
      .from(this.config.storageDestination)
      .list();

    return (backupFiles || []).map((file: any) => ({
      backup_id: file.name.replace('.json', ''),
      created_at: file.created_at,
      size: file.metadata?.size || 0,
      type: file.name.includes('incr-') ? 'incremental' : 'full'
    }));
  }

  private async logBackupEvent(backupId: string, event: string, details: any): Promise<void> {
    try {
      await this.supabaseClient
        .from('audit_logs')
        .insert({
          action: `backup_${event}`,
          resource_type: 'backup',
          resource_id: backupId,
          details,
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      logger.warn('Failed to log backup event', {
        function_name: 'backup',
        backup_id: backupId,
        event
      }, error as Error);
    }
  }
}

const FUNCTION_NAME = 'backup';

serve(withLogging(FUNCTION_NAME, async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const context = { function_name: FUNCTION_NAME, request_id: requestId };

  try {
    // Check admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { action, ...params } = await req.json();
    const backupService = new BackupService(supabaseClient);

    logger.info('Backup request received', { ...context, action, user_id: user.id });

    let result;

    switch (action) {
      case 'create_full':
        result = await backupService.createFullBackup();
        break;

      case 'create_incremental':
        result = await backupService.createIncrementalBackup(params.lastBackupDate);
        break;

      case 'restore':
        result = await backupService.restoreBackup(params.backupId, params.options || {});
        break;

      case 'cleanup':
        result = await backupService.cleanupOldBackups();
        break;

      case 'list':
        result = await backupService.listBackups();
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error in backup function', context, error as Error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));