import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, LifeBuoy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

const formSchema = z.object({
  subject: z.string().trim().max(150, "Subject must be less than 150 characters").optional(),
  message: z
    .string()
    .trim()
    .nonempty("Please describe what you need help with")
    .max(2000, "Message must be less than 2000 characters"),
});

const TicketLoading = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");
  const email = searchParams.get("email");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!orderId || !email) {
    navigate("/ticket-submitted?status=error", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = formSchema.safeParse({ subject, message });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Please check the form");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-client-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          email,
          message: parsed.data.message,
          subject: parsed.data.subject || undefined,
        }),
      });

      const data = await res.json();
      const params = new URLSearchParams({ status: data.status || "error" });
      if (data.company) params.set("company", data.company);
      navigate(`/ticket-submitted?${params.toString()}`, { replace: true });
    } catch {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            How can we help?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us briefly what you need, and our team will get back to you at {email}.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                value={subject}
                maxLength={150}
                placeholder="Short summary"
                onChange={(e) => setSubject(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">What do you need help with? *</Label>
              <Textarea
                id="message"
                value={message}
                maxLength={2000}
                rows={6}
                placeholder="Describe your request in a few sentences..."
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">{message.length}/2000</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? "Sending..." : "Send request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketLoading;
