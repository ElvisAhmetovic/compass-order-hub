# Sidebar on every team page + scrollable sidebar

## What changes
1. **Add the sidebar to the pages missing it.** I checked every signed-in team page; these 6 have no sidebar:
   - Client Portal Activity
   - Social: ABM Website, Facebook, Instagram, TikTok, Twitter
   All other team pages already show it.
2. **Sidebar scrolls by itself.** The sidebar stays fixed to the screen height; when its menu is longer than the screen, you scroll inside the sidebar instead of scrolling the whole page. The logo/header at the top stays visible.

## Technical details
- Sidebar `aside`: `sticky top-0 h-screen` (replace `min-h-screen`), nav becomes `flex-1 overflow-y-auto min-h-0`, header `shrink-0`.
- Each of the 6 pages: wrap in `flex min-h-screen` > `<Sidebar />` + `flex-1 flex flex-col min-w-0` (existing layout rule). Remove the now-redundant "Dashboard" back button on the activity page only if it duplicates navigation (keep it otherwise).
- Verify with Playwright as a team user: sidebar visible on all 6 pages, sidebar scrolls internally at 855px height.
