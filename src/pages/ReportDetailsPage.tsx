import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Printer, Loader2, FileText, ShieldAlert, FileCheck, Zap, AlertCircle } from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
import { ExecutiveScorecard } from '@/components/reports/ExecutiveScorecard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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
  const safeSummary = {
    totalApps: report.summary?.totalApps ?? 0,
    aiApps: report.summary?.aiApps ?? 0,
    shadowAiApps: report.summary?.shadowAiApps ?? 0,
    shadowUsage: report.summary?.shadowUsage ?? 0,
    unapprovedApps: report.summary?.unapprovedApps ?? 0,
    dataExfiltrationRisk: report.summary?.dataExfiltrationRisk ?? 'N/A',
    complianceScore: report.summary?.complianceScore ?? 0,
    libraryCoverage: report.summary?.libraryCoverage ?? 0,
  };
  return (
    <AppLayout container>
      <div className="space-y-16 pb-24 max-w-6xl mx-auto">
        <header className="flex flex-col items-center justify-center space-y-6 text-center relative" role="banner">
          <div className="no-print lg:absolute top-0 left-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
              aria-label="Return to report archive"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Archive
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
              <span className="hidden sm:inline" aria-hidden="true">•</span>
              <span>Generated: {report.date}</span>
              <span className="hidden sm:inline" aria-hidden="true">•</span>
              <span>Cloudflare ZTNA Analytics</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="rounded-2xl no-print hover:bg-secondary border-border/50 shadow-soft"
            onClick={handlePrint}
            aria-label="Download or print report as PDF"
          >
            <Printer className="h-4 w-4 mr-2" /> Download Executive PDF
          </Button>
        </header>
        <section aria-labelledby="scorecard-heading">
          <div className="text-center space-y-2 no-print mb-8">
            <h2 id="scorecard-heading" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Risk Scorecard</h2>
            <div className="h-px w-12 bg-[#F38020] mx-auto" aria-hidden="true" />
          </div>
          <ExecutiveScorecard summary={safeSummary} score={report.score ?? 0} />
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-1" aria-labelledby="summary-heading">
            <Card className="border-border/50 shadow-soft h-full bg-[#F38020]/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10" aria-hidden="true">
                <ShieldAlert className="h-24 w-24" />
              </div>
              <CardHeader>
                <CardTitle id="summary-heading" className="text-xl font-bold">Executive Summary</CardTitle>
                <CardDescription>AI-generated posture analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed italic text-base">
                  "{report.aiInsights?.summary || `This report provides a high-fidelity snapshot of Generative AI usage patterns. The metrics highlight a shadow usage density of ${safeSummary.shadowUsage.toFixed(3)}%, which represents traffic bypassing standard organizational review.`}"
                </p>
              </CardContent>
            </Card>
          </section>
          <section className="lg:col-span-2" aria-labelledby="recommendations-heading">
            <div className="space-y-4">
              <h3 id="recommendations-heading" className="text-lg font-bold tracking-tight px-1 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F38020]" aria-hidden="true" />
                Actionable Remediation Steps
              </h3>
              <div className="grid gap-4">
                {(report.aiInsights?.recommendations || []).map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <Card className={cn(
                      "border-l-4 border-y-border border-r-border shadow-soft",
                      rec.type === 'critical' ? "border-l-red-500 bg-red-500/[0.02]" :
                      rec.type === 'policy' ? "border-l-blue-500 bg-blue-500/[0.02]" :
                      "border-l-emerald-500 bg-emerald-500/[0.02]"
                    )}>
                      <CardContent className="p-5 flex gap-4">
                        <div className={cn(
                          "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
                          rec.type === 'critical' ? "bg-red-500/10 text-red-500" :
                          rec.type === 'policy' ? "bg-blue-500/10 text-blue-500" :
                          "bg-emerald-500/10 text-emerald-500"
                        )} aria-hidden="true">
                          {rec.type === 'critical' ? <ShieldAlert className="h-5 w-5" /> :
                           rec.type === 'policy' ? <FileCheck className="h-5 w-5" /> :
                           <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground">{rec.title}</h4>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <footer className="pt-16 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium opacity-50 no-print" role="contentinfo">
          Internal Enterprise Compliance Use Only • Cloudflare Zero Trust Precision Analytics v1.0
        </footer>
      </div>
    </AppLayout>
  );
}