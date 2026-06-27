import apiService from "../core";

export type BrdExportParams = {
  includeWont: boolean;
};

function projectExportPath(projectId: string): string {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/exports/brd.md`;
}

export const fetchProjectExport = {
  /** GET /api/v1/projects/{project_id}/exports/brd.md */
  getBrdMarkdown: async (
    projectId: string,
    params: BrdExportParams
  ): Promise<string> => {
    const response = await apiService.request<string>({
      method: "GET",
      url: projectExportPath(projectId),
      params: { include_wont: params.includeWont },
      headers: {
        Accept: "text/markdown, text/plain;q=0.9, */*;q=0.8",
      },
    });
    return response.data;
  },
};
