// Builds the placeholder map a template is rendered against. Pure: the shell
// extracts plain data from Obsidian objects and passes it in.

import type { TitleContext } from "./template";

export interface FileInfo {
	path: string;
	name: string;
	basename: string;
	extension: string;
	/** Path of the containing folder; Obsidian reports the vault root as "/". */
	parentPath: string;
}

export interface ContextInput {
	vault: string;
	version: string;
	workspace: string;
	viewType: string;
	file: FileInfo | null;
	frontmatter: Readonly<Record<string, unknown>> | null;
}

export interface PlaceholderDoc {
	key: string;
	description: string;
	needsFile: boolean;
}

export const PLACEHOLDERS: readonly PlaceholderDoc[] = [
	{ key: "vault", description: "Vault name", needsFile: false },
	{ key: "workspace", description: "Active workspace (Workspaces core plugin)", needsFile: false },
	{ key: "version", description: "Obsidian version", needsFile: false },
	{ key: "viewtype", description: "Type of the active view, e.g. markdown, canvas, pdf, graph", needsFile: false },
	{ key: "filepath", description: "Vault-relative path, e.g. Projects/Alpha/Plan.md", needsFile: true },
	{ key: "filename", description: "File name with extension", needsFile: true },
	{ key: "basename", description: "File name without .md (other files keep their extension)", needsFile: true },
	{ key: "extension", description: "File extension", needsFile: true },
	{ key: "parentpath", description: "Containing folder path, e.g. Projects/Alpha", needsFile: true },
	{ key: "folder", description: "Containing folder name, e.g. Alpha", needsFile: true },
	{ key: "frontmatter.<key>", description: "Any frontmatter property", needsFile: true },
];

// Window titles are single-line; collapse any line breaks a multi-line property carries.
function singleLine(text: string): string {
	return text.replace(/\s*[\r\n]+\s*/g, " ").trim();
}

/**
 * Formats a frontmatter value for the title, or returns null when it should not
 * become a placeholder: nested objects, empty values, and unrendered Templater
 * expressions ("<% ... %>") that would otherwise leak into the title.
 */
export function formatFrontmatterValue(value: unknown): string | null {
	if (typeof value === "string") {
		if (value.includes("<%")) return null;
		const text = singleLine(value);
		return text === "" ? null : text;
	}
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) {
		const parts = value
			.map((item) => (typeof item === "object" && item !== null ? null : formatFrontmatterValue(item)))
			.filter((item): item is string => item !== null);
		return parts.length === 0 ? null : parts.join(", ");
	}
	return null;
}

export function buildContext(input: ContextInput): TitleContext {
	const ctx: Record<string, string> = {
		vault: input.vault,
		version: input.version,
		workspace: input.workspace,
		viewtype: input.viewType,
	};

	if (input.file) {
		const { file } = input;
		const parentPath = file.parentPath === "/" ? "" : file.parentPath;
		ctx.filepath = file.path;
		ctx.filename = file.name;
		ctx.basename = file.extension === "md" ? file.basename : file.name;
		ctx.extension = file.extension;
		ctx.parentpath = parentPath;
		ctx.folder = parentPath === "" ? "" : parentPath.slice(parentPath.lastIndexOf("/") + 1);
	}

	if (input.file && input.frontmatter) {
		for (const [key, value] of Object.entries(input.frontmatter)) {
			const text = formatFrontmatterValue(value);
			if (text !== null) ctx[`frontmatter.${key}`] = text;
		}
	}

	return ctx;
}
