# title-customizer

[![GitHub release](https://img.shields.io/github/v/release/jsglazer/title-customizer?logo=github)](https://github.com/jsglazer/title-customizer/releases)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/jsglazer/title-customizer/blob/main/LICENSE)
[![Made with Claude](https://img.shields.io/badge/Made_with-Claude-D97756?logo=anthropic)](https://claude.ai)
[![Gemini Flash Antigravity](https://img.shields.io/badge/Gemini%20Flash-Antigravity-4f86f7?logo=google-gemini&logoColor=white)](https://github.com/google-gemini)
[![CI](https://github.com/jsglazer/title-customizer/actions/workflows/ci.yml/badge.svg)](https://github.com/jsglazer/title-customizer/actions/workflows/ci.yml)
[![CodeQL](https://github.com/jsglazer/title-customizer/actions/workflows/codeql.yml/badge.svg)](https://github.com/jsglazer/title-customizer/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/jsglazer/title-customizer/badge)](https://securityscorecards.dev/viewer/?uri=github.com/jsglazer/title-customizer)

An Obsidian plugin that sets the app window title from a template of note metadata — path, file name, folder, frontmatter, vault, workspace. Time trackers that log the active window title, such as [ActivityWatch](https://activitywatch.net/) or Timing, can then record *which note* you were working in, not just "Obsidian".

Desktop only. A from-scratch rewrite of the idea behind [open-note-to-window-title](https://github.com/jplattel/open-note-to-window-title), with the same template syntax.

## Templates

There are two templates: one for when the active tab shows a file (note, canvas, PDF, image…), and one for when it does not (empty tab, graph view…).

| Placeholder | Value |
| --- | --- |
| `{{vault}}` | Vault name |
| `{{workspace}}` | Active workspace (Workspaces core plugin; empty when disabled) |
| `{{version}}` | Obsidian version |
| `{{viewtype}}` | Active view type: `markdown`, `canvas`, `pdf`, `graph`, `empty`… |
| `{{filepath}}` | Vault-relative path, e.g. `Projects/Alpha/Plan.md` |
| `{{filename}}` | File name with extension, e.g. `Plan.md` |
| `{{basename}}` | File name without `.md` (other files keep their extension) |
| `{{extension}}` | File extension |
| `{{parentpath}}` | Containing folder path, e.g. `Projects/Alpha` |
| `{{folder}}` | Containing folder name, e.g. `Alpha` |
| `{{frontmatter.<key>}}` | Any frontmatter property; lists are joined with `, ` |

Only `vault`, `workspace`, `version`, and `viewtype` are available in the no-file template.

### Segments and empty values

Split a template into segments with the delimiter (default `~~`). Rendering drops any segment whose placeholders are all empty, then joins the remaining segments with the separator (default ` - `). Parentheses around a single placeholder, such as `({{frontmatter.project}})`, disappear along with it when it is empty.

```
{{basename}}~~{{frontmatter.project}}~~{{vault}} - Obsidian
```

- A note with `project: Alpha` → `Plan - Alpha - Main - Obsidian`
- A note without `project` → `Plan - Main - Obsidian`

### Frontmatter override

Set **Frontmatter override property** (e.g. `window-title`), and any note that has that property uses its value as the entire window title.

## ActivityWatch setup

ActivityWatch's window watcher records the title of the focused window. A template that includes the vault-relative path makes the data easy to group and categorise:

```
{{filepath}}~~{{workspace}}~~{{vault}} - Obsidian
```

You can then add ActivityWatch category rules that match on the title, for example a regex such as `Projects/Alpha/` for a project category. On macOS, ActivityWatch needs the Accessibility permission to read window titles.

## Behaviour notes

- Focusing a sidebar (file explorer, outline, backlinks) keeps the title of the note you were in.
- Pop-out windows get their own titles, based on the tab active in that window.
- The title updates when you switch tabs, rename or delete the open file, change its frontmatter, or load a workspace.
- Obsidian rewrites the title on its own. The plugin re-applies yours right away instead of racing it with a timer.
- Disabling the plugin restores the original title.

## Commands

| Command | What it does |
| --- | --- |
| **Refresh window title** | Recomputes the title immediately. |

## Development

```
npm install
npm test        # headless Vitest suite for the template engine (src/core)
npm run build   # type-check + bundle to main.js
```
