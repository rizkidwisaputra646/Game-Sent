import type React from "react";
import {
  Cpu,
  Database,
  FileText,
  Home,
  Scale,
  Search,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  mobileLabel: string;
  shortTag: string;
  icon: React.ComponentType<{ className?: string }>;
  showInBottomNav: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    mobileLabel: "Home",
    shortTag: "01",
    icon: Home,
    showInBottomNav: true,
  },
  {
    href: "/models",
    label: "Model & Evaluation",
    mobileLabel: "Model",
    shortTag: "02",
    icon: Cpu,
    showInBottomNav: true,
  },
  {
    href: "/analyzer",
    label: "Sentiment Analyzer",
    mobileLabel: "Analyze",
    shortTag: "03",
    icon: Search,
    showInBottomNav: true,
  },
  {
    href: "/datasets",
    label: "Dataset Explorer",
    mobileLabel: "Dataset",
    shortTag: "04",
    icon: Database,
    showInBottomNav: true,
  },
  {
    href: "/comparison",
    label: "Game Comparison",
    mobileLabel: "Compare",
    shortTag: "05",
    icon: Scale,
    showInBottomNav: true,
  },
  {
    href: "/reports",
    label: "Reports & Export",
    mobileLabel: "Reports",
    shortTag: "06",
    icon: FileText,
    showInBottomNav: false,
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (item) => item.showInBottomNav
);
