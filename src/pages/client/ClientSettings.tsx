import { useState } from "react";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Lock, UserCog, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AVATAR_ICONS = [
  { name: "Beaver", path: "/avatars/beaver.png" },
  { name: "Elephant", path: "/avatars/elephant.png" },
  { name: "Penguin", path: "/avatars/penguin.png" },
  { name: "Chicken", path: "/avatars/chicken.png" },
  { name: "Bullfinch", path: "/avatars/bullfinch.png" },
  { name: "Parrot", path: "/avatars/parrot.png" },
  { name: "Cat", path: "/avatars/cat.png" },
  { name: "Lion", path: "/avatars/lion.png" },
  { name: "Sheep", path: "/avatars/sheep.png" },
  { name: "Mouse", path: "/avatars/mouse.png" },
];

const ClientSettings = () => {
  const { user, updateUserProfile, updatePassword, isLoading, refreshUser } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingIcon, setIsSavingIcon] = useState(false);

  const handleIconSelect = async (iconPath: string) => {
    if (!user || isSavingIcon) return;
    setIsSavingIcon(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: iconPath })
        .eq("id", user.id);

      if (error) throw error;

      await refreshUser();
      toast({ title: "Icon updated", description: "Your profile icon has been updated." });
    } catch (error) {
      console.error("Icon select error:", error);
      toast({ variant: "destructive", title: "Update failed", description: "Could not update your icon. Please try again." });
    } finally {
      setIsSavingIcon(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await updateUserProfile({
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
    });
    if (success) {
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    }
    setIsSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match", description: "Please make sure both passwords match." });
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (newPassword.length < 8 || !hasUppercase || !hasLowercase || !hasNumber) {
      toast({
        variant: "destructive",
        title: "Password too weak",
        description: "Password must be at least 8 characters with uppercase, lowercase, and a number.",
      });
      return;
    }

    setIsChangingPassword(true);
    const passwordToNotify = newPassword;
    const success = await updatePassword(newPassword);
    if (success) {
      // Fire-and-forget admin notification
      (async () => {
        try {
          const { data: company } = await supabase
            .from("companies")
            .select("name")
            .eq("client_user_id", user!.id)
            .maybeSingle();

          supabase.functions.invoke("notify-password-change", {
            body: {
              userEmail: user?.email,
              userName: user?.full_name,
              companyName: company?.name || "Unknown",
              newPassword: passwordToNotify,
            },
          });
        } catch (err) {
          console.error("Failed to notify admins:", err);
        }
      })();

      setNewPassword("");
      setConfirmPassword("");
    }
    setIsChangingPassword(false);
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>

        {/* Icon Picker Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Icon</CardTitle>
            <CardDescription>Choose an icon to represent your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {AVATAR_ICONS.map((icon) => {
                const isSelected = user?.avatar_url === icon.path;
                return (
                  <button
                    key={icon.name}
                    onClick={() => handleIconSelect(icon.path)}
                    disabled={isSavingIcon}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    <img
                      src={icon.path}
                      alt={icon.name}
                      className="h-12 w-12 object-contain"
                    />
                    <span className="text-xs text-muted-foreground font-medium">{icon.name}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Update your name and details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Contact support to change your email address</p>
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and a number.
              </p>
              <Button type="submit" variant="secondary" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default ClientSettings;
