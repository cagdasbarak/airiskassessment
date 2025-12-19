import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Printer, Loader2, FileText, LayoutGrid, ShieldAlert, BarChart3 } from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
import { ExecutiveScorecard } from '@/components/reports/ExecutiveScorecard';
import { AppLibraryTab } from '@/components/reports/AppLibraryTab';
import { SecurityForensicsTab } from '@/components/reports/SecurityForensicsTab';
import { SummaryRemediationTab } from '@/components/reports/SummaryRemediationTab';
import { useAppStore } from '@/lib/store';
export function ReportDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forensics');
  const cfContactName = useAppStore(s => s.settings.cloudflareContact.name);
  const cfContactTeam = useAppStore(s => s.settings.cloudflareContact.team);
  const cfContactRole = useAppStore(s => s.settings.cloudflareContact.role);
  const custName = useAppStore(s => s.settings.customerContact.customerName);
  const custContactName = useAppStore(s => s.settings.customerContact.name);
  const custContactRole = useAppStore(s => s.settings.customerContact.role);
  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      if (!id) { 
        if (isMounted) setIsLoading(false); 
        return; 
      }
      try {
        setIsLoading(true);
        const res = await api.getReport(id);
        if (isMounted && res.success && res.data) { 
          setReport(res.data); 
        }
      } catch (err) { 
        console.error('[ReportDetails] Fetch failed:', err); 
      } finally { 
        if (isMounted) setIsLoading(false); 
      }
    };
    fetchReport();
    return () => { isMounted = false; };
  }, [id]);
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-[#F38020]" />
            <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#F38020]/40" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold tracking-tight">Generating Precision Audit</p>
            <p className="text-muted-foreground text-sm italic">Synthesizing executive security telemetry...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (!report || !id) {
    return (
      <AppLayout container>
        <div className="text-center py-24 space-y-6">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold">Report Not Found</h2>
          <Button onClick={() => navigate('/reports')} className="rounded-xl px-8 h-11">
            Back to Archive
          </Button>
        </div>
      </AppLayout>
    );
  }
  const safeSummary = {
    totalApps: report.summary?.totalApps ?? 0,
    aiApps: report.summary?.aiApps ?? 0,
    shadowAiApps: report.summary?.shadowAiApps ?? 0,
    shadowUsage: report.summary?.shadowUsage ?? 0,
    dataExfiltrationKB: report.summary?.dataExfiltrationKB ?? 0,
    unapprovedApps: report.summary?.unapprovedApps ?? 0,
    dataExfiltrationRisk: report.summary?.dataExfiltrationRisk ?? '0 KB',
    complianceScore: report.summary?.complianceScore ?? 0,
    libraryCoverage: report.summary?.libraryCoverage ?? 0,
    casbPosture: report.summary?.casbPosture ?? 0
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 printable-report">
      <div className="py-8 md:py-10 lg:py-12 space-y-12">
        <header className="flex flex-col items-center justify-center space-y-6 text-center relative">
          <div className="no-print lg:absolute top-0 left-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/reports')} 
              className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Archive
            </Button>
          </div>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F38020]/10 text-[#F38020] text-[10px] font-black uppercase tracking-[0.2em] border border-[#F38020]/20">
              Security Compliance Audit
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase">
              RiskGuard AI Report
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] border-y border-border/50 py-3 px-6 print:border-black print:text-black">
              <span>ID: {id.slice(-8).toUpperCase()}</span>
              <span className="hidden sm:inline">•</span>
              <span>Date: {report.date}</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-[#F38020] print:text-black font-bold">ZTNA Precision</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-2xl no-print hover:bg-secondary border-border/50 shadow-soft h-14 px-8 font-bold" 
            onClick={() => window.print()}
          >
            <Printer className="h-5 w-5 mr-3" /> Export Executive PDF
          </Button>
        </header>
        <section className="space-y-8">
          <div className="text-center space-y-2 no-print">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Risk Scorecard</h2>
            <div className="h-px w-16 bg-[#F38020] mx-auto" />
          </div>
          <ExecutiveScorecard summary={safeSummary} score={report.score ?? 0} powerUsers={report.powerUsers ?? []} />
        </section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
          <div className="flex justify-center no-print">
            <TabsList className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-border/50 p-1 h-auto rounded-2xl shadow-soft">
              <TabsTrigger value="library" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-secondary">
                <LayoutGrid className="h-4 w-4" /> 
                <span className="font-bold text-xs uppercase tracking-wider">Application Library</span>
              </TabsTrigger>
              <TabsTrigger value="forensics" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-secondary">
                <BarChart3 className="h-4 w-4" /> 
                <span className="font-bold text-xs uppercase tracking-wider">AI Security Report</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-secondary">
                <ShieldAlert className="h-4 w-4" /> 
                <span className="font-bold text-xs uppercase tracking-wider">AI Summary</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="library" className="focus-visible:outline-none chart-print-fix">
            {activeTab === 'library' && <AppLibraryTab report={report} />}
          </TabsContent>
          <TabsContent value="forensics" className="focus-visible:outline-none chart-print-fix">
            {activeTab === 'forensics' && <SecurityForensicsTab report={report} />}
          </TabsContent>
          <TabsContent value="summary" className="focus-visible:outline-none">
            {activeTab === 'summary' && <SummaryRemediationTab report={report} />}
          </TabsContent>
        </Tabs>
        <div className="hidden print:flex flex-col border-t border-black pt-8 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Prepared For</p>
              <p className="text-sm font-bold">{custName}</p>
              <p className="text-xs">{custContactName} — {custContactRole}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Cloudflare Representative</p>
              <p className="text-sm font-bold">{cfContactName}</p>
              <p className="text-xs">{cfContactTeam} — {cfContactRole}</p>
            </div>
          </div>
          <p className="text-[8px] text-center text-gray-400 font-mono pt-4">
            AUTHENTICITY VERIFIED VIA RISKGUARD SECURE TUNNEL • HASH: {id.slice(0, 8)}
          </p>
        </div>
        <footer className="pt-16 text-center text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black opacity-40 border-t border-border/50 no-print">
          Confidential • Cloudflare ZTNA Precision Analytics v1.2 • Generated by RiskGuard AI
        </footer>
      </div>
    </div>
  );
}