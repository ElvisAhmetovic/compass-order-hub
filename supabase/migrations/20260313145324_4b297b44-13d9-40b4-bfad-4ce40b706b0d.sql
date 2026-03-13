-- =============================================
-- SECURITY HARDENING: Client Portal Isolation
-- =============================================

-- 1. COMMENTS: Block clients from reading/writing internal comments
DROP POLICY IF EXISTS "Authenticated users can view comments" ON comments;
CREATE POLICY "Non-client users can view comments" ON comments
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

DROP POLICY IF EXISTS "Users can insert comments" ON comments;
CREATE POLICY "Non-client users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND NOT public.is_client());

-- 2. NOTIFICATIONS: Prevent clients from crafting notifications to other users
DROP POLICY IF EXISTS "Authenticated can create notifications" ON notifications;
CREATE POLICY "Non-client users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_client());

-- 3. CALENDAR_EVENTS: Internal team calendar
DROP POLICY IF EXISTS "Users can view all calendar events" ON calendar_events;
CREATE POLICY "Non-client users can view calendar events" ON calendar_events
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

-- 4. INVENTORY_ITEMS: Hide buying prices from clients
DROP POLICY IF EXISTS "Users can view inventory items" ON inventory_items;
CREATE POLICY "Non-client users can view all inventory items" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

-- 5. ORDER_AUDIT_LOGS: Internal audit trail
DROP POLICY IF EXISTS "Allow read for authenticated" ON order_audit_logs;
CREATE POLICY "Non-client users can view audit logs" ON order_audit_logs
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

-- 6. MONTHLY_CONTRACTS: Internal contract data
DROP POLICY IF EXISTS "Authenticated users can view monthly contracts" ON monthly_contracts;
CREATE POLICY "Non-client users can view monthly contracts" ON monthly_contracts
  FOR SELECT USING (auth.uid() IS NOT NULL AND NOT public.is_client());

-- 7. MONTHLY_INSTALLMENTS: Internal payment schedules
DROP POLICY IF EXISTS "Authenticated users can view monthly installments" ON monthly_installments;
CREATE POLICY "Non-client users can view monthly installments" ON monthly_installments
  FOR SELECT USING (auth.uid() IS NOT NULL AND NOT public.is_client());

-- 8. NOTIFICATION_SETTINGS: System config
DROP POLICY IF EXISTS "Authenticated users can view notification settings" ON notification_settings;
CREATE POLICY "Non-client users can view notification settings" ON notification_settings
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

-- 9. TEAM_ACTIVITIES: Internal gamification
DROP POLICY IF EXISTS "Users can view all team activities" ON team_activities;
CREATE POLICY "Non-client users can view team activities" ON team_activities
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

-- 10. USER_ACHIEVEMENTS: Internal gamification
DROP POLICY IF EXISTS "Users can view all achievements" ON user_achievements;
CREATE POLICY "Non-client users can view achievements" ON user_achievements
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

-- 11. USER_STREAKS: Internal gamification
DROP POLICY IF EXISTS "Users can view all streaks" ON user_streaks;
CREATE POLICY "Non-client users can view streaks" ON user_streaks
  FOR SELECT USING (auth.role() = 'authenticated' AND NOT public.is_client());

-- 12. PROFILES: Defense-in-depth trigger to prevent role column changes by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.is_admin() THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();