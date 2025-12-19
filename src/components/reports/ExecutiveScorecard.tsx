import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Database, FileCheck, Library, Info, AlertTriangle } from 'lucide-react';
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
      value: `${summary.shadowUsage.toFixed(3)}%`,
      description: "GenAI traffic via unmanaged endpoints.",
      icon: Activity,
      color: isHighRiskShadow ? "text-red-500" : "text-[#F38020]",
      bg: isHighRiskShadow ? "bg-red-500/10" : "bg-[#F38020]/10",
      highlight: isHighRiskShadow,
      badge: isHighRiskShadow ? "High Risk" : null,
      tooltip: "Percentage of total detected AI traffic that bypasses review policies."
    },
    {
      title: "Unapproved Apps",
      value: summary.unapprovedApps,
      description: "Active high-risk AI applications.",
      icon: AlertTriangle,
      color: summary.unapprovedApps > 0 ? "text-red-500" : "text-green-500",
      bg: summary.unapprovedApps > 0 ? "bg-red-500/10" : "bg-green-500/10",
      badge: summary.unapprovedApps > 0 ? "Critical" : null,
      tooltip: "Number of applications marked 'Unapproved' with detected traffic logs."
    },
    {
      title: "Health Score",
      value: `${score}%`,
      description: "Weighted environment security posture.",
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      tooltip: "Aggregate score based on policy coverage and risk density."
    },
    {
      title: "Data Risk",
      value: summary.dataExfiltrationRisk,
      description: "Traffic volume to shadow AI.",
      icon: Database,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      tooltip: "Total payload size sent to unapproved Generative AI endpoints."
    },
    {
      title: "Compliance",
      value: `${summary.complianceScore}%`,
      description: "ZTNA policy adherence rate.",
      icon: FileCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      tooltip: "Audit of Access and Gateway rules against security baseline."
    }
  ];
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={cn(
                "border-border/50 shadow-soft overflow-hidden h-full transition-all",
                card.highlight && "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
            )}>
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-xl", card.bg)}>
                    <card.icon className={cn("h-5 w-5", card.color)} />
                  </div>
                  <div className="flex items-center gap-2">
                      {card.badge && (
                          <Badge variant="destructive" className="text-[9px] uppercase font-bold animate-pulse">
                              {card.badge}
                          </Badge>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] text-xs">
                          {card.tooltip}
                        </TooltipContent>
                      </Tooltip>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-3xl font-bold tracking-tight", card.highlight && "text-red-600")}>
                        {card.value}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{card.title}</p>
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed border-t pt-3">
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