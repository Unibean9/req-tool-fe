import {
  AGENT_MESSAGE_MODE_HINTS,
  type AgentMessageModeHint,
} from "@/lib/api/services/fetchAgentSession";

/** Temporary: hide mode picker in agent sidebar until UX is finalized. */
export const SHOW_AGENT_MESSAGE_MODE_HINT_UI = false;

export const AGENT_MESSAGE_MODE_HINT_LABELS: Record<
  AgentMessageModeHint,
  { label: string; description: string }
> = {
  qa: {
    label: "Q&A",
    description: "Ask clarifying questions",
  },
  critique: {
    label: "Debate",
    description: "Debate and suggest improvements",
  },
  explore: {
    label: "Explore",
    description: "Explore and suggest ideas",
  },
  draft: {
    label: "Plan",
    description: "Plan and suggest ideas",
  },
};

export function formatAgentMessageModeHint(
  modeHint: AgentMessageModeHint,
): string {
  return AGENT_MESSAGE_MODE_HINT_LABELS[modeHint].label;
}

const MODE_HINT_STORAGE_PREFIX = "agent-session-mode-hint:";

export function isAgentMessageModeHint(
  value: string,
): value is AgentMessageModeHint {
  return (AGENT_MESSAGE_MODE_HINTS as readonly string[]).includes(value);
}

export function readPersistedAgentMessageModeHint(
  sessionId: string | null,
): AgentMessageModeHint | null {
  if (!sessionId) return null;
  try {
    const raw = sessionStorage.getItem(`${MODE_HINT_STORAGE_PREFIX}${sessionId}`);
    if (raw && isAgentMessageModeHint(raw)) return raw;
  } catch {
    // Session persistence is a convenience; in-memory state still works.
  }
  return null;
}

export function writePersistedAgentMessageModeHint(
  sessionId: string | null,
  modeHint: AgentMessageModeHint | null,
) {
  if (!sessionId) return;
  try {
    const key = `${MODE_HINT_STORAGE_PREFIX}${sessionId}`;
    if (modeHint) sessionStorage.setItem(key, modeHint);
    else sessionStorage.removeItem(key);
  } catch {
    // Session persistence is a convenience; in-memory state still works.
  }
}

export { AGENT_MESSAGE_MODE_HINTS, type AgentMessageModeHint };
