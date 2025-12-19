import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Globe, Printer, Loader2, ShieldAlert } from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
import { AIInsightsSection } from '@/components/reports/AIInsightsSection';
import { ExecutiveScorecard } from '@/components/reports/ExecutiveScorecard';
export function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
  if (isLoading) return (
    <AppLayout container>
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#F38020]" />
        <p className="text-muted-foreground font-medium italic">Generating executive precision report...</p>
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
      <div className="space-y-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/reports')} className="rounded-xl">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Executive AI Risk Assessment</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="text-xs font-mono">Snapshot: {report.id} ��� {report.date}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
        <div className="print:block hidden mb-8 text-center border-b pb-8">
            <h1 className="text-4xl font-bold mb-2">Cloudflare RiskGuard AI Assessment</h1>
            <p className="text-muted-foreground">Precision Audit for Zero Trust Managed Endpoints</p>
        </div>
        {/* Executive View: High-level metrics */}
        <ExecutiveScorecard summary={report.summary} score={report.score} />
        {/* Intelligence Layer: Strategy & Recommendations */}
        <AIInsightsSection insights={report.aiInsights} />
        {/* Inventory Layer: Identified High-Risk Assets */}
        <div className="space-y-6">
            <div className="flex items-center gap-2 border-l-4 border-[#F38020] pl-4">
                <ShieldAlert className="h-6 w-6 text-[#F38020]" />
                <h3 className="text-xl font-bold">Identified Application Inventory</h3>
            </div>
            <Card className="border-border/50 shadow-soft overflow-hidden">
                <Table>
                    <TableHeader className="bg-secondary/30">
                        <TableRow>
                            <TableHead className="font-bold">Application Name</TableHead>
                            <TableHead className="font-bold">Compliance Status</TableHead>
                            <TableHead className="font-bold text-center">Active Users</TableHead>
                            <TableHead className="font-bold text-right">Risk Factor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {report.appLibrary.map((app) => (
                            <TableRow key={app.appId} className="hover:bg-secondary/10 transition-colors">
                                <TableCell className="font-bold">{app.name}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={app.status === 'Approved' ? 'outline' : app.status === 'Unapproved' ? 'destructive' : 'secondary'}
                                        className="text-[10px] uppercase font-bold px-2 py-0.5"
                                    >
                                        {app.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-mono">{app.users}</TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-mono font-bold ${app.risk_score > 70 ? 'text-red-500' : 'text-green-500'}`}>
                                        {app.risk_score}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
      </div>
    </AppLayout>
  );
}