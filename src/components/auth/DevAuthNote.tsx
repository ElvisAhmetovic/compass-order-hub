
import { AlertCircle } from "lucide-react";

export const DevAuthNote = () => {
  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="p-3 mb-4 border border-blue-300 rounded bg-blue-50 text-blue-800 text-sm">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5" />
        <div>
          <p className="font-semibold">Development Notes:</p>
          <ul className="list-disc list-inside ml-1 mt-1">
            <li>For admin access use: <span className="font-mono">luciferbebistar@gmail.com</span> / <span className="font-mono">Admin@123</span></li>
            <li>New registered users need email confirmation by default</li>
            <li>To disable email confirmation for testing, go to Supabase Dashboard &gt; Authentication &gt; Email Templates</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
