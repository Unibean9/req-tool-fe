import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  BookOpenCheck,
  BookOpenText,
  Boxes,
  Cable,
  CircleDot,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Command,
  Database,
  FileStack,
  FileText,
  Gauge,
  Goal,
  Landmark,
  Lightbulb,
  MapPinned,
  Milestone,
  Route,
  Scale,
  ScrollText,
  ServerCog,
  ShieldAlert,
  SquareStack,
  UsersRound,
  Waypoints,
  Workflow,
} from "lucide-react";

import type { DocumentType } from "@/lib/api/services/fetchDocument";

const ITEM_ICONS: Record<string, LucideIcon> = {
  executive_summary: BookOpenText,
  vision_objectives: Goal,
  problem_statement: CircleHelp,
  stakeholder_register: UsersRound,
  scope_capabilities: MapPinned,
  business_rules: Scale,
  constraints_assumptions: Route,
  risks_issues: ShieldAlert,
  functional_requirement: ClipboardList,
  use_case: Workflow,
  non_functional_requirement: Gauge,
  acceptance_criteria: ClipboardCheck,
  domain_entity: Database,
  component: Blocks,
  interface: Cable,
  tech_decision: Lightbulb,
  tech_stack: SquareStack,
  domain_event: CircleDot,
  actor_command: Command,
  policy: Landmark,
  aggregate: Boxes,
  epic: Milestone,
  story: BookOpenCheck,
};

export function getDocumentItemIcon(itemType: string): LucideIcon {
  return ITEM_ICONS[itemType] ?? FileText;
}

const CONTAINER_ICONS: Record<DocumentType, LucideIcon> = {
  brd: ScrollText,
  prd: FileStack,
  event_storming: Waypoints,
  add: ServerCog,
};

export function getDocumentContainerIcon(documentType: DocumentType): LucideIcon {
  return CONTAINER_ICONS[documentType] ?? FileText;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  brd: "Business Requirements Document",
  prd: "Product Requirements Document",
  event_storming: "Event Storming",
  add: "Architecture Design Document",
};

export const DOCUMENT_TYPE_SHORT: Record<DocumentType, string> = {
  brd: "BRD",
  prd: "PRD",
  event_storming: "Event Storming",
  add: "ADD",
};
