import { describe, expect, it } from "vitest";
import { renderSegment, renderTitle, type RenderOptions } from "../src/core/template";

const opts: RenderOptions = { delimiter: "~~", separator: " - ", overrideField: "" };

describe("renderSegment", () => {
	it("substitutes known placeholders", () => {
		expect(renderSegment("Note: {{basename}}", { basename: "Plan" })).toBe("Note: Plan");
	});

	it("tolerates whitespace inside braces", () => {
		expect(renderSegment("{{ basename }}", { basename: "Plan" })).toBe("Plan");
	});

	it("drops a segment whose placeholders are all empty", () => {
		expect(renderSegment("Project: {{frontmatter.project}}", {})).toBe("");
	});

	it("keeps a segment when at least one placeholder resolves", () => {
		expect(renderSegment("{{workspace}} {{vault}}", { vault: "Main" })).toBe("Main");
	});

	it("keeps literal-only segments", () => {
		expect(renderSegment(" Obsidian ", {})).toBe("Obsidian");
	});

	it("removes an empty parenthesised placeholder but keeps a filled one", () => {
		expect(renderSegment("{{basename}} ({{frontmatter.project}})", { basename: "Plan" })).toBe("Plan");
		expect(renderSegment("{{basename}} ({{frontmatter.project}})", { basename: "Plan", "frontmatter.project": "Alpha" })).toBe(
			"Plan (Alpha)",
		);
	});

	it("treats regex metacharacters in keys literally", () => {
		expect(renderSegment("{{frontmatter.a+b(c)}}", { "frontmatter.a+b(c)": "ok" })).toBe("ok");
	});

	it("does not resolve inherited object properties", () => {
		expect(renderSegment("x{{constructor}}", {})).toBe("");
	});
});

describe("renderTitle", () => {
	const ctx = { basename: "Plan", vault: "Main", version: "1.14.5" };

	it("renders the default template", () => {
		expect(renderTitle("{{basename}}~~{{vault}} - Obsidian v{{version}}", ctx, opts)).toBe("Plan - Main - Obsidian v1.14.5");
	});

	it("drops empty segments together with their separator", () => {
		expect(renderTitle("{{workspace}}~~{{basename}}~~{{vault}}", ctx, opts)).toBe("Plan - Main");
	});

	it("ignores leading, trailing, and doubled delimiters", () => {
		expect(renderTitle("~~{{basename}}~~~~{{vault}}~~", ctx, opts)).toBe("Plan - Main");
	});

	it("uses the configured delimiter and separator", () => {
		expect(renderTitle("{{basename}}##{{vault}}", ctx, { ...opts, delimiter: "##", separator: " | " })).toBe("Plan | Main");
	});

	it("does not split when the delimiter is empty", () => {
		expect(renderTitle("{{basename}}~~{{vault}}", ctx, { ...opts, delimiter: "" })).toBe("Plan~~Main");
	});

	it("returns an empty string when nothing resolves", () => {
		expect(renderTitle("{{workspace}}", ctx, opts)).toBe("");
	});

	it("lets the override property replace the whole title", () => {
		const withOverride = { ...ctx, "frontmatter.window-title": "  Custom  " };
		expect(renderTitle("{{basename}}", withOverride, { ...opts, overrideField: "window-title" })).toBe("Custom");
	});

	it("falls back to the template when the override property is missing or blank", () => {
		expect(renderTitle("{{basename}}", ctx, { ...opts, overrideField: "window-title" })).toBe("Plan");
		expect(renderTitle("{{basename}}", { ...ctx, "frontmatter.t": " " }, { ...opts, overrideField: "t" })).toBe("Plan");
	});
});
