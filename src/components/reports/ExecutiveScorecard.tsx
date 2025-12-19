import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Database, FileCheck, Library, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface ScorecardProps {
  summary: {
    totalApps: number;
    aiApps: number;
    shadowAiApps: number;
    shadowUsage: number;
    dataExfiltrationRisk: string;
    complianceScore: number;
    libraryCoverage: number;
  };
  score: number;
}
export function ExecutiveScorecard({ summary, score }: ScorecardProps) {
  const cards = [
    {
      title: "Overall Health",
      value: `${score}%`,
      description: "Aggregate security posture based on 24 metrics.",
      icon: ShieldCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
      tooltip: "Calculated using policy enforcement, library coverage, and shadow AI usage ratios."
    },
    {
      title: "Shadow AI Usage",
      value: `${summary.shadowUsage}%`,
      description: "Percentage of AI traffic through unvetted apps.",
      icon: Activity,
      color: "text-[#F38020]",
      bg: "bg-[#F38020]/10",
      trend: { val: "12%", up: false },
      tooltip: "Represents traffic sessions detected on GenAI endpoints without explicit 'Allow' policies."
    },
    {
      title: "Data Risk",
      value: summary.dataExfiltrationRisk,
      description: "Total data volume uploaded to unapproved AI.",
      icon: Database,
      color: "text-red-500",
      bg: "bg-red-500/10",
      tooltip: "Cumulative 'POST' body bytes intercepted by SWG Gateway targeting AI categories."
    },
    {
      title: "Compliance Score",
      value: `${summary.complianceScore}%`,
      description: "Adherence to ZTNA access control standards.",
      icon: FileCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      tooltip: "Audit of Access JWT validation, MFA requirements, and device posture check coverage."
    },
    {
      title: "Library Coverage",
      value: `${summary.libraryCoverage}%`,
      description: "Percentage of known AI apps with active policies.",
      icon: Library,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      tooltip: "Matching of detected application IDs against Cloudflare's global App Library database."
    }
  ];
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-border/50 shadow-soft overflow-hidden h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-xl ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-xs">
                      {card.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">{card.value}</span>
                    {card.trend && (
                      <span className={`flex items-center text-[10px] font-bold ${card.trend.up ? 'text-red-500' : 'text-green-500'}`}>
                        {card.trend.up ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                        {card.trend.val}
                      </span>
                    )}
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