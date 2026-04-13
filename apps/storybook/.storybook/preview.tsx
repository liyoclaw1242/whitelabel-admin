import React, { useEffect } from "react";
import type { Decorator, Preview } from "@storybook/react";
import { useGlobals } from "storybook/internal/preview-api";
import {
  ThemeProvider,
  tweakcnPresets,
  useTheme,
  type ThemeConfig,
  type ThemePreset,
} from "@whitelabel/ui";
import "../src/styles.css";

const THEME_STORAGE_KEY = "whitelabel-theme";
const COLOR_MODE_STORAGE_KEY = "whitelabel-color-mode";

// tweakcn presets carry category + source on top of the ThemeConfig shape;
// strip those and the remainder is a valid ThemeConfig for setTheme().
function presetToThemeConfig(preset: ThemePreset): ThemeConfig {
  const { category: _c, source: _s, ...rest } = preset;
  return rest as ThemeConfig;
}

function readInitialPreset(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { name?: string };
    return parsed?.name ?? "";
  } catch {
    return "";
  }
}

function readInitialColorMode(): "light" | "dark" | "" {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return "";
}

function readInitialRadius(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { radius?: string };
    return parsed?.radius ?? "";
  } catch {
    return "";
  }
}

const RADIUS_OPTIONS = [
  { value: "0rem", title: "0" },
  { value: "0.25rem", title: "0.25" },
  { value: "0.375rem", title: "0.375" },
  { value: "0.5rem", title: "0.5" },
  { value: "0.625rem", title: "0.625 (default)" },
  { value: "0.75rem", title: "0.75" },
  { value: "1rem", title: "1" },
  { value: "1.25rem", title: "1.25" },
  { value: "1.5rem", title: "1.5" },
];

// Bridges Storybook globals into the @whitelabel/ui ThemeContext.
// Props are passed down from the decorator (where useGlobals is allowed).
interface ThemeToolbarSyncProps {
  children: React.ReactNode;
  presetName: string;
  colorModeGlobal: "light" | "dark" | "";
  radiusGlobal: string;
}

function ThemeToolbarSync({ children, presetName, colorModeGlobal, radiusGlobal }: ThemeToolbarSyncProps) {
  const { theme, setTheme, setColorMode } = useTheme();

  // Apply preset when the toolbar value changes. Empty string means
  // "don't touch" so the persisted localStorage theme stays authoritative.
  useEffect(() => {
    if (!presetName) return;
    const found = tweakcnPresets.find((p) => p.name === presetName);
    if (!found) return;
    const next = presetToThemeConfig(found);
    setTheme({ ...next, radius: radiusGlobal || next.radius });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetName]);

  useEffect(() => {
    if (!colorModeGlobal) return;
    setColorMode(colorModeGlobal);
  }, [colorModeGlobal, setColorMode]);

  useEffect(() => {
    if (!radiusGlobal) return;
    if (theme.radius === radiusGlobal) return;
    setTheme({ ...theme, radius: radiusGlobal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusGlobal]);

  return <>{children}</>;
}

// useGlobals must be called directly inside the decorator function (Storybook rule).
const withTheme: Decorator = (Story, context) => {
  const [globals] = useGlobals();
  const presetName = (globals.preset as string | undefined) ?? "";
  const colorModeGlobal = (globals.colorMode as "light" | "dark" | "" | undefined) ?? "";
  const radiusGlobal = (globals.radius as string | undefined) ?? "";

  return (
    <ThemeProvider>
      <ThemeToolbarSync presetName={presetName} colorModeGlobal={colorModeGlobal} radiusGlobal={radiusGlobal}>
        <Story />
      </ThemeToolbarSync>
    </ThemeProvider>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  initialGlobals: {
    preset: readInitialPreset(),
    colorMode: readInitialColorMode(),
    radius: readInitialRadius(),
  },
  globalTypes: {
    preset: {
      description: "Theme preset (tweakcn)",
      toolbar: {
        title: "Preset",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "", title: "— (persisted)" },
          ...tweakcnPresets.map((p) => ({ value: p.name, title: p.name })),
        ],
      },
    },
    colorMode: {
      description: "Color mode",
      toolbar: {
        title: "Mode",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "", title: "— (persisted)" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    radius: {
      description: "Border radius",
      toolbar: {
        title: "Radius",
        icon: "component",
        dynamicTitle: true,
        items: [
          { value: "", title: "— (persisted)" },
          ...RADIUS_OPTIONS,
        ],
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
