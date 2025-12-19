import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, BrainCircuit, CheckCircle2, Copy, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
interface Recommendation {
  title: string;
  description: string;
  type: 'critical' | 'policy' | 'optimization';
}
interface AIInsights {
  summary: string;
  recommendations: Recommendation[];
}
interface AIInsightsSectionProps {
  insights?: AIInsights;
}
export function AIInsightsSection({ insights }: AIInsightsSectionProps) {
  const copyInsights = () => {
    if (!insights) return;
    const text = `Executive Summary: ${insights.summary}\n\nRecommendations:\n${insights.recommendations.map(r => `- [${r.type.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success('AI recommendations copied to clipboard');
  };
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-900',
          text: 'text-red-900 dark:text-red-100',
          muted: 'text-red-700 dark:text-red-300',
          icon: ShieldAlert,
          iconColor: 'text-red-600'
        };
      case 'policy':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-900',
          text: 'text-blue-900 dark:text-blue-100',
          muted: 'text-blue-700 dark:text-blue-300',
          icon: BrainCircuit,
          iconColor: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-900',
          text: 'text-green-900 dark:text-green-100',
          muted: 'text-green-700 dark:text-green-300',
          icon: CheckCircle2,
          iconColor: 'text-green-600'
        };
    }
  };
  if (!insights) {
    return (
      <Card className="border-dashed border-2 bg-secondary/5">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground italic">Generating AI insights for this snapshot...</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="insights-header"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Card className="border-border/50 shadow-soft bg-gradient-to-br from-white to-[#F38020]/5 dark:from-background dark:to-orange-500/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#F38020]" />
                  Executive Intelligence
                </CardTitle>
                <CardDescription>AI-driven remediation strategy.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={copyInsights}>
                <Copy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed text-foreground font-medium italic border-l-4 border-[#F38020]/30 pl-6 py-2">
                "{insights.summary}"
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {insights.recommendations.map((rec, i) => {
          const styles = getTypeStyles(rec.type);
          const Icon = styles.icon;
          return (
            <motion.div key={i} variants={item}>
              <div className={`flex flex-col h-full p-5 rounded-2xl border ${styles.bg} ${styles.border} transition-all hover:shadow-lg`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-1.5 rounded-lg bg-white/50 dark:bg-black/20">
                    <Icon className={`h-4 w-4 ${styles.iconColor}`} />
                  </div>
                  <h4 className={`text-xs font-bold ${styles.text} uppercase tracking-widest`}>{rec.type}</h4>
                </div>
                <h5 className={`font-bold ${styles.text} mb-2`}>{rec.title}</h5>
                <p className={`text-xs leading-relaxed ${styles.muted}`}>
                  {rec.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}