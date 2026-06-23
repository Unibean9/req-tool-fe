import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Boxes,
  CheckSquare,
  CircleHelp,
  FileText,
  GitBranch,
  Layers,
  Lightbulb,
  Network,
  Scale,
  Shield,
  Target,
  UsersRound,
  Zap,
} from "lucide-react";

import type { DocumentType } from "@/lib/api/services/fetchDocument";

const ITEM_ICONS: Record<string, LucideIcon> = {
  vision_objectives: Target,
  problem_statement: CircleHelp,
  stakeholder_register: UsersRound,
  scope_capabilities: Zap,
  business_rules: Scale,
  constraints_assumptions: Shield,
  risks_issues: AlertTriangle,
  functional_requirement: Layers,
  use_case: GitBranch,
  non_functional_requirement: Shield,
  acceptance_criteria: CheckSquare,
  domain_entity: Boxes,
  component: Network,
  interface: Network,
  tech_decision: Lightbulb,
};

export function getDocumentItemIcon(itemType: string): LucideIcon {
  return ITEM_ICONS[itemType] ?? FileText;
}

const CONTAINER_ICONS: Record<DocumentType, LucideIcon> = {
  brd: FileText,
  prd: Layers,
  sad: Network,
};

export function getDocumentContainerIcon(documentType: DocumentType): LucideIcon {
  return CONTAINER_ICONS[documentType] ?? FileText;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  brd: "Business Requirements Document",
  prd: "Product Requirements Document",
  sad: "Solution Architecture Document",
};

export const DOCUMENT_TYPE_SHORT: Record<DocumentType, string> = {
  brd: "BRD",
  prd: "PRD",
  sad: "SAD",
};
