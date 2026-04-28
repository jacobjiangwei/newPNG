"use client";

import type { StoredNpngProject } from "../lib/projectStorage";

interface ProjectPanelProps {
  projects: StoredNpngProject[];
  activeProjectId: string | null;
  shareUrl: string | null;
  status: string | null;
  onNewProject: () => void;
  onSaveVersion: () => void;
  onOpenProject: (projectId: string) => void;
  onRestoreVersion: (projectId: string, versionId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateShareLink: () => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ProjectPanel({
  projects,
  activeProjectId,
  shareUrl,
  status,
  onNewProject,
  onSaveVersion,
  onOpenProject,
  onRestoreVersion,
  onDeleteProject,
  onCreateShareLink,
}: ProjectPanelProps) {
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#232323] text-xs text-zinc-300">
      <div className="border-b border-zinc-700/80 p-3">
        <div className="mb-2 text-sm font-semibold text-zinc-100">Projects</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSaveVersion}
            className="rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-500"
          >
            Save version
          </button>
          <button
            onClick={onNewProject}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
          >
            New
          </button>
        </div>
        <button
          onClick={onCreateShareLink}
          className="mt-2 w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-200 hover:bg-emerald-500/20"
        >
          Copy viewer share link
        </button>
        {status && <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-400">{status}</div>}
        {shareUrl && (
          <input
            readOnly
            value={shareUrl}
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-[10px] text-zinc-300"
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="border-b border-zinc-700/80 px-3 py-2 font-semibold text-zinc-400">Saved projects</div>
        {projects.length === 0 ? (
          <div className="p-3 text-zinc-500">No local projects yet.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {projects.map((project) => (
              <div key={project.id} className={`p-3 ${project.id === activeProjectId ? "bg-blue-500/10" : ""}`}>
                <button
                  onClick={() => onOpenProject(project.id)}
                  className="block w-full text-left font-semibold text-zinc-100 hover:text-blue-200"
                >
                  {project.name}
                </button>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{project.versions.length} versions</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="mt-2 text-[10px] text-zinc-500 hover:text-red-300"
                >
                  Delete local copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-h-[42%] overflow-auto border-t border-zinc-700/80">
        <div className="border-b border-zinc-700/80 px-3 py-2 font-semibold text-zinc-400">History</div>
        {!activeProject ? (
          <div className="p-3 text-zinc-500">Open or save a project to see versions.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {[...activeProject.versions].reverse().map((version) => (
              <button
                key={version.id}
                onClick={() => onRestoreVersion(activeProject.id, version.id)}
                className={`block w-full px-3 py-2 text-left hover:bg-zinc-800 ${
                  version.id === activeProject.currentVersionId ? "text-blue-200" : "text-zinc-300"
                }`}
              >
                <div className="font-medium">{version.label}</div>
                <div className="mt-0.5 text-[10px] text-zinc-500">{formatDate(version.createdAt)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
