import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Eye, Loader2, AlertCircle, Trash2, ShieldAlert } from 'lucide-react';
import { api, AssessmentReport } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
export function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.listReports();
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setError(res.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('Network telemetry error');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchReports();
  }, []);
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const promise = api.deleteReport(id);
    toast.promise(promise, {
      loading: 'Purging report from archive...',
      success: () => {
        setReports(prev => prev.filter(r => r.id !== id));
        return 'Report permanently deleted.';
      },
      error: 'Deactivation failed.'
    });
  };
  return (
    <AppLayout container>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter">Assessment Archive</h1>
            <p className="text-muted-foreground font-medium">Historical security audits and compliance logs.</p>
          </div>
          <Button className="btn-gradient h-12 px-8 rounded-xl font-bold" onClick={() => navigate('/')}>
            New Audit
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-[2rem] animate-pulse bg-white/20 border border-border/10" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 glass rounded-[2.5rem] border-red-500/20">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-xl font-bold">{error}</p>
            <Button onClick={fetchReports} variant="outline" className="mt-6 rounded-xl">Retry Sync</Button>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed rounded-[3rem] border-border/20 bg-white/5">
            <ShieldAlert className="h-20 w-20 text-muted-foreground mb-6 opacity-20" />
            <h3 className="text-2xl font-bold">No Audit History</h3>
            <p className="text-muted-foreground mb-8 max-w-sm text-center font-medium">Generate your first risk assessment to populate the archive.</p>
            <Button onClick={() => navigate('/')} className="btn-gradient h-14 px-12 rounded-2xl text-lg font-black">
              Start Assessment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {reports.map((report, idx) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <Card className="h-full border-0 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-soft hover:shadow-glow-lg hover:-translate-y-2 transition-all duration-500 rounded-[2rem] overflow-hidden flex flex-col">
                    <CardHeader className="pb-4 relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#F38020]/10 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-[#F38020]" />
                        </div>
                        <Badge className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          report.riskLevel === 'High' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          report.riskLevel === 'Medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}>
                          {report.riskLevel} Risk
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-black tracking-tight uppercase truncate">
                        Audit {report.id.slice(-6)}
                      </CardTitle>
                      <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">
                        <Calendar className="h-3 w-3 mr-2" /> {report.date}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-end justify-between bg-black/5 dark:bg-white/5 p-6 rounded-2xl">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Posture</p>
                          <p className="text-4xl font-black text-foreground">{report.score}%</p>
                        </div>
                        <div className="h-14 w-14 rounded-full border-4 border-background flex items-center justify-center relative overflow-hidden">
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#F38020] to-[#E55A1B]" 
                            style={{ height: `${report.score}%` }} 
                          />
                          <span className="relative z-10 text-[10px] font-black">{report.score}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 p-6 gap-3">
                      <Button 
                        variant="secondary" 
                        className="flex-1 h-12 rounded-xl font-bold bg-white dark:bg-white/10" 
                        onClick={() => navigate(`/reports/${report.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        onClick={(e) => handleDelete(report.id, e)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}