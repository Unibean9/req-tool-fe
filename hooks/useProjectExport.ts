"use client";

import { useCachedGet } from "@/hooks/useCachedGet";
import { fetchProjectExport } from "@/lib/api/services/fetchProjectExport";
import { projectBrdExportQueryKey } from "@/lib/query/query-keys";

export function useProjectBrdExport(
  projectId: string | null | undefined,
  includeWont: boolean,
  options?: { enabled?: boolean }
) {
  const pid = projectId?.trim() ?? "";
  const enabled = Boolean(pid) && (options?.enabled ?? true);

  return useCachedGet<string, Error, string>({
    queryKey: projectBrdExportQueryKey(pid, { includeWont }),
    queryFn: () =>
      fetchProjectExport.getBrdMarkdown(pid, {
        includeWont,
      }),
    enabled,
  });
}
