import { describe, expect, it } from "vitest";
import { buildContext, formatFrontmatterValue, type ContextInput } from "../src/core/context";

const base: ContextInput = {
	vault: "Main",
	version: "1.14.5",
	workspace: "",
	viewType: "markdown",
	file: null,
	frontmatter: null,
};

const note = { path: "Projects/Alpha/Plan.md", name: "Plan.md", basename: "Plan", extension: "md", parentPath: "Projects/Alpha" };

describe("buildContext", () => {
	it("always provides vault, version, workspace, and viewtype", () => {
		expect(buildContext({ ...base, viewType: "graph" })).toEqual({ vault: "Main", version: "1.14.5", workspace: "", viewtype: "graph" });
	});

	it("adds file fields when a file is open", () => {
		const ctx = buildContext({ ...base, file: note });
		expect(ctx).toMatchObject({
			filepath: "Projects/Alpha/Plan.md",
			filename: "Plan.md",
			basename: "Plan",
			extension: "md",
			parentpath: "Projects/Alpha",
			folder: "Alpha",
		});
	});

	it("keeps the extension in basename for non-markdown files", () => {
		const pdf = { path: "Papers/x.pdf", name: "x.pdf", basename: "x", extension: "pdf", parentPath: "Papers" };
		expect(buildContext({ ...base, file: pdf }).basename).toBe("x.pdf");
	});

	it("reports the vault root as an empty parent path and folder", () => {
		const ctx = buildContext({ ...base, file: { ...note, path: "Plan.md", parentPath: "/" } });
		expect(ctx.parentpath).toBe("");
		expect(ctx.folder).toBe("");
	});

	it("prefixes frontmatter keys and skips unusable values", () => {
		const ctx = buildContext({
			...base,
			file: note,
			frontmatter: { project: "Alpha", tags: ["a", "b"], nested: { x: 1 }, draft: "<% tp.date.now() %>", empty: null },
		});
		expect(ctx["frontmatter.project"]).toBe("Alpha");
		expect(ctx["frontmatter.tags"]).toBe("a, b");
		expect(ctx).not.toHaveProperty("frontmatter.nested");
		expect(ctx).not.toHaveProperty("frontmatter.draft");
		expect(ctx).not.toHaveProperty("frontmatter.empty");
	});

	it("ignores frontmatter when no file is open", () => {
		expect(buildContext({ ...base, frontmatter: { project: "Alpha" } })).not.toHaveProperty("frontmatter.project");
	});
});

describe("formatFrontmatterValue", () => {
	it("formats scalars", () => {
		expect(formatFrontmatterValue("x")).toBe("x");
		expect(formatFrontmatterValue(3)).toBe("3");
		expect(formatFrontmatterValue(false)).toBe("false");
	});

	it("collapses line breaks into single spaces", () => {
		expect(formatFrontmatterValue("line one\n  line two\r\n")).toBe("line one line two");
	});

	it("returns null for empty strings, empty arrays, and objects", () => {
		expect(formatFrontmatterValue("  ")).toBeNull();
		expect(formatFrontmatterValue([])).toBeNull();
		expect(formatFrontmatterValue({ a: 1 })).toBeNull();
		expect(formatFrontmatterValue(undefined)).toBeNull();
	});

	it("drops nested objects and blanks from arrays", () => {
		expect(formatFrontmatterValue(["a", { b: 1 }, "", 2])).toBe("a, 2");
	});
});
