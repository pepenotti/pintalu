import { useState, useCallback } from 'react';
import { ToolType, BrushSettings } from '../store/types';
import { BRUSH_SIZES, BrushSizeKey, DRAWING_COLORS } from '../theme/darkTheme';

const DEFAULT_BRUSH: BrushSettings = {
  size: BRUSH_SIZES.medium.paintbrush,
  opacity: 1,
  color: DRAWING_COLORS[6], // Blue
};

interface UseDrawingReturn {
  activeTool: ToolType;
  brushSettings: BrushSettings;
  brushSizeKey: BrushSizeKey;
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setBrushSizeKey: (key: BrushSizeKey) => void;
  setBrushSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
}

export function useDrawing(): UseDrawingReturn {
  const [activeTool, setActiveTool] = useState<ToolType>('paintbrush');
  const [brushSizeKey, setBrushSizeKeyState] = useState<BrushSizeKey>('medium');
  const [brushSettings, setBrushSettings] = useState<BrushSettings>(DEFAULT_BRUSH);

  const setTool = useCallback((tool: ToolType) => {
    setActiveTool(tool);
    // Update size to match the new tool at the current size key
    setBrushSettings(prev => ({
      ...prev,
      size: getSizeForTool(tool, brushSizeKey),
    }));
  }, [brushSizeKey]);

  const setColor = useCallback((color: string) => {
    setBrushSettings(prev => ({ ...prev, color }));
  }, []);

  const setBrushSizeKey = useCallback((key: BrushSizeKey) => {
    setBrushSizeKeyState(key);
    setBrushSettings(prev => ({
      ...prev,
      size: getSizeForTool(activeTool, key),
    }));
  }, [activeTool]);

  const setOpacity = useCallback((opacity: number) => {
    setBrushSettings(prev => ({ ...prev, opacity }));
  }, []);

  const setBrushSize = useCallback((size: number) => {
    setBrushSettings(prev => ({ ...prev, size }));
  }, []);

  return {
    activeTool,
    brushSettings,
    brushSizeKey,
    setTool,
    setColor,
    setBrushSizeKey,
    setBrushSize,
    setOpacity,
  };
}

function getSizeForTool(tool: ToolType, sizeKey: BrushSizeKey): number {
  const sizes = BRUSH_SIZES[sizeKey];
  switch (tool) {
    case 'pencil':      return sizes.pencil;
    case 'marker':      return sizes.marker;
    case 'paintbrush':  return sizes.paintbrush;
    case 'sprayCan':    return sizes.sprayCan;
    case 'crayon':      return sizes.crayon;
    case 'eraser':      return sizes.eraser;
    default:            return sizes.paintbrush;
  }
}
