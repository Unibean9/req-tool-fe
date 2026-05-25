import type {
  PaletteCreatableKind,
  RequirementNodeKind,
} from "./requirementsModelTypes";

export const REQUIREMENTS_PALETTE_DRAG_MIME = "application/req-tool-requirement-node";

export const REQUIREMENT_NODE_DEFAULT_TITLES: Record<RequirementNodeKind, string> = {
  actor: "New Actor",
  epic: "New Epic",
  feature: "New Feature",
  userStory: "New User Story",
};

export const REQUIREMENT_KIND_LABELS: Record<RequirementNodeKind, string> = {
  actor: "Actor",
  epic: "Epic",
  feature: "Feature",
  userStory: "User Story",
};

/** Nền card canvas — tối đồng nhất, không đổi theo loại node. */
export const REQUIREMENT_CARD_SURFACE_CLASS =
  "bg-[#1a1d21] text-zinc-100 [&_.text-muted-foreground]:text-zinc-400/90";

export const REQUIREMENT_KIND_STYLES: Record<
  RequirementNodeKind,
  {
    /** Viền card — luôn hiển thị theo loại */
    border: string;
    /** Viền khi chọn — đậm / sáng hơn */
    borderSelected: string;
    dot: string;
    palette: string;
    /** Icon chip trên palette trái */
    paletteIconBorder: string;
    paletteIconBg: string;
  }
> = {
  actor: {
    border: "border-emerald-500/55",
    borderSelected: "border-emerald-400",
    dot: "bg-emerald-400",
    palette: "from-emerald-500/25 to-emerald-600/10",
    paletteIconBorder: "border-emerald-500/40",
    paletteIconBg: "bg-emerald-500/15",
  },
  epic: {
    border: "border-blue-500/55",
    borderSelected: "border-blue-400",
    dot: "bg-blue-400",
    palette: "from-blue-500/25 to-blue-600/10",
    paletteIconBorder: "border-blue-500/40",
    paletteIconBg: "bg-blue-500/15",
  },
  feature: {
    border: "border-violet-500/55",
    borderSelected: "border-violet-400",
    dot: "bg-violet-400",
    palette: "from-violet-500/25 to-violet-600/10",
    paletteIconBorder: "border-violet-500/40",
    paletteIconBg: "bg-violet-500/15",
  },
  userStory: {
    border: "border-zinc-500/55",
    borderSelected: "border-zinc-400",
    dot: "bg-zinc-400",
    palette: "from-zinc-500/25 to-zinc-600/10",
    paletteIconBorder: "border-zinc-500/40",
    paletteIconBg: "bg-zinc-500/15",
  },
};

/** Cạnh nối tay trên canvas (actor → epic tự gắn khi thả Epic). */
export const VALID_REQUIREMENT_EDGES: ReadonlyArray<
  readonly [RequirementNodeKind, RequirementNodeKind]
> = [
  ["epic", "feature"],
  ["feature", "userStory"],
];

export const INVALID_EDGE_MESSAGE =
  "Only Epic → Feature → User Story connections are allowed. Epics are automatically linked to the current actor when dragged from the palette.";

export const PALETTE_CREATABLE_KINDS = [
  "epic",
  "feature",
  "userStory",
] as const satisfies readonly PaletteCreatableKind[];

/** Cạnh hợp lệ trên canvas — animated + màu nổi bật. */
export const REQUIREMENT_EDGE_TYPE = "smoothstep" as const;

export const REQUIREMENT_EDGE_STYLE = {
  stroke: "hsl(240 5% 58%)",
  strokeWidth: 2.5,
} as const;

export const REQUIREMENT_EDGE_DEFAULT_OPTIONS = {
  type: REQUIREMENT_EDGE_TYPE,
  animated: true,
  style: { ...REQUIREMENT_EDGE_STYLE },
} as const;

export const REQUIREMENT_INVALID_EDGE_STYLE = {
  stroke: "var(--destructive)",
  strokeWidth: 2.5,
} as const;
