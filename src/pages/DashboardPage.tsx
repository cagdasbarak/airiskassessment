import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Zap, ArrowRight, Activity, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, AssessmentReport } from '@/lib/api';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
export function DashboardPage() {
  const navigate = useNavigate();
  const [isAssessing, setIsAssessing] = useState(false);
  const [lastReport, setLastReport] = useState<AssessmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchLastReport = async () => {
      try {
        const res = await api.listReports();
        if (res.success && res.data && res.data.length > 0) {
          setLastReport(res.data[0]);
        }
      } catch (err) {
        console.error('Dashboard telemetry fetch failed');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLastReport();
  }, []);
  const startAssessment = async () => {
    setIsAssessing(true);
    const promise = api.startAssessment();
    toast.promise(promise, {
      loading: 'Analyzing Cloudflare Zero Trust logs...',
      success: (res) => {
        if (res.success && res.data) {
          setTimeout(() => {
            setIsAssessing(false);
            navigate(`/reports/${res.data.id}`);
          }, 800);
          return 'Precision assessment generated.';
        }
        setIsAssessing(false);
        throw new Error(res.error || 'Assessment failed');
      },
      error: (err) => {
        setIsAssessing(false);
        return err.message || 'Failed to connect to Cloudflare API';
      },
    });
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  const safeScore = lastReport?.score ?? 0;
  const safeShadowUsage = lastReport?.summary?.shadowUsage ?? 0;
  const safeUnapprovedApps = lastReport?.summary?.unapprovedApps ?? 0;
  const safeRiskLevel = lastReport?.riskLevel ?? 'N/A';
  const safeDate = lastReport?.date ?? 'No recent history';
  return (
    <AppLayout container>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#F38020] to-[#D14615] p-10 md:p-16 text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <Sparkles className="h-3 w-3 animate-pulse" />
              Executive Risk Platform
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              Zero Trust <br />
              <span className="text-white/80">Command Center</span>
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-xl font-medium">
              Perform high-fidelity audits of your Cloudflare infrastructure to identify shadow AI usage and data exfiltration vulnerabilities.
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                onClick={startAssessment}
                disabled={isAssessing}
                className="bg-white text-[#F38020] hover:bg-white/90 font-black h-14 px-10 rounded-2xl shadow-glow hover:scale-105 active:scale-95 transition-all text-lg"
              >
                {isAssessing ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    Launch Assessment
                    <Zap className="ml-3 h-6 w-6 fill-current" />
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 h-96 w-96 opacity-10 pointer-events-none">
            <ShieldCheck className="h-full w-full rotating" />
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-8">
          <Card className="border-0 bg-white/40 dark:bg-black/20 backdrop-blur-xl shadow-soft overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/10 pb-6">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Latest Security Insight</CardTitle>
                <CardDescription className="font-medium">
                  {lastReport ? `Telemetry snapshot from ${safeDate}` : 'No active audit records found'}
                </CardDescription>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-[#F38020]/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-[#F38020]" />
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin text-[#F38020]" />
                </div>
              ) : lastReport ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Posture Score', value: `${safeScore}%`, color: 'text-foreground' },
                      { label: 'Shadow Usage', value: `${safeShadowUsage.toFixed(2)}%`, color: 'text-[#F38020]' },
                      { label: 'Risk Assets', value: safeUnapprovedApps, color: 'text-red-500' },
                      { label: 'Forensic Risk', value: safeRiskLevel, color: 'text-blue-500' },
                    ].map((stat, i) => (
                      <div key={i} className="p-6 rounded-3xl bg-white/50 dark:bg-white/5 border border-border/5 text-center space-y-2 group hover:bg-white transition-colors cursor-default">
                        <span className={cn("text-3xl font-black", stat.color)}>{stat.value}</span>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full h-14 text-lg font-bold group rounded-2xl border border-border/10 hover:bg-secondary/50"
                    onClick={() => navigate(`/reports/${lastReport?.id || ''}`)}
                  >
                    Drill Down into Full Analysis
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-[2rem] border-border/20">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="text-lg font-semibold">Ready for your first security audit.</p>
                  <p className="text-sm">Click the launch button above to aggregate Cloudflare ZTNA logs.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.footer
          variants={itemVariants}
          className="pt-16 pb-8 text-center"
        >
          <div className="h-px w-24 bg-[#F38020]/20 mx-auto mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-3">
            Powered by Cloudflare Workers & AI
          </p>
          <p className="max-w-xl mx-auto px-6 text-xs text-muted-foreground/60 font-medium leading-relaxed italic">
            Disclaimer: Although this project has AI capabilities, there is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.
          </p>
        </motion.footer>
      </motion.div>
    </AppLayout>
  );
}