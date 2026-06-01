// ─── Warm kids' app palette ────────────────────────────────────────────────────

export const colors = {
  // Background layers
  background: '#EDE3D6',    // warm sandy beige (app background)
  surface: '#FAF5EF',       // lighter cream (toolbar card background)
  surfaceRaised: '#F0E8DC', // slightly raised element bg
  border: '#D9CCBC',        // subtle warm border

  // Text
  textPrimary: '#3A2A1A',   // dark brown
  textSecondary: '#8B7355', // medium warm brown

  // Accent (selected tool / brush size)
  accent: '#BF8A4A',        // warm golden-tan
  accentMuted: '#F0DFC4',   // light tan highlight for selected item

  // Status
  danger: '#D94040',
  success: '#4CAF82',
  dangerSurface: '#3A1A1A',
  successSurface: '#1A3A2A',

  // Canvas background default
  canvasDefault: '#FAFAF8',
} as const;

// ─── 16 kid-friendly drawing colors ───────────────────────────────────────────
// Row 1 (10): vivid spectrum — coral → red
// Row 2 (6): neutrals & earth tones

export const DRAWING_COLORS: string[] = [
  // Row 1
  '#FF7B72', // Coral / Salmon
  '#FF8C42', // Orange
  '#FFD93D', // Yellow
  '#4CBB5A', // Green
  '#26A69A', // Teal
  '#42A5F5', // Sky Blue
  '#5C6BC0', // Blue
  '#9575CD', // Purple
  '#FF80B4', // Pink
  '#E53935', // Red
  // Row 2
  '#A0522D', // Brown
  '#C9A227', // Gold
  '#9E9E9E', // Gray
  '#FFFFFF', // White
  '#D0D0D0', // Light Gray
  '#212121', // Black
];

// ─── Spacing & sizing ─────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

// ─── Tool icon mapping ────────────────────────────────────────────────────────

export const TOOL_LABELS: Record<string, string> = {
  pencil: '✏️',
  marker: '🖊️',
  paintbrush: '🖌️',
  sprayCan: '💨',
  crayon: '🖍️',
  fillBucket: '🪣',
  eraser: '⬜',
  eraseRegion: '✂️',
};

// ─── Brush size steps ─────────────────────────────────────────────────────────

export const BRUSH_SIZES = {
  small:  { pencil: 3,  marker: 8,  paintbrush: 12, sprayCan: 20, crayon: 6,  eraser: 20 },
  medium: { pencil: 6,  marker: 16, paintbrush: 24, sprayCan: 36, crayon: 12, eraser: 36 },
  large:  { pencil: 12, marker: 28, paintbrush: 44, sprayCan: 60, crayon: 22, eraser: 60 },
} as const;

export type BrushSizeKey = keyof typeof BRUSH_SIZES;
