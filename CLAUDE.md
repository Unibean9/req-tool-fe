@AGENTS.md

# Frontend OS

This project uses **Frontend OS** — an AI-assisted workflow system located at `.frontend-os/`.

## How It Works

When a workflow command is invoked (e.g. `/new-ui`), Claude will:

1. Read the workflow definition from `.frontend-os/workflows/registry.json`
2. Apply the skills listed under that workflow
3. Execute using the prompt at `.frontend-os/prompts/executor.md`
4. Audit with the prompt at `.frontend-os/prompts/auditor.md`
5. Follow the relevant checklists in `.frontend-os/checklists/`
6. Output according to `.frontend-os/prompts/final-output.md`

Always read `.frontend-os/architecture/` docs before generating any code.
Prefer snippets in `.frontend-os/snippets/` before writing new patterns.

---

## Available Workflow Commands

| Command | Purpose |
|---------|---------|
| `/new-ui` | Build new UI (page, section, component) |
| `/redesign-ui` | Improve existing UI |
| `/layout-polish` | Polish layouts and spacing |
| `/nextjs-architecture` | Review or refactor architecture |
| `/project-setup` | Setup new project foundation |
| `/component-system` | Build scalable component structure |
| `/animation-polish` | Improve animations and interactions |
| `/accessibility-audit` | Audit and fix accessibility |
| `/harden-ui` | Add loading, error, and empty states |
| `/fix-performance` | Fix rendering and performance issues |
| `/seo-metadata` | Setup metadata and SEO |
| `/use-snippet` | Reuse a snippet from `.frontend-os/snippets/` |
| `/pre-release` | Pre-merge gate: performance + SEO + a11y + production |
| `/production-audit` | Final UI and production quality review |

---

## Skills Reference

Skills are defined in `.frontend-os/skills-lock.json`.

| Skill | Purpose |
|-------|---------|
| `frontend-design` | UI/UX layout and design |
| `vercel-react-best-practices` | React and Next.js best practices |
| `frontend-ui-engineering` | Scalable frontend architecture |
| `shadcn` | shadcn/ui component usage |
| `baseline-ui` | Base design system |
| `emil-design-eng` | Premium UI polish |
| `transitions-dev` | Transitions and interactions |
| `fixing-motion-performance` | Animation optimization |
| `wcag-audit-patterns` | Accessibility audit |
| `fixing-accessibility` | Accessibility fixes |
| `web-quality-audit` | Production quality review |
| `react-doctor` | React performance fixes |
| `fixing-metadata` | SEO metadata setup |

---

## Tech Stack

- **Framework:** Next.js App Router (latest), React, TypeScript
- **Styling:** Tailwind CSS v4 — uses `@theme {}` in `globals.css`, no `tailwind.config.ts`
- **Components:** shadcn/ui + Radix UI
- **Data Fetching:** TanStack Query v5 + Axios
- **State:** Redux Toolkit + redux-persist
- **Real-time:** SignalR WebSocket
- **Auth:** Cookie-based (`authToken`), RBAC middleware, auto-refresh 2 min before expiry
- **Forms:** React Hook Form + Zod
- **Animation:** Framer Motion, GSAP

## Architecture Rule

```
Route-specific components → app/[route]/components/
Shared reusable components → components/shared/
Base UI components → components/ui/
Layout components → components/layout/
```

Never put business-specific logic inside `components/ui/`.

---

## General Skills (Claude Code built-in)

| Command | Purpose |
|---------|---------|
| `/run` | Start the app and observe real behavior |
| `/verify` | Verify a change works before pushing |
| `/review` | Review a pull request |
| `/code-review` | Review current diff for bugs |
| `/security-review` | Security review of branch changes |
| `/update-config` | Configure Claude Code via settings.json |
| `/loop` | Run a command on a recurring interval |
| `/schedule` | Schedule a one-time or recurring agent |
