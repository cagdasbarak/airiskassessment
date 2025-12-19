import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  ChevronLeft, Download, ShieldAlert, BrainCircuit,
  Users, Lock, AlertTriangle, Loader2, Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { AIInsightsSection } from '@/components/reports/AIInsightsSection';
const COLORS = ['#F38020', '#3182CE', '#48BB78', '#F56565', '#805AD5'];
export function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const res = await api.getReport(id);
        if (res.success) {
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
          <p className="text-muted-foreground">Loading assessment data...</p>
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
  const riskDistribution = report?.securityCharts?.riskDistribution ?? [];
  const usageOverTime = report?.securityCharts?.usageOverTime ?? [];
  const appLibrary = report?.appLibrary ?? [];
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Report {report?.id?.slice(-6) ?? '...'}</h1>
              <p className="text-muted-foreground">Generated on {report?.date ?? 'Unknown'} • Enterprise Audit</p>
            </div>
          </div>
          <Button className="btn-gradient">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Apps', value: report?.summary?.totalApps ?? 0, icon: BrainCircuit, color: 'text-blue-500' },
            { label: 'AI Apps', value: report?.summary?.aiApps ?? 0, icon: Users, color: 'text-[#F38020]' },
            { label: 'Shadow AI', value: report?.summary?.shadowAiApps ?? 0, icon: ShieldAlert, color: 'text-red-500' },
            { label: 'Risk Level', value: report?.riskLevel ?? 'N/A', icon: AlertTriangle, color: 'text-orange-500' },
            { label: 'Compliance', value: `${report?.summary?.complianceScore ?? 0}%`, icon: Lock, color: 'text-green-500' },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 shadow-soft">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-8">
            <TabsTrigger value="library" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-6 py-3">App Library</TabsTrigger>
            <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-6 py-3">AI Security Report</TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#F38020] data-[state=active]:bg-transparent px-6 py-3">Executive Recommendations</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">AI Application Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Application</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appLibrary.length > 0 ? appLibrary.map((app: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{app?.name ?? 'Unknown'}</TableCell>
                          <TableCell>{app?.category ?? 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={app?.status === 'Approved' ? 'outline' : app?.status === 'Unapproved' ? 'destructive' : 'secondary'}>
                              {app?.status ?? 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{app?.users ?? 0}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No applications listed.</TableCell>
                        </TableRow>
                      )}
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
                  <CardTitle className="text-lg">AI Usage Trends (Requests)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usageOverTime}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F38020" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F38020" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="usage" stroke="#F38020" fillOpacity={1} fill="url(#colorUsage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Data Transfer Volume (MB)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageOverTime}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="usage" fill="#3182CE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="recommendations">
            {report.aiInsights ? (
              <AIInsightsSection insights={report.aiInsights} />
            ) : (
              <Card className="border-border/50 shadow-soft">
                <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
                  <Sparkles className="h-12 w-12 text-muted-foreground opacity-20" />
                  <div className="text-center">
                    <h3 className="text-lg font-medium">No AI Insights Available</h3>
                    <p className="text-muted-foreground">This report was generated before AI analysis was enabled.</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Generate New Assessment
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}