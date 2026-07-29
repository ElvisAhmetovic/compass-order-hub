## Plan: Export Full Project as ZIP

**Goal:** Package the entire project source code into a downloadable ZIP archive.

### Steps

1. **Create the ZIP archive** of the project root (`/dev-server`) excluding heavy/unnecessary directories (`node_modules`, `.git`, `dist`, build caches).
2. **Write the ZIP** to `/mnt/documents/` so it's immediately downloadable from the chat.
3. **Present** the file as a download artifact.

### What's included
- All `src/` source files (pages, components, services, hooks, types, utils, contexts)
- All `supabase/` edge functions and config
- Config files (`package.json`, `tsconfig`, `vite.config`, `tailwind.config`, etc.)
- `index.html`, `public/` assets
- `.env` structure (note: secrets will be excluded for security)

### What's excluded
- `node_modules/` (can be regenerated with `npm install`)
- `.git/` (version history)
- `dist/` and build output
- Lock files can be included so `npm install` reproduces dependencies

The resulting file will be a standard ZIP you can open in any archive tool or extract and run with `npm install && npm run dev`.