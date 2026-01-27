import { ClientOrder } from "@/services/clientOrderService";

export interface ClientStatusConfig {
  label: string;
  emoji: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'action';
  badgeClassName?: string;
  progress: number;
  requiresAction?: boolean;
}

// Translation map: Internal Status -> Client-Friendly Display
const STATUS_TRANSLATION_MAP: Record<string, ClientStatusConfig> = {
  // Standard statuses
  "Created": { 
    label: "Order Received", 
    emoji: "📋", 
    badgeVariant: "secondary",
    progress: 10 
  },
  "In Progress": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 40 
  },
  "Invoice Sent": { 
    label: "Invoice Sent", 
    emoji: "📄", 
    badgeVariant: "outline",
    progress: 60 
  },
  "Invoice Paid": { 
    label: "Payment Received", 
    emoji: "✅", 
    badgeVariant: "default",
    progress: 80 
  },
  "Resolved": { 
    label: "Completed", 
    emoji: "🎉", 
    badgeVariant: "default",
    badgeClassName: "bg-green-500 hover:bg-green-600 text-white",
    progress: 100 
  },
  "Cancelled": { 
    label: "Cancelled", 
    emoji: "❌", 
    badgeVariant: "destructive",
    progress: 0 
  },
  
  // Extended technical statuses
  "Dev-Backend": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 35 
  },
  "Dev-Sprint": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 45 
  },
  "QA": { 
    label: "Quality Review", 
    emoji: "🔍", 
    badgeVariant: "secondary",
    progress: 70 
  },
  "Briefing": { 
    label: "Getting Started", 
    emoji: "📝", 
    badgeVariant: "secondary",
    progress: 15 
  },
  "Awaiting-Client-Feedback": { 
    label: "Action Required", 
    emoji: "🕒", 
    badgeVariant: "action",
    badgeClassName: "bg-red-500 hover:bg-red-600 text-white",
    progress: 50,
    requiresAction: true 
  },
  "Review": { 
    label: "Under Review", 
    emoji: "👀", 
    badgeVariant: "secondary",
    progress: 55 
  },
  "Complaint": { 
    label: "Under Review", 
    emoji: "👀", 
    badgeVariant: "secondary",
    progress: 50 
  },
  
  // Social media statuses (mapped to In Progress for clients)
  "Facebook": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 50 
  },
  "Instagram": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 50 
  },
  "Trustpilot": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 50 
  },
  "Trustpilot Deletion": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 50 
  },
  "Google Deletion": { 
    label: "In Progress", 
    emoji: "🏗️", 
    badgeVariant: "default",
    progress: 50 
  },
};

// Default fallback for unknown statuses
const DEFAULT_STATUS: ClientStatusConfig = {
  label: "Processing",
  emoji: "⏳",
  badgeVariant: "secondary",
  progress: 25
};

/**
 * Get translated status config from an internal status string
 */
export function getClientStatus(internalStatus: string): ClientStatusConfig {
  return STATUS_TRANSLATION_MAP[internalStatus] || {
    ...DEFAULT_STATUS,
    label: internalStatus // Show raw status if no mapping exists
  };
}

/**
 * Get translated status from order with boolean flags
 * Priority order determines which status to show
 */
export function getClientStatusFromOrder(order: ClientOrder): ClientStatusConfig {
  // Check in order of priority (most important first)
  if (order.status_cancelled) return STATUS_TRANSLATION_MAP["Cancelled"];
  if (order.status_resolved) return STATUS_TRANSLATION_MAP["Resolved"];
  if (order.status_invoice_paid) return STATUS_TRANSLATION_MAP["Invoice Paid"];
  if (order.status_invoice_sent) return STATUS_TRANSLATION_MAP["Invoice Sent"];
  if (order.status_in_progress) return STATUS_TRANSLATION_MAP["In Progress"];
  if (order.status_created) return STATUS_TRANSLATION_MAP["Created"];
  
  // Fallback: try to use the raw status field
  if (order.status) {
    return getClientStatus(order.status);
  }
  
  return DEFAULT_STATUS;
}

/**
 * Get just the display label with optional emoji
 */
export function getClientStatusLabel(internalStatus: string, includeEmoji: boolean = true): string {
  const config = getClientStatus(internalStatus);
  return includeEmoji ? `${config.emoji} ${config.label}` : config.label;
}

/**
 * Check if a status requires client action
 */
export function statusRequiresAction(internalStatus: string): boolean {
  const config = getClientStatus(internalStatus);
  return config.requiresAction === true;
}

/**
 * Get translated status step for timeline display
 */
export function getClientStatusStep(
  stepKey: string, 
  isActive: boolean
): { key: string; label: string; emoji: string; active: boolean } {
  const stepMap: Record<string, { label: string; emoji: string }> = {
    "created": { label: "Order Received", emoji: "📋" },
    "in_progress": { label: "In Progress", emoji: "🏗️" },
    "invoice_sent": { label: "Invoice Sent", emoji: "📄" },
    "invoice_paid": { label: "Payment Received", emoji: "✅" },
    "resolved": { label: "Completed", emoji: "🎉" },
    "cancelled": { label: "Cancelled", emoji: "❌" },
  };
  
  const step = stepMap[stepKey] || { label: stepKey, emoji: "📌" };
  
  return {
    key: stepKey,
    label: step.label,
    emoji: step.emoji,
    active: isActive
  };
}
