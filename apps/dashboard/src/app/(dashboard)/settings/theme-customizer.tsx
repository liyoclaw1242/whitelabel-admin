"use client";

import { useCallback, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Slider,
  useTheme,
  defaultLightTheme,
} from "@whitelabel/ui";
import type { ThemeConfig } from "@whitelabel/ui";
import { CheckIcon, RotateCcwIcon } from "lucide-react";

const colorTokenLabels: { key: keyof ThemeConfig["colors"]; label: string }[] = [
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
      className="group relative flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors hover:border-ring"
      data-active={isActive || undefined}
      style={{
        borderColor: isActive ? "var(--ring)" : undefined,
      }}
    >
      {isActive && (
        <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-3" />
        </div>
      )}
      <div className="flex gap-1">
        <div
          className="size-5 rounded-sm border"
          style={{ backgroundColor: preset.colors.primary }}
          title="Primary"
        />
        <div
          className="size-5 rounded-sm border"
          style={{ backgroundColor: preset.colors.secondary }}
          title="Secondary"
        />
        <div
          className="size-5 rounded-sm border"
          style={{ backgroundColor: preset.colors.accent }}
          title="Accent"
        />
        <div
          className="size-5 rounded-sm border"
          style={{ backgroundColor: preset.colors.background }}
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
        className="size-8 shrink-0 rounded-md border"
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
  const { theme, setTheme, presets } = useTheme();
  const [draft, setDraft] = useState<ThemeConfig>(theme);

  const updateColor = useCallback(
    (key: keyof ThemeConfig["colors"], value: string) => {
      const next = {
        ...draft,
        name: "custom",
        colors: { ...draft.colors, [key]: value },
      };
      setDraft(next);
      setTheme(next); // live preview
    },
    [draft, setTheme],
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
    setDraft(defaultLightTheme);
    setTheme(defaultLightTheme);
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
          <CardTitle>Color Tokens</CardTitle>
          <CardDescription>
            Fine-tune individual color values. Changes apply in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {colorTokenLabels.map(({ key, label }) => (
              <ColorTokenInput
                key={key}
                label={label}
                value={draft.colors[key]}
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
              className="size-12 border bg-primary"
              style={{ borderRadius: draft.radius }}
            />
            <div
              className="size-12 border bg-secondary"
              style={{ borderRadius: draft.radius }}
            />
            <div
              className="size-12 border bg-accent"
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
