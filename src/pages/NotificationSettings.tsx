import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Bell, BellOff, Mail, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface NotificationSettings {
  id: string;
  enabled: boolean;
  recipient_emails: string[];
  notify_on_status_created: boolean;
  notify_on_status_in_progress: boolean;
  notify_on_status_invoice_sent: boolean;
  notify_on_status_invoice_paid: boolean;
  notify_on_status_complaint: boolean;
  notify_on_status_resolved: boolean;
  notify_on_status_cancelled: boolean;
  notify_on_status_deleted: boolean;
  notify_on_status_review: boolean;
  notify_on_status_facebook: boolean;
  notify_on_status_instagram: boolean;
  notify_on_status_trustpilot: boolean;
  notify_on_status_trustpilot_deletion: boolean;
  notify_on_status_google_deletion: boolean;
}

interface NotificationLog {
  id: string;
  created_at: string;
  status_change: string;
  changed_by_name: string;
  email_sent: boolean;
  email_error: string | null;
  recipient_emails: string[];
  order_id: string;
}

const NotificationSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [emailsText, setEmailsText] = useState("");
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can access notification settings",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setEmailsText(data.recipient_emails.join('\n'));
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading notification logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      // Parse emails from textarea
      const emails = emailsText
        .split(/[\n,]/)
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      if (emails.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please enter at least one valid email address",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('notification_settings')
        .update({
          enabled: settings.enabled,
          recipient_emails: emails,
          notify_on_status_created: settings.notify_on_status_created,
          notify_on_status_in_progress: settings.notify_on_status_in_progress,
          notify_on_status_invoice_sent: settings.notify_on_status_invoice_sent,
          notify_on_status_invoice_paid: settings.notify_on_status_invoice_paid,
          notify_on_status_complaint: settings.notify_on_status_complaint,
          notify_on_status_resolved: settings.notify_on_status_resolved,
          notify_on_status_cancelled: settings.notify_on_status_cancelled,
          notify_on_status_deleted: settings.notify_on_status_deleted,
          notify_on_status_review: settings.notify_on_status_review,
          notify_on_status_facebook: settings.notify_on_status_facebook,
          notify_on_status_instagram: settings.notify_on_status_instagram,
          notify_on_status_trustpilot: settings.notify_on_status_trustpilot,
          notify_on_status_trustpilot_deletion: settings.notify_on_status_trustpilot_deletion,
          notify_on_status_google_deletion: settings.notify_on_status_google_deletion,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Notification settings updated successfully",
      });

      await loadSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole={user?.role || "user"}>
          <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Notification Settings</h1>
                <p className="text-muted-foreground mt-1">
                  Configure email notifications for order status changes
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Settings</>
                )}
              </Button>
            </div>

            {/* Global Enable/Disable */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {settings.enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  Global Notification Status
                </CardTitle>
                <CardDescription>
                  Master switch for all status change notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="global-enabled"
                    checked={settings.enabled}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enabled: checked })
                    }
                  />
                  <Label htmlFor="global-enabled" className="font-medium">
                    {settings.enabled ? "Notifications Enabled" : "Notifications Disabled"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Recipient Emails */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Recipient Email Addresses
                </CardTitle>
                <CardDescription>
                  Enter email addresses (one per line or comma-separated)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={emailsText}
                  onChange={(e) => setEmailsText(e.target.value)}
                  placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Currently configured: {emailsText.split(/[\n,]/).filter(e => e.trim() && e.includes('@')).length} emails
                </p>
              </CardContent>
            </Card>

            {/* Status-Specific Toggles */}
            <Card>
              <CardHeader>
                <CardTitle>Status-Specific Notifications</CardTitle>
                <CardDescription>
                  Enable or disable notifications for specific status changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'notify_on_status_created', label: 'Created', category: 'Lifecycle' },
                    { key: 'notify_on_status_in_progress', label: 'In Progress', category: 'Lifecycle' },
                    { key: 'notify_on_status_resolved', label: 'Resolved', category: 'Lifecycle' },
                    { key: 'notify_on_status_invoice_sent', label: 'Invoice Sent', category: 'Financial' },
                    { key: 'notify_on_status_invoice_paid', label: 'Invoice Paid', category: 'Financial' },
                    { key: 'notify_on_status_complaint', label: 'Complaint', category: 'Issues' },
                    { key: 'notify_on_status_cancelled', label: 'Cancelled', category: 'Issues' },
                    { key: 'notify_on_status_deleted', label: 'Deleted', category: 'Issues' },
                    { key: 'notify_on_status_review', label: 'Review', category: 'Social' },
                    { key: 'notify_on_status_facebook', label: 'Facebook', category: 'Social' },
                    { key: 'notify_on_status_instagram', label: 'Instagram', category: 'Social' },
                    { key: 'notify_on_status_trustpilot', label: 'Trustpilot', category: 'Social' },
                    { key: 'notify_on_status_trustpilot_deletion', label: 'Trustpilot Deletion', category: 'Deletions' },
                    { key: 'notify_on_status_google_deletion', label: 'Google Deletion', category: 'Deletions' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor={item.key} className="font-medium cursor-pointer">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <Switch
                        id={item.key}
                        checked={settings[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Notifications (Last 50)
                </CardTitle>
                <CardDescription>
                  History of sent notification emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notifications sent yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Status Change</TableHead>
                          <TableHead>Changed By</TableHead>
                          <TableHead>Recipients</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {log.status_change}
                            </TableCell>
                            <TableCell>{log.changed_by_name}</TableCell>
                            <TableCell className="text-sm">
                              {log.recipient_emails.length} recipients
                            </TableCell>
                            <TableCell>
                              {log.email_sent ? (
                                <Badge variant="default" className="bg-green-500">
                                  ✓ Sent
                                </Badge>
                              ) : (
                                <Badge variant="destructive" title={log.email_error || undefined}>
                                  ✗ Failed
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default NotificationSettings;
