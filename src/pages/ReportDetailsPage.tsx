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
  ChevronLeft, Download, ShieldAlert, Users, Lock, Loader2, Activity, ShieldCheck, Database, Globe, Terminal, Sparkles, Printer
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
  const handlePrint = () => {
    window.print();
  };
  if (isLoading) return (
    <AppLayout container>
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#F38020]" />
        <p className="text-muted-foreground font-medium">Processing advanced security telemetry...</p>
      </div>
    </AppLayout>
  );
  if (!report) return (
    <AppLayout container>
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold">Security report not found</h2>
        <Button variant="link" onClick={() => navigate('/reports')}>Back to Archive</Button>
      </div>
    </AppLayout>
  );
  const safeAppLibrary = report.appLibrary ?? [];
  const summary = report.summary;
  const charts = (report.securityCharts || {}) as SecurityCharts;
  const topAppsTrend = charts.topAppsTrend ?? [];
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
  const trendKeys = topAppsTrend.length > 0 ? Object.keys(topAppsTrend[0]).filter(k => k !== 'name') : [];
  return (
    <AppLayout container>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/reports')} className="rounded-xl no-print">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Security Audit {(report.id ?? '').slice(-6)}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="text-sm">ZTNA Engine v2.5 • {report.date}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Raw Logs</Button>
            <Button onClick={handlePrint} className="btn-gradient rounded-xl"><Printer className="h-4 w-4 mr-2" /> Generate PDF</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border/50 shadow-soft overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-red-500/10">
                <Terminal className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Shadow AI Usage</p>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-3xl font-bold", (summary.shadowUsage) > 50 ? "text-red-500" : "text-foreground")}>
                  {summary.shadowUsage}%
                </p>
                {(summary.shadowUsage) > 50 && (
                  <Badge variant="destructive" className="text-[8px] h-4">HighRisk</Badge>
                )}
              </div>
              <Progress value={summary.shadowUsage} className={cn("h-1 mt-2", (summary.shadowUsage) > 50 ? "[&>div]:bg-red-500" : "")} />
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-orange-500/10">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Unapproved Apps</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-orange-500">{summary.unapprovedApps}</p>
                <span className="text-xs text-muted-foreground">Blocked</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-blue-500/10">
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Data Exfil Risk</p>
              <p className="text-2xl font-bold text-blue-500">{summary.dataExfiltrationRisk}</p>
              <p className="text-[10px] text-muted-foreground mt-1">DLP Incident Volume</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Top Power Users</p>
              <div className="space-y-1.5 mt-2">
                {(report.powerUsers ?? []).map((user, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px]">
                    <span className="font-medium text-foreground truncate max-w-[80px]">{user.name}</span>
                    <span className="text-purple-500 font-bold">{user.prompts} reqs</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-soft overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="p-2 rounded-lg w-fit mb-4 bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Posture Score</p>
              <div className="flex flex-col">
                <p className="text-2xl font-bold text-green-500">{summary.casbPosture}/100</p>
                <div className="h-1 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${summary.casbPosture}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-8 space-x-8 no-print">
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-0 py-4 font-bold text-sm">Application Inventory</TabsTrigger>
            <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-0 py-4 font-bold text-sm">Security Analytics</TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-0 py-4 font-bold text-sm">Executive Recommendations</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1 border-border/50 shadow-soft h-fit">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Review Status Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(data) => setSelectedStatus(selectedStatus === data.name ? null : data.name)}
                          className="cursor-pointer"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#CBD5E1'} strokeWidth={selectedStatus === entry.name ? 4 : 0} stroke="currentColor" className="text-background" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-4">
                    {pieData.map((entry) => (
                      <button
                        key={`pie-${entry.name}`}
                        onClick={() => setSelectedStatus(selectedStatus === entry.name ? null : entry.name)}
                        className={cn(
                          "flex items-center justify-between w-full p-2.5 rounded-xl text-xs transition-all hover:bg-secondary/50",
                          selectedStatus === entry.name ? "bg-secondary ring-1 ring-inset ring-[#F38020]" : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[entry.name] }} />
                          <span className="font-bold">{entry.name}</span>
                        </div>
                        <span className="font-mono">{entry.value}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-3 border-border/50 shadow-soft overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <div>
                    <CardTitle className="text-lg">AI Discovery Log</CardTitle>
                    <CardDescription className="text-xs">Granular analysis of detected generative AI endpoints.</CardDescription>
                  </div>
                  {selectedStatus && <Button variant="ghost" size="sm" onClick={() => setSelectedStatus(null)} className="h-8 rounded-lg text-xs no-print">Clear Filter</Button>}
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-secondary/20">
                      <TableRow className="border-b-0">
                        <TableHead className="w-[30px]"></TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Application</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">App Confidence</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">GenAI Score</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                        <TableHead className="text-right text-[10px] uppercase font-bold">Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApps.map((app) => (
                        <React.Fragment key={app.appId}>
                          <TableRow
                            className="cursor-pointer group hover:bg-secondary/10 transition-colors border-l-4 border-l-transparent data-[state=expanded]:border-l-[#F38020] data-[state=expanded]:bg-secondary/30"
                            data-state={expandedRow === app.appId ? "expanded" : "collapsed"}
                            onClick={() => setExpandedRow(expandedRow === app.appId ? null : app.appId)}
                          >
                            <TableCell className="text-muted-foreground font-mono text-xs">{expandedRow === app.appId ? '−' : '+'}</TableCell>
                            <TableCell className="font-bold text-sm">{app.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                                  <div className={cn("h-full", (app.risk_score ?? 0) > 70 ? 'bg-red-500' : 'bg-green-500')} style={{ width: `${app.risk_score ?? 0}%` }} />
                                </div>
                                <span className="text-[10px] font-bold">{app.risk_score ?? 0}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-mono font-bold text-blue-500">{app.genai_score ?? 0}%</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[9px] h-5" style={{ backgroundColor: `${PIE_COLORS[app.status] || '#808080'}20`, color: PIE_COLORS[app.status] || '#808080', border: `1px solid ${PIE_COLORS[app.status] || '#808080'}40` }}>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold">{app.users ?? 0}</TableCell>
                          </TableRow>
                          <AnimatePresence>
                            {expandedRow === app.appId && (
                              <TableRow className="bg-secondary/5">
                                <TableCell colSpan={6} className="p-0 border-b">
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="p-6">
                                      <AppDetailsDrillDown app={app as any} />
                                    </div>
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="security" className="space-y-8">
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" /> Top 5 Visited AI Apps (30 Day Trend)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={topAppsTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {trendKeys.map((key, i) => (
                      <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={`hsl(${i * 60}, 70%, 50%)`} fill={`hsl(${i * 60}, 70%, 50%)`} fillOpacity={0.4} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recommendations">
            {report.aiInsights ? <AIInsightsSection insights={report.aiInsights} /> : (
              <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
                <Sparkles className="h-10 w-10 text-muted-foreground opacity-20" />
                <p>AI analysis data missing for this report.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}