import { useEffect, useState } from "react";
import { Coffee, Timer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const COMPANY_TIMEZONE = "Europe/Sarajevo";
const EXIT_DURATION_MS = 300;

interface BreakPeriod {
  key: "lunch" | "afternoon";
  label: string;
  endSeconds: number;
}

const getSarajevoTime = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: COMPANY_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    weekday: values.weekday,
    seconds: Number(values.hour) * 3600 + Number(values.minute) * 60 + Number(values.second),
  };
};

export const getActiveWorkBreak = (date: Date): BreakPeriod | null => {
  const { weekday, seconds } = getSarajevoTime(date);
  if (weekday === "Sat" || weekday === "Sun") return null;

  if (seconds >= 12 * 3600 && seconds < 13 * 3600) {
    return { key: "lunch", label: "Work Break 1h", endSeconds: 13 * 3600 };
  }

  if (seconds >= 15 * 3600 && seconds < 15 * 3600 + 30 * 60) {
    return { key: "afternoon", label: "Work Break 30min", endSeconds: 15 * 3600 + 30 * 60 };
  }

  return null;
};

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const WorkBreakBanner = () => {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [renderedBreak, setRenderedBreak] = useState<BreakPeriod | null>(() => getActiveWorkBreak(new Date()));
  const [isVisible, setIsVisible] = useState(false);
  const activeBreak = getActiveWorkBreak(now);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeBreak) {
      setRenderedBreak(activeBreak);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setRenderedBreak(null), EXIT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [activeBreak?.key]);

  if (!user || user.role === "client" || !renderedBreak) return null;

  const { seconds } = getSarajevoTime(now);
  const countdown = formatCountdown(renderedBreak.endSeconds - seconds);

  return (
    <div
      className={`relative z-40 overflow-hidden border-b border-primary/20 bg-primary text-primary-foreground shadow-soft-md transition-all duration-300 motion-reduce:transition-none ${
        isVisible ? "max-h-24 translate-y-0 opacity-100" : "max-h-0 -translate-y-full opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-14 max-w-screen-2xl items-center justify-center gap-4 px-4 py-3">
        <Coffee className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="font-heading text-sm font-semibold sm:text-base">{renderedBreak.label}</span>
        <span className="h-5 w-px bg-primary-foreground/30" aria-hidden="true" />
        <span className="inline-flex min-w-[5.5rem] items-center gap-2 font-mono text-sm font-semibold tabular-nums sm:text-base">
          <Timer className="h-4 w-4" aria-hidden="true" />
          {countdown}
        </span>
      </div>
    </div>
  );
};

export default WorkBreakBanner;