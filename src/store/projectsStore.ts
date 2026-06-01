import { createMMKV } from 'react-native-mmkv';
import { File, Paths } from 'expo-file-system';
import { Project, DrawCommand } from './types';

const storage = createMMKV({ id: 'pintalu' });

const PROJECTS_KEY = 'projects_list';
const historyKey = (projectId: string) => `history:${projectId}`;
const pngFile = (projectId: string) => new File(Paths.document, `${projectId}.png`);

// ─── Project list ─────────────────────────────────────────────────────────────

export function getAllProjects(): Project[] {
  const raw = storage.getString(PROJECTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function saveProject(project: Project): void {
  const all = getAllProjects().filter(p => p.id !== project.id);
  all.unshift({ ...project, updatedAt: Date.now() });
  storage.set(PROJECTS_KEY, JSON.stringify(all));
}

export function deleteProject(projectId: string): void {
  const all = getAllProjects().filter(p => p.id !== projectId);
  storage.set(PROJECTS_KEY, JSON.stringify(all));
  storage.remove(historyKey(projectId));
  try { pngFile(projectId).delete(); } catch (_) {}
}

export function renameProject(projectId: string, newName: string): void {
  const all = getAllProjects().map(p =>
    p.id === projectId ? { ...p, name: newName, updatedAt: Date.now() } : p
  );
  storage.set(PROJECTS_KEY, JSON.stringify(all));
}

// ─── History (undo/redo) ──────────────────────────────────────────────────────

export function loadHistory(projectId: string): DrawCommand[] {
  const raw = storage.getString(historyKey(projectId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DrawCommand[];
  } catch {
    return [];
  }
}

export function persistHistory(projectId: string, commands: DrawCommand[]): void {
  storage.set(historyKey(projectId), JSON.stringify(commands));
}

// ─── PNG thumbnail ────────────────────────────────────────────────────────────

export async function savePNG(projectId: string, base64Data: string): Promise<void> {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  pngFile(projectId).write(bytes);
}

export function getPNGUri(projectId: string): string {
  return pngFile(projectId).uri;
}

export async function pngExists(projectId: string): Promise<boolean> {
  return pngFile(projectId).exists;
}

// ─── Auto-generated name ──────────────────────────────────────────────────────

export function nextDrawingName(): string {
  const all = getAllProjects();
  return `Drawing ${all.length + 1}`;
}
