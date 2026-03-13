

## Replace Avatar Upload with Predefined Icon Picker

Instead of letting clients upload their own photos, provide a grid of the 10 animal icons they can choose from.

### Changes

#### 1. Copy uploaded icons to project
Copy all 10 animal images to `public/avatars/` directory: beaver, elephant, penguin, chicken, bullfinch, parrot, cat, lion, sheep, mouse.

#### 2. Update `ClientSettings.tsx`
- Remove the file upload logic (`handleAvatarUpload`, `fileInputRef`, `isUploadingAvatar`, file input element)
- Replace the avatar section with a grid of 10 clickable animal icons
- When clicked, save the selected icon path (e.g. `/avatars/cat.png`) to `profiles.avatar_url` and call `refreshUser()`
- Highlight the currently selected icon with a ring/border

#### 3. Update `ClientHeader.tsx`
No changes needed -- it already reads `user.avatar_url` and shows the Avatar with fallback initials, so the selected animal icon will display automatically.

### Files
- Copy 10 images to `public/avatars/`
- Modify `src/pages/client/ClientSettings.tsx` -- replace upload section with icon picker grid

