"use client";

import { useCallback, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Label,
  Separator,
  Slider,
  useTheme,
  defaultTheme,
} from "@whitelabel/ui";
import type { ThemeConfig, ColorTokens } from "@whitelabel/ui";
import { CheckIcon, RotateCcwIcon } from "lucide-react";

const colorTokenLabels: { key: keyof ColorTokens; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
  { key: "primary", label: "Primary" },
  { key: "primaryForeground", label: "Primary Foreground" },
  { key: "secondary", label: "Secondary" },
  { key: "secondaryForeground", label: "Secondary Foreground" },
  { key: "muted", label: "Muted" },
  { key: "mutedForeground", label: "Muted Foreground" },
  { key: "accent", label: "Accent" },
  { key: "accentForeground", label: "Accent Foreground" },
  { key: "destructive", label: "Destructive" },
  { key: "border", label: "Border" },
  { key: "ring", label: "Ring" },
];

function PresetCard({
  preset,
  isActive,
  onSelect,
}: {
  preset: ThemeConfig;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl bg-muted/30 p-3 text-left transition-all ring-1 ring-foreground/10 hover:ring-ring/60",
        isActive && "ring-2 ring-ring"
      )}
      data-active={isActive || undefined}
    >
      {isActive && (
        <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-3" />
        </div>
      )}
      <div className="flex gap-1">
        <div
          className="size-5 rounded-sm ring-1 ring-foreground/10"
          style={{ backgroundColor: preset.light.primary }}
          title="Primary"
        />
        <div
          className="size-5 rounded-sm ring-1 ring-foreground/10"
          style={{ backgroundColor: preset.light.secondary }}
          title="Secondary"
        />
        <div
          className="size-5 rounded-sm ring-1 ring-foreground/10"
          style={{ backgroundColor: preset.light.accent }}
          title="Accent"
        />
        <div
          className="size-5 rounded-sm ring-1 ring-foreground/10"
          style={{ backgroundColor: preset.light.background }}
          title="Background"
        />
      </div>
      <span className="text-sm font-medium capitalize">
        {preset.name.replace(/-/g, " ")}
      </span>
    </button>
  );
}

function ColorTokenInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-8 shrink-0 rounded-md ring-1 ring-foreground/10"
        style={{ backgroundColor: value }}
      />
      <div className="grid flex-1 gap-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function ThemeCustomizer() {
  const { theme, setTheme, presets, colorMode } = useTheme();
  const [draft, setDraft] = useState<ThemeConfig>(theme);

  const activeColors = colorMode === "dark" ? draft.dark : draft.light;

  const updateColor = useCallback(
    (key: keyof ColorTokens, value: string) => {
      const modeKey = colorMode === "dark" ? "dark" : "light";
      const next: ThemeConfig = {
        ...draft,
        name: "custom",
        [modeKey]: { ...draft[modeKey], [key]: value },
      };
      setDraft(next);
      setTheme(next);
    },
    [draft, setTheme, colorMode],
  );

  const updateRadius = useCallback(
    (value: number) => {
      const next = { ...draft, name: "custom", radius: `${value}rem` };
      setDraft(next);
      setTheme(next);
    },
    [draft, setTheme],
  );

  const applyPreset = useCallback(
    (preset: ThemeConfig) => {
      setDraft(preset);
      setTheme(preset);
    },
    [setTheme],
  );

  const resetToDefault = useCallback(() => {
    setDraft(defaultTheme);
    setTheme(defaultTheme);
  }, [setTheme]);

  const radiusValue = parseFloat(draft.radius) || 0.625;

  return (
    <div className="space-y-6">
      {/* Preset Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Presets</CardTitle>
          <CardDescription>
            Choose a preset theme or customize individual tokens below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {presets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                isActive={draft.name === preset.name}
                onSelect={() => applyPreset(preset)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Color Tokens ({colorMode === "dark" ? "Dark" : "Light"})</CardTitle>
          <CardDescription>
            Fine-tune individual color values for the current mode. Use the header toggle to switch modes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {colorTokenLabels.map(({ key, label }) => (
              <ColorTokenInput
                key={key}
                label={label}
                value={activeColors[key]}
                onChange={(v) => updateColor(key, v)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>Border Radius</CardTitle>
          <CardDescription>
            Adjust the global border radius for all components.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Slider
              value={[radiusValue]}
              onValueChange={(v) => updateRadius(Array.isArray(v) ? v[0] : v)}
              min={0}
              max={1.5}
              step={0.125}
              className="flex-1"
            />
            <span className="w-16 text-right font-mono text-sm text-muted-foreground">
              {radiusValue}rem
            </span>
          </div>
          <div className="mt-4 flex gap-3">
            <div
              className="size-12 bg-primary ring-1 ring-foreground/10"
              style={{ borderRadius: draft.radius }}
            />
            <div
              className="size-12 bg-secondary ring-1 ring-foreground/10"
              style={{ borderRadius: draft.radius }}
            />
            <div
              className="size-12 bg-accent ring-1 ring-foreground/10"
              style={{ borderRadius: draft.radius }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Separator />
      <div className="flex items-center gap-3">
        <Button onClick={resetToDefault} variant="outline">
          <RotateCcwIcon className="mr-2 size-4" />
          Reset to Default
        </Button>
        <p className="text-xs text-muted-foreground">
          Theme is saved automatically as you make changes.
        </p>
      </div>
    </div>
  );
}
