import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, FileCheck, AlertTriangle, HardDriveUpload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
export function ExecutiveScorecard({ summary, score }: ScorecardProps) {
  const shadowUsage = Number(summary?.shadowUsage || 0);
  const unapprovedCount = Number(summary?.unapprovedApps || 0);
  const dataRiskKB = Number(summary?.dataExfiltrationKB || 0);
  const healthScore = Number(score || 0);
  const complianceScore = Number(summary?.complianceScore || 0);
  // Dynamic logic for Unmanaged Traffic (Card 3)
  const isTrafficRisk = dataRiskKB >= 1024;
  const trafficColorKey: ColorKey = isTrafficRisk ? "red" : "purple";
  const trafficProgress = Math.min(100, (dataRiskKB / 1024) * 100);
  const cards = [
    {
      title: "Shadow AI Usage",
      value: `${shadowUsage.toFixed(3)}%`,
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
      colorKey: trafficColorKey,
      progress: trafficProgress
    },
    {
      title: "Health Score",
      value: `${healthScore.toFixed(0)}%`,
      description: "Security posture",
      icon: ShieldCheck,
      colorClass: "text-blue-500",
      colorKey: "blue" as const,
      progress: healthScore
    },
    {
      title: "Compliance",
      value: `${complianceScore.toFixed(0)}%`,
      description: "Managed ratio",
      icon: FileCheck,
      colorClass: "text-emerald-500",
      colorKey: "emerald" as const,
      progress: complianceScore
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
          className="group"
        >
          <Card className="relative overflow-hidden border-0 bg-white/5 backdrop-blur-xl shadow-2xl h-full transition-all duration-300 hover:bg-white/[0.08] before:absolute before:inset-0 before:bg-gradient-mesh before:opacity-10 before:transition-opacity group-hover:before:opacity-20">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center animate-float group-hover:shadow-glow-lg transition-all">
                  <card.icon className={cn("h-8 w-8 animate-glow", card.colorClass)} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{card.title}</h3>
                <p className="text-4xl font-black bg-gradient-to-r from-[#F38020] to-[#E55A1B] bg-clip-text text-transparent truncate w-full px-2">
                  {card.value}
                </p>
              </div>
              <ProgressRing value={card.progress} colorKey={card.colorKey} />
              <p className="text-xs font-medium text-muted-foreground italic min-h-[1rem]">
                {card.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}