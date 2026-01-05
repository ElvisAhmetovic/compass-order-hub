import { RequireAuth } from "@/components/auth/RequireAuth";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { GoogleSheetsSync } from "@/components/settings/GoogleSheetsSync";

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <RequireAuth>
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
    </RequireAuth>
  );
}
