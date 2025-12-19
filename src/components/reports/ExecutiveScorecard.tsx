import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, AlertTriangle, HardDriveUpload, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PowerUser } from '@/lib/api';
interface ScorecardSummary {
  totalApps: number;
  aiApps: number;
  shadowAiApps: number;
  shadowUsage: number;
  unapprovedApps: number;
  dataExfiltrationKB: number;
  dataExfiltrationRisk: string;
  complianceScore: number;
  libraryCoverage: number;
}
interface ScorecardProps {
  summary: ScorecardSummary;
  score: number;
  powerUsers?: PowerUser[];
}
const COLOR_MAP = {
  orange: '#F38020',
  red: '#EF4444',
  purple: '#A855F7',
  blue: '#3B82F6',
  emerald: '#10B981'
} as const;
type ColorKey = keyof typeof COLOR_MAP;
const ProgressRing = ({ value, colorKey }: { value: number; colorKey: ColorKey }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (safeValue / 100) * circumference;
  const color = COLOR_MAP[colorKey];
  return (
    <div className="relative h-20 w-20 flex items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform overflow-visible">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="6"
          className="text-secondary/20"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
            strokeLinecap: "round"
          }}
        />
      </svg>
      <span className="absolute text-sm font-black tracking-tighter">{Math.round(safeValue)}%</span>
    </div>
  );
};
export function ExecutiveScorecard({ summary, score, powerUsers = [] }: ScorecardProps) {
  const defaultSummary: ScorecardSummary = {
    totalApps: 0,
    aiApps: 0,
    shadowAiApps: 0,
    shadowUsage: 0,
    unapprovedApps: 0,
    dataExfiltrationKB: 0,
    dataExfiltrationRisk: "0 KB",
    complianceScore: 0,
    libraryCoverage: 0
  };
  const safeSummary = summary || defaultSummary;
  const shadowUsage = Number(safeSummary.shadowUsage ?? 0);
  const unapprovedCount = Number(safeSummary.unapprovedApps ?? 0);
  const dataRiskKB = Number(safeSummary.dataExfiltrationKB ?? 0);
  const healthScore = Number(score ?? 0);
  const topUser = powerUsers?.[0] || null;
  const isTrafficRisk = dataRiskKB >= 1024;
  const trafficProgress = Math.min(100, (dataRiskKB / 2048) * 100);
  const userProgress = topUser ? Math.min(100, (topUser.prompts / 50) * 100) : 0;
  const cards = [
    {
      title: "Shadow AI Usage",
      value: `${shadowUsage.toFixed(2)}%`,
      description: "Unmanaged endpoints",
      icon: Activity,
      colorClass: "text-[#F38020]",
      colorKey: "orange" as const,
      progress: shadowUsage
    },
    {
      title: "Unapproved Apps",
      value: String(unapprovedCount),
      description: "Active risk assets",
      icon: AlertTriangle,
      colorClass: unapprovedCount > 0 ? "text-red-500" : "text-emerald-500",
      colorKey: (unapprovedCount > 0 ? "red" : "emerald") as ColorKey,
      progress: unapprovedCount > 0 ? 100 : 0
    },
    {
      title: "Unmanaged AI Traffic",
      value: `${dataRiskKB.toLocaleString()} KB`,
      description: "Non-corporate data volume",
      icon: HardDriveUpload,
      colorClass: isTrafficRisk ? "text-red-500" : "text-purple-500",
      colorKey: (isTrafficRisk ? "red" : "purple") as ColorKey,
      progress: trafficProgress
    },
    {
      title: "Top AI Users",
      value: topUser ? topUser.email.split('@')[0] : 'None Detected',
      description: topUser ? `${topUser.prompts} forensic events` : 'No AI activity tracked',
      icon: User,
      colorClass: "text-purple-500",
      colorKey: "purple" as const,
      progress: userProgress
    },
    {
      title: "Health Score",
      value: `${healthScore.toFixed(0)}%`,
      description: "Security posture",
      icon: ShieldCheck,
      colorClass: healthScore < 70 ? "text-red-500" : "text-blue-500",
      colorKey: (healthScore < 70 ? "red" : "blue") as ColorKey,
      progress: healthScore,
      isSpecial: true
    }
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 xl:gap-8">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          className="group flex flex-col"
        >
          <Card className={cn(
            "relative overflow-hidden border-0 bg-white/5 backdrop-blur-xl shadow-2xl flex-1 transition-all duration-300 hover:bg-white/[0.08]",
            "before:absolute before:inset-0 before:bg-gradient-mesh before:opacity-10 group-hover:before:opacity-20",
            card.isSpecial && healthScore < 50 ? "ring-2 ring-red-500/20" : ""
          )}>
            <CardContent className="p-8 flex flex-col items-center text-center justify-between h-full min-h-[320px] space-y-4">
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center animate-float group-hover:shadow-glow-lg transition-all">
                    <card.icon className={cn("h-8 w-8 animate-glow", card.colorClass)} />
                  </div>
                </div>
                <div className="space-y-1 w-full overflow-hidden">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{card.title}</h3>
                  <p className="text-2xl font-black bg-gradient-to-r from-[#F38020] to-[#E55A1B] bg-clip-text text-transparent truncate w-full px-2">
                    {card.value}
                  </p>
                </div>
              </div>
              <ProgressRing value={card.progress} colorKey={card.colorKey} />
              <p className="text-xs font-medium text-muted-foreground italic h-8 flex items-center justify-center">
                {card.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}