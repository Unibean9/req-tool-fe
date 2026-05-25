"use client";

import { ContextDiagram } from "@/components/ui/context-diagram";
import {
  useContextDiagram,
  useCreateContextDiagramFlow,
  useDeleteContextDiagramFlow,
  useSaveContextDiagramLayout,
  useSyncContextDiagram,
} from "@/hooks/useContextDiagram";

export function DashboardContextDiagram({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const { data, isLoading } = useContextDiagram(projectId);

  const { mutateAsync: saveLayout, isPending: isSavingLayout } =
    useSaveContextDiagramLayout(projectId);
  const { mutate: syncDiagram, isPending: isSyncing } =
    useSyncContextDiagram(projectId);
  const { mutateAsync: createFlow } = useCreateContextDiagramFlow(projectId);
  const { mutateAsync: deleteFlow } = useDeleteContextDiagramFlow(projectId);

  const config = data?.config ?? {
    centerLabel: projectName,
    stakeholders: [],
    flows: [],
  };

  return (
    <div className="min-h-130 flex-1 overflow-hidden rounded-xl border border-border/50 bg-card/30">
      {isLoading ? (
        <div className="flex h-full min-h-130 items-center justify-center">
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      ) : (
        <ContextDiagram
          config={config}
          layout={data?.layout}
          onSaveLayout={saveLayout}
          isSavingLayout={isSavingLayout}
          onSync={syncDiagram}
          isSyncing={isSyncing}
          onCreateFlow={createFlow}
          onDeleteFlow={deleteFlow}
        />
      )}
    </div>
  );
}
