"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Kbd,
  Label,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useTheme,
} from "@whitelabel/ui";
import type { ThemeConfig } from "@whitelabel/ui";
import {
  defaultLightTheme,
  defaultDarkTheme,
  brandBlueTheme,
  brandGreenTheme,
} from "@whitelabel/ui";
import {
  AlertCircleIcon,
  BoldIcon,
  DicesIcon,
  InfoIcon,
  ItalicIcon,
  MoreVerticalIcon,
  PencilIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
  UnderlineIcon,
} from "lucide-react";

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
// Custom themes localStorage helpers
// ---------------------------------------------------------------------------
const CUSTOM_THEMES_KEY = "whitelabel-custom-themes";
const MAX_CUSTOM_THEMES = 20;

function loadCustomThemes(): ThemeConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ThemeConfig[];
  } catch {
    return [];
  }
}

function saveCustomThemes(themes: ThemeConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  } catch {
    // Storage full or unavailable
  }
}

function deleteCustomTheme(
  themes: ThemeConfig[],
  name: string
): ThemeConfig[] {
  const next = themes.filter((t) => t.name !== name);
  saveCustomThemes(next);
  return next;
}

function renameCustomTheme(
  themes: ThemeConfig[],
  oldName: string,
  newName: string
): ThemeConfig[] {
  const next = themes.map((t) =>
    t.name === oldName ? { ...t, name: newName } : t
  );
  saveCustomThemes(next);
  return next;
}

