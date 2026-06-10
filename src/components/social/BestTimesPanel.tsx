import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, TrendingUp } from "lucide-react";
import {
  BestTimeRow,
  SocialPlatform,
  computeBestHoursFromData,
  listBestTimes,
} from "@/services/socialChecklistService";

interface Props {
  platform: SocialPlatform;
  platformLabel: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatHour = (h: number) => `${h.toString().padStart(2, "0")}:00`;

const BestTimesPanel = ({ platform, platformLabel }: Props) => {
  const [defaults, setDefaults] = useState<BestTimeRow[]>([]);
  const [computed, setComputed] = useState<{ hour: number; avgEngagement: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [rows, hours] = await Promise.all([
          listBestTimes(platform),
          computeBestHoursFromData(platform),
        ]);
        if (!mounted) return;
        setDefaults(rows);
        setComputed(hours.slice(0, 5));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [platform]);

  const grouped = new Map<number, number[]>();
  for (const r of defaults) {
    const arr = grouped.get(r.day_of_week) ?? [];
    arr.push(r.hour);
    grouped.set(r.day_of_week, arr.sort((a, b) => a - b));
  }

  return (
    <Card className="p-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-4 h-4 text-primary" />
          Best times to post — {platformLabel}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Local time. Defaults are industry rules of thumb; computed hours are from your past 90 days of performance data.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Recommended windows
        </div>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : grouped.size === 0 ? (
          <div className="text-xs text-muted-foreground">No defaults configured.</div>
        ) : (
          <div className="space-y-1">
            {Array.from({ length: 7 }, (_, day) => grouped.get(day) ?? []).map((hours, day) => (
              hours.length === 0 ? null : (
                <div key={day} className="flex items-start gap-2 text-sm">
                  <span className="w-10 text-muted-foreground font-medium">{DAYS[day]}</span>
                  <div className="flex flex-wrap gap-1">
                    {hours.map((h) => (
                      <Badge key={h} variant="secondary" className="text-xs">{formatHour(h)}</Badge>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Your top hours (last 90d)
        </div>
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : computed.length === 0 ? (
          <div className="text-xs text-muted-foreground">Add engagement numbers to completed items to see this.</div>
        ) : (
          <div className="space-y-1">
            {computed.map((c) => (
              <div key={c.hour} className="flex items-center justify-between text-sm">
                <span>{formatHour(c.hour)}</span>
                <span className="text-xs text-muted-foreground">
                  avg {c.avgEngagement.toFixed(1)} · {c.count} post{c.count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BestTimesPanel;
