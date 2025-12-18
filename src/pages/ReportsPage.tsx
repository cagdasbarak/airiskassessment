import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Trash2, Eye, ChevronRight } from 'lucide-react';
import { MOCK_REPORTS } from '@/lib/mock-data';
import { toast } from 'sonner';
export function ReportsPage() {
  const navigate = useNavigate();
  const deleteReport = (id: string) => {
    toast.success(`Report ${id} deleted`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_REPORTS.map((report) => (
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
                <CardTitle className="text-xl">Report {report.id}</CardTitle>
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
                  <div className="h-12 w-12 rounded-full border-4 border-secondary flex items-center justify-center">
                    <div 
                      className="h-full w-full rounded-full border-4 border-[#F38020] border-t-transparent animate-spin-slow" 
                      style={{ clipPath: `inset(0 0 ${100 - report.score}% 0)` }}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => navigate(`/reports/${report.id}`)}>
                  <Eye className="h-4 w-4 mr-2" /> View
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteReport(report.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}