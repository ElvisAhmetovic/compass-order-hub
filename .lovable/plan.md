

## Customer Ticket Request System

### What This Does

When a client receives a status change email, the email will include a new **"Open Support Ticket"** button. When the client clicks it, the following happens:

1. A new edge function creates a ticket automatically (pre-filled with the client's email, order info, and company name)
2. An email notification is sent to the team informing them that this client is requesting support
3. On the Empria dashboard, a new **"Customer Tickets"** section appears in the sidebar, showing all tickets submitted by external clients through this email button

---

### Architecture

The flow works like this:

1. **Status change email** includes a new CTA button: "Open Support Ticket"
2. The button links to a new edge function: `create-client-ticket`
3. The edge function:
   - Receives the order ID and client email via query params (no auth needed)
   - Looks up the order to get company name, contact info, etc.
   - Creates a record in a new `customer_tickets` table
   - Sends email notification to the team (using `NOTIFICATION_EMAIL_LIST`)
   - Shows a simple HTML "Thank you" confirmation page
4. A new sidebar item **"Customer Tickets"** links to a new page listing all tickets
5. Each ticket shows the client email, linked order, company name, and timestamp

---

### Database: New `customer_tickets` Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| order_id | uuid | The order this ticket is linked to |
| client_email | text | The email of the client who clicked |
| client_name | text | Contact person or company name |
| company_name | text | Company name from the order |
| subject | text | Auto-generated: "Support request for [company]" |
| status | text | "open", "in_progress", "closed" (default: "open") |
| created_at | timestamptz | When the ticket was created |
| notes | text | Optional admin notes |

RLS: Admins and agents can read/update/delete. Insert is open (no auth, since clients click from email). A unique constraint on `(order_id, client_email)` with a time window prevents duplicate tickets from double-clicks.

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/create-client-ticket/index.ts` | Edge function: creates ticket, sends team email, returns confirmation HTML |
| `src/pages/CustomerTickets.tsx` | New page listing all customer tickets |
| `src/pages/CustomerTicketDetail.tsx` | Detail view for a single customer ticket |
| `src/services/customerTicketService.ts` | Service to fetch/update customer tickets |

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-client-status-notification/index.ts` | Add "Open Support Ticket" button to email HTML template |
| `src/components/dashboard/Sidebar.tsx` | Add "Customer Tickets" menu item with unread badge |
| `src/App.tsx` | Add routes for `/customer-tickets` and `/customer-tickets/:id` |

---

### Technical Details

**Email Button HTML** (added to status change email template):
- A styled button linking to: `{SUPABASE_URL}/functions/v1/create-client-ticket?orderId={orderId}&email={clientEmail}`
- Placed below the "View in Client Portal" button with label like "Need Help? Open a Ticket"

**Edge Function `create-client-ticket`**:
- No JWT required (client clicks from email, not logged in)
- Validates order exists, checks for duplicate ticket in last 5 minutes
- Inserts into `customer_tickets` table
- Sends notification email to team via Resend
- Creates in-app notifications for all admins
- Returns an HTML page saying "Your ticket has been submitted. Our team will contact you shortly."

**Customer Tickets Page**:
- Table view with columns: Client, Company, Order, Status, Date
- Click to open detail view
- Filter by status (open/in_progress/closed)
- Admin can update status and add notes
- Real-time updates via Supabase subscription

**Sidebar Entry**:
- New item: "Customer Tickets" with a ticket icon
- Badge showing count of open tickets
- Visible to admin and agent roles

