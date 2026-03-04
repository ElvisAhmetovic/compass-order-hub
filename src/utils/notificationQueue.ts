import { supabase } from "@/integrations/supabase/client";

interface QueueItem {
  functionName: string;
  body: Record<string, unknown>;
}

const queue: QueueItem[] = [];
let processing = false;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;

    try {
      await supabase.functions.invoke(item.functionName, { body: item.body });
    } catch (err) {
      console.error(`Notification queue: failed to invoke ${item.functionName}`, err);
    }

    // Wait 8 seconds between calls so the previous batch of emails finishes
    if (queue.length > 0) {
      await delay(8000);
    }
  }

  processing = false;
}

/**
 * Enqueue an edge function call. Calls are serialized with an 8-second gap
 * between invocations to avoid hitting Resend rate limits when multiple
 * toggles are clicked in rapid succession.
 */
export function enqueueNotification(functionName: string, body: Record<string, unknown>) {
  queue.push({ functionName, body });
  processQueue();
}
