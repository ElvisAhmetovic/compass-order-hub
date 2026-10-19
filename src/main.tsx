import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// After a new publish, an open tab may request page files that no longer exist.
// Reload once to fetch the latest version instead of showing a blank screen.
const RELOAD_KEY = "chunk-reload-at";
const tryReload = () => {
  const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
  if (Date.now() - last > 10000) {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.reload();
  }
};
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  tryReload();
});
window.addEventListener("unhandledrejection", (event) => {
  const msg = String((event.reason as Error)?.message || event.reason || "");
  if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
    event.preventDefault();
    tryReload();
  }
});

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(<HelmetProvider><App /></HelmetProvider>);
