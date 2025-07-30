import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useState, useEffect } from "react";

const AdminSettings = () => {
  const { settings, loading, saving, updateSettings } = useSystemSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No settings available</p>
      </div>
    );
  }

  const handleSave = () => {
    if (localSettings) {
      updateSettings(localSettings);
    }
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure system preferences and security
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Basic system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="system-name">System Name</Label>
              <Input 
                id="system-name" 
                value={localSettings?.system_name || ""} 
                onChange={(e) => setLocalSettings(prev => prev ? {...prev, system_name: e.target.value} : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input 
                id="admin-email" 
                type="email" 
                value={localSettings?.admin_email || ""} 
                onChange={(e) => setLocalSettings(prev => prev ? {...prev, admin_email: e.target.value} : null)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to restrict access during updates
                </p>
              </div>
              <Switch 
                checked={localSettings?.maintenance_mode === "true"}
                onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, maintenance_mode: checked.toString()} : null)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              Configure AI analysis settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-retry Failed Analyses</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically retry failed AI requests
                </p>
              </div>
              <Switch 
                checked={localSettings?.auto_retry_analyses === "true"}
                onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, auto_retry_analyses: checked.toString()} : null)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="max-retries">Max Retry Attempts</Label>
              <Input 
                id="max-retries" 
                type="number" 
                value={localSettings?.max_retry_attempts || ""} 
                onChange={(e) => setLocalSettings(prev => prev ? {...prev, max_retry_attempts: e.target.value} : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (seconds)</Label>
              <Input 
                id="timeout" 
                type="number" 
                value={localSettings?.request_timeout || ""} 
                onChange={(e) => setLocalSettings(prev => prev ? {...prev, request_timeout: e.target.value} : null)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Security and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for admin access
                </p>
              </div>
              <Switch 
                checked={localSettings?.require_2fa === "true"}
                onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, require_2fa: checked.toString()} : null)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-logout inactive sessions
                </p>
              </div>
              <Switch 
                checked={localSettings?.session_timeout === "true"}
                onCheckedChange={(checked) => setLocalSettings(prev => prev ? {...prev, session_timeout: checked.toString()} : null)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="session-duration">Session Duration (hours)</Label>
              <Input 
                id="session-duration" 
                type="number" 
                value={localSettings?.session_duration || ""} 
                onChange={(e) => setLocalSettings(prev => prev ? {...prev, session_duration: e.target.value} : null)}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;