export interface ThemeConfig {
  name: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;

    border: string;
    input: string;
    ring: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    inputSheer: string;
    inputSheerHover: string;
    inputDisabledBg: string;
    mutedHover: string;
    destructiveBg: string;
    destructiveBgHover: string;
    destructiveRing: string;
    destructiveBorder: string;
    destructiveFocusBg: string;
    borderInput: string;
    checkedBorder: string;
    checkedBg: string;
    kbdTooltipBg: string;
    switchUnchecked: string;
    switchThumbChecked: string;
    switchThumbUnchecked: string;
    tabsTriggerText: string;
    outlineBg: string;
    outlineBgHover: string;
    activeTabBorder: string;
    avatarOverlayBlend: string;
  };
  radius: string;
  fontFamily?: string;
}

export const defaultLightTheme: ThemeConfig = {
  name: "default-light",
  colors: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
    chart1: "oklch(0.87 0 0)",
    chart2: "oklch(0.556 0 0)",
    chart3: "oklch(0.439 0 0)",
    chart4: "oklch(0.371 0 0)",
    chart5: "oklch(0.269 0 0)",
    sidebar: "oklch(0.985 0 0)",
    sidebarForeground: "oklch(0.145 0 0)",
    sidebarPrimary: "oklch(0.205 0 0)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.97 0 0)",
    sidebarAccentForeground: "oklch(0.205 0 0)",
    sidebarBorder: "oklch(0.922 0 0)",
    sidebarRing: "oklch(0.708 0 0)",
    inputSheer: "transparent",
    inputSheerHover: "transparent",
    inputDisabledBg: "oklch(0.922 0 0 / 50%)",
    mutedHover: "oklch(0.97 0 0)",
    destructiveBg: "oklch(0.577 0.245 27.325 / 10%)",
    destructiveBgHover: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveRing: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveBorder: "oklch(0.577 0.245 27.325)",
    destructiveFocusBg: "oklch(0.577 0.245 27.325 / 10%)",
    borderInput: "oklch(0.922 0 0)",
    checkedBorder: "oklch(0.205 0 0 / 30%)",
    checkedBg: "oklch(0.205 0 0 / 5%)",
    kbdTooltipBg: "oklch(1 0 0 / 20%)",
    switchUnchecked: "oklch(0.922 0 0)",
    switchThumbChecked: "oklch(1 0 0)",
    switchThumbUnchecked: "oklch(1 0 0)",
    tabsTriggerText: "oklch(0.145 0 0 / 60%)",
    outlineBg: "oklch(1 0 0)",
    outlineBgHover: "oklch(0.97 0 0)",
    activeTabBorder: "transparent",
    avatarOverlayBlend: "darken",
  },
  radius: "0.625rem",
};

