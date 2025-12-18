import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, BrainCircuit, CheckCircle2, Copy, Sparkles } from 'lucide-react';
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
  insights: AIInsights;
}
export function AIInsightsSection({ insights }: AIInsightsSectionProps) {
  const copySummary = () => {
    navigator.clipboard.writeText(insights.summary);
    toast.success('Summary copied to clipboard');
  };
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-100 dark:border-red-900',
          text: 'text-red-900 dark:text-red-100',
          muted: 'text-red-700 dark:text-red-300',
          icon: ShieldAlert,
          iconColor: 'text-red-600'
        };
      case 'policy':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-100 dark:border-blue-900',
          text: 'text-blue-900 dark:text-blue-100',
          muted: 'text-blue-700 dark:text-blue-300',
          icon: BrainCircuit,
          iconColor: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-100 dark:border-green-900',
          text: 'text-green-900 dark:text-green-100',
          muted: 'text-green-700 dark:text-green-300',
          icon: CheckCircle2,
          iconColor: 'text-green-600'
        };
    }
  };
  return (
    <div className="space-y-8">
      <Card className="border-border/50 shadow-soft bg-gradient-to-br from-white to-secondary/20 dark:from-background dark:to-secondary/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#F38020]" />
              Executive Summary
            </CardTitle>
            <CardDescription>AI-generated overview of your security posture.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={copySummary}>
            <Copy className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-foreground/90 italic">
            "{insights.summary}"
          </p>
        </CardContent>
      </Card>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4"
      >
        {insights.recommendations.map((rec, i) => {
          const styles = getTypeStyles(rec.type);
          const Icon = styles.icon;
          return (
            <motion.div key={i} variants={item}>
              <div className={`flex gap-4 p-5 rounded-2xl border ${styles.bg} ${styles.border} transition-all hover:shadow-md`}>
                <div className={`p-2 rounded-xl bg-white/50 dark:bg-black/20 h-fit`}>
                  <Icon className={`h-6 w-6 ${styles.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <h4 className={`font-bold ${styles.text} capitalize`}>{rec.title}</h4>
                  <p className={`text-sm leading-relaxed ${styles.muted}`}>
                    {rec.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}