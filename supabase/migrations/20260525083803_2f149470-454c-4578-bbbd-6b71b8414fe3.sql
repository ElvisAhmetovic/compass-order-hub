UPDATE public.notification_settings
SET recipient_emails = array_append(recipient_emails, 'Ikram@team-abmedia.com'),
    updated_at = now()
WHERE NOT ('Ikram@team-abmedia.com' = ANY(recipient_emails));