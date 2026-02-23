import { useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TicketSubmitted = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "success";
  const company = searchParams.get("company") || "";

  const config = {
    success: {
      icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
      title: "Ticket Submitted Successfully",
      message: company
        ? `Your support request for ${decodeURIComponent(company)} has been received.`
        : "Your support request has been received.",
      sub: "Our team has been notified and will contact you shortly.",
    },
    duplicate: {
      icon: <ClipboardList className="h-16 w-16 text-muted-foreground" />,
      title: "Ticket Already Submitted",
      message: "You have already submitted a support request for this order recently.",
      sub: "Our team has been notified and will contact you shortly.",
    },
    error: {
      icon: <AlertCircle className="h-16 w-16 text-destructive" />,
      title: "Something Went Wrong",
      message: "We couldn't process your support request at this time.",
      sub: "Please try again later or contact us directly.",
    },
  }[status] || {
    icon: <AlertCircle className="h-16 w-16 text-destructive" />,
    title: "Invalid Request",
    message: "This page was accessed incorrectly.",
    sub: "Please use the link from your email to submit a ticket.",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-4">
          {config.icon}
          <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          <p className="text-muted-foreground">{config.message}</p>
          <p className="text-sm text-muted-foreground">{config.sub}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketSubmitted;
