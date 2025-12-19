import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ChevronLeft, Download, ShieldAlert, Users, Lock, Loader2, Activity, ShieldCheck, Database, Globe, Terminal, Sparkles, Printer, AlertTriangle
} from 'lucide-react';
import { api, AssessmentReport, SecurityCharts } from '@/lib/api';
import { AIInsightsSection } from '@/components/reports/AIInsightsSection';
import { AppDetailsDrillDown } from '@/components/reports/AppDetailsDrillDown';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('library');
  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const res = await api.getReport(id);
        if (res.success && res.data) setReport(res.data);
      } catch (err) {
        console.error('Failed to fetch report');
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
        <p className="text-muted-foreground font-medium">Processing advanced security telemetry...</p>
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
  const safeAppLibrary = report.appLibrary ?? [];
  const summary = report.summary;
  const isHighRiskShadow = (summary?.shadowUsage ?? 0) > 30;
  const isHighRiskUnapproved = (summary?.unapprovedApps ?? 0) > 0;
  const statusCounts = safeAppLibrary.reduce((acc: Record<string, number>, app) => {
    const status = app.status ?? 'Unreviewed';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value: Number(value)
  }));
  const filteredApps = selectedStatus
    ? safeAppLibrary.filter(a => a.status === selectedStatus)
    : safeAppLibrary;
  return (
    <AppLayout container>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/reports')} className="rounded-xl no-print">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Audit {(report.id ?? '').slice(-6)}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="text-sm">ZTNA Engine v2.5 ��� {report.date ?? 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Raw Logs</Button>
            <Button onClick={() => window.print()} className="btn-gradient rounded-xl"><Printer className="h-4 w-4 mr-2" /> Generate PDF</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className={cn(
            "border-border/50 shadow-soft transition-all",
            isHighRiskShadow && "ring-4 ring-red-500 animate-pulse bg-red-500/5"
          )}>
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-red-500/10">
                <Terminal className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Shadow AI Usage</p>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-3xl font-bold", isHighRiskShadow ? "text-red-500" : "text-foreground")}>
                  {summary?.shadowUsage?.toFixed(2) ?? 0}%
                </p>
                {isHighRiskShadow && (
                  <Badge variant="destructive" className="text-[8px] h-4">CRITICAL</Badge>
                )}
              </div>
              <Progress value={summary?.shadowUsage ?? 0} className={cn("h-1 mt-2", isHighRiskShadow ? "[&>div]:bg-red-500" : "")} />
            </CardContent>
          </Card>
          <Card className={cn(
            "border-border/50 shadow-soft transition-all",
            isHighRiskUnapproved && "ring-4 ring-red-500 bg-red-500/5"
          )}>
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Unapproved Apps</p>
              <div className="flex items-center gap-3">
                <p className={cn("text-3xl font-bold", isHighRiskUnapproved ? "text-red-600" : "text-foreground")}>
                  {summary?.unapprovedApps ?? 0}
                </p>
                {isHighRiskUnapproved && (
                  <Badge className="bg-red-600 text-white border-none text-[10px] h-5">BLOCKED</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft overflow-hidden">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-blue-500/10">
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Data Exfil Risk</p>
              <p className="text-2xl font-bold text-blue-500">{summary?.dataExfiltrationRisk ?? '0 MB'}</p>
              <p className="text-[10px] text-muted-foreground mt-1">DLP Incident Volume</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft overflow-hidden">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Top Power Users</p>
              <div className="space-y-1.5 mt-2">
                {(report?.powerUsers ?? []).slice(0, 3).map((user, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px]">
                    <span className="font-medium text-foreground truncate max-w-[80px]">{user?.name ?? 'N/A'}</span>
                    <span className="text-purple-500 font-bold">{user?.prompts ?? 0} reqs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft overflow-hidden">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Posture Score</p>
              <div className="flex flex-col">
                <p className="text-2xl font-bold text-green-500">{(summary?.casbPosture ?? 0)}/100</p>
                <div className="h-1 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${summary?.casbPosture ?? 0}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-8 space-x-8 no-print">
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-0 py-4 font-bold text-sm text-foreground">Application Inventory</TabsTrigger>
            <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-0 py-4 font-bold text-sm text-foreground">Security Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-6">
            <Card className="border-border/50 shadow-soft overflow-hidden">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold text-foreground">Application</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-foreground">Status</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-foreground">Risk Level</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold text-foreground">Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.appId} className="hover:bg-secondary/10">
                      <TableCell className="font-bold text-sm text-foreground">{app.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px]" style={{ color: PIE_COLORS[app.status] }}>{app.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={app.risk === 'High' ? 'destructive' : 'outline'} className="text-[9px]">{app.risk}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">{app.users}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}