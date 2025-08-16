import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: 'auth_failure' | 'permission_denied' | 'suspicious_activity' | 'data_access';
  user_id?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security monitoring hook for detecting and logging security events
 */
export const useSecurityMonitor = () => {
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const logSecurityEvent = async (
    eventType: SecurityEvent['event_type'],
    details: Record<string, any>,
    severity: SecurityEvent['severity'] = 'medium'
  ) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Default anonymous user for client-side events
          action: eventType,
          resource_type: 'security_event',
          details: {
            event_type: eventType,
            severity,
            ...details,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            ip_address: 'client_side' // Will be populated server-side
          }
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security event logging failed:', error);
    }
  };

  const detectSuspiciousActivity = (event: string, context: Record<string, any>) => {
    // Rate limiting detection
    const eventKey = `security_${event}_${Date.now()}`;
    const recentAttempts = JSON.parse(
      localStorage.getItem('security_attempts') || '[]'
    );

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // Clean old attempts
    const validAttempts = recentAttempts.filter((attempt: any) => 
      attempt.timestamp > fiveMinutesAgo
    );

    // Add current attempt
    validAttempts.push({ event, timestamp: now, context });

    // Store back
    localStorage.setItem('security_attempts', JSON.stringify(validAttempts));

    // Check for suspicious patterns
    const eventCount = validAttempts.filter((attempt: any) => attempt.event === event).length;
    
    if (eventCount > 10) { // More than 10 attempts in 5 minutes
      logSecurityEvent('suspicious_activity', {
        event,
        attempt_count: eventCount,
        context
      }, 'high');
      
      return true;
    }

    return false;
  };

  const trackAuthFailure = (reason: string, email?: string) => {
    detectSuspiciousActivity('auth_failure', { reason, email });
    logSecurityEvent('auth_failure', { reason, email }, 'medium');
  };

  const trackPermissionDenied = (resource: string, action: string) => {
    detectSuspiciousActivity('permission_denied', { resource, action });
    logSecurityEvent('permission_denied', { resource, action }, 'medium');
  };

  const trackDataAccess = (resource: string, operation: string) => {
    logSecurityEvent('data_access', { resource, operation }, 'low');
  };

  const loadRecentEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', 'security_event')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to load security events:', error);
      } else {
        // Transform the data to match SecurityEvent interface
        const transformedEvents = (data || []).map(item => {
          const details = typeof item.details === 'object' && item.details !== null ? item.details as Record<string, any> : {};
          return {
            id: item.id,
            timestamp: item.timestamp,
            event_type: (details.event_type as SecurityEvent['event_type']) || 'data_access',
            user_id: item.user_id,
            details: details,
            severity: (details.severity as SecurityEvent['severity']) || 'medium'
          };
        });
        setRecentEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Security event loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clean up old security attempts on mount
    const cleanupAttempts = () => {
      const recentAttempts = JSON.parse(
        localStorage.getItem('security_attempts') || '[]'
      );
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      
      const validAttempts = recentAttempts.filter((attempt: any) => 
        attempt.timestamp > oneHourAgo
      );
      
      localStorage.setItem('security_attempts', JSON.stringify(validAttempts));
    };

    cleanupAttempts();
  }, []);

  return {
    recentEvents,
    loading,
    logSecurityEvent,
    detectSuspiciousActivity,
    trackAuthFailure,
    trackPermissionDenied,
    trackDataAccess,
    loadRecentEvents
  };
};