import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, FileCheck, AlertTriangle, Info, HardDriveUpload } from 'lucide-react';
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
    dataExfiltrationKB: number;
    dataExfiltrationRisk: string;
    complianceScore: number;
    libraryCoverage: number;
  };
  score: number;
}
export function ExecutiveScorecard({ summary, score }: ScorecardProps) {
  const shadowUsageValue = summary?.shadowUsage ?? 0;
  const unapprovedCount = summary?.unapprovedApps ?? 0;
  const dataExfiltrationKB = summary?.dataExfiltrationKB ?? 0;
  const healthScore = score ?? 0;
  // Consume the pre-formatted high-fidelity string from the backend
  const dataRiskLabel = summary?.dataExfiltrationRisk ?? '0 KB';
  const compliance = summary?.complianceScore ?? 0;
  // Visual Risk Triggers
  const isHighRiskShadow = shadowUsageValue > 50;
  const isCriticalUnapproved = unapprovedCount > 0;
  // Badge and color triggers for data volume (1024KB = 1MB)
  const isCriticalUpload = dataExfiltrationKB >= 1024;
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
      tooltip: "Percentage of detected AI applications not present in your organization's managed and reviewed application list."
    },
    {
      title: "Unapproved Apps",
      value: unapprovedCount,
      description: "Active restricted AI assets.",
      icon: AlertTriangle,
      color: isCriticalUnapproved ? "text-red-500" : "text-emerald-500",
      bg: isCriticalUnapproved ? "bg-red-500/10" : "bg-emerald-500/10",
      highlight: isCriticalUnapproved,
      badge: isCriticalUnapproved ? "Critical" : null,
      tooltip: "The count of AI applications explicitly marked as 'Unapproved' that still show active network telemetry."
    },
    {
      title: "Unmanaged AI Upload",
      value: dataRiskLabel,
      description: "30D Forensic Data Leakage.",
      icon: HardDriveUpload,
      color: isCriticalUpload ? "text-red-500" : "text-purple-500",
      bg: isCriticalUpload ? "bg-red-500/10" : "bg-purple-500/10",
      highlight: isCriticalUpload,
      badge: isCriticalUpload ? "Critical" : null,
      tooltip: "High-fidelity aggregate of bytes sent to unreviewed or unapproved AI endpoints within the last 30 days, filtered by Gateway status and DLP incidents."
    },
    {
      title: "Health Score",
      value: `${healthScore.toFixed(0)}%`,
      description: "Aggregate security posture.",
      icon: ShieldCheck,
      color: healthScore >= 85 ? "text-blue-500" : healthScore >= 70 ? "text-emerald-500" : "text-amber-500",
      bg: healthScore >= 85 ? "bg-blue-500/10" : healthScore >= 70 ? "bg-emerald-500/10" : "bg-amber-500/10",
      tooltip: "A composite indicator reflecting policy coverage, shadow usage density, and effective Cloudflare ZTNA configuration."
    },
    {
      title: "Compliance Rate",
      value: `${compliance}%`,
      description: "Managed application ratio.",
      icon: FileCheck,
      color: "text-[#F38020]",
      bg: "bg-[#F38020]/10",
      tooltip: "The ratio of managed AI applications compared to the total detected environment footprint."
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
              delay: idx * 0.1,
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            <Card className={cn(
              "border-border/50 shadow-soft h-full transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl",
              card.highlight && "ring-2 ring-red-500/50 shadow-lg shadow-red-500/10 bg-red-500/[0.01]"
            )}>
              <CardContent className="p-8 flex flex-col items-center text-center justify-between h-full space-y-6">
                <div className="relative">
                  <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-500", card.bg)}>
                    <card.icon className={cn("h-8 w-8", card.color)} />
                  </div>
                  {card.badge && (
                    <Badge variant="destructive" className="absolute -top-3 -right-3 text-[8px] uppercase font-bold px-1.5 py-0 h-4 ring-2 ring-background opacity-90 animate-pulse duration-[2000ms]">
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{card.title}</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="focus:outline-none" aria-label={`Details for ${card.title}`}>
                          <Info className="h-3 w-3 text-muted-foreground/30 cursor-help" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[11px] max-w-[180px] bg-popover/95 backdrop-blur-sm border border-border/50 shadow-2xl p-2.5">
                        {card.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className={cn(
                    "text-2xl font-bold tracking-tighter sm:text-3xl transition-colors duration-300",
                    card.highlight ? "text-red-600" : "text-foreground"
                  )}>
                    {card.value}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 leading-tight font-medium">
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