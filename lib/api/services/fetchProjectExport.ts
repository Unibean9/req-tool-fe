import apiService from "../core";

export type BrdExportParams = {
  includeWont: boolean;
};

function brdExportPath(projectId: string): string {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/exports/brd.md`;
}

function prdExportPath(projectId: string): string {
  return `/api/v1/projects/${encodeURIComponent(projectId)}/exports/prd.md`;
}

const markdownAcceptHeader = {
  Accept: "text/markdown, text/plain;q=0.9, */*;q=0.8",
} as const;

export const fetchProjectExport = {
  /** GET /api/v1/projects/{project_id}/exports/brd.md */
  getBrdMarkdown: async (
    projectId: string,
    params: BrdExportParams
  ): Promise<string> => {
    const response = await apiService.request<string>({
      method: "GET",
      url: brdExportPath(projectId),
      params: { include_wont: params.includeWont },
      headers: markdownAcceptHeader,
    });
    return response.data;
  },

  /** GET /api/v1/projects/{project_id}/exports/prd.md */
  getPrdMarkdown: async (projectId: string): Promise<string> => {
    const response = await apiService.request<string>({
      method: "GET",
      url: prdExportPath(projectId),
      headers: markdownAcceptHeader,
    });
    return response.data;
  },
};
