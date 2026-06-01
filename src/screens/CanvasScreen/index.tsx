import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import RNShake from 'react-native-shake';

import { CanvasView, CanvasViewRef } from '../../components/Canvas/CanvasView';
import { EraseRegionOverlay } from '../../components/Canvas/EraseRegionOverlay';
import { TopBar } from '../../components/Toolbar/TopBar';
import { BottomToolbar } from '../../components/Toolbar/BottomToolbar';
import { BrushSizePanel } from '../../components/Toolbar/BrushSizePanel';
import { useHistory } from '../../hooks/useHistory';
import { useDrawing } from '../../hooks/useDrawing';
import { useAutoSave } from '../../hooks/useAutoSave';
import { saveProject, getAllProjects, nextDrawingName } from '../../store/projectsStore';
import { Project, DrawCommand, EraseRegionCommand, ToolType } from '../../store/types';
import { colors } from '../../theme/darkTheme';
import { DRAWING_COLORS } from '../../theme/darkTheme';
import { ClearConfirmModal } from '../../components/ClearConfirmModal';
import { FloatingToolPill } from '../../components/Toolbar/FloatingToolPill';
import { useLanguage } from '../../i18n';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation';

type RouteParams = {
  projectId?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  fillMode?: 'antialiased' | 'pixel';
  backgroundColor?: string;
};

