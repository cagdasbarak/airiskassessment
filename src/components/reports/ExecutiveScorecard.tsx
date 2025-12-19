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
const ProgressRing = ({ value, color, glowColor }: { value: number; color: string; glowColor: string }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
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
            filter: `drop-shadow(0 0 8px ${glowColor})`,
            strokeLinecap: "round"
          }}
        />
      </svg>
      <span className="absolute text-sm font-black tracking-tighter">{Math.round(value)}%</span>
    </div>
  );
};
export function ExecutiveScorecard({ summary, score }: ScorecardProps) {
  const shadowUsage = Number(summary?.shadowUsage || 0);
  const unapproved = Number(summary?.unapprovedApps || 0);
  const dataRisk = summary?.dataExfiltrationRisk || '0 KB';
  const healthScore = Number(score || 0);
  const compliance = Number(summary?.complianceScore || 0);
  const cards = [
    {
      title: "Shadow AI Usage",
      value: `${shadowUsage.toFixed(3)}%`,
      description: "Unmanaged endpoints",
      icon: Activity,
      color: "text-[#F38020]",
      glowColor: "rgba(243, 128, 32, 0.5)",
      progress: shadowUsage
    },
    {
      title: "Unapproved Apps",
      value: String(unapproved),
      description: "Active risk assets",
      icon: AlertTriangle,
      color: unapproved > 0 ? "text-red-500" : "text-emerald-500",
      glowColor: unapproved > 0 ? "rgba(239, 68, 68, 0.5)" : "rgba(16, 185, 129, 0.5)",
      progress: unapproved > 0 ? 100 : 0
    },
    {
      title: "Risk Volume",
      value: dataRisk,
      description: "30D Forensic Data",
      icon: HardDriveUpload,
      color: "text-purple-500",
      glowColor: "rgba(168, 85, 247, 0.5)",
      progress: Math.min(100, (Number(summary?.dataExfiltrationKB || 0) / 1024) * 100)
    },
    {
      title: "Health Score",
      value: `${healthScore.toFixed(0)}%`,
      description: "Security posture",
      icon: ShieldCheck,
      color: "text-blue-500",
      glowColor: "rgba(59, 130, 246, 0.5)",
      progress: healthScore
    },
    {
      title: "Compliance",
      value: `${compliance.toFixed(0)}%`,
      description: "Managed ratio",
      icon: FileCheck,
      color: "text-emerald-500",
      glowColor: "rgba(16, 185, 129, 0.5)",
      progress: compliance
    }
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 lg:gap-8">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          className="group"
        >
          <Card className="relative overflow-hidden border-0 bg-white/5 backdrop-blur-xl shadow-2xl h-full before:absolute before:inset-0 before:bg-gradient-mesh before:opacity-10">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center animate-float group-hover:shadow-glow-lg transition-all">
                  <card.icon className={cn("h-8 w-8 animate-glow", card.color)} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{card.title}</h3>
                <p className="text-4xl font-black bg-gradient-to-r from-[#F38020] to-[#E55A1B] bg-clip-text text-transparent">
                  {card.value}
                </p>
              </div>
              <ProgressRing value={card.progress} color={card.color.split('-').pop()?.replace('500', '') === 'red' ? '#ef4444' : card.color.includes('F38020') ? '#F38020' : card.color.includes('purple') ? '#a855f7' : card.color.includes('blue') ? '#3b82f6' : '#10b981'} glowColor={card.glowColor} />
              <p className="text-xs font-medium text-muted-foreground italic">
                {card.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}