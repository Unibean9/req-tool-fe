"use client";

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

// ── Font registration ─────────────────────────────────────────────────────────
// Full NotoSans TTF (not a subset) — covers all Latin + extended diacritics.

Font.register({
  family: "NotoSans",
  fonts: [
    { src: "/fonts/NotoSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSans-Bold.ttf", fontWeight: 700 },
    { src: "/fonts/NotoSans-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
    { src: "/fonts/NotoSans-BoldItalic.ttf", fontWeight: 700, fontStyle: "italic" },
  ],
});

// Symbols font for characters not in NotoSans (✓ ✔ etc.)
Font.register({ family: "NotoSansSymbols2", src: "/fonts/NotoSansSymbols2-Regular.ttf" });

// Prevent hyphenation from breaking diacritical characters
Font.registerHyphenationCallback((word) => [word]);

// ── Brand palette (matches system --brand-*) ──────────────────────────────────

const CANOPY = "#285a48"; // cover bg
const JADE = "#408a71";   // accent / headings
const MINT_LIGHT = "#e8f5f0"; // light bg
const MINT_BORDER = "#c5e8d8"; // dividers
const ABYSS = "#091413";  // body text
const MUTED = "#547666";  // secondary text
const WHITE = "#ffffff";
const A4_WIDTH = 595.28;
const PAGE_HORIZONTAL_PADDING = 56;
const TABLE_BORDER_WIDTH = 1;
const TABLE_WIDTH = A4_WIDTH - PAGE_HORIZONTAL_PADDING * 2 - TABLE_BORDER_WIDTH * 2;

// ── Inline parse ──────────────────────────────────────────────────────────────

type Seg = { t: string; b?: true; i?: true; tick?: true; color?: string };

const PRIORITY_INLINE_RE = /\b(high|critical|medium|normal|low|minor)\b/gi;
const PRIORITY_INLINE_COLORS: Record<string, string> = {
  high: "#dc2626", critical: "#dc2626",
  medium: "#d97706", normal: "#d97706",
  low: JADE, minor: JADE,
};

function applyPriorityColors(segs: Seg[]): Seg[] {
  const out: Seg[] = [];
  for (const seg of segs) {
    // Only split plain text (not bold/italic/tick/already-colored)
    if (seg.b || seg.i || seg.tick || seg.color) {
      out.push(seg);
      continue;
    }
    PRIORITY_INLINE_RE.lastIndex = 0;
    let cur = 0;
    let m: RegExpExecArray | null;
    while ((m = PRIORITY_INLINE_RE.exec(seg.t)) !== null) {
      if (m.index > cur) out.push({ t: seg.t.slice(cur, m.index) });
      out.push({ t: m[0], color: PRIORITY_INLINE_COLORS[m[0].toLowerCase()] });
      cur = PRIORITY_INLINE_RE.lastIndex;
    }
    if (cur < seg.t.length) out.push({ t: seg.t.slice(cur) });
  }
  return out.filter((s) => s.t.length > 0);
}

function inline(raw: string): Seg[] {
  const src = raw.normalize("NFC").replace(/`([^`]+)`/g, "$1");
  const out: Seg[] = [];
  // Handles: ***bi***, **bold**, *italic*, _italic_, ✓✔ (symbols font)
  const re = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|_([^_\n]+)_|([✓✔])/g;
  let cur = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > cur) out.push({ t: src.slice(cur, m.index) });
    if (m[1]) out.push({ t: m[1], b: true, i: true });
    else if (m[2]) out.push({ t: m[2], b: true });
    else if (m[3]) out.push({ t: m[3], i: true });
    else if (m[4]) out.push({ t: m[4], i: true });
    else if (m[5]) out.push({ t: "✓", tick: true });
    cur = re.lastIndex;
  }
  if (cur < src.length) out.push({ t: src.slice(cur) });
  return applyPriorityColors(out.filter((s) => s.t.length > 0));
}

// ── Block parse ───────────────────────────────────────────────────────────────

type Block =
  | { k: "h1" | "h2" | "h3" | "h4"; text: string }
  | { k: "p"; segs: Seg[] }
  | { k: "bullet"; rows: Seg[][] }
  | { k: "numbered"; rows: Seg[][] }
  | { k: "table"; headers: string[]; rows: string[][] }
  | { k: "hr" };

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((_c, i, a) => i > 0 && i < a.length - 1);
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line.trim());
}

function parseMarkdown(md: string): Block[] {
  // NFC normalization: API text may arrive NFD-decomposed, breaking glyph lookup
  md = md.normalize("NFC");
  // Replace glyphs not present in NotoSans with ASCII equivalents
  md = md
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/≠/g, "!=")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/…/g, "...");
  const lines = md.split(/\r?\n/);
  const out: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = parseTableRow(tableLines[0]);
        const dataLines = tableLines.filter((l) => !isSeparatorRow(l)).slice(1);
        const rows = dataLines.map(parseTableRow);
        out.push({ k: "table", headers, rows });
      }
      continue;
    }

    if (line.startsWith("#### ")) {
      out.push({ k: "h4", text: line.slice(5).trim() });
      i++;
    } else if (line.startsWith("### ")) {
      out.push({ k: "h3", text: line.slice(4).trim() });
      i++;
    } else if (line.startsWith("## ")) {
      out.push({ k: "h2", text: line.slice(3).trim() });
      i++;
    } else if (line.startsWith("# ")) {
      out.push({ k: "h1", text: line.slice(2).trim() });
      i++;
    } else if (/^---+\s*$/.test(line)) {
      out.push({ k: "hr" });
      i++;
    } else if (/^[-*+]\s/.test(line)) {
      const rows: Seg[][] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        rows.push(inline(lines[i].replace(/^[-*+]\s/, "")));
        i++;
      }
      out.push({ k: "bullet", rows });
    } else if (/^\d+\.\s/.test(line)) {
      const rows: Seg[][] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        rows.push(inline(lines[i].replace(/^\d+\.\s/, "")));
        i++;
      }
      out.push({ k: "numbered", rows });
    } else if (line.trim()) {
      out.push({ k: "p", segs: inline(line.trim()) });
      i++;
    } else {
      i++;
    }
  }

  return out;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Cover ──
  cover: {
    backgroundColor: CANOPY,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 0,
  },
  coverAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 140,
    height: "100%",
    backgroundColor: JADE,
    opacity: 0.2,
  },
  coverCard: {
    backgroundColor: WHITE,
    marginHorizontal: 48,
    marginBottom: 72,
    padding: 40,
    borderRadius: 4,
  },
  coverLabel: {
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: JADE,
    letterSpacing: 2,
    marginBottom: 14,
  },
  coverTitle: {
    fontSize: 26,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: ABYSS,
    lineHeight: 1.4,
    marginBottom: 20,
  },
  coverMeta: {
    flexDirection: "row",
    gap: 24,
  },
  coverMetaItem: {
    fontSize: 9,
    fontFamily: "NotoSans",
    color: MUTED,
  },

  // ── Content page ──
  page: {
    fontFamily: "NotoSans",
    fontSize: 10,
    color: ABYSS,
    paddingHorizontal: 56,
    paddingTop: 40,
    paddingBottom: 56,
    backgroundColor: WHITE,
  },
  pageBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: MINT_BORDER,
    borderBottomStyle: "solid",
  },
  pageBarLeft: { fontSize: 8, fontFamily: "NotoSans", color: MUTED },
  pageBarRight: {
    fontSize: 8,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: JADE,
    letterSpacing: 1,
  },
  pageNum: {
    position: "absolute",
    bottom: 24,
    right: 56,
    fontSize: 8,
    fontFamily: "NotoSans",
    color: MUTED,
  },

  // ── Headings ──
  h1: {
    fontSize: 17,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: CANOPY,
    marginTop: 22,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: JADE,
    borderBottomStyle: "solid",
  },
  h2: {
    fontSize: 13,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: ABYSS,
    marginTop: 16,
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: JADE,
    borderLeftStyle: "solid",
  },
  h3: {
    fontSize: 11,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: ABYSS,
    marginTop: 12,
    marginBottom: 4,
  },
  h4: {
    fontSize: 10,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: MUTED,
    marginTop: 8,
    marginBottom: 3,
  },

  // ── Body ──
  p: {
    fontSize: 10,
    fontFamily: "NotoSans",
    lineHeight: 1.7,
    marginBottom: 6,
    color: ABYSS,
  },
  bold: { fontFamily: "NotoSans", fontWeight: 700 },
  italic: { fontFamily: "NotoSans", fontStyle: "italic" },
  boldItalic: { fontFamily: "NotoSans", fontWeight: 700, fontStyle: "italic" },

  // ── Lists ──
  listWrap: { marginBottom: 6, paddingLeft: 4 },
  listRow: { flexDirection: "row", marginBottom: 3 },
  listBullet: {
    width: 14,
    fontSize: 10,
    fontFamily: "NotoSans",
    lineHeight: 1.7,
    color: JADE,
  },
  listText: { flex: 1, fontSize: 10, fontFamily: "NotoSans", lineHeight: 1.7 },

  // ── Table ──
  table: {
    marginBottom: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: MINT_BORDER,
    borderStyle: "solid",
    borderRadius: 3,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: MINT_LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: JADE,
    borderBottomStyle: "solid",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: MINT_BORDER,
    borderBottomStyle: "solid",
  },
  tableLastRow: {
    flexDirection: "row",
  },
  // View wrappers — NO flex: 1, width is set inline per-column as a percentage.
  // react-pdf does NOT correctly compute row height for wrapped text when flex: 1 is used;
  // explicit percentage widths fix this.
  thView: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: MINT_BORDER,
    borderRightStyle: "solid",
  },
  thViewLast: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tdView: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: MINT_BORDER,
    borderRightStyle: "solid",
  },
  tdViewLast: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  // Text-only styles (no flex/padding/border)
  thText: {
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: CANOPY,
  },
  tdText: {
    fontSize: 9,
    fontFamily: "NotoSans",
    color: ABYSS,
    lineHeight: 1.5,
  },

  // ── HR ──
  hr: {
    borderTopWidth: 1,
    borderTopColor: MINT_BORDER,
    borderTopStyle: "solid",
    marginVertical: 12,
  },

  // ── Tick/check mark ──
  tickGlyph: {
    fontFamily: "NotoSansSymbols2",
    fontSize: 10,
    color: JADE,
  },

  // ── Priority labels ──
  priorityHigh: {
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: "#dc2626",
  },
  priorityMedium: {
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: "#d97706",
  },
  priorityLow: {
    fontSize: 9,
    fontFamily: "NotoSans",
    fontWeight: 700,
    color: JADE,
  },
});

// ── Type for individual style value ──────────────────────────────────────────

type PdfStyle = (typeof s)[keyof typeof s];

// ── Table layout helpers ─────────────────────────────────────────────────────

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function resolveColumnWeights(headers: string[]): number[] {
  const normalized = headers.map(normalizeHeader);

  return normalized.map((header) => {
    if (header === "#" || header === "step") return 0.55;
    if (header === "critical" || header === "severity" || header === "priority") return 0.9;
    if (header === "actor" || header === "type" || header === "owner" || header === "status") {
      return 1.05;
    }
    if (
      header === "description" ||
      header === "action" ||
      header === "objective" ||
      header === "success metric"
    ) {
      return 2.6;
    }
    if (header === "business rules" || header === "acceptance criteria") return 1.35;

    return 1.4;
  });
}

function resolveColumnWidths(headers: string[]): number[] {
  const weights = resolveColumnWeights(headers);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  return weights.map((weight) => (TABLE_WIDTH * weight) / totalWeight);
}

function normalizeRowCells(row: string[], colCount: number): string[] {
  return Array.from({ length: colCount }, (_unused, index) => row[index] ?? "");
}

// ── Priority cell renderer ───────────────────────────────────────────────────

const PRIORITY_RE = /\b(high|critical|medium|normal|low|minor)\b/i;

function cleanCell(v: string): string {
  return v.replace(/[[\]`_]/g, "").replace(/:\s*$/, "").trim();
}

