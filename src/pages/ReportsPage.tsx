import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Eye, Loader2, AlertCircle, Trash2 } from 'lucide-react';
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
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      const res = await api.deleteReport(id);
      if (res.success) {
        setReports(prev => prev.filter(r => r.id !== id));
        toast.success('Report deleted successfully');
      } else {
        toast.error(res.error || 'Failed to delete report');
      }
    } catch (err) {
      toast.error('Network error while deleting report');
    }
  };
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
              <Card key={`skeleton-${i}`} className="h-64 animate-pulse bg-secondary/20" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">{error}</p>
            <Button onClick={fetchReports}>Retry</Button>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl min-h-[400px]">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No reports found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-center">Start your first assessment to begin tracking your organizational AI risk posture.</p>
            <Button onClick={() => navigate('/')} className="btn-gradient h-11 px-8">Start Assessment</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, idx) => {
              const reportId = report?.id || `fallback-${idx}`;
              return (
                <Card key={`report-${reportId}-${idx}`} className="group border-border/50 shadow-soft hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-[#F38020]/10">
                        <FileText className="h-5 w-5 text-[#F38020]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report?.riskLevel === 'High' ? 'destructive' : report?.riskLevel === 'Medium' ? 'secondary' : 'outline'}>
                          {report?.riskLevel ?? 'Unknown'} Risk
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive no-print"
                          onClick={(e) => handleDelete(reportId, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-xl">Report {reportId.slice(-6).toUpperCase()}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" /> {report?.date ?? 'N/A'}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Health Score</p>
                        <p className="text-3xl font-bold text-foreground">{report?.score ?? 0}%</p>
                      </div>
                      <div className="h-12 w-12 rounded-full border-4 border-secondary flex items-center justify-center overflow-hidden">
                        <div
                          className="w-full bg-[#F38020]"
                          style={{ height: `${report?.score ?? 0}%`, marginTop: 'auto' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => navigate(`/reports/${reportId}`)}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}