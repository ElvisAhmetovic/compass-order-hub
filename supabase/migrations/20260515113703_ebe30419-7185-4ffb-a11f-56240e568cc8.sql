
-- =====================================================================
-- Secure Work Hours v2
-- =====================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.wh_status AS ENUM ('submitted','not_submitted','not_worked','admin_override');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wh_audit_action AS ENUM ('created','updated','locked','auto_marked_zero','admin_override','admin_unlock','admin_correction');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wh_audit_source AS ENUM ('worker_form','admin_panel','auto_lock_job','api');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.work_hours_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  worker_email text,
  work_date date NOT NULL,
  start_time time,
  end_time time,
  break_minutes integer DEFAULT 0,
  total_hours numeric(5,2) NOT NULL DEFAULT 0,
  status public.wh_status NOT NULL DEFAULT 'submitted',
  locked boolean NOT NULL DEFAULT false,
  locked_reason text,
  locked_at timestamptz,
  submitted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  admin_override_by uuid,
  admin_override_at timestamptz,
  admin_note text,
  worker_note text,
  CONSTRAINT work_hours_v2_user_date_unique UNIQUE (user_id, work_date),
  CONSTRAINT work_hours_v2_hours_range CHECK (total_hours >= 0 AND total_hours <= 24),
  CONSTRAINT work_hours_v2_break_nonneg CHECK (break_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS work_hours_v2_user_date_idx ON public.work_hours_v2(user_id, work_date DESC);
CREATE INDEX IF NOT EXISTS work_hours_v2_date_idx ON public.work_hours_v2(work_date DESC);

CREATE TABLE IF NOT EXISTS public.work_hours_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_hours_id uuid,
  worker_id uuid,
  worker_email text,
  action public.wh_audit_action NOT NULL,
  changed_by_user_id uuid,
  changed_by_email text,
  changed_by_role text,
  old_values jsonb,
  new_values jsonb,
  reason text,
  source public.wh_audit_source NOT NULL DEFAULT 'api',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wh_audit_wh_idx ON public.work_hours_audit_log(work_hours_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wh_audit_worker_idx ON public.work_hours_audit_log(worker_id, created_at DESC);

-- RLS
ALTER TABLE public.work_hours_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_hours_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: super admin (server-side email check)
CREATE OR REPLACE FUNCTION public.wh_is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email')::text, '')) = 'luciferbebistar@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.wh_company_now()
RETURNS timestamptz LANGUAGE sql STABLE AS $$
  SELECT now();
$$;

CREATE OR REPLACE FUNCTION public.wh_company_today()
RETURNS date LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Europe/Sarajevo')::date;
$$;

CREATE OR REPLACE FUNCTION public.wh_before_deadline()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Europe/Sarajevo')::time < time '12:00:00';
$$;

-- Drop existing policies if re-run
DROP POLICY IF EXISTS wh_v2_select_self_or_admin ON public.work_hours_v2;
DROP POLICY IF EXISTS wh_v2_no_client_writes ON public.work_hours_v2;
DROP POLICY IF EXISTS wh_v2_admin_delete ON public.work_hours_v2;
DROP POLICY IF EXISTS wh_audit_select_self_or_admin ON public.work_hours_audit_log;

-- SELECT: own rows or super admin
CREATE POLICY wh_v2_select_self_or_admin ON public.work_hours_v2
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.wh_is_super_admin());

-- Block direct INSERT/UPDATE from clients (no policy = denied under RLS)
-- DELETE only super admin
CREATE POLICY wh_v2_admin_delete ON public.work_hours_v2
FOR DELETE TO authenticated
USING (public.wh_is_super_admin());

-- Audit: workers see own, super admin sees all
CREATE POLICY wh_audit_select_self_or_admin ON public.work_hours_audit_log
FOR SELECT TO authenticated
USING (worker_id = auth.uid() OR public.wh_is_super_admin());

-- Revoke client write privileges (RLS already blocks, but be explicit)
REVOKE INSERT, UPDATE, DELETE ON public.work_hours_audit_log FROM anon, authenticated;

-- =====================================================================
-- RPCs
-- =====================================================================

CREATE OR REPLACE FUNCTION public.wh_submit(
  p_total_hours numeric,
  p_start_time time DEFAULT NULL,
  p_end_time time DEFAULT NULL,
  p_break_minutes integer DEFAULT 0,
  p_worker_note text DEFAULT NULL
) RETURNS public.work_hours_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := coalesce((auth.jwt() ->> 'email')::text, '');
  v_today date := public.wh_company_today();
  v_existing public.work_hours_v2;
  v_row public.work_hours_v2;
  v_old jsonb;
  v_new jsonb;
  v_action public.wh_audit_action;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF p_total_hours IS NULL OR p_total_hours < 0 OR p_total_hours > 24 THEN
    RAISE EXCEPTION 'Total hours must be between 0 and 24';
  END IF;
  IF p_break_minutes IS NULL THEN p_break_minutes := 0; END IF;
  IF p_break_minutes < 0 THEN RAISE EXCEPTION 'Break minutes cannot be negative'; END IF;
  IF p_start_time IS NOT NULL AND p_end_time IS NOT NULL AND p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;
  IF p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
    IF (EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60) < p_break_minutes THEN
      RAISE EXCEPTION 'Break cannot exceed worked time';
    END IF;
  END IF;

  -- Deadline (super admin bypasses)
  IF NOT public.wh_is_super_admin() AND NOT public.wh_before_deadline() THEN
    RAISE EXCEPTION 'Submission deadline (12:00) has passed for today. Contact admin.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_existing FROM public.work_hours_v2
   WHERE user_id = v_uid AND work_date = v_today;

  IF FOUND THEN
    IF v_existing.locked AND NOT public.wh_is_super_admin() THEN
      RAISE EXCEPTION 'This day is locked. Contact admin.' USING ERRCODE = 'P0001';
    END IF;

    v_old := to_jsonb(v_existing);

    UPDATE public.work_hours_v2 SET
      start_time = p_start_time,
      end_time = p_end_time,
      break_minutes = p_break_minutes,
      total_hours = p_total_hours,
      worker_note = p_worker_note,
      status = CASE WHEN public.wh_is_super_admin() AND v_existing.locked THEN 'admin_override'::wh_status ELSE 'submitted'::wh_status END,
      locked = CASE WHEN public.wh_is_super_admin() THEN false ELSE v_existing.locked END,
      submitted_at = now(),
      updated_by = v_uid,
      updated_at = now(),
      worker_email = coalesce(worker_email, v_email)
    WHERE id = v_existing.id
    RETURNING * INTO v_row;

    v_action := 'updated';
  ELSE
    INSERT INTO public.work_hours_v2(
      user_id, worker_email, work_date, start_time, end_time, break_minutes,
      total_hours, status, submitted_at, created_by, updated_by, worker_note
    ) VALUES (
      v_uid, v_email, v_today, p_start_time, p_end_time, p_break_minutes,
      p_total_hours, 'submitted', now(), v_uid, v_uid, p_worker_note
    ) RETURNING * INTO v_row;

    v_old := NULL;
    v_action := 'created';
  END IF;

  v_new := to_jsonb(v_row);

  INSERT INTO public.work_hours_audit_log(
    work_hours_id, worker_id, worker_email, action,
    changed_by_user_id, changed_by_email, changed_by_role,
    old_values, new_values, source
  ) VALUES (
    v_row.id, v_row.user_id, v_row.worker_email, v_action,
    v_uid, v_email,
    CASE WHEN public.wh_is_super_admin() THEN 'super_admin' ELSE 'worker' END,
    v_old, v_new, 'worker_form'
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.wh_admin_upsert(
  p_user_id uuid,
  p_work_date date,
  p_total_hours numeric,
  p_start_time time DEFAULT NULL,
  p_end_time time DEFAULT NULL,
  p_break_minutes integer DEFAULT 0,
  p_status public.wh_status DEFAULT 'admin_override',
  p_locked boolean DEFAULT false,
  p_admin_note text DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS public.work_hours_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := coalesce((auth.jwt() ->> 'email')::text, '');
  v_existing public.work_hours_v2;
  v_row public.work_hours_v2;
  v_target_email text;
  v_old jsonb;
  v_new jsonb;
  v_action public.wh_audit_action;
BEGIN
  IF NOT public.wh_is_super_admin() THEN
    RAISE EXCEPTION 'Only super admin can perform this action';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'A reason is required for admin changes';
  END IF;
  IF p_total_hours < 0 OR p_total_hours > 24 THEN
    RAISE EXCEPTION 'Total hours must be 0..24';
  END IF;

  SELECT email INTO v_target_email FROM auth.users WHERE id = p_user_id;

  SELECT * INTO v_existing FROM public.work_hours_v2
   WHERE user_id = p_user_id AND work_date = p_work_date;

  IF FOUND THEN
    v_old := to_jsonb(v_existing);
    UPDATE public.work_hours_v2 SET
      start_time = p_start_time,
      end_time = p_end_time,
      break_minutes = coalesce(p_break_minutes, 0),
      total_hours = p_total_hours,
      status = p_status,
      locked = p_locked,
      locked_reason = CASE WHEN p_locked THEN coalesce(locked_reason, p_reason) ELSE NULL END,
      locked_at = CASE WHEN p_locked AND NOT v_existing.locked THEN now() ELSE locked_at END,
      admin_override_by = v_uid,
      admin_override_at = now(),
      admin_note = p_admin_note,
      updated_by = v_uid,
      updated_at = now(),
      worker_email = coalesce(worker_email, v_target_email)
    WHERE id = v_existing.id
    RETURNING * INTO v_row;
    v_action := CASE WHEN v_existing.locked OR v_existing.work_date < public.wh_company_today() THEN 'admin_override' ELSE 'admin_correction' END;
  ELSE
    INSERT INTO public.work_hours_v2(
      user_id, worker_email, work_date, start_time, end_time, break_minutes,
      total_hours, status, locked, locked_reason, locked_at,
      admin_override_by, admin_override_at, admin_note,
      created_by, updated_by, submitted_at
    ) VALUES (
      p_user_id, v_target_email, p_work_date, p_start_time, p_end_time, coalesce(p_break_minutes,0),
      p_total_hours, p_status, p_locked,
      CASE WHEN p_locked THEN p_reason END,
      CASE WHEN p_locked THEN now() END,
      v_uid, now(), p_admin_note,
      v_uid, v_uid, now()
    ) RETURNING * INTO v_row;
    v_action := 'admin_correction';
  END IF;

  v_new := to_jsonb(v_row);

  INSERT INTO public.work_hours_audit_log(
    work_hours_id, worker_id, worker_email, action,
    changed_by_user_id, changed_by_email, changed_by_role,
    old_values, new_values, reason, source
  ) VALUES (
    v_row.id, v_row.user_id, v_row.worker_email, v_action,
    v_uid, v_email, 'super_admin',
    v_old, v_new, p_reason, 'admin_panel'
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.wh_admin_unlock(
  p_id uuid,
  p_reason text
) RETURNS public.work_hours_v2
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := coalesce((auth.jwt() ->> 'email')::text, '');
  v_old public.work_hours_v2;
  v_row public.work_hours_v2;
BEGIN
  IF NOT public.wh_is_super_admin() THEN
    RAISE EXCEPTION 'Only super admin can unlock entries';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;
  SELECT * INTO v_old FROM public.work_hours_v2 WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Entry not found'; END IF;

  UPDATE public.work_hours_v2 SET
    locked = false,
    locked_reason = NULL,
    locked_at = NULL,
    admin_override_by = v_uid,
    admin_override_at = now(),
    updated_by = v_uid,
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  INSERT INTO public.work_hours_audit_log(
    work_hours_id, worker_id, worker_email, action,
    changed_by_user_id, changed_by_email, changed_by_role,
    old_values, new_values, reason, source
  ) VALUES (
    v_row.id, v_row.user_id, v_row.worker_email, 'admin_unlock',
    v_uid, v_email, 'super_admin',
    to_jsonb(v_old), to_jsonb(v_row), p_reason, 'admin_panel'
  );

  RETURN v_row;
END;
$$;

-- Idempotent auto-lock for today (Sarajevo)
CREATE OR REPLACE FUNCTION public.wh_auto_lock_today()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_today date := public.wh_company_today();
  v_now_time time := (now() AT TIME ZONE 'Europe/Sarajevo')::time;
  v_count integer := 0;
  r record;
  v_inserted public.work_hours_v2;
BEGIN
  -- Only after 12:00 Sarajevo
  IF v_now_time < time '12:00:00' THEN RETURN 0; END IF;

  FOR r IN
    SELECT p.id AS user_id, u.email
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.role IN ('admin','agent')
      AND NOT EXISTS (
        SELECT 1 FROM public.work_hours_v2 w
        WHERE w.user_id = p.id AND w.work_date = v_today
      )
  LOOP
    INSERT INTO public.work_hours_v2(
      user_id, worker_email, work_date, total_hours, status,
      locked, locked_reason, locked_at, created_by, updated_by
    ) VALUES (
      r.user_id, r.email, v_today, 0, 'not_submitted',
      true, 'Missed 12:00 submission deadline', now(), NULL, NULL
    )
    ON CONFLICT (user_id, work_date) DO NOTHING
    RETURNING * INTO v_inserted;

    IF v_inserted.id IS NOT NULL THEN
      INSERT INTO public.work_hours_audit_log(
        work_hours_id, worker_id, worker_email, action,
        changed_by_user_id, changed_by_email, changed_by_role,
        old_values, new_values, reason, source
      ) VALUES (
        v_inserted.id, v_inserted.user_id, v_inserted.worker_email, 'auto_marked_zero',
        NULL, 'system', 'system',
        NULL, to_jsonb(v_inserted),
        'Missed 12:00 submission deadline', 'auto_lock_job'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wh_submit(numeric, time, time, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wh_admin_upsert(uuid, date, numeric, time, time, integer, public.wh_status, boolean, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wh_admin_unlock(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wh_auto_lock_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.wh_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.wh_before_deadline() TO authenticated;
GRANT EXECUTE ON FUNCTION public.wh_company_today() TO authenticated;
