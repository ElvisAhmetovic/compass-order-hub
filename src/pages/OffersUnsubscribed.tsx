import { useSearchParams } from "react-router-dom";

export default function OffersUnsubscribed() {
  const [params] = useSearchParams();
  const ok = params.get("ok") === "1";
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Media Marketing</h1>
        {ok ? (
          <>
            <p className="text-foreground">Sie erhalten keine weiteren Angebote von uns.</p>
            <p className="text-muted-foreground">You will not receive further offers from us.</p>
          </>
        ) : (
          <>
            <p className="text-foreground">Dieser Link ist ungültig.</p>
            <p className="text-muted-foreground">This link is invalid.</p>
          </>
        )}
      </div>
    </main>
  );
}