function renderCellWithTicks(text: string, baseStyle: PdfStyle) {
  const re = /[✓✔]/g;
  const parts: { t: string; tick?: true }[] = [];
  let cur = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cur) parts.push({ t: text.slice(cur, m.index) });
    parts.push({ t: "✓", tick: true });
    cur = re.lastIndex;
  }
  if (cur < text.length) parts.push({ t: text.slice(cur) });
  return (
    <Text style={baseStyle}>
      {parts.map((p, i) =>
        p.tick ? <Text key={i} style={s.tickGlyph}>✓</Text> : p.t
      )}
    </Text>
  );
}

function PriorityText({ value, cellStyle }: { value: string; cellStyle: PdfStyle }) {
  const clean = cleanCell(value);

  if (/[✓✔]/.test(clean)) return renderCellWithTicks(clean, cellStyle);

  const m = PRIORITY_RE.exec(clean);
  if (!m) return <Text style={cellStyle}>{clean}</Text>;

  const label = m[0].toLowerCase();
  const priorityStyle =
    label === "high" || label === "critical"
      ? s.priorityHigh
      : label === "medium" || label === "normal"
        ? s.priorityMedium
        : s.priorityLow;

  const before = clean.slice(0, m.index);
  const after = clean.slice(m.index + m[0].length);

  return (
    <Text style={cellStyle}>
      {before}
      <Text style={priorityStyle}>{m[0]}</Text>
      {after}
    </Text>
  );
}

