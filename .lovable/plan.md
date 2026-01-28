

# Add Email Notifications for Client Support Inquiries

## Overview

Send email notifications to all admin team members when a client submits a new support inquiry. This provides an additional notification channel beyond the in-app notifications already implemented.

## Current Infrastructure

**Existing patterns to follow:**
- `send-tech-support-notification` edge function uses Resend API with `RESEND_API_KEY`
- Email sender: `"AB Media Team <noreply@empriadental.de>"`
- `NOTIFICATION_EMAIL_LIST` contains 11 team member emails
- Rate limiting: 600ms delay between emails to respect Resend limits
- `APP_URL` environment variable for deep linking

**Current flow:**
1. Client creates inquiry via `createClientInquiry()` in `clientSupportService.ts`
2. In-app notifications are created for all admins
3. **Missing:** Email notifications are NOT sent

## Solution

### Part 1: Create New Edge Function

**File**: `supabase/functions/send-support-inquiry-notification/index.ts`

Create a new edge function that:
- Receives inquiry details (id, subject, message, client name, client email, order info)
- Sends formatted HTML emails to all notification recipients
- Includes deep link to `/support/{inquiryId}` for quick access

```typescript
interface SupportInquiryNotificationRequest {
  inquiryData: {
    id: string;
    subject: string;
    message: string;
    clientName: string;
    clientEmail: string;
    orderCompanyName?: string;
    createdAt: string;
  };
  emails: string[];
}
```

**Email template features:**
- Professional HTML layout matching existing email styles
- Inquiry subject and message preview
- Client contact information
- Link to related order (if applicable)
- Direct "View in Dashboard" button linking to `/support/{id}`

### Part 2: Update Config

**File**: `supabase/config.toml`

Add configuration for the new edge function:
```toml
[functions.send-support-inquiry-notification]
verify_jwt = false
```

### Part 3: Call Edge Function from Service

**File**: `src/services/clientSupportService.ts`

Update `createClientInquiry()` to invoke the edge function after creating the inquiry:

```typescript
// After successful inquiry creation and in-app notifications
try {
  await supabase.functions.invoke('send-support-inquiry-notification', {
    body: {
      inquiryData: {
        id: data.id,
        subject: params.subject,
        message: params.message,
        clientName: userName,
        clientEmail: userData.user.email,
        orderCompanyName: orderCompanyName, // fetch if orderId provided
        createdAt: new Date().toISOString()
      },
      emails: NOTIFICATION_EMAIL_LIST
    }
  });
} catch (emailError) {
  console.error("Error sending email notification:", emailError);
  // Don't block the inquiry creation if email fails
}
```

## Data Flow

```text
Client Portal                     Backend                           Email Service
┌──────────────┐                 ┌─────────────────┐               ┌─────────────┐
│ New Inquiry  │                 │ clientSupport   │               │ Resend API  │
│ Form Submit  │────────────────▶│ Service.ts      │               │             │
└──────────────┘                 │                 │               └──────────────┘
                                 │ 1. Insert       │                      ▲
                                 │    inquiry      │                      │
                                 │                 │                      │
                                 │ 2. Create       │                      │
                                 │    in-app       │                      │
                                 │    notifications│                      │
                                 │                 │                      │
                                 │ 3. Invoke       │    ┌─────────────────┘
                                 │    edge func ───┼───▶│ send-support-
                                 └─────────────────┘    │ inquiry-
                                                        │ notification
                                                        │
                                                        │ 4. Send emails
                                                        │    to all admins
                                                        │    (11 recipients)
                                                        └─────────────────
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/send-support-inquiry-notification/index.ts` | Create | New edge function for sending support inquiry emails |
| `supabase/config.toml` | Modify | Add function configuration |
| `src/services/clientSupportService.ts` | Modify | Add edge function invocation after inquiry creation |

## Email Template Design

The email will include:
- Header with "New Support Inquiry" title
- Client information section (name, email)
- Linked order info (if applicable)
- Inquiry subject prominently displayed
- Message content preview
- "View Inquiry" CTA button linking to dashboard
- Footer with automatic generation notice

## Error Handling

- Email sending is wrapped in try/catch
- Failure to send emails does NOT block inquiry creation
- Errors are logged for debugging
- Each recipient is sent individually with 600ms delay
- Results tracked per-recipient for monitoring

## Expected Outcome

1. Client submits support inquiry
2. Inquiry saved to database (existing)
3. In-app notifications created for admins (existing)
4. **NEW:** Email sent to all 11 team members
5. Email includes deep link to specific inquiry
6. Admin clicks email → opens dashboard at `/support/{id}`

