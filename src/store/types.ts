// ─── Tool types ───────────────────────────────────────────────────────────────

export type ToolType =
  | 'pencil'
  | 'marker'
  | 'paintbrush'
  | 'sprayCan'
  | 'crayon'
  | 'fillBucket'
  | 'eraser'
  | 'eraseRegion';

// ─── Brush settings ───────────────────────────────────────────────────────────

export interface BrushSettings {
  size: number;      // px, 3–60
  opacity: number;   // 0–1
  color: string;     // hex
}

// ─── Draw commands (command pattern for undo/redo) ────────────────────────────

export interface PointXY {
  x: number;
  y: number;
}

export interface StrokePathCommand {
  type: 'strokePath';
  id: string;
  tool: Exclude<ToolType, 'fillBucket' | 'eraseRegion'>;
  points: PointXY[];
  color: string;
  size: number;
  opacity: number;
}

export interface SprayDotsCommand {
  type: 'sprayDots';
  id: string;
  dots: PointXY[];
  color: string;
  dotRadius: number;
  opacity: number;
}

export interface FillRegionCommand {
  type: 'fillRegion';
  id: string;
  x: number;
  y: number;
  color: string;
  antialiased: boolean;
  // Logical canvas dimensions — used to render the image at the correct size
  canvasWidth: number;
  canvasHeight: number;
  // The resulting filled image is stored as a base64 PNG snapshot diff
  resultImageBase64: string;
}

export interface EraseRegionCommand {
  type: 'eraseRegion';
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClearCanvasCommand {
  type: 'clearCanvas';
  id: string;
  backgroundColor: string;
}

export type DrawCommand =
  | StrokePathCommand
  | SprayDotsCommand
  | FillRegionCommand
  | EraseRegionCommand
  | ClearCanvasCommand;

// ─── Project ──────────────────────────────────────────────────────────────────

export type FillMode = 'antialiased' | 'pixel';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  canvasWidth: number;
  canvasHeight: number;
  fillMode: FillMode;
  backgroundColor: string;
}

// ─── Canvas presets ───────────────────────────────────────────────────────────

export interface CanvasPreset {
  label: string;
  emoji: string;
  width: number;
  height: number;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { label: 'Square S',  emoji: '◽', width: 400,  height: 400  },
  { label: 'Portrait',  emoji: '📄', width: 600,  height: 800  },
  { label: 'Landscape', emoji: '🖼', width: 800,  height: 600  },
  { label: 'Square L',  emoji: '⬜', width: 1080, height: 1080 },
  { label: 'Wide',      emoji: '🎞', width: 1280, height: 720  },
];

export const CANVAS_MIN_SIZE = 200;
export const CANVAS_MAX_SIZE = 2048;

// ─── Drawing state (runtime, not persisted) ───────────────────────────────────

export interface DrawingState {
  activeTool: ToolType;
  brushSettings: BrushSettings;
  activeProjectId: string | null;
}
