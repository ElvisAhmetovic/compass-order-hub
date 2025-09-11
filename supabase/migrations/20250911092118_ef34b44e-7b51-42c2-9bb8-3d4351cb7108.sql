-- Add missing DELETE policy for ticket attachments storage

CREATE POLICY "Users can delete attachments from their tickets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ticket-attachments' AND 
  (
    -- Users can delete attachments from tickets they created
    (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM tech_support_tickets t WHERE t.created_by = auth.uid()
    ) 
    OR
    -- Admins and agents can delete any ticket attachments
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = ANY(ARRAY['admin', 'agent'])
    )
  )
);