import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer, Loader2 } from 'lucide-react';
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
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#F38020]" />
          <p className="text-muted-foreground font-medium italic">Generating executive precision report...</p>
        </div>
      </AppLayout>
    );
  }
  if (!report) {
    return (
      <AppLayout container>
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold">Report not found</h2>
          <Button onClick={handleBack} className="mt-4">Back to Archive</Button>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="space-y-12 pb-20">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="no-print absolute top-8 left-8">
            <Button variant="outline" size="icon" onClick={handleBack} className="rounded-xl">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground uppercase">Executive AI Risk Assessment</h1>
            <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
              Snapshot ID: {report.id} • Generated: {report.date}
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl no-print" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
        <div className="print:block hidden mb-8 text-center border-b pb-8">
          <h1 className="text-4xl font-bold mb-2 uppercase">RiskGuard AI Precision Audit</h1>
          <p className="text-muted-foreground">Automated Zero Trust Governance Report</p>
        </div>
        {/* The 5-Card Grid Experience */}
        <ExecutiveScorecard summary={report.summary} score={report.score} />
        <footer className="pt-12 text-center text-[10px] text-muted-foreground uppercase tracking-tighter opacity-40 no-print">
          Internal Compliance Use Only • Cloudflare Zero Trust Analytics
        </footer>
      </div>
    </AppLayout>
  );
}