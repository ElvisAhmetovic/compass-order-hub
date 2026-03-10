import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type VatMode = "7" | "19" | "custom";

const VatCalculator = () => {
  const [grossAmount, setGrossAmount] = useState<string>("");
  const [vatMode, setVatMode] = useState<VatMode>("19");
  const [customVat, setCustomVat] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const vatPercent =
    vatMode === "7" ? 7 : vatMode === "19" ? 19 : parseFloat(customVat) || 0;
  const gross = parseFloat(grossAmount) || 0;
  const net = gross / (1 + vatPercent / 100);
  const vatAmount = gross - net;

  const copyToClipboard = (value: number, field: string) => {
    navigator.clipboard.writeText(value.toFixed(2));
    setCopiedField(field);
    toast.success("Copied!");
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator size={18} />
          Netto / Brutto Rechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Net amount input */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Bruttobetrag (€)
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={grossAmount}
            onChange={(e) => setGrossAmount(e.target.value)}
            step="0.01"
          />
        </div>

        {/* VAT rate selector */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            MwSt-Satz
          </label>
          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={vatMode === "7" ? "default" : "outline"}
              onClick={() => setVatMode("7")}
              className="flex-1"
            >
              7%
            </Button>
            <Button
              type="button"
              size="sm"
              variant={vatMode === "19" ? "default" : "outline"}
              onClick={() => setVatMode("19")}
              className="flex-1"
            >
              19%
            </Button>
            <Button
              type="button"
              size="sm"
              variant={vatMode === "custom" ? "default" : "outline"}
              onClick={() => setVatMode("custom")}
              className="flex-1"
            >
              Individuell
            </Button>
          </div>
          {vatMode === "custom" && (
            <Input
              type="number"
              placeholder="z.B. 21"
              value={customVat}
              onChange={(e) => setCustomVat(e.target.value)}
              step="1"
              className="mt-2"
            />
          )}
        </div>

        {/* Results */}
        {net > 0 && (
          <div className="rounded-md border bg-muted/50 p-3 space-y-2">
            <ResultRow
              label="Netto"
              value={net}
              field="netto"
              copiedField={copiedField}
              onCopy={copyToClipboard}
            />
            <ResultRow
              label={`MwSt (${vatPercent}%)`}
              value={vatAmount}
              field="mwst"
              copiedField={copiedField}
              onCopy={copyToClipboard}
            />
            <div className="border-t pt-2">
              <ResultRow
                label="Brutto"
                value={grossAmount}
                field="brutto"
                copiedField={copiedField}
                onCopy={copyToClipboard}
                bold
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ResultRow = ({
  label,
  value,
  field,
  copiedField,
  onCopy,
  bold,
}: {
  label: string;
  value: number;
  field: string;
  copiedField: string | null;
  onCopy: (value: number, field: string) => void;
  bold?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className={`text-sm ${bold ? "font-bold" : "text-muted-foreground"}`}>
      {label}
    </span>
    <div className="flex items-center gap-1.5">
      <span className={`text-sm tabular-nums ${bold ? "font-bold" : ""}`}>
        €{value.toFixed(2)}
      </span>
      <button
        type="button"
        onClick={() => onCopy(value, field)}
        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        {copiedField === field ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  </div>
);

export default VatCalculator;