function getNextDefaultName(themes: ThemeConfig[]): string {
  let n = 1;
  const names = new Set(themes.map((t) => t.name));
  while (names.has(`My Theme ${n}`)) n++;
  return `My Theme ${n}`;
}

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
        className="size-8 shrink-0 rounded-md ring-1 ring-foreground/10"
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
    <div className="space-y-8">
      {/* ---- Existing: Card, Buttons, Badges, Input, Switch ---- */}
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

      {/* ---- Form Components ---- */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Form Components
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Checkbox */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Checkbox</Label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox defaultChecked />
                <Label className="text-sm">Checked</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox />
                <Label className="text-sm">Unchecked</Label>
              </div>
            </div>
          </div>

          {/* Radio Group */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Radio Group</Label>
            <RadioGroup defaultValue="option-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="option-1" />
                <Label className="text-sm">Option 1</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="option-2" />
                <Label className="text-sm">Option 2</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Select */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Select</Label>
            <Select defaultValue="apple">
              <SelectTrigger>
                <SelectValue placeholder="Pick a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Slider (standalone demo) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Slider</Label>
            <Slider defaultValue={[40]} max={100} step={1} />
          </div>
        </div>

        {/* Textarea (full width) */}
        <div className="space-y-1.5 max-w-sm">
          <Label className="text-xs text-muted-foreground">Textarea</Label>
          <Textarea placeholder="Write something..." defaultValue="Theme preview text" />
        </div>
      </section>

      {/* ---- Information Display ---- */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Information Display
        </h3>

        <div className="space-y-3">
          <Alert>
            <InfoIcon className="size-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              This is a default alert to display general information.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Avatar */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Avatar</Label>
            <div className="flex gap-2">
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=AB" alt="AB" />
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>CD</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <Label className="text-xs text-muted-foreground">Progress</Label>
            <Progress value={65} />
          </div>

          {/* Kbd */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kbd</Label>
            <div className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Separator</Label>
          <Separator />
        </div>
      </section>

      {/* ---- Navigation ---- */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Navigation
        </h3>

        {/* Tabs */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tabs</Label>
          <Tabs defaultValue="tab-1">
            <TabsList>
              <TabsTrigger value="tab-1">Account</TabsTrigger>
              <TabsTrigger value="tab-2">Settings</TabsTrigger>
              <TabsTrigger value="tab-3">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="tab-1">
              <p className="text-sm text-muted-foreground p-2">
                Manage your account preferences here.
              </p>
            </TabsContent>
            <TabsContent value="tab-2">
              <p className="text-sm text-muted-foreground p-2">
                Configure your application settings.
              </p>
            </TabsContent>
            <TabsContent value="tab-3">
              <p className="text-sm text-muted-foreground p-2">
                View your billing and subscription details.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Breadcrumb */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Breadcrumb</Label>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Theme</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      {/* ---- Overlay (trigger buttons only) ---- */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Overlay
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Dialog trigger */}
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Open Dialog
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a sample dialog to preview theme styles.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Dialog body content goes here.
              </p>
            </DialogContent>
          </Dialog>

          {/* Popover trigger */}
          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" />}>
              Open Popover
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Popover Title</PopoverTitle>
                <PopoverDescription>
                  A small overlay for extra info.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          {/* Tooltip hover demo */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm" />}>
                Hover for Tooltip
              </TooltipTrigger>
              <TooltipContent>
                Tooltip content <Kbd>⌘T</Kbd>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {/* ---- Other ---- */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Other
        </h3>

        {/* Accordion */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Accordion</Label>
          <Accordion>
            <AccordionItem value="item-1">
              <AccordionTrigger>What is theming?</AccordionTrigger>
              <AccordionContent>
                Theming lets you customise colors, spacing, and typography to
                match your brand.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I export my theme?</AccordionTrigger>
              <AccordionContent>
                Yes — themes can be exported as JSON and shared across projects.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Are dark themes supported?</AccordionTrigger>
              <AccordionContent>
                Absolutely. Switch between light and dark presets above.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Toggle & Toggle Group */}
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Toggle</Label>
            <Toggle variant="outline" aria-label="Toggle bold">
              <BoldIcon className="size-4" />
            </Toggle>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Toggle Group</Label>
            <ToggleGroup variant="outline" defaultValue={["bold"]}>
              <ToggleGroupItem value="bold" aria-label="Bold">
                <BoldIcon className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <ItalicIcon className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Underline">
                <UnderlineIcon className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </section>
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

  // Mobile/tablet: tab-based view (editor vs preview)
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  // Editor sub-tab: colors vs typography
  const [editorTab, setEditorTab] = useState<"colors" | "typography">("colors");

  // Custom themes state
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([]);

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [overwriteTarget, setOverwriteTarget] = useState<string | null>(null);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Toast-like warning message
  const [warning, setWarning] = useState<string | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWarning = useCallback((msg: string) => {
    setWarning(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setWarning(null), 3000);
  }, []);

  // Load custom themes from localStorage on mount
  useEffect(() => {
    setCustomThemes(loadCustomThemes());
  }, []);

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

  const updateTypography = useCallback(
    (key: keyof NonNullable<ThemeConfig["typography"]>, value: string) => {
      applyDraft({
        ...draft,
        typography: { ...draft.typography, [key]: value },
      });
    },
    [draft, applyDraft]
  );

  const handleLetterSpacingChange = useCallback(
    (val: number | readonly number[]) => {
      const v = Array.isArray(val) ? val[0] : val;
      updateTypography("letterSpacing", `${v}em`);
    },
    [updateTypography]
  );

  // --- Save theme ---
  const openSaveDialog = useCallback(() => {
    setSaveName(getNextDefaultName(customThemes));
    setOverwriteTarget(null);
    setSaveDialogOpen(true);
  }, [customThemes]);

  const handleSaveConfirm = useCallback(() => {
    const trimmed = saveName.trim();
    if (!trimmed) return;

    const existing = customThemes.find((t) => t.name === trimmed);

    // If name already exists and we haven't confirmed overwrite yet
    if (existing && overwriteTarget !== trimmed) {
      setOverwriteTarget(trimmed);
      return;
    }

    // Check limit (only for new themes, not overwrites)
    if (!existing && customThemes.length >= MAX_CUSTOM_THEMES) {
      showWarning(`Maximum of ${MAX_CUSTOM_THEMES} custom themes reached. Delete one first.`);
      setSaveDialogOpen(false);
      return;
    }

    const themeToSave: ThemeConfig = { ...draft, name: trimmed };
    let next: ThemeConfig[];
    if (existing) {
      next = customThemes.map((t) => (t.name === trimmed ? themeToSave : t));
    } else {
      next = [...customThemes, themeToSave];
    }

    saveCustomThemes(next);
    setCustomThemes(next);
    applyDraft(themeToSave);
    setSaveDialogOpen(false);
    setOverwriteTarget(null);
  }, [saveName, customThemes, overwriteTarget, draft, applyDraft, showWarning]);

  // --- Delete theme ---
  const openDeleteDialog = useCallback((name: string) => {
    setDeleteTarget(name);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const next = deleteCustomTheme(customThemes, deleteTarget);
    setCustomThemes(next);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, customThemes]);

  // --- Rename theme ---
  const openRenameDialog = useCallback(
    (name: string) => {
      setRenameTarget(name);
      setRenameName(name);
      setRenameDialogOpen(true);
    },
    []
  );

  const handleRenameConfirm = useCallback(() => {
    const trimmed = renameName.trim();
    if (!trimmed || !renameTarget) return;
    if (
      trimmed !== renameTarget &&
      customThemes.some((t) => t.name === trimmed)
    ) {
      showWarning("A theme with that name already exists.");
      return;
    }
    const next = renameCustomTheme(customThemes, renameTarget, trimmed);
    setCustomThemes(next);
    // If the renamed theme is currently active, update the draft name too
    if (draft.name === renameTarget) {
      applyDraft({ ...draft, name: trimmed });
    }
    setRenameDialogOpen(false);
    setRenameTarget(null);
  }, [renameName, renameTarget, customThemes, draft, applyDraft, showWarning]);

  // --- Switch to custom theme ---
  const handleCustomThemeSelect = useCallback(
    (ct: ThemeConfig) => {
      applyDraft(ct);
    },
    [applyDraft]
  );

  const radiusNum = parseFloat(draft.radius) || 0.625;

  const editorContent = (
    <div className="space-y-6 pb-8">
      <div className="lg:hidden">
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

      {/* My Themes */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">My Themes</h2>
        {customThemes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No saved themes yet
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {customThemes.map((ct) => (
              <div
                key={ct.name}
                className={`group relative rounded-lg border p-3 text-left text-xs transition-colors hover:border-ring cursor-pointer ${
                  draft.name === ct.name
                    ? "border-ring ring-2 ring-ring/30"
                    : "border-border"
                }`}
                onClick={() => handleCustomThemeSelect(ct)}
              >
                <div className="flex gap-1 mb-1.5">
                  {[
                    ct.colors.primary,
                    ct.colors.secondary,
                    ct.colors.accent,
                    ct.colors.background,
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="size-4 rounded-full border border-border/50"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="font-medium">{ct.name}</span>

                {/* 3-dot menu */}
                <div
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button className="rounded p-0.5 hover:bg-accent">
                          <MoreVerticalIcon className="size-3.5 text-muted-foreground" />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="end" sideOffset={4}>
                      <DropdownMenuItem
                        onClick={() => openRenameDialog(ct.name)}
                      >
                        <PencilIcon className="size-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => openDeleteDialog(ct.name)}
                      >
                        <Trash2Icon className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={openSaveDialog}
            className="flex-1"
          >
            <SaveIcon className="size-4 mr-1.5" />
            Save
          </Button>
        </div>
      </section>

      {/* Editor sub-tabs: Colors / Typography */}
      <div className="flex gap-1 border-b border-border pb-1">
        <button
          onClick={() => setEditorTab("colors")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            editorTab === "colors"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Colors
        </button>
        <button
          onClick={() => setEditorTab("typography")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            editorTab === "typography"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Typography
        </button>
      </div>

      {editorTab === "colors" && (
        <>
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
        </>
      )}

      {editorTab === "typography" && (
        <>
          {/* Font Family: Sans */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Sans-Serif Font</h2>
            <Select
              value={draft.typography?.fontSans || ""}
              onValueChange={(v) => v && updateTypography("fontSans", v)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Default (Geist)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geist, sans-serif">Geist</SelectItem>
                <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                <SelectItem value="'Helvetica Neue', Helvetica, sans-serif">Helvetica Neue</SelectItem>
                <SelectItem value="'Segoe UI', sans-serif">Segoe UI</SelectItem>
                <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* Font Family: Serif */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Serif Font</h2>
            <Select
              value={draft.typography?.fontSerif || ""}
              onValueChange={(v) => v && updateTypography("fontSerif", v)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Default (serif)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                <SelectItem value="'Palatino Linotype', serif">Palatino</SelectItem>
                <SelectItem value="Cambria, serif">Cambria</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* Font Family: Mono */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Monospace Font</h2>
            <Select
              value={draft.typography?.fontMono || ""}
              onValueChange={(v) => v && updateTypography("fontMono", v)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Default (monospace)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="'Geist Mono', monospace">Geist Mono</SelectItem>
                <SelectItem value="'JetBrains Mono', monospace">JetBrains Mono</SelectItem>
                <SelectItem value="'Fira Code', monospace">Fira Code</SelectItem>
                <SelectItem value="'SF Mono', monospace">SF Mono</SelectItem>
                <SelectItem value="Menlo, monospace">Menlo</SelectItem>
                <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* Letter Spacing */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Letter Spacing</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tracking</Label>
                <span className="text-xs text-muted-foreground font-mono">
                  {(parseFloat(draft.typography?.letterSpacing || "0") || 0).toFixed(3)}em
                </span>
              </div>
              <Slider
                value={[parseFloat(draft.typography?.letterSpacing || "0") || 0]}
                min={0}
                max={0.2}
                step={0.005}
                onValueChange={handleLetterSpacingChange}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );

  const previewContent = (
    <div className="overflow-y-auto rounded-xl bg-background p-4 ring-1 ring-foreground/10 sm:p-6">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">
        Live Preview
      </h2>
      <LivePreview />
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem-3rem)]">
      {/* ---- Warning toast ---- */}
      {warning && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-destructive bg-destructive-bg px-4 py-2 text-sm text-destructive shadow-md">
          {warning}
        </div>
      )}

      {/* ---- Save Dialog ---- */}
      <Dialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          setSaveDialogOpen(open);
          if (!open) setOverwriteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Theme</DialogTitle>
            <DialogDescription>
              {overwriteTarget
                ? `A theme named "${overwriteTarget}" already exists. Save again to overwrite it.`
                : "Give your custom theme a name."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={saveName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSaveName(e.target.value);
                setOverwriteTarget(null);
              }}
              placeholder="Theme name"
              className="text-sm"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") handleSaveConfirm();
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button size="sm" onClick={handleSaveConfirm}>
              {overwriteTarget ? "Overwrite" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Rename Dialog ---- */}
      <Dialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Theme</DialogTitle>
            <DialogDescription>
              Enter a new name for &ldquo;{renameTarget}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={renameName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRenameName(e.target.value)
              }
              placeholder="New name"
              className="text-sm"
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter") handleRenameConfirm();
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button size="sm" onClick={handleRenameConfirm}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Theme</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Mobile/tablet: tab toggle layout (< lg) ---- */}
      <div className="flex h-full flex-col lg:hidden">
        <div className="flex shrink-0 gap-1 border-b border-border pb-3 mb-4">
          <button
            onClick={() => setMobileTab("editor")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mobileTab === "editor"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileTab("preview")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mobileTab === "preview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {mobileTab === "editor" ? editorContent : previewContent}
        </div>
      </div>

      {/* ---- Desktop: side-by-side layout (>= lg) ---- */}
      <div className="hidden h-full gap-6 lg:flex">
        {/* Left panel: editors */}
        <div className="w-[420px] shrink-0 overflow-y-auto pr-2">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Theme Editor</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customize your dashboard theme in real time.
            </p>
          </div>
          {editorContent}
        </div>

        {/* Right panel: live preview */}
        <div className="min-w-[300px] flex-1">
          {previewContent}
        </div>
      </div>
    </div>
  );
}
