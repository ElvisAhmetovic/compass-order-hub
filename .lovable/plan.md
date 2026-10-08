# Rebrand the login and register screens to Empria Tech CRM

## What the user asked
Clicking "Anmelden" opens the login screen, which still says "AB Media Team CRM" with the old logo. It should say "EMPRIA TECH CRM" and use the current Empria Tech (AB symbol) logo.

## Current state (verified)
- `src/pages/Login.tsx` — heading "AB Media Team CRM" and old logo `/lovable-uploads/2d4259f4-...png` (alt "AB Media Team Logo").
- `src/components/auth/LoginForm.tsx` — the card inside the login page repeats the same old logo image.
- `src/pages/Register.tsx` — heading "AB Media Team CRM".
- `src/components/dashboard/Sidebar.tsx` — also says "AB Media Team CRM", but that is the CRM's internal sidebar; per the standing rule the CRM keeps its own branding, so it stays unchanged.

## Changes
1. **Login page** (`src/pages/Login.tsx`)
   - Replace the old logo image with the AB symbol `@/assets/ab-team-symbol.png` (same one used in the public header), alt "Empria Tech".
   - Change the heading to "Empria Tech CRM".
2. **Login form card** (`src/components/auth/LoginForm.tsx`)
   - Replace the old logo image with the same AB symbol import, alt "Empria Tech".
3. **Register page** (`src/pages/Register.tsx`)
   - Change the heading to "Empria Tech CRM" and add the AB symbol above it to match the login page.

## Out of scope
- CRM sidebar, invoices, PDFs, emails — they keep the CRM's own branding per standing rules.

## Verification
- Open `/login` and `/register` in the browser: heading reads "Empria Tech CRM", the AB symbol loads (no broken image), in both the pre-login state and after a failed login.
- Check the build log is clean.
