import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const TemporaryNotificationBanner = () => {
  // Set expiry to October 10, 2025
  const EXPIRY_DATE = new Date("2025-10-10T00:00:00Z").getTime();

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if notification is still valid (not expired)
    const now = Date.now();
    if (now > EXPIRY_DATE) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-4xl">
        <Alert variant="warning" className="relative pr-12">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold mb-2">
            Privremeni tehnički problem
          </AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            Želim vas obavijestiti o privremenom prekidu u radu kritične funkcije na Empriji.
            <br /><br />
            Zbog tehničkog problema s funkcijom "resend" (ponovno slanje) na našoj web stranici EmpriaDental, 
            sve automatizirane obavijesti i mailovi koji se šalju s naše domene (potvrde, podsjetnici, 
            obavijesti korisnicima, itd.) bit će obustavljeni do daljnjeg.
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleDismiss}
            aria-label="Zatvori obavijest"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      </div>
    </div>
  );
};

export default TemporaryNotificationBanner;
