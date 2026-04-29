import type { NpngDocument } from "./types";

const PROJECTS_KEY = "nextpng.projects.v1";
const ACTIVE_PROJECT_KEY = "nextpng.activeProjectId.v1";
const MAX_PROJECT_VERSIONS = 40;

export interface StoredNpngVersion {
  id: string;
  createdAt: string;
  label: string;
  yamlText: string;
}

export interface StoredNpngProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  draftYaml: string;
  currentVersionId: string | null;
  versions: StoredNpngVersion[];
}

export interface StoredProjectState {
  projects: StoredNpngProject[];
  activeProjectId: string | null;
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createId(prefix: string): string {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
}

export function inferProjectName(doc: NpngDocument | null, fallback = "Untitled npng"): string {
  const firstLayerName = doc?.layers?.find((layer) => layer.name?.trim())?.name?.trim();
  if (firstLayerName) return firstLayerName;
  const width = doc?.canvas?.width;
  const height = doc?.canvas?.height;
  if (width && height) return `npng ${width}x${height}`;
  return fallback;
}

function makeVersion(yamlText: string, label: string): StoredNpngVersion {
  return {
    id: createId("version"),
    createdAt: new Date().toISOString(),
    label,
    yamlText,
  };
}

export function createStoredProject(yamlText: string, name: string, label = "Created"): StoredNpngProject {
  const version = makeVersion(yamlText, label);
  const now = new Date().toISOString();
  return {
    id: createId("project"),
    name,
    createdAt: now,
    updatedAt: now,
    draftYaml: yamlText,
    currentVersionId: version.id,
    versions: [version],
  };
}

export function loadStoredProjectState(): StoredProjectState {
  if (!hasLocalStorage()) return { projects: [], activeProjectId: null };

  try {
    const rawProjects = window.localStorage.getItem(PROJECTS_KEY);
    const projects = rawProjects ? JSON.parse(rawProjects) as StoredNpngProject[] : [];
    const activeProjectId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
    return {
      projects: Array.isArray(projects) ? projects : [],
      activeProjectId,
    };
  } catch (error) {
    console.error("Failed to load saved npng projects.", error);
    return { projects: [], activeProjectId: null };
  }
}

export function persistStoredProjectState(projects: StoredNpngProject[], activeProjectId: string | null): void {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (activeProjectId) window.localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
  else window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
}

export function updateProjectDraft(
  projects: StoredNpngProject[],
  projectId: string,
  yamlText: string,
  inferredName: string,
): StoredNpngProject[] {
  return projects.map((project) => {
    if (project.id !== projectId) return project;
    const hasCustomName = project.name !== "Untitled npng" && !/^npng \d+x\d+$/.test(project.name);
    return {
      ...project,
      name: hasCustomName ? project.name : inferredName,
      draftYaml: yamlText,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function saveProjectVersion(
  projects: StoredNpngProject[],
  projectId: string,
  yamlText: string,
  label: string,
): StoredNpngProject[] {
  return projects.map((project) => {
    if (project.id !== projectId) return project;
    const version = makeVersion(yamlText, label);
    const versions = [...project.versions, version].slice(-MAX_PROJECT_VERSIONS);
    return {
      ...project,
      draftYaml: yamlText,
      currentVersionId: version.id,
      versions,
      updatedAt: version.createdAt,
    };
  });
}

export function getProjectDocument(project: StoredNpngProject): string {
  return project.draftYaml || project.versions.at(-1)?.yamlText || "";
}
