-- Phase 1: Create proper role infrastructure

-- 1.1 Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'user', 'client');

-- 1.2 Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- 1.3 Create secure has_role() function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 1.4 Create is_client() helper function
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'client'
  )
$$;

-- 1.5 Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Phase 2: Add direct client linking to orders

-- 2.1 Add client_id column to orders table
ALTER TABLE public.orders
ADD COLUMN client_id UUID REFERENCES auth.users(id);

-- Create index for efficient client lookups
CREATE INDEX idx_orders_client_id ON public.orders(client_id);

-- 2.2 Populate client_id from existing company relationships
UPDATE public.orders o
SET client_id = c.client_user_id
FROM public.companies c
WHERE o.company_id = c.id
  AND c.client_user_id IS NOT NULL
  AND o.client_id IS NULL;

-- Phase 3: Secure RLS Policies for Orders

-- 3.1 Remove overly permissive policies
DROP POLICY IF EXISTS "Allow select on orders for all" ON public.orders;
DROP POLICY IF EXISTS "Allow users to view orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders" ON public.orders;

-- 3.2 Create secure client-specific SELECT policy
CREATE POLICY "Clients can view their own orders"
  ON public.orders
  FOR SELECT
  USING (
    -- Client can only see orders assigned to them
    (client_id = auth.uid() AND public.has_role(auth.uid(), 'client'))
    -- OR internal users with proper permissions (preserved)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'user')
  );

-- 3.3 Update INSERT policy for internal users only
DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;
CREATE POLICY "Internal users can insert orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    (auth.uid() = created_by AND NOT public.has_role(auth.uid(), 'client'))
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3.4 Update UPDATE policy for internal users only  
DROP POLICY IF EXISTS "Users can update assigned orders" ON public.orders;
CREATE POLICY "Internal users can update orders"
  ON public.orders
  FOR UPDATE
  USING (
    (auth.uid() = assigned_to AND NOT public.has_role(auth.uid(), 'client'))
    OR (auth.uid() = created_by AND NOT public.has_role(auth.uid(), 'client'))
    OR public.has_role(auth.uid(), 'admin')
  );

-- Phase 4: RLS Policies for user_roles Table

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage roles (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Phase 5: Update client_orders View

-- Drop and recreate view to include client_id
DROP VIEW IF EXISTS public.client_orders;

CREATE VIEW public.client_orders WITH (security_invoker=on) AS
SELECT 
    o.id,
    o.company_name,
    o.description,
    o.status,
    o.created_at,
    o.updated_at,
    o.price,
    o.currency,
    o.priority,
    o.status_created,
    o.status_in_progress,
    o.status_invoice_sent,
    o.status_invoice_paid,
    o.status_resolved,
    o.status_cancelled,
    o.contact_email,
    o.contact_phone,
    o.client_id,
    c.id AS company_id,
    c.client_user_id,
    c.name AS linked_company_name,
    c.email AS company_email
FROM orders o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.deleted_at IS NULL 
  AND (o.status_deleted = false OR o.status_deleted IS NULL);