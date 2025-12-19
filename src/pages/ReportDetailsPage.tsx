import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, Download, Users, Loader2, ShieldCheck, Database, Globe, Terminal, Printer, AlertTriangle
} from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
const PIE_COLORS: Record<string, string> = {
  'Unreviewed': '#808080',
  'Review': '#FDBA74',
  'Unapproved': '#EF4444',
  'Approved': '#10B981'
};
export function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('library');
  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const res = await api.getReport(id);
        if (res.success && res.data) setReport(res.data);
      } catch (err) {
        console.error('Report fetch failed');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);
  if (isLoading) return (
    <AppLayout container>
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#F38020]" />
        <p className="text-muted-foreground font-medium">Aggregating Cloudflare Security Logs...</p>
      </div>
    </AppLayout>
  );
  if (!report || !report.summary) return (
    <AppLayout container>
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-foreground">Security report not found</h2>
        <Button variant="link" onClick={() => navigate('/reports')}>Back to Archive</Button>
      </div>
    </AppLayout>
  );
  const summary = report.summary;
  const safeAppLibrary = report.appLibrary ?? [];
  const shadowPercent = Number(summary.shadowUsage) || 0;
  const isHighRiskShadow = shadowPercent > 30;
  return (
    <AppLayout container>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/reports')} className="rounded-xl no-print">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Security Audit {(report.id || '').slice(-6)}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="text-sm">ZTNA Core v2.5 • {report.date || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Export</Button>
            <Button onClick={() => window.print()} className="btn-gradient rounded-xl"><Printer className="h-4 w-4 mr-2" /> PDF</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className={cn("border-border/50 shadow-soft", isHighRiskShadow && "ring-2 ring-red-500 bg-red-500/5")}>
            <CardContent className="p-6">
              <Terminal className="h-5 w-5 text-red-500 mb-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Shadow AI Usage</p>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-3xl font-bold", isHighRiskShadow ? "text-red-500" : "text-foreground")}>
                  {shadowPercent.toFixed(1)}%
                </p>
                {isHighRiskShadow && <Badge variant="destructive" className="text-[8px] h-4">CRITICAL</Badge>}
              </div>
              <Progress value={shadowPercent} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-6">
              <AlertTriangle className="h-5 w-5 text-orange-500 mb-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Unapproved Apps</p>
              <p className="text-3xl font-bold">{summary.unapprovedApps || 0}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-6">
              <Database className="h-5 w-5 text-blue-500 mb-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">DLP Incident Mass</p>
              <p className="text-2xl font-bold text-blue-500">{summary.dataExfiltrationRisk || '0 MB'}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-6">
              <Users className="h-5 w-5 text-purple-500 mb-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Power Users</p>
              <div className="space-y-1 mt-2">
                {(report.powerUsers || []).slice(0, 2).map((u, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[80px]">{u.name}</span>
                    <span className="font-bold">{u.prompts} reqs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft">
            <CardContent className="p-6">
              <ShieldCheck className="h-5 w-5 text-green-500 mb-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Security Score</p>
              <p className="text-2xl font-bold text-green-500">{report.score}%</p>
            </CardContent>
          </Card>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-8 space-x-8">
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] px-0 py-4 font-bold text-sm">Application Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-6">
            <div className="rounded-xl border border-border/50 shadow-soft overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold">Application</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Risk Level</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeAppLibrary.length > 0 ? safeAppLibrary.map((app, i) => (
                    <TableRow key={app.appId || i}>
                      <TableCell className="font-bold text-sm">{app.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px]" style={{ color: PIE_COLORS[app.status] || '#808080' }}>{app.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={app.risk === 'High' ? 'destructive' : 'outline'} className="text-[9px]">{app.risk}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{app.users}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">No AI applications detected in logs.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}