import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useAdminLogs } from "@/hooks/useAdminLogs";

const AdminLogs = () => {
  const { data, loading, error } = useAdminLogs();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Error loading logs: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No log data available</p>
      </div>
    );
  }

  const { stats, logs } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Knowledge Base Logs</h2>
        <p className="text-muted-foreground">
          Monitor knowledge base uploads and processing activities
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">Uploaded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processedFiles}</div>
            <p className="text-xs text-muted-foreground">Successfully</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFiles}</div>
            <p className="text-xs text-muted-foreground">In queue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}</div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest knowledge base uploads and processing</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.original_name}</TableCell>
                  <TableCell className="uppercase text-xs">{log.file_type}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.file_size ? `${Math.round(log.file_size / 1024)}KB` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'processed' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.processed_at ? new Date(log.processed_at).toLocaleString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;