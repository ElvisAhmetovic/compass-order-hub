

## Make Sidebar Configuration Global (Admin-Controlled, Applies to All Users)

Currently the sidebar hidden items are stored per-user in localStorage. The user wants admin changes to apply site-wide for all users.

### Approach

Create a Supabase table `sidebar_config` with a single row storing the hidden items array. Admins can update it; all users read from it. Replace the localStorage-based hook with Supabase queries and a realtime subscription so changes propagate instantly.

### Changes

**1. New Supabase table: `sidebar_config`**
```sql
CREATE TABLE public.sidebar_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hidden_items text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.sidebar_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can read sidebar config"
  ON public.sidebar_config FOR SELECT TO authenticated
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update sidebar config"
  ON public.sidebar_config FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insert initial row
INSERT INTO public.sidebar_config (hidden_items) VALUES ('{}');
```

**2. Rewrite `src/hooks/useSidebarConfig.ts`**
- Fetch hidden items from `sidebar_config` table instead of localStorage
- Subscribe to realtime changes on the table so all users see updates instantly
- `toggleItem` performs an UPDATE on the single row (admin only)
- Remove all localStorage logic

**3. Update `src/pages/Settings.tsx`**
- Only show the "Sidebar Navigation" card to admins (since only they can change it)
- Add a note like "These settings apply to all users"

