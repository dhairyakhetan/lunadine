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

export const MENU_ISSUES: MenuIssue[] = [
  {
    title: "“Continuos” noodles",
    detail: "Printed as “Continuos”. Is it meant to be “Continental”?",
    source: "card",
    items: ["Veg Continuos Noodles", "Continuos Chicken Noodles", "Continuos Mix Noodles", "Continuos Egg Noodles"],
    q: "continuos",
  },
  {
    title: "“Salanta” / “Salanto” gravies",
    detail: "The card spells it both ways. Which is correct?",
    source: "card",
    items: ["Salanta Paneer (Gravy)", "Salanta Fish", "Salanta Prawn"],
    q: "salanta",
  },
  {
    title: "“Moon Fan” fried rice",
    detail: "Is “Moon Fan” the intended name?",
    source: "card",
    items: ["Moon Fan Fried Rice", "Moon Fan Mix Fried Rice"],
    q: "moon fan",
  },
  {
    title: "“Royal Hummer” mocktail",
    detail: "Is “Royal Hummer” the intended name?",
    source: "card",
    items: ["Royal Hummer"],
    q: "royal hummer",
  },
  {
    title: "“Burnt Garlic” noodles",
    detail: "The card says just “Burnt Garlic”; the site adds “Noodles”. Is that right?",
    source: "card",
    items: ["Burnt Garlic Noodles"],
    q: "burnt garlic",
  },
  {
    title: "“Dewani” vs “Diwani” Handi",
    detail: "Which spelling should the menu use?",
    source: "card",
    items: ["Veg Dewani Handi"],
    q: "dewani",
  },
  {
    title: "Rows printed twice — Chinese gravy (non-veg)",
    detail: "Three rows appeared twice on the card; one copy of each is kept. Confirm nothing is missing or mispriced.",
    source: "card",
    section: "chinese-gravy",
  },
  {
    title: "Egg Fried Rice ₹250 vs Egg Schezwan ₹240",
    detail: "Plain Egg Fried Rice costs more than Egg Schezwan Fried Rice. Are both prices right?",
    source: "card",
    items: ["Egg Fried Rice", "Egg Schezwan Fried Rice"],
    q: "egg",
  },
  {
    title: "Cucumber Salad ₹150",
    detail: "Other salads are ₹80–₹120. Is ₹150 right?",
    source: "card",
    items: ["Cucumber Salad"],
    q: "salad",
  },
  {
    title: "Diet Coke can size",
    detail: "Listed as a 330 ml can; every other can is 300 ml. Which is right?",
    source: "review",
    items: ["Diet Coke (330 ml can)"],
    q: "can",
  },
];
