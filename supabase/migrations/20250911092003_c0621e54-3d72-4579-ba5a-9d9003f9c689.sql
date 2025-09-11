-- Create RLS policies for ticket-attachments storage bucket

-- Allow authenticated users to upload files to their own folder structure
CREATE POLICY "Users can upload ticket attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ticket-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own ticket attachments
CREATE POLICY "Users can view their own ticket attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'ticket-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own ticket attachments
CREATE POLICY "Users can delete their own ticket attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ticket-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all ticket attachments
CREATE POLICY "Admins can view all ticket attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'ticket-attachments' AND 
  public.get_auth_user_role() = 'admin'
);