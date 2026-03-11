

## Send Offer from Create Order + Offers Panel

### What
Add a "Send Offer" button to the Create Order modal that emails the client a styled offer using the provided HTML template (adapted to English, 5 stars, AB Media branding, client details). All sent offers are tracked in a new `offers` database table and displayed in a new "Offers" sidebar page showing who sent it, when, to whom, and offer details.

### Database Changes

**New `offers` table:**
```sql
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_data jsonb NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  client_address text,
  company_name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  sent_by uuid REFERENCES auth.users(id),
  sent_by_name text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);
```
With RLS: authenticated non-client users can SELECT/INSERT.

### Edge Function: `send-offer-email`

**`supabase/functions/send-offer-email/index.ts`**
- Accepts: client email, name, phone, address, price, currency, description, company name, sender name
- Builds HTML email from the provided template adapted to:
  - English language
  - 5 gold stars instead of 1
  - "AB Media Team" in header (replaces "Unternehmensprofil" / Google logo)
  - Review card replaced with client info card (name, email, phone, price, description, address)
  - Blue button says "Confirm Your Order" (link placeholder for now)
  - Footer: sender name as the specialist, AB Media Team branding
- Sends via Resend API using `RESEND_API_KEY_ABMEDIA` from `noreply@empriadental.de`
- Returns success/error

### Frontend Changes

**`src/components/dashboard/CreateOrderModal.tsx`**
- Add a "Send Offer" button next to the existing "Create Order" button
- On click: validates the form, calls the `send-offer-email` edge function with form data, inserts a record into the `offers` table, closes modal, shows "Offer Sent" toast
- Does NOT create an order — only sends the offer email and logs it

**`src/pages/Offers.tsx`** (new)
- Standard layout with Sidebar
- Fetches all records from `offers` table ordered by `created_at` desc
- Table columns: Client Name, Company, Email, Price, Sent By, Date/Time, Actions (View details dialog)
- View dialog shows full offer details including description

**`src/components/dashboard/Sidebar.tsx`**
- Add "Offers" menu item with `Send` icon, route `/offers`, roles: `['admin', 'agent']`

**`src/App.tsx`**
- Add `/offers` route pointing to the new Offers page, wrapped in `RequireAuth`

