import { Scale } from "lucide-react";

import { ProjectWorkbenchPlaceholder } from "../../components/projectWorkbenchPlaceholder";

export default function ProjectBusinessRulesPage() {
  return (
    <ProjectWorkbenchPlaceholder
      title="Rules"
      description="Business rules and constraints will be documented here."
      icon={Scale}
    />
  );
}
