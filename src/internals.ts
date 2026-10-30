// The ONLY module that touches undocumented Obsidian internals. If a future
// Obsidian release changes these shapes, this is the one file to fix; every
// accessor degrades to an empty value rather than throwing.
//
// Shape verified against Obsidian 1.14.5 (installer 1.14.4):
//   app.internalPlugins.plugins.workspaces = { enabled: boolean, instance: { activeWorkspace: string } }

import type { App } from "obsidian";

interface InternalPluginsShape {
	internalPlugins?: {
		plugins?: Record<string, { enabled?: unknown; instance?: { activeWorkspace?: unknown } } | undefined>;
	};
}

/** Name of the workspace loaded by the Workspaces core plugin, or "" when it is disabled or unavailable. */
export function getActiveWorkspaceName(app: App): string {
	const workspaces = (app as unknown as InternalPluginsShape).internalPlugins?.plugins?.workspaces;
	if (workspaces?.enabled !== true) return "";
	const name = workspaces.instance?.activeWorkspace;
	return typeof name === "string" ? name : "";
}
