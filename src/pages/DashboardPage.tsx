import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Zap, ArrowRight, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
export function DashboardPage() {
  const navigate = useNavigate();
  const [isAssessing, setIsAssessing] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchLastReport = async () => {
      try {
        const res = await api.listReports();
        if (res.success && res.data && res.data.length > 0) {
          setLastReport(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch reports');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLastReport();
  }, []);
  const startAssessment = async () => {
    setIsAssessing(true);
    const promise = api.startAssessment();
    toast.promise(promise, {
      loading: 'Analyzing Cloudflare Zero Trust logs...',
      success: (res) => {
        setIsAssessing(false);
        if (res.success && res.data) {
          navigate(`/reports/${res.data.id}`);
          return 'Assessment complete!';
        }
        throw new Error(res.error || 'Assessment failed');
      },
      error: (err) => {
        setIsAssessing(false);
        return err.message || 'Failed to connect to Cloudflare API';
      },
    });
  };
  return (
    <AppLayout container>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F38020] to-[#E55A1B] p-8 md:p-12 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              AI Risk Assessment Command Center
            </h1>
            <p className="text-lg text-white/90">
              Instantly audit your Cloudflare Zero Trust environment for shadow AI usage,
              data exfiltration risks, and policy compliance.
            </p>
            <Button
              size="lg"
              onClick={startAssessment}
              disabled={isAssessing}
              className="bg-white text-[#F38020] hover:bg-white/90 font-bold h-12 px-8 rounded-xl shadow-lg transition-all hover:scale-105"
            >
              {isAssessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start New Assessment
                  <Zap className="ml-2 h-5 w-5 fill-current" />
                </>
              )}
            </Button>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
            <ShieldCheck className="h-full w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Last Report Summary */}
          <Card className="md:col-span-2 border-border/50 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Latest Security Insight</CardTitle>
                <CardDescription>
                  {lastReport ? `Summary from report generated on ${lastReport.date}` : 'No assessments generated yet'}
                </CardDescription>
              </div>
              <Activity className="h-5 w-5 text-[#F38020]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : lastReport ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-secondary/50 text-center space-y-1">
                      <span className="text-2xl font-bold text-foreground">{lastReport.score}%</span>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Health Score</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 text-center space-y-1">
                      <span className="text-2xl font-bold text-orange-500">{lastReport.summary.aiApps}</span>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">AI Apps</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 text-center space-y-1">
                      <span className="text-2xl font-bold text-red-500">{lastReport.summary.shadowAiApps}</span>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Shadow AI</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 text-center space-y-1">
                      <span className="text-2xl font-bold text-blue-500">{lastReport.riskLevel}</span>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Level</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full mt-6 group" onClick={() => navigate(`/reports/${lastReport.id}`)}>
                    View Full Report <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Start New Assessment" to begin your first audit.
                </div>
              )}
            </CardContent>
          </Card>
          {/* Quick Actions / Status */}
          <Card className="border-border/50 shadow-soft">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Real-time connectivity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Cloudflare API</span>
                </div>
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Gateway Logs</span>
                </div>
                <span className="text-xs text-muted-foreground">Syncing</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-xs leading-relaxed">
                    Review your Gateway policies regularly to ensure new AI models are correctly categorized.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}