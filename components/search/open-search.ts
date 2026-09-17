/**
 * Opens the ⌘K search dialog from anywhere.
 *
 * A tiny event rather than shared state or context, because the two things that
 * need to talk — the homepage search box and the dialog in the header — are in
 * separate subtrees, and threading a context provider through the root layout
 * just to connect two components would be more machinery than the problem needs.
 *
 * The dialog listens for the event; the homepage box dispatches it. Neither
 * imports the other.
 */

export const OPEN_SEARCH_EVENT = "dora:open-search";

export function openSearch(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}
