import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Eye, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
export function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.listReports();
      if (res.success && res.data) {
        setReports(res.data);
      } else {
        setError(res.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('Network error while fetching reports');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchReports();
  }, []);
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment Reports</h1>
            <p className="text-muted-foreground">View and manage your historical AI risk assessments.</p>
          </div>
          <Button className="btn-gradient" onClick={() => navigate('/')}>
            New Assessment
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-secondary/20" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">{error}</p>
            <Button onClick={fetchReports}>Retry</Button>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed rounded-3xl">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No reports found</h3>
            <p className="text-muted-foreground mb-6">Start your first assessment to see results here.</p>
            <Button onClick={() => navigate('/')}>Start Assessment</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="group border-border/50 shadow-soft hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-[#F38020]/10">
                      <FileText className="h-5 w-5 text-[#F38020]" />
                    </div>
                    <Badge variant={report.riskLevel === 'High' ? 'destructive' : report.riskLevel === 'Medium' ? 'secondary' : 'outline'}>
                      {report.riskLevel} Risk
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">Report {report.id.slice(-6)}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3 mr-1" /> {report.date}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Health Score</p>
                      <p className="text-3xl font-bold text-foreground">{report.score}%</p>
                    </div>
                    <div className="h-12 w-12 rounded-full border-4 border-secondary flex items-center justify-center overflow-hidden">
                      <div 
                        className="h-full w-full bg-[#F38020]" 
                        style={{ height: `${report.score}%`, marginTop: 'auto' }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/reports/${report.id}`)}>
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}