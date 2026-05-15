CREATE OR REPLACE FUNCTION public.wh_admin_bulk_set_lock(p_ids uuid[], p_lock boolean, p_reason text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := coalesce((auth.jwt() ->> 'email')::text, '');
  v_count integer := 0;
  v_old public.work_hours_v2;
  v_row public.work_hours_v2;
  v_id uuid;
BEGIN
  IF NOT public.wh_is_super_admin() THEN
    RAISE EXCEPTION 'Only super admin can perform this action';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  FOREACH v_id IN ARRAY p_ids LOOP
    SELECT * INTO v_old FROM public.work_hours_v2 WHERE id = v_id;
    IF NOT FOUND THEN CONTINUE; END IF;

    UPDATE public.work_hours_v2 SET
      locked = p_lock,
      locked_reason = CASE WHEN p_lock THEN coalesce(locked_reason, p_reason) ELSE NULL END,
      locked_at = CASE WHEN p_lock AND NOT v_old.locked THEN now() WHEN NOT p_lock THEN NULL ELSE locked_at END,
      admin_override_by = v_uid,
      admin_override_at = now(),
      updated_by = v_uid,
      updated_at = now()
    WHERE id = v_id
    RETURNING * INTO v_row;

    INSERT INTO public.work_hours_audit_log(
      work_hours_id, worker_id, worker_email, action,
      changed_by_user_id, changed_by_email, changed_by_role,
      old_values, new_values, reason, source
    ) VALUES (
      v_row.id, v_row.user_id, v_row.worker_email,
      CASE WHEN p_lock THEN 'admin_lock'::wh_audit_action ELSE 'admin_unlock'::wh_audit_action END,
      v_uid, v_email, 'super_admin',
      to_jsonb(v_old), to_jsonb(v_row), p_reason, 'admin_panel_bulk'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$;