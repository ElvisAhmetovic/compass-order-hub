import { RequireAuth } from "@/components/auth/RequireAuth";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GoogleSheetsSync } from "@/components/settings/GoogleSheetsSync";
import { Checkbox } from "@/components/ui/checkbox";
import { useSidebarConfig } from "@/hooks/useSidebarConfig";

// Must match the labels in Sidebar.tsx menuItems
const ALL_SIDEBAR_ITEMS = [
  { label: 'Dashboard', alwaysVisible: true },
  { label: 'Work Hours' },
  { label: 'Monthly Packages' },
  { label: 'Text' },
  { label: 'User Management' },
  { label: 'Support' },
  { label: 'Customer Tickets' },
  { label: 'Tech Support' },
  { label: 'My Orders' },
  { label: 'Active Orders' },
  { label: 'Invoice Sent' },
  { label: 'Invoice Paid' },
  { label: 'Invoices' },
  { label: 'Proposals' },
  { label: 'Google Deletion' },
  { label: 'Complaints' },
  { label: 'Completed' },
  { label: 'Cancelled' },
  { label: 'Reviews' },
  { label: 'Companies' },
  { label: 'Clients' },
  { label: 'Inventory' },
  { label: 'Rankings' },
  { label: 'Analytics' },
  { label: 'User Statistics' },
  { label: 'Settings', alwaysVisible: true },
  { label: 'Deleted' },
  { label: 'Yearly Packages' },
  { label: 'Team Chat' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isHidden, toggleItem } = useSidebarConfig();

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={user?.role}>
            <div className="max-w-4xl mx-auto py-6 space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Settings</h1>
                  <p className="text-muted-foreground">
                    Manage your application preferences and configurations.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-6">
                {user?.role === 'admin' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Integrations</CardTitle>
                      <CardDescription>
                        Manage external service integrations and data sync.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GoogleSheetsSync />
                    </CardContent>
                  </Card>
                )}

                {user?.role === 'admin' && <Card>
                  <CardHeader>
                    <CardTitle>Sidebar Navigation</CardTitle>
                    <CardDescription>
                      Choose which items appear in the main sidebar. These settings apply to all users. Unchecked items will be moved to the "More..." section.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {ALL_SIDEBAR_ITEMS.map((item) => (
                        <label
                          key={item.label}
                          className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${
                            item.alwaysVisible ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Checkbox
                            checked={!isHidden(item.label)}
                            onCheckedChange={() => {
                              if (!item.alwaysVisible) toggleItem(item.label);
                            }}
                            disabled={item.alwaysVisible}
                          />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Application Preferences</CardTitle>
                    <CardDescription>
                      Customize how the application behaves for you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Settings configuration coming soon...
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Configure your notification preferences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Notification settings coming soon...
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy & Security</CardTitle>
                    <CardDescription>
                      Manage your privacy and security settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Privacy settings coming soon...
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Layout>
        </div>
      </div>
    </RequireAuth>
  );
}
