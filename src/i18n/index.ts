import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { File, Paths } from 'expo-file-system';

export type Language = 'en' | 'es';

const langFile = new File(Paths.document, 'pintalu_lang.json');

// ─── Translations ─────────────────────────────────────────────────────────────
export const translations = {
  en: {
    // TopBar
    undo: 'Undo',
    redo: 'Redo',
    clearLabel: 'Clear',
    resetView: 'Reset view',
    save: 'Save',
    gallery: 'Gallery',
    // Canvas screen
    showToolbar: 'Show toolbar',
    hideToolbar: 'Hide toolbar',
    // Gallery
    myDrawings: 'My Drawings 🎨',
    noDrawingsYet: 'No drawings yet!',
    tapToStart: 'Tap the button below to start.',
    rename: 'Rename',
    exportPhoto: 'Export to Camera Roll',
    delete: 'Delete',
    cancel: 'Cancel',
    newDrawing: 'New drawing',
    renameDrawingTitle: 'Rename Drawing',
    permissionNeeded: 'Permission needed',
    permissionMessage: 'Please allow access to your photo library.',
    noSavedImage: 'No saved image',
    saveFirst: 'Save the drawing first.',
    exported: 'Exported!',
    savedToLibrary: 'Saved to your photo library.',
    deleteDrawingTitle: 'Delete Drawing?',
    deleteDrawingMessage: (name: string) => `"${name}" will be permanently deleted.`,
    // NewCanvasSheet
    newDrawingSheetTitle: 'New Drawing',
    canvasSize: 'Canvas Size',
    customSize: 'Custom',
    widthPx: 'Width (px)',
    heightPx: 'Height (px)',
    fillBucketStyle: 'Fill Bucket Style',
    smoothFill: 'Smooth',
    pixelFill: 'Pixel-perfect',
    smoothFillLabel: 'Smooth fill',
    pixelFillLabel: 'Pixel-perfect fill',
    startDrawing: '🎨  Start Drawing',
    // BrushSizePanel
    brushSizeLabel: (key: string) => `Brush size ${key}`,
    // Language toggle label (shows current language)
    languageToggle: '🌐 EN',
    // About
    aboutBtn: 'About',
    aboutTitle: 'About Pintalú',
    aboutTagline: 'Draw, color, create! 🎨',
    aboutDescription: 'A personal project I made for my daughters, and decided to share with everyone. Free to use, forever.',
    aboutFeedback: 'Feedback is always welcome!',
    aboutGithub: 'GitHub repo',
    aboutEmail: 'Send an email',
    aboutVersion: 'Version',
    aboutClose: 'Close',
  },
  es: {
    // TopBar
    undo: 'Deshacer',
    redo: 'Rehacer',
    clearLabel: 'Borrar',
    resetView: 'Restablecer',
    save: 'Guardar',
    gallery: 'Galería',
    // Canvas screen
    showToolbar: 'Mostrar herramientas',
    hideToolbar: 'Ocultar herramientas',
    // Gallery
    myDrawings: 'Mis dibujos 🎨',
    noDrawingsYet: '¡Aún no hay dibujos!',
    tapToStart: 'Toca el botón de abajo para empezar.',
    rename: 'Renombrar',
    exportPhoto: 'Exportar al a galería',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    newDrawing: 'Nuevo dibujo',
    renameDrawingTitle: 'Renombrar dibujo',
    permissionNeeded: 'Permiso necesario',
    permissionMessage: 'Por favor permite el acceso a tu galería de fotos.',
    noSavedImage: 'Sin imagen guardada',
    saveFirst: 'Guarda el dibujo primero.',
    exported: '¡Exportado!',
    savedToLibrary: 'Guardado en tu galería.',
    deleteDrawingTitle: '¿Eliminar dibujo?',
    deleteDrawingMessage: (name: string) => `"${name}" se eliminará permanentemente.`,
    // NewCanvasSheet
    newDrawingSheetTitle: 'Nuevo dibujo',
    canvasSize: 'Tamaño del lienzo',
    customSize: 'Personalizado',
    widthPx: 'Ancho (px)',
    heightPx: 'Alto (px)',
    fillBucketStyle: 'Estilo del balde',
    smoothFill: 'Suave',
    pixelFill: 'Pixel perfecto',
    smoothFillLabel: 'Relleno suave',
    pixelFillLabel: 'Pixel perfecto',
    startDrawing: '🎨  ¡A dibujar!',
    // BrushSizePanel
    brushSizeLabel: (key: string) => `Tamaño ${key}`,
    // Language toggle label (shows current language)
    languageToggle: '🌐 ES',
    // About
    aboutBtn: 'Acerca de',
    aboutTitle: 'Acerca de Pintalú',
    aboutTagline: '¡Dibuja, colorea, crea! 🎨',
    aboutDescription: 'Un proyecto personal que hice para mis hijas, y decidí compartirlo con todos. Gratis para siempre.',
    aboutFeedback: '¡El feedback siempre es bienvenido!',
    aboutGithub: 'Repositorio en GitHub',
    aboutEmail: 'Enviar un email',
    aboutVersion: 'Versión',
    aboutClose: 'Cerrar',
  },
} as const;

export type Translations = typeof translations[Language];

// ─── Context ──────────────────────────────────────────────────────────────────
interface LanguageContextType {
  lang: Language;
  t: Translations;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: translations.en,
  toggleLanguage: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('es');

  useEffect(() => {
    langFile.text()
      .then(json => {
        const saved = JSON.parse(json) as Language;
        if (saved === 'en' || saved === 'es') setLang(saved);
      })
      .catch(() => {/* no saved preference — keep default 'es' */});
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next: Language = prev === 'en' ? 'es' : 'en';
      langFile.write(JSON.stringify(next));
      return next;
    });
  }, []);

  return React.createElement(
    LanguageContext.Provider,
    { value: { lang, t: translations[lang], toggleLanguage } },
    children
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLanguage() {
  return useContext(LanguageContext);
}
