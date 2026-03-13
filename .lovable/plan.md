

## Filter Client Portal Notifications

### Problem
The `NotificationCenter` component is shared between admin and client portals. It fetches **all** notifications for the user without filtering by relevance. Clients can see internal team notifications (chat messages, workflow alerts, etc.) that should only be visible to staff.

### Solution
Create a dedicated `ClientNotificationCenter` component for the client portal that only shows notifications with `action_url` starting with `/client/`. This keeps the existing `NotificationCenter` unchanged for staff while giving clients a scoped view.

### Changes

**1. `src/services/notificationService.ts`** — Add a `getClientNotifications` method that filters to only client-relevant notifications:
```ts
static async getClientNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .like('action_url', '/client/%')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}
```

**2. `src/components/client-portal/ClientNotificationCenter.tsx`** — New component, a trimmed copy of `NotificationCenter` that uses `getClientNotifications` instead of `getNotifications`. Same UI, just scoped data.

**3. `src/components/client-portal/ClientHeader.tsx`** — Replace `NotificationCenter` import with `ClientNotificationCenter`.

### Files
- `src/services/notificationService.ts` — add filtered query method
- `src/components/client-portal/ClientNotificationCenter.tsx` — new component
- `src/components/client-portal/ClientHeader.tsx` — swap component

