---
title: Taptics Lineup Builder Handbook
---

## What this is

This is a practical handbook for working on this repo (and collaborating with AI) while keeping changes safe and reversible.

## Run the app (live view)

- **Install deps**

```bash
npm install
```

- **Start dev server**

```bash
npm run dev
```

Vite will print a local URL (often `http://localhost:5173/`).

## Node setup (macOS)

You need Node.js + npm available in your terminal.

- If you use a version manager (e.g. `asdf`), make sure a Node version is installed and active.
- If installs fail or Node is missing, installing Node from `nodejs.org` (LTS `.pkg`) is the simplest option.

## Dependency install gotcha (current repo)

This repo currently has a peer-dependency mismatch (React 19 vs `lucide-react` peer range). If `npm install` fails with `ERESOLVE`, use:

```bash
npm install --legacy-peer-deps
```

If you want the “clean” fix later, update dependencies so peer ranges match (do this intentionally, and test).

## Secrets / environment variables

- Put secrets in **`.env.local`**, not in code.
- Example: `GEMINI_API_KEY` should be read from env, never hard-coded.
- Don’t commit secrets to source control.

## Project standards (AI + code style)

These are also captured in `.cursor/rules/project-standards.mdc` (always-on).

### Change strategy
- Prefer **minimal, surgical changes** over refactors.
- If a refactor would help, **propose first** and wait for approval.

### React + TypeScript
- Follow React best practices (functional components, hooks, predictable state).
- Keep components readable: extract helpers/hooks when logic grows.
- Avoid unnecessary re-renders when it matters; don’t over-optimize.

### UI/UX + accessibility
- Prioritize clarity and usability.
- Include accessible labels, keyboard navigation where relevant, and sensible focus behavior.
- Don’t introduce UI that looks “right” but is hard to use.

### Dependencies
- If dependency changes are needed, **propose the exact change and why**, and ask before applying.

## “Return to this build” (closest equivalent)

Use **git checkpoints**. This gives you “snapshots” you can jump back to.

### One-time setup

From the repo root:

```bash
git init
git add .
git commit -m "baseline"
```

### Before an AI “build” (or any big change)

```bash
git add .
git commit -m "checkpoint: before <change>"
```

### Return to a previous checkpoint

- See checkpoints:

```bash
git log --oneline
```

- Temporarily go back (to inspect/run):

```bash
git checkout <hash>
```

- Permanently reset back (discarding later work):

```bash
git reset --hard <hash>
```

If you want an even safer workflow, use branches (e.g. `feature/<name>`).

## How to ask the AI for best results

- **Keep tasks small**: one feature/bug at a time.
- **Define non-negotiables**: “don’t change lineup algorithm”, “UI only”, “no new deps”, etc.
- **Limit scope**: name the file(s) to touch when you care about blast radius.
- **Test immediately** after changes and report concrete steps + what you expected vs saw.

