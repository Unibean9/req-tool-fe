"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type WorkspaceMode = "deliverables" | "artifact-link";

type ContextValue = {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
};

const ProjectWorkspaceModeContext = createContext<ContextValue | null>(null);

export function ProjectWorkspaceModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<WorkspaceMode>("deliverables");
  return (
    <ProjectWorkspaceModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ProjectWorkspaceModeContext.Provider>
  );
}

export function useProjectWorkspaceMode() {
  const ctx = useContext(ProjectWorkspaceModeContext);
  if (!ctx) throw new Error("useProjectWorkspaceMode: missing ProjectWorkspaceModeProvider");
  return ctx;
}
