export interface TitleSettings {
	/** Template used when the active view shows a file. */
	titleTemplate: string;
	/** Template used when no file is open (empty tab, graph view, ...). */
	titleTemplateEmpty: string;
	separator: string;
	delimiter: string;
	overrideField: string;
}

export const DELIMITER_OPTIONS: readonly { value: string; label: string }[] = [
	{ value: "~~", label: "~~ (tilde)" },
	{ value: "##", label: "## (hash)" },
	{ value: "__", label: "__ (underscore)" },
];

export const DEFAULT_SETTINGS: Readonly<TitleSettings> = {
	titleTemplate: "{{basename}}~~{{vault}} - Obsidian v{{version}}",
	titleTemplateEmpty: "{{vault}} - Obsidian v{{version}}",
	separator: " - ",
	delimiter: "~~",
	overrideField: "",
};

function stringOr(value: unknown, fallback: string): string {
	return typeof value === "string" ? value : fallback;
}

/** Turns whatever `loadData()` returned (possibly null or hand-edited) into valid settings. */
export function normalizeSettings(raw: unknown): TitleSettings {
	const data = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
	const delimiter = stringOr(data.delimiter, DEFAULT_SETTINGS.delimiter);
	return {
		titleTemplate: stringOr(data.titleTemplate, DEFAULT_SETTINGS.titleTemplate),
		titleTemplateEmpty: stringOr(data.titleTemplateEmpty, DEFAULT_SETTINGS.titleTemplateEmpty),
		separator: stringOr(data.separator, DEFAULT_SETTINGS.separator),
		delimiter: DELIMITER_OPTIONS.some((option) => option.value === delimiter) ? delimiter : DEFAULT_SETTINGS.delimiter,
		overrideField: stringOr(data.overrideField, DEFAULT_SETTINGS.overrideField),
	};
}
