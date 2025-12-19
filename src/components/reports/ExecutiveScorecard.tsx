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
  const shadowUsageValue = summary?.shadowUsage ?? 0;
  const unapprovedCount = summary?.unapprovedApps ?? 0;
  const healthScore = score ?? 0;
  const dataRisk = summary?.dataExfiltrationRisk ?? '0 MB';
  const compliance = summary?.complianceScore ?? 0;
  const isHighRiskShadow = shadowUsageValue > 50;
  const isCriticalUnapproved = unapprovedCount > 0;
  const cards = [
    {
      title: "Shadow AI Usage",
      value: `${shadowUsageValue.toFixed(3)}%`,
      description: "Traffic via unmanaged endpoints.",
      icon: Activity,
      color: isHighRiskShadow ? "text-red-500" : "text-[#F38020]",
      bg: isHighRiskShadow ? "bg-red-500/10" : "bg-[#F38020]/10",
      highlight: isHighRiskShadow,
      badge: isHighRiskShadow ? "High Risk" : null,
      tooltip: "Percentage of detected AI applications not found in managed lists. High density suggests bypass of security controls."
    },
    {
      title: "Unapproved Apps",
      value: unapprovedCount,
      description: "Active restricted AI assets.",
      icon: AlertTriangle,
      color: isCriticalUnapproved ? "text-red-500" : "text-green-500",
      bg: isCriticalUnapproved ? "bg-red-500/10" : "bg-green-500/10",
      highlight: isCriticalUnapproved,
      badge: isCriticalUnapproved ? "Critical" : null,
      tooltip: "Number of applications explicitly marked as 'Unapproved' with active traffic detected in Gateway logs."
    },
    {
      title: "Health Score",
      value: `${healthScore.toFixed(0)}%`,
      description: "Aggregate security posture.",
      icon: ShieldCheck,
      color: healthScore < 70 ? "text-amber-500" : "text-blue-500",
      bg: healthScore < 70 ? "bg-amber-500/10" : "bg-blue-500/10",
      tooltip: "Composite indicator of Zero Trust policy coverage and shadow AI usage density."
    },
    {
      title: "Data Risk",
      value: dataRisk,
      description: "Shadow AI payload volume.",
      icon: Database,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      tooltip: "Estimated volume of sensitive data transmitted to unmanaged or unreviewed AI endpoints."
    },
    {
      title: "Compliance",
      value: `${compliance}%`,
      description: "Policy adherence rate.",
      icon: FileCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      tooltip: "Ratio of managed AI applications against the total detected environment footprint."
    }
  ];
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: idx * 0.12,
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            <Card className={cn(
              "border-border/50 shadow-soft h-full transition-all duration-300 relative overflow-hidden group",
              card.highlight && "ring-2 ring-red-500/50 shadow-lg shadow-red-500/10 bg-red-500/[0.01]"
            )}>
              <CardContent className="p-8 flex flex-col items-center text-center justify-between h-full space-y-6">
                <div className="relative">
                  <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300", card.bg)}>
                    <card.icon className={cn("h-8 w-8", card.color)} />
                  </div>
                  {card.badge && (
                    <Badge variant="destructive" className="absolute -top-3 -right-3 text-[8px] uppercase font-bold animate-pulse px-1.5 py-0 h-4 ring-2 ring-background">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.title}</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="focus:outline-none" aria-label={`Information about ${card.title}`}>
                          <Info className="h-3 w-3 text-muted-foreground/30 cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[200px] bg-popover/90 backdrop-blur-sm border border-border/50 shadow-xl">
                        {card.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className={cn(
                    "text-4xl font-bold tracking-tighter",
                    card.highlight ? "text-red-600" : "text-foreground"
                  )}>
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