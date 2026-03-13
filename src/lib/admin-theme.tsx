"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "dark" | "light";

export interface AdminThemeCls {
  bg: string;
  bgCard: string;
  bgDeep: string;
  bgSidebar: string;
  border: string;
  borderHover: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  accentGradient: string;
  accentShadow: string;
  inputBg: string;
  inputBorder: string;
  tableRowHover: string;
  accent: string;
  shadow: string;
  bgHover: string;
  doradoText: string;
}

export interface AdminTheme extends AdminThemeCls {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;

  /** Tailwind class strings for backward-compatible usage in className props */
  cls: AdminThemeCls;

  /* Color values (not Tailwind classes) */
  colors: {
    bg: string;
    bgCard: string;
    bgSidebar: string;
    bgDeep: string;
    bgHover: string;
    border: string;
    borderSubtle: string;
    text: string;
    textMuted: string;
    textFaint: string;
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryText: string;
    dorado: string;
    doradoLight: string;
    doradoText: string;
    nude: string;
    nudeLight: string;
    success: string;
    successLight: string;
    successText: string;
    warning: string;
    warningLight: string;
    warningText: string;
    danger: string;
    dangerLight: string;
    dangerText: string;
    info: string;
    infoLight: string;
    infoText: string;
    inputBg: string;
    inputBorder: string;
  };
}

/* ── Light Mode Colors ── */
const lightColors = {
  // Layout - usando los colores premium de la marca
  bg: "#FAF7F4",
  bgCard: "#FFFFFF",
  bgSidebar: "#FFFFFF",
  bgDeep: "#FAF7F4",
  bgHover: "#F3E6E6",

  // Borders
  border: "#EDE3E1",
  borderSubtle: "#F3E6E6",

  // Text
  text: "#121212",
  textMuted: "#6B6B6B",
  textFaint: "#6B6B6B99", // /60 opacity

  // Primary (Vino - color principal de la marca)
  primary: "#8B3A4A",
  primaryHover: "#6B2A3A",
  primaryLight: "#8B3A4A1A", // /10 opacity
  primaryText: "#8B3A4A",

  // Dorado (premium)
  dorado: "#C9A46A",
  doradoLight: "#C9A46A1A", // /10 opacity
  doradoText: "#C9A46A",

  // Nude (acento suave)
  nude: "#E8B7B7",
  nudeLight: "#E8B7B733", // /20 opacity

  // Semantic
  success: "#10B981", // emerald-500
  successLight: "#ECFDF5", // emerald-50
  successText: "#059669", // emerald-600
  warning: "#F59E0B", // amber-500
  warningLight: "#FFFBEB", // amber-50
  warningText: "#D97706", // amber-600
  danger: "#EF4444", // red-500
  dangerLight: "#FEF2F2", // red-50
  dangerText: "#DC2626", // red-600
  info: "#3B82F6", // blue-500
  infoLight: "#EFF6FF", // blue-50
  infoText: "#2563EB", // blue-600

  // Components
  inputBg: "#FFFFFF",
  inputBorder: "#EDE3E1",
};

/* ── Dark Mode Colors ── */
const darkColors = {
  // Layout - modo oscuro más suave y claro
  bg: "#1A1A1A",
  bgCard: "#242424",
  bgSidebar: "#1F1F1F",
  bgDeep: "#1A1A1A",
  bgHover: "#2A2A2A",

  // Borders - más visibles
  border: "#3A3A3A",
  borderSubtle: "#2A2A2A",

  // Text - mejor contraste
  text: "#F5F5F5",
  textMuted: "#B0B0B0",
  textFaint: "#808080",

  // Primary (Vino más claro para modo oscuro)
  primary: "#B85565",
  primaryHover: "#D06575",
  primaryLight: "#B8556526", // /15 opacity
  primaryText: "#E8B7B7",

  // Dorado (más brillante para oscuro)
  dorado: "#D4B87A",
  doradoLight: "#D4B87A26", // /15 opacity
  doradoText: "#D4B87A",

  // Nude (más visible en oscuro)
  nude: "#E8B7B7",
  nudeLight: "#E8B7B726", // /15 opacity

  // Semantic - colores más brillantes para oscuro
  success: "#34D399", // emerald-400
  successLight: "#10B98126", // emerald-500/15
  successText: "#34D399", // emerald-400
  warning: "#FBBF24", // amber-400
  warningLight: "#F59E0B26", // amber-500/15
  warningText: "#FBBF24", // amber-400
  danger: "#F87171", // red-400
  dangerLight: "#EF444426", // red-500/15
  dangerText: "#F87171", // red-400
  info: "#60A5FA", // blue-400
  infoLight: "#3B82F626", // blue-500/15
  infoText: "#60A5FA", // blue-400

  // Components
  inputBg: "#2A2A2A",
  inputBorder: "#3A3A3A",
};

