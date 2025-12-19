import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line
} from 'recharts';
import {
  ChevronLeft, Download, ShieldAlert, BrainCircuit,
  Users, Lock, AlertTriangle, Loader2, Sparkles, Activity, FileWarning, ShieldCheck, Database
} from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
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
        if (res.success && res.data) {
          setReport(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch report details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#F38020]" />
          <p className="text-muted-foreground">Synthesizing security audit...</p>
        </div>
      </AppLayout>
    );
  }
  if (!report) {
    return (
      <AppLayout container>
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold">Report not found</h2>
          <Button variant="link" onClick={() => navigate('/reports')}>Back to reports</Button>
        </div>
      </AppLayout>
    );
  }

  const safeAppLibrary = report.appLibrary ?? [];
  const safePowerUsers = report.powerUsers ?? [];
  const safeSummary = report.summary ?? {totalApps:0, aiApps:0, shadowAiApps:0, dataExfiltrationRisk:'0 MB', complianceScore:0, libraryCoverage:0, casbPosture:0};
  const safeCharts = report.securityCharts ?? {usageOverTime:[], riskDistribution:[], dataVolume:[], mcpActivity:[], loginEvents:[]};
  const safeAiInsights = report.aiInsights ?? null;

  const statusCounts = safeAppLibrary.reduce((acc: Record<string, number>, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value: Number(value)
  }));
  const filteredApps = selectedStatus ? safeAppLibrary.filter(a => a.status === selectedStatus) : safeAppLibrary;
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Assessment {(report.id ?? '').slice(-6)}</h1>
              <p className="text-muted-foreground">Audit Date: {report.date ?? 'Unknown'} • Cloudflare Zero Trust</p>
            </div>
          </div>
          <Button className="btn-gradient">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Apps', value: safeSummary.totalApps ?? 0, icon: BrainCircuit, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'AI Apps', value: safeSummary.aiApps ?? 0, icon: Activity, color: 'text-[#F38020]', bg: 'bg-[#F38020]/10' },
            { label: 'Shadow AI', value: safeSummary.shadowAiApps ?? 0, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Risk Level', value: report.riskLevel ?? 'LOW', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Library Coverage', value: `${safeSummary.libraryCoverage ?? 0}%`, icon: Lock, color: 'text-green-500', bg: 'bg-green-500/10' },
          ].map((stat, i) => (
            <Card key={`stat-${i}`} className="border-border/50 shadow-soft overflow-hidden group hover:scale-[1.02] transition-transform">
              <CardContent className="p-6 relative">
                <div className={`absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
                  <stat.icon className={`h-16 w-16 ${stat.color}`} />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-8 overflow-x-auto">
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-6 py-3 font-semibold">App Library</TabsTrigger>
            <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-6 py-3 font-semibold">Security Analytics</TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-6 py-3 font-semibold">Executive Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="lg:col-span-1 border-border/50 shadow-soft h-fit">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Governance Split</CardTitle>
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
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#CBD5E1'} strokeWidth={selectedStatus === entry.name ? 3 : 0} stroke="white" />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {pieData.map((entry, i) => (
                      <button
                        key={`pie-${entry.name}`}
                        onClick={() => setSelectedStatus(selectedStatus === entry.name ? null : entry.name)}
                        className={cn(
                          "flex items-center justify-between w-full p-2 rounded-lg text-xs transition-colors hover:bg-secondary/50",
                          selectedStatus === entry.name ? "bg-secondary ring-1 ring-[#F38020]" : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[entry.name] }} />
                          <span className="font-medium">{entry.name}</span>
                        </div>
                        <span className="font-bold">{entry.value}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-3 border-border/50 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Application Inventory</CardTitle>
                    <CardDescription>
                      {selectedStatus ? `Showing ${selectedStatus} applications only` : 'Drill down into specific GenAI app policies and usage'}
                    </CardDescription>
                  </div>
                  {selectedStatus && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStatus(null)} className="text-xs h-7">Clear Filter</Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-secondary/20">
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>Application</TableHead>
                        <TableHead>Risk Score</TableHead>
                        <TableHead>GenAI Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApps.map((app, index) => (
                        <React.Fragment key={`app-${index}`}>
                          <TableRow
                            className="cursor-pointer hover:bg-secondary/10 transition-colors border-l-2 border-transparent data-[state=expanded]:border-l-[#F38020] data-[state=expanded]:bg-secondary/30"
                            data-state={expandedRow === `app-${index}` ? "expanded" : "collapsed"}
                            onClick={() => setExpandedRow(expandedRow === `app-${index}` ? null : `app-${index}`)}
                          >
                            <TableCell className="text-center font-bold text-muted-foreground">{expandedRow === `app-${index}` ? '-' : '+'}</TableCell>
                            <TableCell className="font-bold">{app.name ?? 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                                  <div className={`h-full ${(app.risk_score ?? 0) > 70 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${app.risk_score ?? 0}%` }} />
                                </div>
                                <span className="text-xs font-medium">{app.risk_score ?? 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-mono">{app.genai_score ?? 0}</TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: PIE_COLORS[app.status ?? ''] ?? '#CBD5E1', color: 'white' }}>{app.status ?? 'Unknown'}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{app.users ?? 0}</TableCell>
                          </TableRow>
                          <AnimatePresence>
                            {expandedRow === `app-${index}` && (
                              <TableRow className="bg-secondary/5 border-b border-[#F38020]/10">
                                <TableCell colSpan={6} className="p-0">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-6">
                                      <AppDetailsDrillDown app={app} />
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
          <TabsContent value="security" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/50 shadow-soft">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" /> Data Transfer Trend (MB)
                      </CardTitle>
                      <Badge variant="outline">Last 30 Days</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={safeCharts.dataVolume}>
                        <defs>
                          <linearGradient id="colorExfil" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3182CE" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3182CE" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" hide />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#3182CE" fillOpacity={1} fill="url(#colorExfil)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-soft">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#F38020]" /> MCP Server Activity
                      </CardTitle>
                      <Badge variant="outline">Real-time</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={safeCharts.mcpActivity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" hide />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#F38020" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-soft">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" /> Daily AI Login Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={safeCharts.loginEvents}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" hide />
                        <YAxis />
                        <Tooltip />
                        <Line type="stepAfter" dataKey="value" stroke="#805AD5" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-soft">
                   <CardHeader>
                     <CardTitle className="text-base flex items-center gap-2">
                       <FileWarning className="h-4 w-4 text-red-500" /> Risk Distribution (Volumetric)
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={safeCharts.riskDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {safeCharts.riskDistribution.map((entry, index) => (
                            <Cell key={`risk-${index}`} fill={['#10B981', '#F59E0B', '#EF4444'][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>
          <TabsContent value="recommendations">
            {safeAiInsights ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AIInsightsSection insights={safeAiInsights} />
                </div>
                <div className="space-y-6">
                  <Card className="border-border/50 shadow-soft bg-gradient-to-br from-primary/5 to-transparent">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" /> Top Active Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {safePowerUsers.map((u, i) => (
                        <div key={`pu_${report.id}_${u.email ?? `user${i}`}`} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/40">
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate">{u.email ?? 'Unknown User'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">GenAI Interactions</p>
                          </div>
                          <Badge variant="secondary" className="font-mono">{u.events ?? 0}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                         <ShieldCheck className="h-4 w-4 text-green-500" /> Posture Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-6">
                      <div className="text-5xl font-black text-foreground mb-2">{safeSummary.casbPosture ?? 0}</div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Aggregate CASB Risk</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-border/50 shadow-soft">
                <CardContent className="py-24 text-center space-y-4">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">AI Analysis not available for this legacy report.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}