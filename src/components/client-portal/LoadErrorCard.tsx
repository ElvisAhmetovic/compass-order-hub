import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/ClientLanguageContext";

interface Props { onRetry: () => void; message?: string; compact?: boolean }

/** Shown when portal data could not be loaded — never an empty list. */
const LoadErrorCard = ({ onRetry, message, compact }: Props) => {
  const { t } = useLanguage();
  const body = (
    <div className={`flex flex-col items-center text-center gap-3 ${compact ? "py-4" : "py-10"}`} role="alert">
      <AlertTriangle className={compact ? "h-6 w-6 text-destructive" : "h-10 w-10 text-destructive"} />
      <div>
        <p className="font-medium text-foreground">{message || t("common.loadFailed")}</p>
        <p className="text-sm text-muted-foreground">{t("common.loadFailedDesc")}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />{t("common.retry")}
      </Button>
    </div>
  );
  if (compact) return body;
  return <Card className="border-destructive/40"><CardContent>{body}</CardContent></Card>;
};

export default LoadErrorCard;
