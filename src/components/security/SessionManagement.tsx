
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Shield, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SessionManagement() {
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [maxSessions, setMaxSessions] = useState("3");
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSessionSettings();
    loadActiveSessions();
  }, []);

  const loadSessionSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('session_timeout_minutes, max_concurrent_sessions')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSessionTimeout(data.session_timeout_minutes?.toString() || "30");
        setMaxSessions(data.max_concurrent_sessions?.toString() || "3");
      }
    } catch (error) {
      console.error('Error loading session settings:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const response = await supabase.functions.invoke('get-active-sessions', {
        body: { userId: user?.id }
      });

      if (response.error) {
        throw response.error;
      }

      setActiveSessions(response.data || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const updateSessionSettings = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from('user_settings')
        .upsert({
          id: user?.id,
          session_timeout_minutes: parseInt(sessionTimeout),
          max_concurrent_sessions: parseInt(maxSessions)
        });

      toast({
        title: "Settings Updated",
        description: "Session management settings have been updated.",
      });
    } catch (error) {
      console.error('Error updating session settings:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update session settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await supabase.functions.invoke('terminate-session', {
        body: { sessionId, userId: user?.id }
      });

      if (response.error) {
        throw response.error;
      }

      await loadActiveSessions();

      toast({
        title: "Session Terminated",
        description: "The session has been terminated successfully.",
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not terminate the session.",
      });
    }
  };

  const terminateAllSessions = async () => {
    try {
      const response = await supabase.functions.invoke('terminate-all-sessions', {
        body: { userId: user?.id }
      });

      if (response.error) {
        throw response.error;
      }

      await loadActiveSessions();

      toast({
        title: "All Sessions Terminated",
        description: "All other sessions have been terminated.",
      });
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not terminate all sessions.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Session Management
        </CardTitle>
        <CardDescription>
          Configure session timeout and manage active sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-sessions">Max Concurrent Sessions</Label>
              <Select value={maxSessions} onValueChange={setMaxSessions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 session</SelectItem>
                  <SelectItem value="2">2 sessions</SelectItem>
                  <SelectItem value="3">3 sessions</SelectItem>
                  <SelectItem value="5">5 sessions</SelectItem>
                  <SelectItem value="10">10 sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={updateSessionSettings} disabled={isLoading}>
            Update Settings
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Active Sessions</h3>
            <Button 
              variant="outline" 
              onClick={terminateAllSessions}
              size="sm"
            >
              Terminate All Others
            </Button>
          </div>

          {activeSessions.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                No active sessions found or session tracking is not enabled.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {activeSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.device || 'Unknown Device'}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.location || 'Unknown Location'} • 
                      Last active: {new Date(session.last_active).toLocaleString()}
                    </p>
                    {session.is_current && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Current Session
                      </span>
                    )}
                  </div>
                  {!session.is_current && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => terminateSession(session.id)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