export const defaultDarkTheme: ThemeConfig = {
  name: "default-dark",
  colors: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    popover: "oklch(0.205 0 0)",
    popoverForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.922 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    mutedForeground: "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.704 0.191 22.216)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.556 0 0)",
    chart1: "oklch(0.87 0 0)",
    chart2: "oklch(0.556 0 0)",
    chart3: "oklch(0.439 0 0)",
    chart4: "oklch(0.371 0 0)",
    chart5: "oklch(0.269 0 0)",
    sidebar: "oklch(0.205 0 0)",
    sidebarForeground: "oklch(0.985 0 0)",
    sidebarPrimary: "oklch(0.488 0.243 264.376)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.269 0 0)",
    sidebarAccentForeground: "oklch(0.985 0 0)",
    sidebarBorder: "oklch(1 0 0 / 10%)",
    sidebarRing: "oklch(0.556 0 0)",
    inputSheer: "oklch(1 0 0 / 30%)",
    inputSheerHover: "oklch(1 0 0 / 50%)",
    inputDisabledBg: "oklch(1 0 0 / 80%)",
    mutedHover: "oklch(0.269 0 0 / 50%)",
    destructiveBg: "oklch(0.704 0.191 22.216 / 20%)",
    destructiveBgHover: "oklch(0.704 0.191 22.216 / 30%)",
    destructiveRing: "oklch(0.704 0.191 22.216 / 40%)",
    destructiveBorder: "oklch(0.704 0.191 22.216 / 50%)",
    destructiveFocusBg: "oklch(0.704 0.191 22.216 / 20%)",
    borderInput: "oklch(1 0 0 / 15%)",
    checkedBorder: "oklch(0.922 0 0 / 20%)",
    checkedBg: "oklch(0.922 0 0 / 10%)",
    kbdTooltipBg: "oklch(0.145 0 0 / 10%)",
    switchUnchecked: "oklch(1 0 0 / 80%)",
    switchThumbChecked: "oklch(0.205 0 0)",
    switchThumbUnchecked: "oklch(0.985 0 0)",
    tabsTriggerText: "oklch(0.708 0 0)",
    outlineBg: "oklch(1 0 0 / 30%)",
    outlineBgHover: "oklch(1 0 0 / 50%)",
    activeTabBorder: "oklch(1 0 0 / 15%)",
    avatarOverlayBlend: "lighten",
  },
  radius: "0.625rem",
};

export const brandBlueTheme: ThemeConfig = {
  name: "brand-blue",
  colors: {
    background: "oklch(0.985 0.002 250)",
    foreground: "oklch(0.145 0.02 250)",
    card: "oklch(0.985 0.002 250)",
    cardForeground: "oklch(0.145 0.02 250)",
    popover: "oklch(0.985 0.002 250)",
    popoverForeground: "oklch(0.145 0.02 250)",
    primary: "oklch(0.488 0.243 264.376)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.94 0.02 250)",
    secondaryForeground: "oklch(0.205 0.02 250)",
    muted: "oklch(0.94 0.015 250)",
    mutedForeground: "oklch(0.556 0.02 250)",
    accent: "oklch(0.92 0.03 250)",
    accentForeground: "oklch(0.205 0.02 250)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.9 0.02 250)",
    input: "oklch(0.9 0.02 250)",
    ring: "oklch(0.488 0.243 264.376)",
    chart1: "oklch(0.87 0.05 250)",
    chart2: "oklch(0.556 0.05 250)",
    chart3: "oklch(0.439 0.05 250)",
    chart4: "oklch(0.371 0.05 250)",
    chart5: "oklch(0.269 0.05 250)",
    sidebar: "oklch(0.96 0.01 250)",
    sidebarForeground: "oklch(0.145 0.02 250)",
    sidebarPrimary: "oklch(0.488 0.243 264.376)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.92 0.03 250)",
    sidebarAccentForeground: "oklch(0.205 0.02 250)",
    sidebarBorder: "oklch(0.9 0.02 250)",
    sidebarRing: "oklch(0.488 0.243 264.376)",
    inputSheer: "transparent",
    inputSheerHover: "transparent",
    inputDisabledBg: "oklch(0.9 0.02 250 / 50%)",
    mutedHover: "oklch(0.92 0.02 250)",
    destructiveBg: "oklch(0.577 0.245 27.325 / 10%)",
    destructiveBgHover: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveRing: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveBorder: "oklch(0.577 0.245 27.325)",
    destructiveFocusBg: "oklch(0.577 0.245 27.325 / 10%)",
    borderInput: "oklch(0.9 0.02 250)",
    checkedBorder: "oklch(0.488 0.243 264.376 / 30%)",
    checkedBg: "oklch(0.488 0.243 264.376 / 5%)",
    kbdTooltipBg: "oklch(0.985 0.002 250 / 20%)",
    switchUnchecked: "oklch(0.9 0.02 250)",
    switchThumbChecked: "oklch(0.985 0 0)",
    switchThumbUnchecked: "oklch(0.985 0 0)",
    tabsTriggerText: "oklch(0.145 0.02 250 / 60%)",
    outlineBg: "oklch(0.985 0.002 250)",
    outlineBgHover: "oklch(0.94 0.02 250)",
    activeTabBorder: "transparent",
    avatarOverlayBlend: "darken",
  },
  radius: "0.75rem",
};

