export interface NavItemConfig {
  id: "home" | "plants" | "ask" | "saved" | "profile";
  label: string;
  shortLabel: string;
  ariaLabel: string;
  href: string;
  exact?: boolean;
  matchPrefixes?: string[];
  accentColor: string;
  glowColor: string;
  pastelBg: string;
  indicatorColor: string;
  isCenterpiece?: boolean;
}

export const COMMUNITY_NAV_ITEMS: NavItemConfig[] = [
  {
    id: "home",
    label: "Home",
    shortLabel: "Home",
    ariaLabel: "NaturAide Community Home",
    href: "/community",
    exact: true,
    accentColor: "#059669",
    glowColor: "rgba(5, 150, 105, 0.22)",
    pastelBg: "#ecfdf5",
    indicatorColor: "#059669",
  },
  {
    id: "plants",
    label: "Plants",
    shortLabel: "Plants",
    ariaLabel: "Medicinal Plants and Herbal Guide",
    href: "/community/herbal-guide",
    exact: false,
    matchPrefixes: [
      "/community/herbal-guide",
      "/community/plants",
      "/community/products",
      "/community/herbal-finder",
      "/community/preparation",
      "/community/preparation-guide",
    ],
    accentColor: "#16a34a",
    glowColor: "rgba(22, 163, 74, 0.22)",
    pastelBg: "#f0fdf4",
    indicatorColor: "#16a34a",
  },
  {
    id: "ask",
    label: "Ask NaturAide",
    shortLabel: "Ask",
    ariaLabel: "Ask NaturAide - AI Botanical Health Assistant",
    href: "/community/ask",
    exact: false,
    matchPrefixes: ["/community/ask"],
    accentColor: "#0d9488",
    glowColor: "rgba(13, 148, 136, 0.35)",
    pastelBg: "#ccfbf1",
    indicatorColor: "#0d9488",
    isCenterpiece: true,
  },
  {
    id: "saved",
    label: "Saved",
    shortLabel: "Saved",
    ariaLabel: "Saved Plants, Guides, and Formulations",
    href: "/community/my-guide",
    exact: false,
    matchPrefixes: ["/community/my-guide", "/community/saved"],
    accentColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.22)",
    pastelBg: "#fffbeb",
    indicatorColor: "#f59e0b",
  },
  {
    id: "profile",
    label: "Profile",
    shortLabel: "Profile",
    ariaLabel: "Your Health Profile and Screening",
    href: "/community/profile",
    exact: false,
    matchPrefixes: ["/community/profile", "/community/screening"],
    accentColor: "#0284c7",
    glowColor: "rgba(2, 132, 199, 0.22)",
    pastelBg: "#f0f9ff",
    indicatorColor: "#0284c7",
  },
];

export function isNavActive(item: NavItemConfig, pathname: string): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.matchPrefixes && item.matchPrefixes.length > 0) {
    return item.matchPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
  }
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