const ThemeContext = createContext<AdminTheme | null>(null);

export function useAdminTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used inside AdminThemeProvider");
  return ctx;
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("admin_theme_mode") as ThemeMode | null;
    if (saved === "dark" || saved === "light") {
      setModeState(saved);
    }
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem("admin_theme_mode", m);
  };

  const toggleMode = () => setMode(mode === "dark" ? "light" : "dark");

  const colors = mode === "dark" ? darkColors : lightColors;

  // Backward-compatible Tailwind class strings (arbitrary values — static in source for JIT scanning)
  // Light:  bg-white border-[#EDE3E1] text-[#121212] text-[#6B6B6B] text-[#6B6B6B] bg-[#FAF7F4] bg-[#8B3A4A]/10 text-[#8B3A4A] border-[#8B3A4A] bg-[#F3E6E6]
  // Dark:   bg-[#242424] border-[#3A3A3A] text-[#F5F5F5] text-[#B0B0B0] text-[#808080] bg-[#1A1A1A] bg-[#B85565]/15 text-[#E8B7B7] border-[#B85565] bg-[#2A2A2A]
  const isDark = mode === "dark";
  const cls: AdminThemeCls = {
    bg:            isDark ? "bg-[#1A1A1A]"       : "bg-[#FAF7F4]",
    bgCard:        isDark ? "bg-[#242424]"       : "bg-white",
    bgDeep:        isDark ? "bg-[#1A1A1A]"       : "bg-[#FAF7F4]",
    bgSidebar:     isDark ? "bg-[#1F1F1F]"       : "bg-white",
    bgHover:       isDark ? "hover:bg-[#2A2A2A]" : "hover:bg-[#F3E6E6]",
    border:        isDark ? "border-[#3A3A3A]"   : "border-[#EDE3E1]",
    borderHover:   isDark ? "border-[#D4B87A]"   : "border-[#C9A46A]",
    text:          isDark ? "text-[#F5F5F5]"     : "text-[#121212]",
    textMuted:     isDark ? "text-[#B0B0B0]"     : "text-[#6B6B6B]",
    textFaint:     isDark ? "text-[#808080]"     : "text-[#6B6B6B]",
    accentBg:      isDark ? "bg-[#B85565]/15"    : "bg-[#8B3A4A]/10",
    accentText:    isDark ? "text-[#E8B7B7]"     : "text-[#8B3A4A]",
    accentBorder:  isDark ? "border-[#B85565]"   : "border-[#8B3A4A]",
    accentGradient:isDark ? "from-[#B85565] to-[#8B3A4A]" : "from-[#8B3A4A] to-[#5E0B2B]",
    accentShadow:  isDark ? "shadow-[#B85565]/20" : "shadow-[#8B3A4A]/20",
    inputBg:       isDark ? "bg-[#2A2A2A]"       : "bg-white",
    inputBorder:   isDark ? "border-[#3A3A3A]"   : "border-[#EDE3E1]",
    tableRowHover: isDark ? "hover:bg-[#2A2A2A]" : "hover:bg-[#FAF7F4]",
    accent:        isDark ? "#B85565"             : "#8B3A4A",
    shadow:        isDark ? "shadow-md"           : "shadow-sm",
    doradoText:    isDark ? "text-[#D4B87A]"      : "text-[#C9A46A]",
  };

  const theme: AdminTheme = {
    mode,
    setMode,
    toggleMode,
    cls,
    colors,
    // Spread cls properties at the top level for backward compatibility
    ...cls,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
