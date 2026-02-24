

## Set Favicon / Browser Icon

Copy the uploaded image to the public directory and update `index.html` to use it as the favicon, apple touch icon, etc.

### Files to Change

| File | Change |
|------|--------|
| `public/favicon.png` | Copy uploaded image here |
| `index.html` | Replace existing favicon link with new `<link>` tags pointing to `/favicon.png` |

### Implementation

1. Copy `user-uploads://WhatsApp_Slika_2025-09-17_u_12.06.09_1ee167d7-removebg-preview.png` → `public/favicon.png`
2. In `index.html` `<head>`, add/replace:
   ```html
   <link rel="icon" href="/favicon.png" type="image/png" />
   <link rel="apple-touch-icon" href="/favicon.png" />
   ```

