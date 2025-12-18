import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, FileCheck, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AssessmentReport } from '@/lib/api';
interface SummaryRemediationTabProps {
  report: AssessmentReport;
}
export function SummaryRemediationTab({ report }: SummaryRemediationTabProps) {
  const defaultSummary = "This report provides a definitive analysis of organizational AI usage patterns. Current telemetry suggests a dynamic risk landscape that requires proactive Cloudflare Gateway management to ensure data integrity.";
  const recommendations = report.aiInsights?.recommendations || [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <section className="lg:col-span-1">
        <Card className="border-border/50 shadow-soft h-full bg-[#F38020]/5 overflow-hidden relative border-t-4 border-t-[#F38020]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="h-24 w-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Executive Summary</CardTitle>
            <CardDescription className="font-bold text-[10px] uppercase tracking-wider text-[#F38020]">AI Forensics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed italic text-base font-medium">
              "{report.aiInsights?.summary || defaultSummary}"
            </p>
          </CardContent>
        </Card>
      </section>
      <section className="lg:col-span-2">
        <div className="space-y-6">
          <h3 className="text-xl font-black uppercase tracking-tighter px-1 flex items-center gap-3">
            <Zap className="h-6 w-6 text-[#F38020]" />
            Remediation Framework
          </h3>
          <div className="grid gap-4">
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={cn(
                  "border-l-4 border-y-border border-r-border shadow-soft group hover:shadow-md transition-shadow",
                  rec.type === 'critical' ? "border-l-red-500 bg-red-500/[0.02]" :
                  rec.type === 'policy' ? "border-l-blue-500 bg-blue-500/[0.02]" :
                  "border-l-emerald-500 bg-emerald-500/[0.02]"
                )}>
                  <CardContent className="p-6 flex gap-5">
                    <div className={cn(
                      "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      rec.type === 'critical' ? "bg-red-500/10 text-red-500" :
                      rec.type === 'policy' ? "bg-blue-500/10 text-blue-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {rec.type === 'critical' ? <ShieldAlert className="h-6 w-6" /> :
                       rec.type === 'policy' ? <FileCheck className="h-6 w-6" /> :
                       <AlertCircle className="h-6 w-6" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-foreground uppercase tracking-tight">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">{rec.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}