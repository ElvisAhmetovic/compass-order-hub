import { useState } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Step = { title: string; sub: string };
const Row = ({ steps }: { steps: Step[] }) => (
  <div className="flex flex-wrap items-stretch gap-2">
    {steps.map((s, i) => (
      <div key={s.title} className="flex items-center gap-2">
        <div className="min-w-[140px] max-w-[190px] rounded-md border bg-muted/40 px-3 py-2">
          <p className="text-sm font-medium">{s.title}</p>
          <p className="text-xs text-muted-foreground">{s.sub}</p>
        </div>
        {i < steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
    ))}
  </div>
);

/** End-to-end picture of the offer, reply and answer paths. */
export default function OutreachFlowDiagram() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        How outreach works
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <CardContent className="space-y-4 pt-0">
          <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">1 · Offer</p>
            <Row steps={[
              { title: "AI draft", sub: "Client inactive 3+ months, no unpaid invoices" },
              { title: "Pending", sub: "Waits for a team member" },
              { title: "Approve & send", sub: "Weekdays 9–17" },
              { title: "Offer sent", sub: "From office@mediaamarketing.com, replies go to the app" },
            ]} /></div>
          <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">2 · Reply</p>
            <Row steps={[
              { title: "Client replies", sub: "Presses Reply on the offer" },
              { title: "Replies tab", sub: "With business name, linked to the offer" },
              { title: "Ticket opened", sub: "Not for newsletters" },
              { title: "Copy to approver", sub: "Forwarded to their login email" },
            ]} /></div>
          <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">3 · Answer</p>
            <Row steps={[
              { title: "Answer in the app", sub: "Sent from office@, saved in the thread" },
              { title: "or from own email", sub: "Reply to the forwarded copy; copied into the thread" },
              { title: "Client profile", sub: "Whole conversation in history" },
            ]} /></div>
          <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Office inbox</p>
            <Row steps={[
              { title: "Mail to office@", sub: "Stays in Gmail" },
              { title: "Gmail forward", sub: "Copy sent to the app" },
              { title: "Replies → Office inbox", sub: "No forwarding, no auto follow-up" },
            ]} /></div>
        </CardContent>
      )}
    </Card>
  );
}
