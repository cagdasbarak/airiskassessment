import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Database, FileCheck, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
interface ScorecardProps {
  summary: {
    totalApps: number;
    aiApps: number;
    shadowAiApps: number;
    shadowUsage: number;
    unapprovedApps: number;
    dataExfiltrationRisk: string;
    complianceScore: number;
    libraryCoverage: number;
  };
  score: number;
}
export function ExecutiveScorecard({ summary, score }: ScorecardProps) {
  const isHighRiskShadow = summary.shadowUsage > 50;
  const cards = [
    {
      title: "Shadow AI Usage",
      value: `${summary.shadowUsage.toFixed(1)}%`,
      description: "Traffic via unmanaged endpoints.",
      icon: Activity,
      color: isHighRiskShadow ? "text-red-500" : "text-[#F38020]",
      bg: isHighRiskShadow ? "bg-red-500/10" : "bg-[#F38020]/10",
      highlight: isHighRiskShadow,
      badge: isHighRiskShadow ? "High Risk" : null,
      tooltip: "Percentage of total detected AI traffic that bypasses standard review policies."
    },
    {
      title: "Unapproved Apps",
      value: summary.unapprovedApps,
      description: "Active restricted AI assets.",
      icon: AlertTriangle,
      color: summary.unapprovedApps > 0 ? "text-red-500" : "text-green-500",
      bg: summary.unapprovedApps > 0 ? "bg-red-500/10" : "bg-green-500/10",
      badge: summary.unapprovedApps > 0 ? "Critical" : null,
      tooltip: "Number of Generative AI applications marked 'Unapproved' with current activity."
    },
    {
      title: "Health Score",
      value: `${score.toFixed(0)}%`,
      description: "Aggregate security posture.",
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      tooltip: "Composite score based on policy coverage and detected shadow risk density."
    },
    {
      title: "Data Risk",
      value: summary.dataExfiltrationRisk,
      description: "Shadow AI payload volume.",
      icon: Database,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      tooltip: "Estimated volume of data transferred to unreviewed Generative AI endpoints."
    },
    {
      title: "Compliance",
      value: `${summary.complianceScore}%`,
      description: "Policy adherence rate.",
      icon: FileCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      tooltip: "Audit of current Gateway and Access rules against organizational baseline."
    }
  ];
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={cn(
              "border-border/50 shadow-soft h-full transition-all relative overflow-hidden",
              card.highlight && "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
            )}>
              <CardContent className="p-8 flex flex-col items-center text-center justify-between h-full space-y-6">
                <div className="relative">
                  <div className={cn("p-4 rounded-2xl", card.bg)}>
                    <card.icon className={cn("h-8 w-8", card.color)} />
                  </div>
                  {card.badge && (
                    <Badge variant="destructive" className="absolute -top-3 -right-3 text-[8px] uppercase font-bold animate-pulse px-1.5 py-0 h-4">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.title}</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/30 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs bg-popover/90 backdrop-blur-sm">
                        {card.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className={cn("text-4xl font-bold tracking-tighter", card.highlight ? "text-red-600" : "text-foreground")}>
                    {card.value}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/70 leading-tight">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </TooltipProvider>
  );
}