import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  ChevronLeft, Download, ShieldAlert, BrainCircuit, 
  Users, Lock, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { MOCK_REPORT_DETAILS } from '@/lib/mock-data';
const COLORS = ['#F38020', '#3182CE', '#48BB78', '#F56565', '#805AD5'];
export function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = MOCK_REPORT_DETAILS;
  return (
    <AppLayout container>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Report {id}</h1>
              <p className="text-muted-foreground">Generated on May 20, 2024 ��� Enterprise Audit</p>
            </div>
          </div>
          <Button className="btn-gradient">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
        {/* Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Apps', value: data.summary.totalApps, icon: BrainCircuit, color: 'text-blue-500' },
            { label: 'AI Apps', value: data.summary.aiApps, icon: Users, color: 'text-[#F38020]' },
            { label: 'Shadow AI', value: data.summary.shadowAiApps, icon: ShieldAlert, color: 'text-red-500' },
            { label: 'Risk Level', value: data.summary.dataExfiltrationRisk, icon: AlertTriangle, color: 'text-orange-500' },
            { label: 'Compliance', value: `${data.summary.complianceScore}%`, icon: Lock, color: 'text-green-500' },
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
                        data={data.securityCharts.riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.securityCharts.riskDistribution.map((entry, index) => (
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
                      {data.appLibrary.map((app, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{app.name}</TableCell>
                          <TableCell>{app.category}</TableCell>
                          <TableCell>
                            <Badge variant={app.status === 'Approved' ? 'outline' : app.status === 'Unapproved' ? 'destructive' : 'secondary'}>
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{app.users}</TableCell>
                        </TableRow>
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
                  <CardTitle className="text-lg">AI Usage Trends (Requests)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.securityCharts.usageOverTime}>
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
                    <BarChart data={data.securityCharts.usageOverTime}>
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
            <Card className="border-border/50 shadow-soft">
              <CardHeader>
                <CardTitle>Executive Summary & Action Plan</CardTitle>
                <CardDescription>AI-generated insights based on your Zero Trust activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                    <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-900 dark:text-red-100">Critical: Shadow AI Usage Detected</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        8 unapproved AI applications are currently bypassing standard procurement. 
                        Recommend implementing a "Block All AI" Gateway policy with an "Approved List" exception.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                    <BrainCircuit className="h-6 w-6 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-100">Optimization: License Coverage</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your current Zero Trust Enterprise license covers all detected users. 
                        Consider enabling "DLP for AI" to prevent sensitive data from being pasted into LLM prompts.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-green-900 dark:text-green-100">Policy Strength: High</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Access policies for GitHub Copilot are correctly configured with MFA. 
                        No unauthorized access attempts detected in this period.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}