export const brandGreenTheme: ThemeConfig = {
  name: "brand-green",
  colors: {
    background: "oklch(0.985 0.005 155)",
    foreground: "oklch(0.145 0.02 155)",
    card: "oklch(0.985 0.005 155)",
    cardForeground: "oklch(0.145 0.02 155)",
    popover: "oklch(0.985 0.005 155)",
    popoverForeground: "oklch(0.145 0.02 155)",
    primary: "oklch(0.55 0.18 155)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.94 0.02 155)",
    secondaryForeground: "oklch(0.205 0.02 155)",
    muted: "oklch(0.94 0.015 155)",
    mutedForeground: "oklch(0.556 0.02 155)",
    accent: "oklch(0.92 0.03 155)",
    accentForeground: "oklch(0.205 0.02 155)",
    destructive: "oklch(0.577 0.245 27.325)",
    border: "oklch(0.9 0.02 155)",
    input: "oklch(0.9 0.02 155)",
    ring: "oklch(0.55 0.18 155)",
    chart1: "oklch(0.87 0.05 155)",
    chart2: "oklch(0.556 0.05 155)",
    chart3: "oklch(0.439 0.05 155)",
    chart4: "oklch(0.371 0.05 155)",
    chart5: "oklch(0.269 0.05 155)",
    sidebar: "oklch(0.96 0.01 155)",
    sidebarForeground: "oklch(0.145 0.02 155)",
    sidebarPrimary: "oklch(0.55 0.18 155)",
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: "oklch(0.92 0.03 155)",
    sidebarAccentForeground: "oklch(0.205 0.02 155)",
    sidebarBorder: "oklch(0.9 0.02 155)",
    sidebarRing: "oklch(0.55 0.18 155)",
    inputSheer: "transparent",
    inputSheerHover: "transparent",
    inputDisabledBg: "oklch(0.9 0.02 155 / 50%)",
    mutedHover: "oklch(0.92 0.02 155)",
    destructiveBg: "oklch(0.577 0.245 27.325 / 10%)",
    destructiveBgHover: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveRing: "oklch(0.577 0.245 27.325 / 20%)",
    destructiveBorder: "oklch(0.577 0.245 27.325)",
    destructiveFocusBg: "oklch(0.577 0.245 27.325 / 10%)",
    borderInput: "oklch(0.9 0.02 155)",
    checkedBorder: "oklch(0.55 0.18 155 / 30%)",
    checkedBg: "oklch(0.55 0.18 155 / 5%)",
    kbdTooltipBg: "oklch(0.985 0.005 155 / 20%)",
    switchUnchecked: "oklch(0.9 0.02 155)",
    switchThumbChecked: "oklch(0.985 0 0)",
    switchThumbUnchecked: "oklch(0.985 0 0)",
    tabsTriggerText: "oklch(0.145 0.02 155 / 60%)",
    outlineBg: "oklch(0.985 0.005 155)",
    outlineBgHover: "oklch(0.94 0.02 155)",
    activeTabBorder: "transparent",
    avatarOverlayBlend: "darken",
  },
  radius: "0.5rem",
};

export const themePresets: ThemeConfig[] = [
  defaultLightTheme,
  defaultDarkTheme,
  brandBlueTheme,
  brandGreenTheme,
];

const STORAGE_KEY = "whitelabel-theme";

export function loadThemeFromStorage(): ThemeConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeConfig;
  } catch {
    return null;
  }
}

