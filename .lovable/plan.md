

## Assign Customer Tickets to Client Portal Users

### What This Does

When a customer ticket comes in (from the email "Need Help?" button), an admin can assign it to a specific client user from the Empria client portal. Once assigned:

1. A **support inquiry** is automatically created in the `support_inquiries` table, pre-filled with the ticket's subject, client email, and linked order -- so the client sees it in their portal under "Support"
2. The customer ticket gets a visible **tag/badge** showing the assigned client's name and email
3. Admins can easily see which tickets are assigned and to whom in the tickets list

### How It Works

1. Admin opens a customer ticket detail page
2. A new "Assign to Client" section shows a dropdown of client portal users (fetched from `user_roles` where role = 'client', joined with `profiles`)
3. Admin selects a client and clicks "Assign"
4. The system:
   - Updates `customer_tickets` with `assigned_client_id` and `assigned_client_name`/`assigned_client_email`
   - Creates a `support_inquiry` record for that client user, linking the same `order_id` and pre-filling the subject/message
   - Sends the client an in-app notification that a support ticket has been created for them
5. On the Customer Tickets list page, assigned tickets show a badge with the client's name/email

---

### Database Changes

**Alter `customer_tickets` table** -- add 3 columns:

| Column | Type | Description |
|--------|------|-------------|
| assigned_client_id | uuid (nullable) | The client portal user this ticket is assigned to |
| assigned_client_name | text (nullable) | Display name of the assigned client |
| assigned_client_email | text (nullable) | Email of the assigned client |

No new tables needed. When a ticket is assigned, a row is inserted into the existing `support_inquiries` table so the client sees it in their portal.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/CustomerTicketDetail.tsx` | Add "Assign to Client" card with a dropdown of client users and assign button; show assigned client badge |
| `src/pages/CustomerTickets.tsx` | Show assigned client name/email tag in the table rows |
| `src/services/customerTicketService.ts` | Add `assignToClient()` method that updates the ticket and creates a support inquiry; add method to fetch client users |

---

### Technical Details

**Fetching client users for the dropdown:**
- Query `user_roles` where `role = 'client'`, join with `profiles` to get names, and `auth.users` (via profiles.id) for emails
- Since we can't query `auth.users` directly from the client, we'll use the `profiles` table which has user info and the `app_users` table or query profiles + user email from the auth context

**Assigning a ticket:**
```
customerTicketService.assignToClient(ticketId, {
  clientId: selectedClient.id,
  clientName: selectedClient.name,
  clientEmail: selectedClient.email,
  orderId: ticket.order_id,
  subject: ticket.subject,
})
```

This method will:
1. Update `customer_tickets` set `assigned_client_id`, `assigned_client_name`, `assigned_client_email`
2. Insert into `support_inquiries` with `user_id = clientId`, `subject = ticket.subject`, `message = "Support ticket created from customer request"`, `order_id = ticket.order_id`
3. Insert a notification for the client user

**Customer Tickets list table** -- add a new column "Assigned To" showing a badge with the client's name or email when assigned, and a dash when not.

**Customer Ticket Detail page** -- new card section between the info card and the status card:
- Title: "Assign to Client Portal User"
- A searchable select dropdown of client users
- An "Assign" button
- If already assigned, show the assigned client info with option to unassign