export default function CanvasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = (route.params ?? {}) as RouteParams;
  const { width: screenW } = useWindowDimensions();
  const { t } = useLanguage();

  // ─── Project bootstrap ───────────────────────────────────────────────────
  const [project, setProject] = useState<Project>(() => {
    if (params.projectId) {
      const found = getAllProjects().find(p => p.id === params.projectId);
      if (found) return found;
    }
    // For new drawings, canvasWidth/Height will be corrected by handleCanvasAreaLayout.
    // We intentionally do NOT call saveProject here — side effects in state
    // initializers run twice in React Strict Mode and can race with layout.
    return {
      id: Date.now().toString(),
      name: nextDrawingName(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      canvasWidth: params.canvasWidth ?? 800,
      canvasHeight: params.canvasHeight ?? 600,
      fillMode: params.fillMode ?? 'antialiased',
      backgroundColor: params.backgroundColor ?? '#FAFAF8',
    };
  });

  // ─── Drawing state ───────────────────────────────────────────────────────
  const drawing = useDrawing();
  const history = useHistory(project.id);
  const canvasRef = useRef<CanvasViewRef>(null);

  // For new drawings, the canvas must not render until the area dimensions
  // are known from layout. Otherwise Skia allocates a surface with the full
  // screen size, then immediately recreates it — the surface swap races the
  // GPU on real devices and crashes intermittently (never on the simulator).
  const [canvasReady, setCanvasReady] = useState(!!params.projectId);

  // Load history for existing projects
  useEffect(() => {
    if (params.projectId) {
      history.loadFromProject(params.projectId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.projectId]);

  // ─── Erase region state ──────────────────────────────────────────────────
  const [eraseRegionActive, setEraseRegionActive] = useState(false);
  const canvasAreaSizeRef = useRef({ width: 0, height: 0 });

  const handleToolSelect = useCallback(
    (tool: typeof drawing.activeTool) => {
      if (tool === 'eraseRegion') {
        setEraseRegionActive(true);
      } else {
        setEraseRegionActive(false);
        drawing.setTool(tool);
      }
    },
    [drawing]
  );

  // ─── Shake to undo ───────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = RNShake.addListener(() => {
        history.undo();
      });
      return () => sub.remove();
    }, [history])
  );

  // ─── Auto-save ───────────────────────────────────────────────────────────
  const getSnapshotBase64 = useCallback(async () => {
    return canvasRef.current?.getSnapshotBase64() ?? null;
  }, []);

  const { save } = useAutoSave({ project, getSnapshotBase64 });

  // Save and return to Gallery
  const handleSave = useCallback(async () => {
    await save();
    navigation.goBack();
  }, [save, navigation]);

  // Keep a stable ref to save so the focus effect never re-runs on mid-render
  // project changes (which would call makeImageSnapshot during a GPU surface
  // recreation and crash on device).
  const saveRef = useRef(save);
  saveRef.current = save;

  // Auto-save when navigating away — stable deps, only runs on blur/unmount.
  useFocusEffect(
    useCallback(() => {
      return () => {
        saveRef.current();
      };
    }, []) // intentionally empty — saveRef.current is always current
  );

  // ─── Clear canvas ────────────────────────────────────────────────────────
  const [clearModalVisible, setClearModalVisible] = useState(false);

  const handleClear = useCallback(() => {
    setClearModalVisible(true);
  }, []);

  const handleClearConfirm = useCallback(() => {
    setClearModalVisible(false);
    history.clearHistory();
  }, [history]);

  // ─── Erase region confirm ────────────────────────────────────────────────
  const handleEraseRegionConfirm = useCallback(
    (r: { x: number; y: number; width: number; height: number }) => {
      // Canvas now fills the canvasArea, so there is no centering offset.
      const { scale, translateX: tx, translateY: ty } =
        canvasRef.current?.getTransform() ?? { scale: 1, translateX: 0, translateY: 0 };
      const { width: areaW, height: areaH } = canvasAreaSizeRef.current;

      const canvasX = (r.x - tx) / scale;
      const canvasY = (r.y - ty) / scale;
      const canvasW = r.width / scale;
      const canvasH = r.height / scale;

      const cmd: EraseRegionCommand = {
        type: 'eraseRegion',
        id: Date.now().toString(),
        x: Math.max(0, canvasX),
        y: Math.max(0, canvasY),
        width: Math.min(canvasW, areaW - Math.max(0, canvasX)),
        height: Math.min(canvasH, areaH - Math.max(0, canvasY)),
      };
      history.pushCommand(cmd);
      setEraseRegionActive(false);
      drawing.setTool('paintbrush');
    },
    [history, drawing]
  );
  // ─── Toolbar visibility ─────────────────────────────────────────────────────
  const [toolbarVisible, setToolbarVisible] = useState(true);
  // ─── Zoom indicator ──────────────────────────────────────────────────────
  const [isZoomed, setIsZoomed] = useState(false);

  // ─── Auto-size canvas to drawing area on first layout (new projects) ────
  const canvasSizedRef = useRef(!!params.projectId);

  const handleCanvasAreaLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      canvasAreaSizeRef.current = { width, height };
      if (!canvasSizedRef.current && width > 0 && height > 0) {
        canvasSizedRef.current = true;
        // Update dimensions and persist — this is the first and only saveProject
        // call for new drawings, using the real canvas area dimensions.
        setProject(p => {
          const updated = {
            ...p,
            canvasWidth: Math.round(width),
            canvasHeight: Math.round(height),
          };
          saveProject(updated);
          return updated;
        });
        // Only now is it safe to mount the Skia canvas — correct size from frame 1.
        setCanvasReady(true);
      }
    },
    []
  );

  // ─── Cycle tool / color for floating pill ───────────────────────────────
  const CYCLE_TOOLS: ToolType[] = ['paintbrush', 'pencil', 'crayon', 'marker', 'fillBucket', 'sprayCan', 'eraser'];

  const handleCycleTool = useCallback(() => {
    const idx = CYCLE_TOOLS.indexOf(drawing.activeTool as typeof CYCLE_TOOLS[number]);
    const next = CYCLE_TOOLS[(idx + 1) % CYCLE_TOOLS.length];
    handleToolSelect(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing.activeTool, handleToolSelect]);

  const handleCycleColor = useCallback(() => {
    const idx = DRAWING_COLORS.indexOf(drawing.brushSettings.color);
    const next = DRAWING_COLORS[(Math.max(0, idx) + 1) % DRAWING_COLORS.length];
    drawing.setColor(next);
  }, [drawing]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <TopBar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isZoomed={isZoomed}
        onUndo={history.undo}
        onRedo={history.redo}
        onClear={handleClear}
        onSave={handleSave}
        onGallery={() => navigation.navigate('Gallery')}
        onResetView={() => setIsZoomed(false)}
      />

      <View
        style={styles.canvasArea}
        onLayout={handleCanvasAreaLayout}
      >
        {canvasReady && (
        <CanvasView
          ref={canvasRef}
          canvasWidth={project.canvasWidth}
          canvasHeight={project.canvasHeight}
          backgroundColor={project.backgroundColor}
          commands={history.commands}
          activeTool={drawing.activeTool}
          brushSettings={drawing.brushSettings}
          onCommandCommitted={history.pushCommand}
          eraseRegionActive={eraseRegionActive}
        />
        )}

        {eraseRegionActive && (
          <EraseRegionOverlay
            onConfirm={handleEraseRegionConfirm}
            onCancel={() => {
              setEraseRegionActive(false);
              drawing.setTool('paintbrush');
            }}
          />
        )}

        {/* Vertical brush size panel — floats on the right edge */}
        <BrushSizePanel
          brushSize={drawing.brushSettings.size}
          activeTool={drawing.activeTool}
          onSizeChange={drawing.setBrushSize}
        />
      </View>

      <BottomToolbar
        activeTool={drawing.activeTool}
        activeColor={drawing.brushSettings.color}
        activeSizeKey={drawing.brushSizeKey}
        toolbarVisible={toolbarVisible}
        onToolSelect={handleToolSelect}
        onColorSelect={drawing.setColor}
        onSizeChange={drawing.setBrushSizeKey}
        onToggleToolbar={() => setToolbarVisible(v => !v)}
      />

      {/* Floating pill — only when toolbar is hidden */}
      {!toolbarVisible && (
        <FloatingToolPill
          activeTool={drawing.activeTool}
          activeColor={drawing.brushSettings.color}
          onCycleTool={handleCycleTool}
          onCycleColor={handleCycleColor}
          onExpand={() => setToolbarVisible(true)}
        />
      )}

      <ClearConfirmModal
        visible={clearModalVisible}
        onConfirm={handleClearConfirm}
        onCancel={() => setClearModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  canvasArea: {
    flex: 1,
    position: 'relative',
  },
  showToolbarPill: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    left: '35%',
    right: '35%',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  showToolbarText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
