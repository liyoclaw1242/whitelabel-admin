"use client";

import { useCallback, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Slider,
  Switch,
  useTheme,
} from "@whitelabel/ui";
import type { ThemeConfig } from "@whitelabel/ui";
import {
  defaultLightTheme,
  defaultDarkTheme,
  brandBlueTheme,
  brandGreenTheme,
} from "@whitelabel/ui";
import { DicesIcon, RotateCcwIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Token groups: only the ~20 primary tokens users should edit directly
// ---------------------------------------------------------------------------
const TOKEN_GROUPS: {
  label: string;
  tokens: { key: keyof ThemeConfig["colors"]; label: string }[];
}[] = [
  {
    label: "Primary",
    tokens: [
      { key: "primary", label: "Primary" },
      { key: "primaryForeground", label: "Primary Foreground" },
    ],
  },
  {
    label: "Secondary",
    tokens: [
      { key: "secondary", label: "Secondary" },
      { key: "secondaryForeground", label: "Secondary Foreground" },
    ],
  },
  {
    label: "Accent",
    tokens: [
      { key: "accent", label: "Accent" },
      { key: "accentForeground", label: "Accent Foreground" },
    ],
  },
  {
    label: "Muted",
    tokens: [
      { key: "muted", label: "Muted" },
      { key: "mutedForeground", label: "Muted Foreground" },
    ],
  },
  {
    label: "Base",
    tokens: [
      { key: "background", label: "Background" },
      { key: "foreground", label: "Foreground" },
    ],
  },
  {
    label: "Card",
    tokens: [
      { key: "card", label: "Card" },
      { key: "cardForeground", label: "Card Foreground" },
    ],
  },
  {
    label: "Destructive",
    tokens: [{ key: "destructive", label: "Destructive" }],
  },
  {
    label: "Border & Input",
    tokens: [
      { key: "border", label: "Border" },
      { key: "input", label: "Input" },
      { key: "ring", label: "Ring" },
    ],
  },
  {
    label: "Sidebar",
    tokens: [
      { key: "sidebar", label: "Sidebar" },
      { key: "sidebarForeground", label: "Sidebar Foreground" },
      { key: "sidebarPrimary", label: "Sidebar Primary" },
      { key: "sidebarAccent", label: "Sidebar Accent" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------
const PRESETS: ThemeConfig[] = [
  defaultLightTheme,
  defaultDarkTheme,
  brandBlueTheme,
  brandGreenTheme,
];

// ---------------------------------------------------------------------------
// Randomize: generate a harmonious light-theme palette from a random hue
// ---------------------------------------------------------------------------
function generateRandomTheme(): ThemeConfig {
  const hue = Math.round(Math.random() * 360);
  const destructiveColor = "oklch(0.577 0.245 27.325)";

  const colors: ThemeConfig["colors"] = {
    background: `oklch(0.985 0.005 ${hue})`,
    foreground: `oklch(0.145 0.02 ${hue})`,
    card: `oklch(0.985 0.005 ${hue})`,
    cardForeground: `oklch(0.145 0.02 ${hue})`,
    popover: `oklch(0.985 0.005 ${hue})`,
    popoverForeground: `oklch(0.145 0.02 ${hue})`,
    primary: `oklch(0.45 0.2 ${hue})`,
    primaryForeground: "oklch(0.985 0 0)",
    secondary: `oklch(0.94 0.02 ${hue})`,
    secondaryForeground: `oklch(0.205 0.02 ${hue})`,
    muted: `oklch(0.94 0.015 ${hue})`,
    mutedForeground: `oklch(0.556 0.02 ${hue})`,
    accent: `oklch(0.92 0.03 ${hue})`,
    accentForeground: `oklch(0.205 0.02 ${hue})`,
    destructive: destructiveColor,
    border: `oklch(0.9 0.02 ${hue})`,
    input: `oklch(0.9 0.02 ${hue})`,
    ring: `oklch(0.45 0.2 ${hue})`,
    chart1: `oklch(0.87 0.05 ${hue})`,
    chart2: `oklch(0.556 0.05 ${hue})`,
    chart3: `oklch(0.439 0.05 ${hue})`,
    chart4: `oklch(0.371 0.05 ${hue})`,
    chart5: `oklch(0.269 0.05 ${hue})`,
    sidebar: `oklch(0.96 0.01 ${hue})`,
    sidebarForeground: `oklch(0.145 0.02 ${hue})`,
    sidebarPrimary: `oklch(0.45 0.2 ${hue})`,
    sidebarPrimaryForeground: "oklch(0.985 0 0)",
    sidebarAccent: `oklch(0.92 0.03 ${hue})`,
    sidebarAccentForeground: `oklch(0.205 0.02 ${hue})`,
    sidebarBorder: `oklch(0.9 0.02 ${hue})`,
    sidebarRing: `oklch(0.45 0.2 ${hue})`,
    // Derived tokens
    inputSheer: "transparent",
    inputSheerHover: "transparent",
    inputDisabledBg: `oklch(0.9 0.02 ${hue} / 50%)`,
    mutedHover: `oklch(0.92 0.02 ${hue})`,
    destructiveBg: `${destructiveColor.replace(")", " / 10%)")}`,
    destructiveBgHover: `${destructiveColor.replace(")", " / 20%)")}`,
    destructiveRing: `${destructiveColor.replace(")", " / 20%)")}`,
    destructiveBorder: destructiveColor,
    destructiveFocusBg: `${destructiveColor.replace(")", " / 10%)")}`,
    borderInput: `oklch(0.9 0.02 ${hue})`,
    checkedBorder: `oklch(0.45 0.2 ${hue} / 30%)`,
    checkedBg: `oklch(0.45 0.2 ${hue} / 5%)`,
    kbdTooltipBg: `oklch(0.985 0.005 ${hue} / 20%)`,
    switchUnchecked: `oklch(0.9 0.02 ${hue})`,
    switchThumbChecked: "oklch(0.985 0 0)",
    switchThumbUnchecked: "oklch(0.985 0 0)",
    tabsTriggerText: `oklch(0.145 0.02 ${hue} / 60%)`,
    outlineBg: `oklch(0.985 0.005 ${hue})`,
    outlineBgHover: `oklch(0.94 0.02 ${hue})`,
    activeTabBorder: "transparent",
    avatarOverlayBlend: "darken",
  };

  return {
    name: `random-${hue}`,
    colors,
    radius: "0.625rem",
  };
}

// ---------------------------------------------------------------------------
// Derive non-primary tokens from updated primary ones
// ---------------------------------------------------------------------------
function deriveFullTheme(
  base: ThemeConfig,
  overrides: Partial<ThemeConfig["colors"]>
): ThemeConfig {
  const colors = { ...base.colors, ...overrides };

  // Keep derived tokens in sync with primary ones
  colors.popover = colors.background;
  colors.popoverForeground = colors.foreground;
  colors.sidebarBorder = colors.border;
  colors.sidebarRing = colors.ring;
  colors.borderInput = colors.border;

  // Destructive derived
  const dest = colors.destructive;
  colors.destructiveBg = `${dest.replace(/\)$/, " / 10%)")}`;
  colors.destructiveBgHover = `${dest.replace(/\)$/, " / 20%)")}`;
  colors.destructiveRing = `${dest.replace(/\)$/, " / 20%)")}`;
  colors.destructiveBorder = dest;
  colors.destructiveFocusBg = `${dest.replace(/\)$/, " / 10%)")}`;

  // Primary derived
  const prim = colors.primary;
  colors.checkedBorder = `${prim.replace(/\)$/, " / 30%)")}`;
  colors.checkedBg = `${prim.replace(/\)$/, " / 5%)")}`;

  return { ...base, colors };
}

// ---------------------------------------------------------------------------
// Color swatch + text input for a single token
// ---------------------------------------------------------------------------
function TokenEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-8 shrink-0 rounded-md border border-border shadow-sm"
        style={{ background: value }}
      />
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          className="h-7 text-xs font-mono"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview panel
// ---------------------------------------------------------------------------
function LivePreview() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sample Card</CardTitle>
          <CardDescription>
            This card previews how your theme looks on common components.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>

          <div className="max-w-sm">
            <Label className="mb-1.5 block text-sm">Text Input</Label>
            <Input placeholder="Type something..." />
          </div>

          <div className="flex items-center gap-3">
            <Switch defaultChecked />
            <Label className="text-sm">Toggle option</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ThemeEditorPage() {
  const { theme, setTheme, presets } = useTheme();
  // Local draft state so we can batch edits before auto-saving
  const [draft, setDraft] = useState<ThemeConfig>(theme);

  // Whenever draft changes, apply it immediately via setTheme
  const applyDraft = useCallback(
    (next: ThemeConfig) => {
      setDraft(next);
      setTheme(next);
    },
    [setTheme]
  );

  const updateColor = useCallback(
    (key: keyof ThemeConfig["colors"], value: string) => {
      const derived = deriveFullTheme(draft, { [key]: value });
      applyDraft(derived);
    },
    [draft, applyDraft]
  );

  const handlePreset = useCallback(
    (preset: ThemeConfig) => {
      applyDraft(preset);
    },
    [applyDraft]
  );

  const handleRandomize = useCallback(() => {
    applyDraft(generateRandomTheme());
  }, [applyDraft]);

  const handleReset = useCallback(() => {
    applyDraft(defaultLightTheme);
  }, [applyDraft]);

  const handleRadiusChange = useCallback(
    (val: number | readonly number[]) => {
      const v = Array.isArray(val) ? val[0] : val;
      applyDraft({ ...draft, radius: `${v}rem` });
    },
    [draft, applyDraft]
  );

  const radiusNum = parseFloat(draft.radius) || 0.625;

  return (
    <div className="flex h-[calc(100vh-3.5rem-3rem)] gap-6">
      {/* ---- Left panel: editors ---- */}
      <div className="w-[420px] shrink-0 overflow-y-auto pr-2 space-y-6 pb-8">
        <div>
          <h1 className="text-xl font-semibold">Theme Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your dashboard theme in real time.
          </p>
        </div>

        {/* Presets */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Presets</h2>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePreset(preset)}
                className={`rounded-lg border p-3 text-left text-xs transition-colors hover:border-ring ${
                  draft.name === preset.name
                    ? "border-ring ring-2 ring-ring/30"
                    : "border-border"
                }`}
              >
                <div className="flex gap-1 mb-1.5">
                  {[
                    preset.colors.primary,
                    preset.colors.secondary,
                    preset.colors.accent,
                    preset.colors.background,
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="size-4 rounded-full border border-border/50"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="font-medium capitalize">
                  {preset.name.replace(/-/g, " ")}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Controls */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium">Controls</h2>

          {/* Radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Border Radius</Label>
              <span className="text-xs text-muted-foreground font-mono">
                {radiusNum.toFixed(3)}rem
              </span>
            </div>
            <Slider
              value={[radiusNum]}
              min={0}
              max={1.5}
              step={0.025}
              onValueChange={handleRadiusChange}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRandomize}
              className="flex-1"
            >
              <DicesIcon className="size-4 mr-1.5" />
              Randomize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
            >
              <RotateCcwIcon className="size-4 mr-1.5" />
              Reset
            </Button>
          </div>
        </section>

        {/* Token groups */}
        {TOKEN_GROUPS.map((group) => (
          <section key={group.label} className="space-y-3">
            <h2 className="text-sm font-medium">{group.label}</h2>
            <div className="space-y-2">
              {group.tokens.map((t) => (
                <TokenEditor
                  key={t.key}
                  label={t.label}
                  value={draft.colors[t.key]}
                  onChange={(v) => updateColor(t.key, v)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ---- Right panel: live preview ---- */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-background p-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">
          Live Preview
        </h2>
        <LivePreview />
      </div>
    </div>
  );
}
