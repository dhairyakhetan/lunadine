/* Open questions about the menu text and prices, shown only in review mode
   (the "Menu issues" button on /menu; see MenuBrowser). Remove an entry once the owner answers it.
   `items` are exact names from lib/menu.ts that get flagged inline; `q` is what "Show" searches for. */

export type MenuIssue = {
  title: string;
  detail: string;
  source: "card" | "review"; // "card": queried from the printed card; "review": spotted while reviewing the site
  items?: string[];
  q?: string;
  section?: string; // section id to jump to when there's nothing to search for
};

// All open questions were answered by the owner (Nov 2026). Add new ones here; the review button
// only appears while this list has entries.
export const MENU_ISSUES: MenuIssue[] = [];
