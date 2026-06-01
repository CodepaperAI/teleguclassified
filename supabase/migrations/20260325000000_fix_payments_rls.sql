-- Migration to fix RLS for payments table
-- Enable RLS on the payments table if it's not already enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own payment records
-- This checks that the user_id in the payment record matches the authenticated user's ID
CREATE POLICY "Users can view their own payment records" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: We don't need policies for INSERT/UPDATE here because those operations 
-- are handled by the service role in the API routes/webhooks, which bypass RLS.
