"use client";

import { useCallback, useRef, useState } from "react";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils";

/**
 * Code block chrome (spec §27).
 *
 * Spec §27 wants a title bar carrying the filename, a COPY control, syntax
 * highlighting, line numbers and highlighted lines — and explicitly does not
 * want macOS traffic lights, because this is not a Mac app.
 *
 * The interesting problem here is getting the source text to the clipboard.
 * The highlighted output is a grid of `<span data-line>` elements, and
 * `textContent` on a grid concatenates lines with no separator, so copying
 * `pre.textContent` would paste everything onto one line. Reading each
 * `[data-line]` and joining with newlines is what actually preserves the code.
 *
 * The title arrives as `data-title`, normalised onto every `<pre>` by
 * `rehypeCodeChrome` in lib/mdx.ts.
 */

export function CodeBlock({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const title = (props as Record<string, unknown>)["data-title"];
  const label = typeof title === "string" && title ? title : "代码";

  const copy = useCallback(async () => {
    const pre = preRef.current;
    if (!pre) return;

    const lineElements = pre.querySelectorAll("[data-line]");
    const text =
      lineElements.length > 0
        ? Array.from(lineElements)
            .map((line) => line.textContent ?? "")
            .join("\n")
        : (pre.textContent ?? "");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access is denied outside secure contexts and in some
      // browsers' privacy modes. Copying silently failing is acceptable;
      // throwing an unhandled rejection into the console is not.
    }
  }, []);

  return (
    <div className="px-window my-8">
      <div className="px-window__bar">
        <span className="truncate">{label}</span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "px-btn px-btn--sm shrink-0",
            copied && "px-btn--primary",
          )}
          aria-label={copied ? "已复制代码" : `复制 ${label} 的代码`}
        >
          <PixelIcon name={copied ? "check" : "copy"} size={12} />
          <span aria-live="polite">{copied ? "已复制" : "复制"}</span>
        </button>
      </div>

      <pre ref={preRef} className={className} {...props}>
        {children}
      </pre>
    </div>
  );
}
