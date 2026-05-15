CREATE OR REPLACE FUNCTION public.wh_submit(
  p_total_hours numeric,
  p_start_time time without time zone DEFAULT NULL,
  p_end_time time without time zone DEFAULT NULL,
  p_break_minutes integer DEFAULT 0,
  p_worker_note text DEFAULT NULL
)
RETURNS public.work_hours_v2
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := coalesce((auth.jwt() ->> 'email')::text, '');
  v_today date := public.wh_company_today();
  v_existing public.work_hours_v2;
  v_row public.work_hours_v2;
  v_old jsonb;
  v_new jsonb;
  v_action public.wh_audit_action;
  v_is_super boolean := public.wh_is_super_admin();
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

  IF NOT v_is_super AND NOT public.wh_before_deadline() THEN
    RAISE EXCEPTION 'Submission deadline (12:00) has passed for today. Contact admin.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_existing FROM public.work_hours_v2
   WHERE user_id = v_uid AND work_date = v_today;

  IF FOUND THEN
    IF v_existing.locked AND NOT v_is_super THEN
      RAISE EXCEPTION 'This day is locked. Contact admin.' USING ERRCODE = 'P0001';
    END IF;

    v_old := to_jsonb(v_existing);

    UPDATE public.work_hours_v2 SET
      start_time = p_start_time,
      end_time = p_end_time,
      break_minutes = p_break_minutes,
      total_hours = p_total_hours,
      worker_note = p_worker_note,
      status = CASE WHEN v_is_super AND v_existing.locked THEN 'admin_override'::wh_status ELSE 'submitted'::wh_status END,
      locked = true,
      locked_reason = CASE WHEN v_is_super THEN coalesce(v_existing.locked_reason, 'Submitted (admin)') ELSE 'Submitted by worker' END,
      locked_at = coalesce(v_existing.locked_at, now()),
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
      total_hours, status, locked, locked_reason, locked_at,
      submitted_at, created_by, updated_by, worker_note
    ) VALUES (
      v_uid, v_email, v_today, p_start_time, p_end_time, p_break_minutes,
      p_total_hours, 'submitted', true, 'Submitted by worker', now(),
      now(), v_uid, v_uid, p_worker_note
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
    CASE WHEN v_is_super THEN 'super_admin' ELSE 'worker' END,
    v_old, v_new, 'worker_form'
  );

  RETURN v_row;
END;
$function$;