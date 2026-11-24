export type TraceItem = { tool: string; args: Record<string, unknown>; result: string };
export type MessageParts = { trace?: TraceItem[]; actions?: string[] };
export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; parts: MessageParts };

/** Converts a stored row into a chat message; tolerates missing/old parts. */
export function toChatMessage(row: { id: string; role: string; content: string; parts: unknown }): ChatMessage {
  const p = (row.parts && typeof row.parts === "object" && !Array.isArray(row.parts) ? row.parts : {}) as MessageParts;
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    content: row.content ?? "",
    parts: { trace: Array.isArray(p.trace) ? p.trace : [], actions: Array.isArray(p.actions) ? p.actions : [] },
  };
}

export const assistantPath = (threadId?: string) => (threadId ? `/assistant/${threadId}` : "/assistant");
