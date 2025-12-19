import React, { useEffect, useState, useMemo } from 'react';
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
  ChevronLeft, Download, Users, Loader2, ShieldCheck, Database, Globe, Terminal, Printer, AlertTriangle, TrendingUp, BarChart3, PieChart
} from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { AppDetailsDrillDown } from '@/components/reports/AppDetailsDrillDown';
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
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
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
        <Button onClick={() => navigate('/reports')}>Back to Archive</Button>
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
                <span className="text-xs font-mono">v2.5.8 ��� Snapshot: {report.date}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Export JSON</Button>
            <Button onClick={() => window.print()} className="btn-gradient rounded-xl"><Printer className="h-4 w-4 mr-2" /> Executive PDF</Button>
          </div>
        </div>
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-12 mb-8 space-x-8">
            <TabsTrigger value="trends" className="data-[state=active]:border-[#F38020] border-b-2 border-transparent rounded-none px-0 h-full font-bold">AI Security Report (30d)</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:border-[#F38020] border-b-2 border-transparent rounded-none px-0 h-full font-bold">Application Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="trends" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#F38020]" /> Top 5 AI Applications by User Count
                </CardTitle>
                <CardDescription>30-day user engagement distribution for primary GenAI endpoints.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.securityCharts?.usageTrends}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="ChatGPT" stackId="a" fill="#10B981" />
                    <Bar dataKey="Claude" stackId="a" fill="#FDBA74" />
                    <Bar dataKey="GitHub Copilot" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="Midjourney" stackId="a" fill="#EF4444" />
                    <Bar dataKey="Perplexity" stackId="a" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-border/50 shadow-soft">
                <CardHeader><CardTitle className="text-sm font-bold">App Status Trends</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.securityCharts?.statusTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend iconType="circle" />
                      <Line type="monotone" dataKey="Approved" stroke="#10B981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Review" stroke="#FDBA74" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Unapproved" stroke="#EF4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-soft">
                <CardHeader><CardTitle className="text-sm font-bold">Data Uploads by Status (KB)</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.securityCharts?.dataTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Approved" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="Unapproved" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-border/50 shadow-soft">
                <CardHeader><CardTitle className="text-sm font-bold">MCP Server Access Performance (ms)</CardTitle></CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.securityCharts?.mcpTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="stepAfter" dataKey="Access Time" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-soft">
                <CardHeader><CardTitle className="text-sm font-bold">MCP Model Connection Events</CardTitle></CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.securityCharts?.mcpTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Login Events" fill="#F38020" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="inventory" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col lg:flex-row gap-8">
              <Card className="flex-1 border-border/50 shadow-soft h-fit">
                <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-[#F38020]" /> Status Distribution</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
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
                            <Cell key={`cell-${index}`} fill={entry.fill} cursor="pointer" strokeWidth={selectedStatusFilter === entry.name ? 4 : 1} stroke={selectedStatusFilter === entry.name ? '#000' : 'none'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                    {pieData.map((d) => (
                      <button 
                        key={d.name} 
                        onClick={() => setSelectedStatusFilter(selectedStatusFilter === d.name ? null : d.name)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg border transition-all",
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
                  <h3 className="font-bold flex items-center gap-2">
                    <Terminal className="h-4 w-4" /> Detected Applications
                    {selectedStatusFilter && <Badge variant="secondary" className="ml-2">Filter: {selectedStatusFilter}</Badge>}
                  </h3>
                  {selectedStatusFilter && <Button variant="link" size="sm" onClick={() => setSelectedStatusFilter(null)}>Clear Filter</Button>}
                </div>
                <div className="rounded-xl border border-border/50 overflow-hidden shadow-soft">
                  <Table>
                    <TableHeader className="bg-secondary/30">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Application</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-right">Risk Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((app) => (
                        <React.Fragment key={app.appId}>
                          <TableRow 
                            className={cn("cursor-pointer hover:bg-secondary/20 transition-colors", expandedApp === app.appId && "bg-secondary/10")}
                            onClick={() => setExpandedApp(expandedApp === app.appId ? null : app.appId)}
                          >
                            <TableCell className="font-bold text-sm">
                              {app.name}
                              <div className="text-[9px] text-muted-foreground font-normal">{app.category}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px]" style={{ color: PIE_COLORS[app.status], borderColor: PIE_COLORS[app.status] + '40' }}>{app.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn("font-mono font-bold", app.risk_score > 70 ? "text-red-500" : "text-green-500")}>{app.risk_score}</span>
                            </TableCell>
                          </TableRow>
                          {expandedApp === app.appId && (
                            <TableRow className="bg-secondary/5 hover:bg-secondary/5">
                              <TableCell colSpan={3} className="p-0">
                                <div className="p-6 border-t border-border/50 bg-background/30">
                                  <AppDetailsDrillDown app={app} />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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