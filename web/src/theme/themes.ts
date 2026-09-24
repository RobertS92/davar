export type ThemeId = "tabernacle" | "carpenter" | "judah";

export const THEMES: {
  id: ThemeId;
  name: string;
  description: string;
}[] = [
  {
    id: "tabernacle",
    name: "The Tabernacle",
    description: "Dark indigo sanctuary",
  },
  {
    id: "carpenter",
    name: "The Carpenter's Workbench",
    description: "Warm light wood tones",
  },
  {
    id: "judah",
    name: "Judah's Lion",
    description: "Emerald and gold night",
  },
];

export function applyTheme(themeId: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", themeId);
}
