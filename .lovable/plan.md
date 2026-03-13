

## Client Portal Settings Page

### Current State
- There's already a `/client/profile` route with `ClientProfile` page that has name editing and password change
- The sidebar has a "Profile" item with User icon pointing to `/client/profile`
- The `profiles` table has no `avatar_url` column yet
- No avatar storage exists for clients

### Plan

#### 1. Database Migration
Add `avatar_url` (text, nullable) column to the `profiles` table to store the avatar image URL.

#### 2. Rename Sidebar Item
In `ClientSidebar.tsx`, rename "Profile" to "Settings" and change the icon from `User` to `Settings` (from lucide-react). Keep the URL as `/client/profile` (or change to `/client/settings` for consistency).

#### 3. Revamp `ClientProfile.tsx` → `ClientSettings.tsx`
Rename the page and restructure it with three card sections:

- **Avatar Section** (top): Circular avatar preview showing current image or initials fallback. "Upload Photo" button that opens a file picker (accept images only, max ~2MB). On upload, store to `team-files` bucket (already public) under `avatars/{user_id}`, update `profiles.avatar_url`, and show the new image immediately.

- **Personal Information** (existing): First name, last name, email (read-only). Same save logic via `updateUserProfile`.

- **Change Password** (existing): New password + confirm, with the 8-char complexity requirement (uppercase, lowercase, number) matching the project's password policy. Same logic via `updatePassword`.

#### 4. Update Routes
In `App.tsx`, update the route path from `/client/profile` to `/client/settings` and update the import/component name accordingly. Update the sidebar nav item URL to match.

#### 5. Show Avatar in Header
In `ClientHeader.tsx`, display a small Avatar circle next to the user's name, using `user.avatar_url` if available, falling back to initials. This sets up the foundation for the avatar display you mentioned implementing next.

### Files to Modify
- **Migration**: Add `avatar_url` to `profiles`
- `src/components/client-portal/ClientSidebar.tsx` — rename item, change icon/URL
- `src/pages/client/ClientProfile.tsx` — rename to `ClientSettings.tsx`, add avatar upload section
- `src/App.tsx` — update route path and import
- `src/components/client-portal/ClientHeader.tsx` — show avatar circle
- `src/context/AuthContext.tsx` — ensure `avatar_url` is included in user state (need to verify)

