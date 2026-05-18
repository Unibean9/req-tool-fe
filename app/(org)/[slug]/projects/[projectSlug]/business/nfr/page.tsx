import { Gauge } from "lucide-react";

import { ProjectWorkbenchPlaceholder } from "../../components/projectWorkbenchPlaceholder";

export default function ProjectBusinessNfrPage() {
  return (
    <ProjectWorkbenchPlaceholder
      title="NFR"
      description="Non-functional requirements for this project will be captured here."
      icon={Gauge}
    />
  );
}
