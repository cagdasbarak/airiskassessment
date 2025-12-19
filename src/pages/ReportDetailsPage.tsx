import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer, Loader2, FileText } from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
import { ExecutiveScorecard } from '@/components/reports/ExecutiveScorecard';
export function ReportDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      if (!id) {
        setIsLoading(false);
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
  const handleBack = () => navigate('/reports');
  const handlePrint = () => window.print();
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex flex-col items-center justify-center h-96 space-y-6">
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
  if (!report) {
    return (
      <AppLayout container>
        <div className="text-center py-24 space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Report Not Found</h2>
            <p className="text-muted-foreground">The requested assessment could not be located in the archive.</p>
          </div>
          <Button onClick={handleBack} className="rounded-xl px-8 h-11">Back to Archive</Button>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="space-y-16 pb-24 max-w-6xl mx-auto">
        {/* Header Controls */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center relative">
          <div className="no-print lg:absolute top-0 left-0">
            <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-xl gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" /> Back to List
            </Button>
          </div>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F38020]/10 text-[#F38020] text-xs font-bold uppercase tracking-widest border border-[#F38020]/20">
              Security Compliance Audit
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase lg:text-6xl">
              Executive AI Risk Report
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-muted-foreground uppercase tracking-widest border-y border-border/50 py-3 px-8">
              <span>Ref: {report.id.toUpperCase()}</span>
              <span className="hidden sm:inline">•</span>
              <span>Generated: {report.date}</span>
              <span className="hidden sm:inline">•</span>
              <span>Cloudflare ZTNA Analytics</span>
            </div>
          </div>
          <Button variant="outline" size="lg" className="rounded-2xl no-print hover:bg-secondary border-border/50 shadow-soft" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Download Executive PDF
          </Button>
        </div>
        {/* Professional Print Branding */}
        <div className="print:block hidden mb-12 text-center border-b border-black pb-10">
          <h1 className="text-5xl font-black mb-2 uppercase tracking-tighter">RiskGuard AI Precision Audit</h1>
          <p className="text-xl font-medium text-gray-600">Automated Zero Trust Governance & AI Risk Discovery</p>
          <div className="mt-4 text-sm font-mono text-gray-500 uppercase">
            Snapshot: {report.id} | Date: {report.date} | Confidential
          </div>
        </div>
        {/* The Core Analytical Grid */}
        <div className="space-y-12">
          <div className="text-center space-y-2 no-print">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Risk Scorecard</h2>
            <div className="h-px w-12 bg-[#F38020] mx-auto" />
          </div>
          <ExecutiveScorecard summary={report.summary} score={report.score} />
        </div>
        {/* Executive Summary Note */}
        <div className="bg-secondary/30 rounded-3xl p-10 border border-border/50 text-center space-y-4 max-w-4xl mx-auto shadow-sm">
          <h3 className="text-lg font-bold tracking-tight">Executive Assessment Note</h3>
          <p className="text-muted-foreground leading-relaxed italic text-sm sm:text-base">
            "This report provides a high-fidelity snapshot of Generative AI usage patterns across your Zero Trust environment. 
            The metrics highlight critical shadow usage densities that bypass standard organizational review. 
            Immediate remediation is recommended for all endpoints marked as high-risk or unapproved."
          </p>
        </div>
        <footer className="pt-16 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium opacity-50 no-print">
          Internal Enterprise Compliance Use Only • Cloudflare Zero Trust Precision Analytics v1.0
        </footer>
      </div>
    </AppLayout>
  );
}