// ── Inline renderer ───────────────────────────────────────────────────────────

function InlineText({ segs, style }: { segs: Seg[]; style?: PdfStyle }) {
  if (segs.length === 1 && !segs[0].b && !segs[0].i && !segs[0].tick && !segs[0].color) {
    return <Text style={style}>{segs[0].t}</Text>;
  }
  return (
    <Text style={style}>
      {segs.map((seg, idx) => (
        <Text
          key={idx}
          style={
            seg.tick
              ? s.tickGlyph
              : seg.color
                ? { fontFamily: "NotoSans", fontWeight: 700, color: seg.color }
                : seg.b && seg.i
                  ? s.boldItalic
                  : seg.b
                    ? s.bold
                    : seg.i
                      ? s.italic
                      : undefined
          }
        >
          {seg.t}
        </Text>
      ))}
    </Text>
  );
}

// ── Block renderer ────────────────────────────────────────────────────────────

function BlockNode({ block }: { block: Block }) {
  switch (block.k) {
    case "h1":
      return <Text minPresenceAhead={48} style={s.h1}>{block.text}</Text>;
    case "h2":
      return <Text minPresenceAhead={42} style={s.h2}>{block.text}</Text>;
    case "h3":
      return <Text minPresenceAhead={32} style={s.h3}>{block.text}</Text>;
    case "h4":
      return <Text minPresenceAhead={28} style={s.h4}>{block.text}</Text>;
    case "p":
      return <InlineText segs={block.segs} style={s.p} />;
    case "bullet":
      return (
        <View style={s.listWrap}>
          {block.rows.map((row, i) => (
            <View key={i} style={s.listRow}>
              <Text style={s.listBullet}>•</Text>
              <InlineText segs={row} style={s.listText} />
            </View>
          ))}
        </View>
      );
    case "numbered":
      return (
        <View style={s.listWrap}>
          {block.rows.map((row, i) => (
            <View key={i} style={s.listRow}>
              <Text style={s.listBullet}>{i + 1}.</Text>
              <InlineText segs={row} style={s.listText} />
            </View>
          ))}
        </View>
      );
    case "table":
      {
        const colCount = Math.max(block.headers.length, 1);
        // Use absolute pt widths so react-pdf can measure text height before flex resolves.
        // Wider text-heavy columns prevent long BRD descriptions from becoming thin towers.
        const colWidths = resolveColumnWidths(block.headers);
        return (
          <View style={s.table}>
            {/* Header row */}
            <View wrap={false} style={s.tableHeaderRow}>
              {block.headers.map((h, ci) => (
                <View
                  key={ci}
                  style={[
                    ci < colCount - 1 ? s.thView : s.thViewLast,
                    { width: colWidths[ci], flexShrink: 0 },
                  ]}
                >
                  <Text style={s.thText}>{h}</Text>
                </View>
              ))}
            </View>
            {/* Data rows */}
            {block.rows.map((rawRow, ri) => {
              const row = normalizeRowCells(rawRow, colCount);
              return (
                <View
                  key={ri}
                  wrap={false}
                  style={ri < block.rows.length - 1 ? s.tableRow : s.tableLastRow}
                >
                  {row.map((cell, ci) => (
                    <View
                      key={ci}
                      style={[
                        ci < colCount - 1 ? s.tdView : s.tdViewLast,
                        { width: colWidths[ci], flexShrink: 0 },
                      ]}
                    >
                      <PriorityText value={cell} cellStyle={s.tdText} />
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        );
      }
    case "hr":
      return <View style={s.hr} />;
  }
}

// ── Group headings with their next block to prevent orphaned headings ─────────

type BlockGroup = { items: Block[]; paired: boolean };

function groupBlocks(blocks: Block[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    const isHeading = block.k === "h1" || block.k === "h2" || block.k === "h3" || block.k === "h4";
    if (isHeading && i + 1 < blocks.length) {
      groups.push({ items: [block, blocks[i + 1]], paired: true });
      i += 2;
    } else {
      groups.push({ items: [block], paired: false });
      i++;
    }
  }
  return groups;
}

// ── Public component ──────────────────────────────────────────────────────────

export type BrdDocumentProps = {
  markdown: string;
  projectName: string;
};

export function BrdDocument({ markdown, projectName }: BrdDocumentProps) {
  const blocks = parseMarkdown(markdown);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document
      title={`${projectName} – Business Requirements Document`}
      author="ReqTool"
      subject="BRD"
    >
      {/* ── Cover ── */}
      <Page size="A4" style={s.cover}>
        <View style={s.coverAccent} />
        <View style={s.coverCard}>
          <Text style={s.coverLabel}>BUSINESS REQUIREMENTS DOCUMENT</Text>
          <Text style={s.coverTitle}>{projectName}</Text>
          <View style={s.coverMeta}>
            <Text style={s.coverMetaItem}>Created: {today}</Text>
            <Text style={s.coverMetaItem}>Version: 1.0</Text>
          </View>
        </View>
      </Page>

      {/* ── Content ── */}
      <Page size="A4" style={s.page} wrap>
        <View style={s.pageBar} fixed>
          <Text style={s.pageBarLeft}>{projectName}</Text>
          <Text style={s.pageBarRight}>BRD</Text>
        </View>

        {groupBlocks(blocks).map((group, i) =>
          group.paired && !group.items.some((item) => item.k === "table") ? (
            <View key={i} wrap={false} style={{ width: "100%" }}>
              {group.items.map((b, j) => <BlockNode key={j} block={b} />)}
            </View>
          ) : (
            <View key={i} style={{ width: "100%" }}>
              {group.items.map((b, j) => <BlockNode key={j} block={b} />)}
            </View>
          )
        )}

        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
