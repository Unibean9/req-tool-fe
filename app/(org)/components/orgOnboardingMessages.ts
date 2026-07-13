export type OrgOnboardingSlide = {
  kicker: string;
  headline: string;
  detail: string;
};

export const ORG_ONBOARDING_SLIDES: readonly OrgOnboardingSlide[] = [
  {
    kicker: "Workspace",
    headline: "Welcome to ReqFlow",
    detail:
      "Where requirements get organized the right way from day one — no more scattered sheets and chats.",
  },
  {
    kicker: "Structure",
    headline: "A backlog that's a system",
    detail:
      "Agile and GitHub-first workflow: every item has a place, an owner, and a trace to code.",
  },
  {
    kicker: "Kickoff",
    headline: "A project ready to work",
    detail:
      "Clear hierarchy, consistent conventions, and automatic GitHub sync as the team starts sprinting.",
  },
  {
    kicker: "Coordination",
    headline: "Requirements with a roadmap",
    detail:
      "Analyze, organize, and deliver from a single source of truth — teams stay closer to scope and progress.",
  },
  {
    kicker: "Connection",
    headline: "One unified flow",
    detail:
      "From Business Capability to Technical Task — no more gap between business and engineering.",
  },
] as const;
