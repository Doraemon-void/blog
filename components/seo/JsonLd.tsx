/**
 * Renders a JSON-LD block (spec §48).
 *
 * Kept in `components/` rather than `lib/seo.ts` so the SEO module stays free of
 * JSX and can be imported from any server context — including the RSS and
 * search-index route handlers, which never render a tree.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The input is always an object literal built in lib/seo.ts. No user
      // content reaches it, and JSON.stringify escapes any `</script>` that
      // could otherwise terminate the block early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
