import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Key, User, Save, RefreshCw, Loader2, Building2, Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { api, LicenseInfo } from '@/lib/api';
const FeatureCheck = ({ label, enabled }: { label: string, enabled: boolean }) => (
  <div className="flex items-center justify-between py-2.5 border-b last:border-0 border-border/30">
    <span className="text-sm font-medium">{label}</span>
    {enabled ? (
      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 text-muted-foreground/40">
        <XCircle className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Missing</span>
      </div>
    )}
  </div>
);
export function SettingsPage() {
  // Adhering to Zustand Primitive Selection Law
  const accountId = useAppStore(s => s.settings.accountId);
  const email = useAppStore(s => s.settings.email);
  const apiKey = useAppStore(s => s.settings.apiKey);
  // Cloudflare Contact Primitives
  const cfName = useAppStore(s => s.settings.cloudflareContact.name);
  const cfRole = useAppStore(s => s.settings.cloudflareContact.role);
  const cfEmail = useAppStore(s => s.settings.cloudflareContact.email);
  const cfTeam = useAppStore(s => s.settings.cloudflareContact.team);
  // Customer Contact Primitives
  const custOrg = useAppStore(s => s.settings.customerContact.customerName);
  const custName = useAppStore(s => s.settings.customerContact.name);
  const custRole = useAppStore(s => s.settings.customerContact.role);
  const custEmail = useAppStore(s => s.settings.customerContact.email);
  const updateStoreSettings = useAppStore(s => s.updateSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isCheckingLicense, setIsCheckingLicense] = useState(false);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.data) {
          updateStoreSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [updateStoreSettings]);
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get the latest settings from the store
      const currentSettings = useAppStore.getState().settings;
      const res = await api.updateSettings(currentSettings);
      if (res.success) {
        toast.success('Settings saved securely');
      } else {
        toast.error(res.error || 'Save failed');
      }
    } catch (err) {
      toast.error('Network error while saving settings');
    } finally {
      setIsSaving(false);
    }
  };
  const checkLicense = async () => {
    setIsCheckingLicense(true);
    try {
      const res = await api.checkLicense();
      if (res.success && res.data) {
        setLicense(res.data);
        toast.success('License verified successfully');
      } else {
        toast.error(res.error || 'License verification failed');
      }
    } catch (err) {
      toast.error('Connection error during license check');
    } finally {
      setIsCheckingLicense(false);
    }
  };
  if (isLoading) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout container>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Configure your environment for automated risk analysis.</p>
          </div>
          <Tabs defaultValue="integration" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
              <TabsTrigger value="integration" className="flex items-center gap-2">
                <Key className="h-4 w-4" /> Integration
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Report Contact
              </TabsTrigger>
            </TabsList>
            <TabsContent value="integration">
              <Card className="flex-1 border-border/50 shadow-soft h-fit">
                <CardHeader>
                  <CardTitle>Cloudflare API Credentials</CardTitle>
                  <CardDescription>We use these keys to securely fetch your Zero Trust subscription and log data.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="accountId">Account ID</Label>
                      <Input
                        id="accountId"
                        value={accountId}
                        onChange={(e) => updateStoreSettings({ accountId: e.target.value })}
                        placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Cloudflare Admin Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => updateStoreSettings({ email: e.target.value })}
                        placeholder="admin@company.com"
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">Global API Key / Token</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => updateStoreSettings({ apiKey: e.target.value })}
                        placeholder="••••••••••••••••••••••••"
                        className="bg-secondary/50"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6 bg-secondary/10">
                  <Button variant="ghost" onClick={() => updateStoreSettings({ accountId: '', email: '', apiKey: '' })}>Clear</Button>
                  <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Integration
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="report">
              <div className="space-y-6">
                <Card className="border-border/50 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#F38020]">
                      <Building2 className="h-5 w-5" /> Cloudflare Contact
                    </CardTitle>
                    <CardDescription>Internal representative listed on generated reports.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={cfName} onChange={(e) => updateStoreSettings({ cloudflareContact: { name: e.target.value } })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input value={cfRole} onChange={(e) => updateStoreSettings({ cloudflareContact: { role: e.target.value } })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={cfEmail} onChange={(e) => updateStoreSettings({ cloudflareContact: { email: e.target.value } })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Team</Label>
                      <Input value={cfTeam} onChange={(e) => updateStoreSettings({ cloudflareContact: { team: e.target.value } })} className="bg-secondary/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-500">
                      <Briefcase className="h-5 w-5" /> Customer Stakeholder
                    </CardTitle>
                    <CardDescription>Primary customer contact receiving the assessment.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Input value={custOrg} onChange={(e) => updateStoreSettings({ customerContact: { customerName: e.target.value } })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={custName} onChange={(e) => updateStoreSettings({ customerContact: { name: e.target.value } })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input value={custRole} onChange={(e) => updateStoreSettings({ customerContact: { role: e.target.value } })} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={custEmail} onChange={(e) => updateStoreSettings({ customerContact: { email: e.target.value } })} className="bg-secondary/50" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-4 bg-secondary/5">
                    <Button onClick={handleSave} disabled={isSaving} className="btn-gradient">
                      Save Stakeholders
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <Card className="w-full md:w-80 md:flex-shrink-0 border-[#F38020]/20 shadow-soft bg-secondary/30 h-fit">
          <CardHeader className="py-4 px-5 border-b">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-[#F38020]" />
              <span className="text-sm font-bold uppercase tracking-wider">License Status</span>
            </div>
            <CardTitle className="text-lg">Subscription Audit</CardTitle>
            <CardDescription className="text-xs">Real-time Cloudflare plan verification.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {!license ? (
              <div className="text-center py-8 space-y-4">
                <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
                <p className="text-xs text-muted-foreground px-4">Connect your API credentials to verify your Zero Trust license entitlements.</p>
                <Button variant="outline" size="sm" onClick={checkLicense} disabled={isCheckingLicense} className="w-full">
                  {isCheckingLicense ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                  Verify Now
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">ZTNA Plan</span>
                    <span className="font-bold text-[#F38020]">{license.plan}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Seat Utilization</span>
                      <span className="font-bold">{license.usedLicenses}/{license.totalLicenses}</span>
                    </div>
                    <Progress value={(license.usedLicenses / (license.totalLicenses || 1)) * 100} className="h-2" />
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Feature Checklist</h4>
                  <FeatureCheck label="Access Gateway" enabled={license.accessSub} />
                  <FeatureCheck label="SWG Gateway" enabled={license.gatewaySub} />
                  <FeatureCheck label="CASB Integration" enabled={license.casb} />
                  <FeatureCheck label="DLP Scanning" enabled={license.dlp} />
                  <FeatureCheck label="Remote Browser" enabled={license.rbi} />
                </div>
                <Button variant="ghost" size="sm" onClick={checkLicense} disabled={isCheckingLicense} className="w-full text-xs text-muted-foreground">
                  {isCheckingLicense ? "Refreshing..." : "Last checked moments ago"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}