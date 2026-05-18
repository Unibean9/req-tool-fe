import { Link2 } from "lucide-react";

import { ProjectWorkbenchPlaceholder } from "../components/projectWorkbenchPlaceholder";

export default function ProjectGithubLinkPage() {
  return (
    <ProjectWorkbenchPlaceholder
      title="Liên kết với Github"
      description="Kết nối repository GitHub với dự án để đồng bộ requirements và trace tới code."
      icon={Link2}
    />
  );
}
