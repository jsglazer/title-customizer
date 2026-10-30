// Pure title-template renderer. No `obsidian` import, no DOM: every input is
// passed in, so the whole rendering contract is covered by headless tests.

/** Values available to a template, keyed by placeholder name (e.g. "basename", "frontmatter.project"). */
export type TitleContext = Readonly<Record<string, string>>;

export interface RenderOptions {
	/** Marker in the template that splits it into segments, e.g. "~~". Empty disables segmenting. */
	delimiter: string;
	/** Text inserted between the segments that survive rendering, e.g. " - ". */
	separator: string;
	/** Frontmatter key whose value, when present, replaces the whole title. Empty disables the override. */
	overrideField: string;
}

// Keys are matched by these patterns and looked up in the context map; a key is
// never compiled into a RegExp, so keys containing regex metacharacters are safe.
const PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g;
// "({{key}})" — parentheses wrapping a single placeholder disappear with it when it is empty.
const OPTIONAL_GROUP = /\(+\s*\{\{\s*([^{}]+?)\s*\}\}\s*\)+/g;

export function lookup(ctx: TitleContext, key: string): string {
	return Object.prototype.hasOwnProperty.call(ctx, key) ? ctx[key] : "";
}

/**
 * Renders one segment. A segment that contains placeholders but resolves none
 * of them is reported as empty so the caller can drop it — together with its
 * separator — instead of leaving literal text such as "Project: " behind.
 */
export function renderSegment(segment: string, ctx: TitleContext): string {
	let placeholders = 0;
	let resolved = 0;

	const withoutEmptyGroups = segment.replace(OPTIONAL_GROUP, (match, key: string) =>
		lookup(ctx, key) === "" ? "" : match,
	);
	const text = withoutEmptyGroups.replace(PLACEHOLDER, (_match, key: string) => {
		const value = lookup(ctx, key);
		if (value !== "") resolved++;
		return value;
	});
	// Count against the original segment so an emptied "({{key}})" still counts as a placeholder.
	segment.replace(PLACEHOLDER, (match) => {
		placeholders++;
		return match;
	});

	if (placeholders > 0 && resolved === 0) return "";
	return text.trim();
}

export function renderTitle(template: string, ctx: TitleContext, options: RenderOptions): string {
	const overrideField = options.overrideField.trim();
	if (overrideField !== "") {
		const override = lookup(ctx, `frontmatter.${overrideField}`).trim();
		if (override !== "") return override;
	}

	const segments = options.delimiter === "" ? [template] : template.split(options.delimiter);
	return segments
		.map((segment) => renderSegment(segment, ctx))
		.filter((segment) => segment !== "")
		.join(options.separator)
		.trim();
}
