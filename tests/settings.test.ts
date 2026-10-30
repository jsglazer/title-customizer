import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/core/settings";

describe("normalizeSettings", () => {
	it("returns defaults for missing data", () => {
		expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings("garbage")).toEqual(DEFAULT_SETTINGS);
	});

	it("keeps valid saved values", () => {
		const saved = { titleTemplate: "{{filepath}}", titleTemplateEmpty: "", separator: " | ", delimiter: "##", overrideField: "title" };
		expect(normalizeSettings(saved)).toEqual(saved);
	});

	it("replaces wrongly typed fields and unknown delimiters with defaults", () => {
		const result = normalizeSettings({ titleTemplate: 42, delimiter: "%%" });
		expect(result.titleTemplate).toBe(DEFAULT_SETTINGS.titleTemplate);
		expect(result.delimiter).toBe(DEFAULT_SETTINGS.delimiter);
	});
});
