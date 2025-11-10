-- Allow authenticated users to view basic profile info for rankings
CREATE POLICY "Allow authenticated users to view profile names for rankings"
ON profiles
FOR SELECT
TO authenticated
USING (true);