import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const formatPrice = (price: number, currency: string) => {
  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ConfirmOffer = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!offerId) {
        setError("Invalid offer link.");
        setLoading(false);
        return;
      }
      try {
        const { data, error: fnError } = await supabase.functions.invoke('confirm-offer', {
          body: { offerId, action: 'fetch' },
        });
        if (fnError) throw fnError;
        if (!data?.offer) throw new Error('Offer not found');

        if (data.offer.confirmed_at) {
          setAlreadyConfirmed(true);
        }
        setOffer(data.offer);
      } catch (err: any) {
        setError(err.message || "Could not load offer details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [offerId]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('confirm-offer', {
        body: { offerId },
      });
      if (fnError) throw fnError;
      if (data?.alreadyConfirmed) {
        setAlreadyConfirmed(true);
        return;
      }
      setConfirmed(true);
      // Redirect after 5 seconds
      setTimeout(() => {
        window.location.href = 'https://gmail.com';
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to confirm offer.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Thank you for confirming!</h1>
          <p className="text-muted-foreground">
            We will contact you shortly via WhatsApp or email.
          </p>
          <p className="text-xs text-muted-foreground">Redirecting in a few seconds…</p>
        </div>
      </div>
    );
  }

  if (alreadyConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Already Confirmed</h1>
          <p className="text-muted-foreground">
            This offer has already been confirmed. We will be in touch shortly!
          </p>
        </div>
      </div>
    );
  }

  const initial = (offer?.client_name || 'C').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-primary">AB Media Team</h2>
          <div className="text-4xl text-yellow-400 tracking-widest">★★★★★</div>
          <h1 className="text-2xl font-semibold text-foreground">Confirm Your Order</h1>
        </div>

        {/* Offer Details Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold shrink-0">
              {initial}
            </div>
            <div className="space-y-1 flex-1">
              <div className="font-semibold text-card-foreground text-lg">{offer?.client_name}</div>
              <div className="text-sm text-muted-foreground">📧 {offer?.client_email}</div>
              {offer?.client_phone && (
                <div className="text-sm text-muted-foreground">📞 {offer?.client_phone}</div>
              )}
              {offer?.client_address && (
                <div className="text-sm text-muted-foreground">📍 {offer?.client_address}</div>
              )}
              <div className="text-xl font-bold text-primary mt-2">
                Price: {formatPrice(offer?.price || 0, offer?.currency || 'EUR')}
              </div>
              {offer?.description && (
                <div className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                  {offer.description}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          size="lg"
          className="w-full text-lg h-14"
          onClick={handleConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Confirming…
            </>
          ) : (
            "Confirm Your Order with AB Media Team"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By confirming, you agree to proceed with the services outlined above.
        </p>
      </div>
    </div>
  );
};

export default ConfirmOffer;
