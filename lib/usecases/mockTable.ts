import type { UseCaseActorResponse, UseCaseItemResponse, UseCaseModelResponse } from "@/lib/api/services/useCaseModel";

const actors: UseCaseActorResponse[] = [
  { id: "MOCK-ACT-RESEARCHER", name: "Researcher", kind: "Primary actor" },
  { id: "MOCK-ACT-ADMIN", name: "System Administrator", kind: "Supporting actor" },
  { id: "MOCK-ACT-REVIEWER", name: "Reviewer", kind: "Supporting actor" },
];
const groups = [
  { title: "Manage research workspace and access", subsystem: "Workspace & Access", children: ["Authenticate user", "Manage user access", "Manage project members"] },
  { title: "Understand and improve dataset quality", subsystem: "Dataset Quality", children: ["Upload dataset", "Review data quality", "Validate dataset"] },
  { title: "Frame research question and hypothesis", subsystem: "Research Framing", children: ["Define research question", "Generate candidate hypotheses", "Review hypothesis selection"] },
  { title: "Execute and validate experiment", subsystem: "Scientific Validation", children: ["Generate experiment plan", "Execute experiment", "Review scientific evidence"] },
  { title: "Publish research outputs and report", subsystem: "Research Outputs", children: ["Generate research figures", "Review manuscript draft", "Export reproducibility package"] },
];
const descriptions: Record<string, [string, string]> = {
  "Run a research experiment": ["Guide a research project from its initial question through data preparation, experimentation and publication of findings.", "The research team has an approved project and access to the platform."],
  "Manage research workspace and access": ["Set up a shared project workspace, invite team members and assign access permissions so each person can use the projects and actions appropriate to their role.", "An organization and project exist. The person managing access has permission to invite members and change roles."],
  "Understand and improve dataset quality": ["Upload research data, review its quality and resolve validation issues before using it in an experiment.", "A dataset is available and the researcher has permission to upload it to the project."],
  "Frame research question and hypothesis": ["Turn the research problem into a clear question, propose candidate hypotheses and select the ones to investigate.", "The research scope and initial dataset assessment are available."],
  "Execute and validate experiment": ["Prepare an experiment plan, run it and review the evidence to determine whether the results support the research hypothesis.", "A hypothesis, suitable dataset and execution environment are available."],
  "Publish research outputs and report": ["Prepare figures, review the manuscript and package the materials needed to explain and reproduce the findings.", "The experiment has completed and the research evidence has been reviewed."],
  "Authenticate user": ["Verify the user's identity and open their account with the permissions assigned to them.", "The user has an active account and valid sign-in credentials."],
  "Manage user access": ["Assign or update project roles so team members can access the resources needed for their responsibilities.", "The administrator can manage roles and the target user belongs to the organization."],
  "Manage project members": ["Invite collaborators to a project, review membership and remove members who no longer need access.", "The project exists and the acting user can manage its membership."],
  "Upload dataset": ["Add a dataset to the project and record its source so the team can use it in research.", "The user has a supported dataset file and upload permission."],
  "Review data quality": ["Inspect missing values, duplicates and other quality issues to decide what needs cleaning.", "A dataset has been uploaded and its quality profile is available."],
  "Validate dataset": ["Check the dataset against the experiment's requirements and report issues that prevent its use.", "The dataset and validation requirements are available."],
  "Define research question": ["Describe the question the experiment will answer and the scope of the investigation.", "The research problem and relevant background are documented."],
  "Generate candidate hypotheses": ["Propose testable explanations or predictions that address the research question.", "A research question and supporting context are available."],
  "Review hypothesis selection": ["Compare candidate hypotheses and record which ones should proceed to experimentation.", "Candidate hypotheses are available for review."],
  "Generate experiment plan": ["Specify the method, input data and evaluation criteria needed to test the selected hypothesis.", "The hypothesis has been selected and the dataset has been reviewed."],
  "Execute experiment": ["Run the approved experiment and capture its outputs and execution trace.", "An experiment plan, required data and a ready execution environment are available."],
  "Review scientific evidence": ["Examine experiment outputs and limitations to decide whether the evidence supports the hypothesis.", "The experiment outputs and execution trace are available."],
  "Generate research figures": ["Create figures and tables that communicate the experiment's reviewed findings.", "Reviewed results are available for presentation."],
  "Review manuscript draft": ["Check that the manuscript accurately describes the method, evidence, findings and limitations.", "A manuscript draft and its supporting evidence are available."],
  "Export reproducibility package": ["Bundle the methods, configuration and result references needed to reproduce the experiment.", "The experiment records are complete and the user has permission to export them."],
};
const row = (id: string, title: string, level: UseCaseItemResponse["level"], parentUseCaseId: string | null, subsystem: string): UseCaseItemResponse => ({
  id, title, level, parentUseCaseId, subsystem,
  primaryActorId: title === "Manage user access" ? actors[1].id : actors[0].id,
  supportingActorIds: title === "Manage user access" ? [] : [subsystem === "Workspace & Access" ? actors[1].id : actors[2].id],
  status: "Suggested", priority: "Should",
  description: descriptions[title]?.[0] ?? title,
  precondition: descriptions[title]?.[1] ?? "A research project is available and the user has access.",
  sourceTrace: ["Mock data · layout preview"],
});
const root = row("MOCK-UC-L0-001", "Run a research experiment", "L0", null, "Research Platform");
const useCases = [root, ...groups.flatMap((group, index) => {
  const parent = row(`MOCK-UC-L1-${index + 1}`, group.title, "L1", root.id, group.subsystem);
  return [parent, ...group.children.map((title, childIndex) => row(`MOCK-UC-L2-${index + 1}-${childIndex + 1}`, title, "L2", parent.id, group.subsystem))];
})];

/** Presentation fallback only. Never insert sample IDs into the API cache or mutation payloads. */
export const MOCK_TABLE_MODEL: UseCaseModelResponse = {
  projectId: "", projectName: "Research Project", actors, useCases,
  relationships: useCases.filter((item) => item.parentUseCaseId).map((item) => ({
    id: `MOCK-REL-${item.id}`, sourceId: item.parentUseCaseId!, targetId: item.id, type: "part-of", condition: null,
  })),
  diagrams: [], diagramPlans: [], sourceHash: null, validation: null, generation: null,
};
