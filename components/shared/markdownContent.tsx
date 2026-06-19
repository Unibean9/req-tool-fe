"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

function normalizeProposalMarkdown(content: string): string {
  return content
    .replace(
      /^\*\*([^*\n]+?):\*\*\s*$/gm,
      (_match, label: string) => `### ${label.trim()}`
    )
    .replace(
      /^\*\*([^*\n]+?):\*\*\s+/gm,
      (_match, label: string) => `### ${label.trim()}\n\n`
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function MarkdownContent({
  content,
  className,
  variant = "default",
}: {
  content: string;
  className?: string;
  variant?: "default" | "document";
}) {
  const normalized = normalizeProposalMarkdown(content);
  const isDocument = variant === "document";

  return (
    <div
      className={cn(
        "markdown-content text-pretty",
        isDocument && "markdown-content--document w-full",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3
              className={cn(
                "text-balance font-semibold text-foreground not-first:mt-6",
                isDocument
                  ? "text-base tracking-tight"
                  : "text-base not-first:mt-5"
              )}
            >
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4
              className={cn(
                "text-balance font-semibold text-foreground not-first:mt-6",
                isDocument
                  ? "border-b border-border/50 pb-2 text-sm uppercase tracking-[0.12em] text-primary not-first:mt-8"
                  : "text-sm not-first:mt-4"
              )}
            >
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5
              className={cn(
                "text-balance font-semibold text-foreground not-first:mt-6",
                isDocument
                  ? "flex items-center gap-2.5 border-b border-border/45 pb-2 text-[0.8125rem] uppercase tracking-[0.14em] text-primary not-first:mt-8 before:h-px before:w-6 before:shrink-0 before:bg-primary/55 before:content-['']"
                  : "text-sm not-first:mt-4"
              )}
            >
              {children}
            </h5>
          ),
          h4: ({ children }) => (
            <h6
              className={cn(
                "font-semibold text-foreground not-first:mt-4",
                isDocument ? "text-sm text-foreground" : "text-sm not-first:mt-3"
              )}
            >
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p
              className={cn(
                "leading-6 text-foreground/90 not-first:mt-3",
                isDocument
                  ? "text-[0.9375rem] leading-7 first:text-[0.975rem] first:leading-[1.75]"
                  : "text-sm"
              )}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              className={cn(
                "flex flex-col text-foreground/90",
                isDocument
                  ? "mt-3.5 list-none gap-2.5 pl-0 text-[0.9375rem] leading-7 [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:top-[0.72em] [&>li]:before:left-0 [&>li]:before:size-1.5 [&>li]:before:rounded-full [&>li]:before:bg-primary/70 [&>li]:before:content-['']"
                  : "mt-3 list-disc gap-1.5 pl-5 text-sm leading-6"
              )}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={cn(
                "flex flex-col text-foreground/90",
                isDocument
                  ? "mt-3.5 list-decimal gap-2.5 pl-5 text-[0.9375rem] leading-7 marker:text-primary/80"
                  : "mt-3 list-decimal gap-1.5 pl-5 text-sm leading-6"
              )}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              className={cn(
                isDocument
                  ? "pl-0.5 [&>p]:mt-0 [&>p]:not-first:mt-2"
                  : "pl-0.5"
              )}
            >
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "border-l-2 border-primary/45 pl-4 text-sm leading-6 text-muted-foreground",
                isDocument
                  ? "mt-5 rounded-r-xl bg-primary/6 py-3 pr-4 not-first:mt-6"
                  : "mt-3"
              )}
            >
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children }) => {
            const isBlock = Boolean(codeClassName);
            if (isBlock) {
              return (
                <code className={cn("font-mono text-xs", codeClassName)}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-muted/55 px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/45 p-3 font-mono text-xs leading-relaxed text-foreground">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr
              className={cn(
                "border-border/70",
                isDocument ? "my-8 border-dashed" : "my-5"
              )}
            />
          ),
          table: ({ children }) => (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/70">
              <table className="w-full min-w-md border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/35 text-foreground">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-border/60 last:border-b-0">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top text-foreground/90">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
