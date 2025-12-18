import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { MOCK_LOGS } from '@/lib/mock-data';
import { toast } from 'sonner';
export function LogsPage() {
  const clearLogs = () => {
    toast.info('Audit logs cleared');
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Track all administrative activities within RiskGuard AI.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button variant="destructive" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear Logs
            </Button>
          </div>
        </div>
        <Card className="border-border/50 shadow-soft overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LOGS.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      {log.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}