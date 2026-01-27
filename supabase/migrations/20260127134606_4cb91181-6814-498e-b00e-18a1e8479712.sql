-- Enable realtime for orders table
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;