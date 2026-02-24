import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TicketLoading = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const email = searchParams.get("email");

    if (!orderId || !email) {
      navigate("/ticket-submitted?status=error", { replace: true });
      return;
    }

    const submitTicket = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/create-client-ticket`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, email }),
          }
        );

        const data = await res.json();
        const params = new URLSearchParams({ status: data.status || "error" });
        if (data.company) params.set("company", data.company);
        navigate(`/ticket-submitted?${params.toString()}`, { replace: true });
      } catch {
        setError(true);
        setTimeout(() => {
          navigate("/ticket-submitted?status=error", { replace: true });
        }, 2000);
      }
    };

    submitTicket();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-6">
          {error ? (
            <>
              <p className="text-destructive font-medium">Something went wrong. Redirecting...</p>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h1 className="text-xl font-bold text-foreground">Submitting your request...</h1>
              <p className="text-muted-foreground text-sm">Please wait while we process your support ticket.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketLoading;
