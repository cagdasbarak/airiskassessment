import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, Globe, Printer, BarChart3, PieChart, Zap, Loader2
} from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { AppDetailsDrillDown } from '@/components/reports/AppDetailsDrillDown';
import { AIInsightsSection } from '@/components/reports/AIInsightsSection';
import { ExecutiveScorecard } from '@/components/reports/ExecutiveScorecard';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
const PIE_COLORS: Record<string, string> = {
  'Unreviewed': '#808080',
  'Review': '#FDBA74',
  'Unapproved': '#EF4444',
  'Approved': '#10B981'
};
const usageChartConfig: ChartConfig = {
  'ChatGPT': { label: 'ChatGPT', color: '#10B981' },
  'Claude': { label: 'Claude', color: '#FDBA74' },
  'GitHub Copilot': { label: 'GitHub Copilot', color: '#3B82F6' },
  'Midjourney': { label: 'Midjourney', color: '#EF4444' }
};
const dataChartConfig: ChartConfig = {
  'Approved': { label: 'Approved Data', color: '#10B981' },
  'Unapproved': { label: 'Unapproved Data', color: '#EF4444' }
};
const pieChartConfig: ChartConfig = {
  'Approved': { label: 'Approved', color: '#10B981' },
  'Review': { label: 'Review', color: '#FDBA74' },
  'Unapproved': { label: 'Unapproved', color: '#EF4444' },
  'Unreviewed': { label: 'Unreviewed', color: '#808080' }
};
export function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    const fetchReport = async () => {
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
  const pieData = useMemo(() => {
    if (!report?.appLibrary) return [];
    const counts: Record<string, number> = {};
    report.appLibrary.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count,
      fill: PIE_COLORS[status] || '#808080'
    }));
  }, [report]);
  const filteredInventory = useMemo(() => {
    if (!report?.appLibrary) return [];
    if (!selectedStatusFilter) return report.appLibrary;
    return report.appLibrary.filter(app => app.status === selectedStatusFilter);
  }, [report, selectedStatusFilter]);
  if (isLoading) return (
    <AppLayout container>
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#F38020]" />
        <p className="text-muted-foreground font-medium italic">Reconstructing 30-day security telemetry...</p>
      </div>
    </AppLayout>
  );
  if (!report) return (
    <AppLayout container>
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold">Report not found</h2>
        <Button onClick={() => navigate('/reports')} className="mt-4">Back to Archive</Button>
      </div>
    </AppLayout>
  );
  return (
    <AppLayout container>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/reports')} className="rounded-xl no-print">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Cloudflare ZTNA Audit</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="text-xs font-mono">Snapshot ID: {report?.id ?? 'N/A'} • Date: {report.date}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Executive PDF
            </Button>
          </div>
        </div>
        <ExecutiveScorecard summary={report.summary} score={report.score} />
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-12 mb-8 space-x-8">
            <TabsTrigger value="trends" className="data-[state=active]:border-[#F38020] border-b-2 border-transparent rounded-none px-0 h-full font-bold">Security Trends</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:border-[#F38020] border-b-2 border-transparent rounded-none px-0 h-full font-bold">Inventory & Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="trends" className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <AIInsightsSection insights={report.aiInsights} />
            <div className="grid grid-cols-1 gap-8">
              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#F38020]" /> AI Usage distribution (Users)
                  </CardTitle>
                  <CardDescription>30-day user engagement across GenAI platforms.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={usageChartConfig} className="h-[350px]">
                    <BarChart data={report.securityCharts?.usageTrends ?? []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} hide />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="ChatGPT" stackId="a" fill="var(--color-ChatGPT)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Claude" stackId="a" fill="var(--color-Claude)" />
                      <Bar dataKey="GitHub Copilot" stackId="a" fill="var(--color-GitHub-Copilot)" />
                      <Bar dataKey="Midjourney" stackId="a" fill="var(--color-Midjourney)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-border/50 shadow-soft h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" /> Top Power Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase">User</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase text-right">Prompts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(report.powerUsers ?? []).map((u) => (
                          <TableRow key={u.email}>
                            <TableCell>
                              <div className="font-bold text-sm">{u.name}</div>
                              <div className="text-[10px] text-muted-foreground">{u.email}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-[#F38020]">
                              {u.prompts}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-soft h-full">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Data Upload Trends (KB)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={dataChartConfig} className="h-[350px]">
                      <AreaChart data={report.securityCharts?.dataTrends ?? []}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="Approved" stackId="1" stroke="var(--color-Approved)" fill="var(--color-Approved)" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="Unapproved" stackId="1" stroke="var(--color-Unapproved)" fill="var(--color-Unapproved)" fillOpacity={0.2} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="inventory" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col lg:flex-row gap-8">
              <Card className="flex-1 border-border/50 shadow-soft h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-[#F38020]" /> Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ChartContainer config={pieChartConfig} className="h-[350px] w-full">
                    <RePieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data) => setSelectedStatusFilter(selectedStatusFilter === data.name ? null : data.name)}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} cursor="pointer" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </RePieChart>
                  </ChartContainer>
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                    {pieData.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => setSelectedStatusFilter(selectedStatusFilter === d.name ? null : d.name)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border transition-all text-left",
                          selectedStatusFilter === d.name ? "bg-secondary border-primary" : "border-border/50 hover:bg-secondary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                          <span className="text-xs font-bold">{d.name}</span>
                        </div>
                        <span className="text-[10px] opacity-50">{d.value}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="lg:w-[65%] space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                    <BarChart3 className="h-4 w-4" /> Detected Inventory
                    {selectedStatusFilter && <Badge variant="secondary" className="ml-2">Filter: {selectedStatusFilter}</Badge>}
                  </h3>
                  {selectedStatusFilter && <Button variant="link" size="sm" onClick={() => setSelectedStatusFilter(null)}>Reset</Button>}
                </div>
                <div className="rounded-xl border border-border/50 overflow-hidden shadow-soft bg-background">
                  <Table>
                    <TableHeader className="bg-secondary/30">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Application</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((app) => (
                        <Fragment key={app.appId}>
                          <TableRow
                            className={cn("cursor-pointer hover:bg-secondary/20 transition-colors", expandedApp === app.appId && "bg-secondary/10")}
                            onClick={() => setExpandedApp(expandedApp === app.appId ? null : app.appId)}
                          >
                            <TableCell className="font-bold text-sm">
                              {app.name}
                              <div className="text-[9px] text-muted-foreground font-normal">{app.category}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px]" style={{ color: PIE_COLORS[app.status], borderColor: (PIE_COLORS[app.status] ?? '#808080') + '40' }}>{app.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn("font-mono font-bold", (app.risk_score ?? 0) > 70 ? "text-red-500" : "text-green-500")}>{app.risk_score ?? 0}</span>
                            </TableCell>
                          </TableRow>
                          {expandedApp === app.appId && (
                            <TableRow className="bg-secondary/5">
                              <TableCell colSpan={3} className="p-0 border-t-0">
                                <div className="p-6 bg-background/50 border-t border-border/30">
                                  <AppDetailsDrillDown app={app} />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}