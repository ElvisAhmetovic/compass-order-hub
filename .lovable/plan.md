

## QA Deep Dive — Findings & Recommendations

### BUGS / DATA INTEGRITY ISSUES

**1. Ghost column: `contact_name` doesn't exist in the database**
The `Order` TypeScript type defines `contact_name`, and multiple services reference it (`companyUtils.ts`, `companySyncService.ts`, `supabaseCompanySyncService.ts`, `migrationService.ts`). However, the `orders` table has NO `contact_name` column. This means:
- Company sync uses `order.contact_name` which is always `undefined`
- Contact person info from orders never actually gets synced to companies
- Fix: Add a `contact_name` column to the `orders` table via migration, OR remove it from the type and services if it's truly not needed.

**2. Hardcoded email list duplicated in `orderService.ts`**
`sendOrderUpdateEmails()` (line 753) has a hardcoded email list string instead of using the centralized `NOTIFICATION_EMAIL_LIST` from `src/constants/notificationEmails.ts`. The lists are also slightly different (the constant has 12 emails, the hardcoded string has 11 — missing `jannes@scoolfinanceedu.com`). This means update notifications skip one team member.

**3. `orderUtils.ts` still writes to localStorage**
`updateOrderInStorage()` writes order data to `localStorage`, but the app uses Supabase as the data source. This creates stale data and confusion — it's dead code from the pre-Supabase era.

**4. Invoice settings stored only in localStorage**
`useInvoiceSettings.ts`, `invoicePdfGenerator.ts`, and `SendMonthlyInvoiceDialog.tsx` all read invoice template settings (logo, company info) from `localStorage`. If a user clears browser data or switches devices, all settings are lost. These should be persisted to the `company_settings` table.

---

### SECURITY ISSUES

**5. Weak password policy — only 6 characters required**
`formValidation.ts` and `ClientProfile.tsx` enforce only 6-character minimum passwords. Industry standard is 8+ with complexity requirements.

**6. `updateUserProfile` in AuthContext can update roles**
Line 249 of `AuthContext.tsx`: `role: profileData.role || user.role` — this allows updating the `profiles.role` field from the client side. While the real role comes from `user_roles`, it's still a confusing surface area.

**7. Overly permissive RLS on `customer_tickets` INSERT**
The policy `Service role can insert customer tickets` uses `WITH CHECK (true)`, which is flagged by the Supabase linter. Any authenticated user (or even anon) could insert tickets.

**8. `client_orders` view has NO RLS policies at all**
The `client_orders` table/view has zero RLS policies defined, meaning it relies on whatever default is set. This should be verified.

---

### UX / QUALITY IMPROVEMENTS

**9. No loading skeletons anywhere**
All pages show generic "Loading..." text. Skeleton loading states would improve perceived performance significantly.

**10. No error boundaries**
There are no React error boundaries. A crash in any component takes down the entire app. Adding a top-level error boundary with a "Something went wrong" fallback would prevent white screens.

**11. No confirmation on permanent delete**
`permanentlyDeleteOrder()` in `orderService.ts` has no client-side confirmation guard — it's called directly. If any UI triggers it without a dialog, data is lost forever.

**12. Excessive console logging in production**
Services like `invoiceService.ts` have dozens of `console.log` statements with emojis (`🚀`, `✅`, `🚫`). These should be stripped or gated behind a debug flag for production.

**13. `companySyncService.ts` creates orders for clients without matching companies**
The `syncClientsToCompanies` method creates fake orders (price: 0, description: "Auto-created from client") just to link clients. This pollutes the order list with dummy data.

**14. No pagination on several list queries**
`getOrders()`, `getClients()`, `getInvoices()` all fetch without limits. With Supabase's default 1000-row cap, data will silently go missing as the business grows.

---

### RECOMMENDED PRIORITY ACTIONS

| Priority | Item | Effort |
|----------|------|--------|
| High | Fix `contact_name` ghost column (#1) | Small — add DB migration |
| High | Unify hardcoded email list (#2) | Tiny — use the constant |
| High | Add error boundary (#10) | Small — one component |
| Medium | Persist invoice settings to DB (#4) | Medium |
| Medium | Strengthen password policy (#5) | Tiny |
| Medium | Fix `client_orders` RLS (#8) | Small |
| Medium | Add pagination to list queries (#14) | Medium |
| Low | Remove localStorage dead code (#3) | Small |
| Low | Add loading skeletons (#9) | Medium |
| Low | Reduce console logging (#12) | Small |
| Low | Fix company sync creating dummy orders (#13) | Small |