export function saveThemeToStorage(theme: ThemeConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function applyThemeToDOM(theme: ThemeConfig): void {
  const root = document.documentElement;
  root.style.setProperty("--background", theme.colors.background);
  root.style.setProperty("--foreground", theme.colors.foreground);
  root.style.setProperty("--card", theme.colors.card);
  root.style.setProperty("--card-foreground", theme.colors.cardForeground);
  root.style.setProperty("--popover", theme.colors.popover);
  root.style.setProperty("--popover-foreground", theme.colors.popoverForeground);
  root.style.setProperty("--primary", theme.colors.primary);
  root.style.setProperty("--primary-foreground", theme.colors.primaryForeground);
  root.style.setProperty("--secondary", theme.colors.secondary);
  root.style.setProperty("--secondary-foreground", theme.colors.secondaryForeground);
  root.style.setProperty("--muted", theme.colors.muted);
  root.style.setProperty("--muted-foreground", theme.colors.mutedForeground);
  root.style.setProperty("--accent", theme.colors.accent);
  root.style.setProperty("--accent-foreground", theme.colors.accentForeground);
  root.style.setProperty("--destructive", theme.colors.destructive);
  root.style.setProperty("--border", theme.colors.border);
  root.style.setProperty("--input", theme.colors.input);
  root.style.setProperty("--ring", theme.colors.ring);
  root.style.setProperty("--chart-1", theme.colors.chart1);
  root.style.setProperty("--chart-2", theme.colors.chart2);
  root.style.setProperty("--chart-3", theme.colors.chart3);
  root.style.setProperty("--chart-4", theme.colors.chart4);
  root.style.setProperty("--chart-5", theme.colors.chart5);
  root.style.setProperty("--sidebar", theme.colors.sidebar);
  root.style.setProperty("--sidebar-foreground", theme.colors.sidebarForeground);
  root.style.setProperty("--sidebar-primary", theme.colors.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", theme.colors.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-accent", theme.colors.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", theme.colors.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", theme.colors.sidebarBorder);
  root.style.setProperty("--sidebar-ring", theme.colors.sidebarRing);
  root.style.setProperty("--input-sheer", theme.colors.inputSheer);
  root.style.setProperty("--input-sheer-hover", theme.colors.inputSheerHover);
  root.style.setProperty("--input-disabled-bg", theme.colors.inputDisabledBg);
  root.style.setProperty("--muted-hover", theme.colors.mutedHover);
  root.style.setProperty("--destructive-bg", theme.colors.destructiveBg);
  root.style.setProperty("--destructive-bg-hover", theme.colors.destructiveBgHover);
  root.style.setProperty("--destructive-ring", theme.colors.destructiveRing);
  root.style.setProperty("--destructive-border", theme.colors.destructiveBorder);
  root.style.setProperty("--destructive-focus-bg", theme.colors.destructiveFocusBg);
  root.style.setProperty("--border-input", theme.colors.borderInput);
  root.style.setProperty("--checked-border", theme.colors.checkedBorder);
  root.style.setProperty("--checked-bg", theme.colors.checkedBg);
  root.style.setProperty("--kbd-tooltip-bg", theme.colors.kbdTooltipBg);
  root.style.setProperty("--switch-unchecked", theme.colors.switchUnchecked);
  root.style.setProperty("--switch-thumb-checked", theme.colors.switchThumbChecked);
  root.style.setProperty("--switch-thumb-unchecked", theme.colors.switchThumbUnchecked);
  root.style.setProperty("--tabs-trigger-text", theme.colors.tabsTriggerText);
  root.style.setProperty("--outline-bg", theme.colors.outlineBg);
  root.style.setProperty("--outline-bg-hover", theme.colors.outlineBgHover);
  root.style.setProperty("--active-tab-border", theme.colors.activeTabBorder);
  root.style.setProperty("--avatar-overlay-blend", theme.colors.avatarOverlayBlend);
  root.style.setProperty("--radius", theme.radius);
  if (theme.fontFamily) {
    root.style.setProperty("--font-sans", theme.fontFamily);
  }
  root.setAttribute("data-theme", theme.name);
}
