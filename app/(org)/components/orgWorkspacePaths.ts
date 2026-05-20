/** Wizard tạo dự án tại `/{slug}/projects/project-new` — ẩn chrome tổng. */
export function isOrgProjectNewWizardPath(pathname: string): boolean {
  return /\/projects\/project-new\/?$/.test(pathname);
}

/** Wizard chỉnh sửa tại `/{slug}/projects/project-edit` — ẩn chrome tổng. */
export function isOrgProjectEditWizardPath(pathname: string): boolean {
  return /\/projects\/project-edit\/?$/.test(pathname);
}

export function isOrgProjectWizardPath(pathname: string): boolean {
  return (
    isOrgProjectNewWizardPath(pathname) ||
    isOrgProjectEditWizardPath(pathname)
  );
}

/** Workspace chi tiết dự án: `/{slug}/projects/{projectSlug}/...` (không gồm wizard). */
export function isOrgProjectSlugWorkspacePath(pathname: string): boolean {
  const p = pathname.split("/").filter(Boolean);
  if (p.length < 3) return false;
  if (p[1] !== "projects") return false;
  if (p[2] === "project-new" || p[2] === "project-edit") return false;
  return true;
}

/** Trang thành viên org full-bleed (sơ đồ + panel). */
export function isOrgMembersWorkbenchPath(pathname: string): boolean {
  const p = pathname.split("/").filter(Boolean);
  return p.length >= 2 && p[1] === "members";
}

/**
 * Đường dẫn sau khi đổi tổ chức (slug segment đầu).
 * Không giữ `projectSlug` — dự án không dùng chung giữa các tổ chức.
 */
export function replaceOrgSlugInPathname(
  pathname: string,
  targetSlug: string
): string {
  const segs = pathname.split("/").filter(Boolean);
  const enc = encodeURIComponent(targetSlug);
  if (segs.length === 0) return `/${enc}/projects`;

  const section = segs[1];

  if (section === "members") {
    return `/${enc}/members`;
  }

  if (section === "projects") {
    if (segs[2] === "project-new") {
      return `/${enc}/projects/project-new`;
    }
    if (segs[2] === "project-edit") {
      return `/${enc}/projects`;
    }
    return `/${enc}/projects`;
  }

  return `/${enc}/projects`;
}

export function projectWorkspaceSubPathFromPathname(pathname: string): string {
  const p = pathname.split("/").filter(Boolean);
  if (p.length < 3 || p[1] !== "projects") return "dashboard";
  if (p[2] === "project-new" || p[2] === "project-edit") return "dashboard";
  return p.slice(3).join("/") || "dashboard";
}

export function buildProjectEditPath(
  orgSlug: string,
  projectSlug: string
): string {
  const encOrg = encodeURIComponent(orgSlug);
  const encProj = encodeURIComponent(projectSlug);
  return `/${encOrg}/projects/project-edit?project=${encProj}`;
}

export function buildProjectWorkspacePath(
  orgSlug: string,
  projectSlug: string,
  subPath: string
): string {
  const encOrg = encodeURIComponent(orgSlug);
  const encProj = encodeURIComponent(projectSlug);
  const tab = subPath.replace(/^\/+/, "") || "dashboard";
  return `/${encOrg}/projects/${encProj}/${tab}`;
}

/** Vào workspace: dự án đầu tiên, hoặc danh sách dự án nếu org chưa có dự án. */
export function buildOrgEntryPath(
  orgSlug: string,
  projects: { slug: string }[],
  subPath = "dashboard"
): string {
  const first = projects[0];
  if (first) {
    return buildProjectWorkspacePath(orgSlug, first.slug, subPath);
  }
  return `/${encodeURIComponent(orgSlug)}/projects`;
}
