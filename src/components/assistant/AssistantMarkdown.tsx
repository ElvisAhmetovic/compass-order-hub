import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

/** Renders an assistant answer with GitHub-style markdown (tables, lists) and a copy button. */
export function AssistantMarkdown({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative rounded-2xl border border-border bg-card px-4 py-3">
      <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-base prose-h2:text-base prose-h3:text-sm prose-headings:mb-2 prose-headings:mt-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-a:text-primary">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ children }) => (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="m-0 w-full text-xs">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="bg-muted px-3 py-2 text-left font-semibold text-foreground">{children}</th>,
            td: ({ children }) => <td className="border-t border-border px-3 py-2 align-top">{children}</td>,
            tr: ({ children }) => <tr className="even:bg-muted/40">{children}</tr>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">{children}</a>,
            code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono before:content-none after:content-none">{children}</code>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      <button type="button" onClick={copy} aria-label="Copy answer" className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
