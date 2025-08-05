import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  function: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

const AdminTestPanel = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { function: 'admin-users', status: 'idle' },
    { function: 'admin-billing', status: 'idle' },
    { function: 'admin-ai-logs', status: 'idle' },
    { function: 'admin-system-settings', status: 'idle' },
  ]);

  const testFunction = async (functionName: string) => {
    const startTime = Date.now();
    
    setTests(prev => prev.map(test => 
      test.function === functionName 
        ? { ...test, status: 'testing', error: undefined } 
        : test
    ));

    try {
      // Get current session
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      const duration = Date.now() - startTime;

      if (error) {
        throw new Error(error.message || 'Function failed');
      }

      setTests(prev => prev.map(test => 
        test.function === functionName 
          ? { 
              ...test, 
              status: 'success', 
              result: data,
              duration 
            } 
          : test
      ));

      toast.success(`${functionName} test passed in ${duration}ms`);
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setTests(prev => prev.map(test => 
        test.function === functionName 
          ? { 
              ...test, 
              status: 'error', 
              error: errorMessage,
              duration 
            } 
          : test
      ));

      toast.error(`${functionName} test failed: ${errorMessage}`);
    }
  };

  const testAllFunctions = async () => {
    for (const test of tests) {
      await testFunction(test.function);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Admin Edge Functions Test Panel</CardTitle>
        <div className="flex gap-2">
          <Button onClick={testAllFunctions}>Test All Functions</Button>
          <Button 
            variant="outline" 
            onClick={() => setTests(prev => prev.map(test => ({ 
              ...test, 
              status: 'idle', 
              error: undefined, 
              result: undefined,
              duration: undefined 
            })))}
          >
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.function} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h3 className="font-medium">{test.function}</h3>
                  {test.duration && (
                    <p className="text-sm text-muted-foreground">{test.duration}ms</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {test.status === 'success' && test.result && (
                  <div className="text-sm text-green-600">
                    {test.function === 'admin-users' && `${test.result.users?.length || 0} users`}
                    {test.function === 'admin-billing' && `${test.result.totalUsers || 0} total users`}
                    {test.function === 'admin-ai-logs' && `${test.result.logs?.length || 0} logs`}
                    {test.function === 'admin-system-settings' && 'Settings loaded'}
                  </div>
                )}
                
                {test.error && (
                  <div className="text-sm text-red-600 max-w-xs truncate">
                    {test.error}
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => testFunction(test.function)}
                  disabled={test.status === 'testing'}
                >
                  {test.status === 'testing' ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminTestPanel;