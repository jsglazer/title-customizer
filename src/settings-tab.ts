import { App, PluginSettingTab, Setting } from "obsidian";
import { PLACEHOLDERS } from "./core/context";
import { DEFAULT_SETTINGS, DELIMITER_OPTIONS, type TitleSettings } from "./core/settings";
import type TitleCustomizerPlugin from "./main";

export class TitleCustomizerSettingTab extends PluginSettingTab {
	private previewEl: HTMLElement | null = null;

	constructor(
		app: App,
		private readonly plugin: TitleCustomizerPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const preview = new Setting(containerEl)
			.setName("Current window title")
			.setDesc("Updates live as you edit the settings below.");
		this.previewEl = preview.controlEl.createEl("code", { cls: "title-customizer-preview" });
		this.updatePreview();

		new Setting(containerEl).setName("Templates").setHeading();

		const help = containerEl.createDiv({ cls: "setting-item-description title-customizer-help" });
		help.createEl("p", {
			text: "Split a template into segments with the delimiter (e.g. ~~). Segments whose placeholders are all empty are dropped, and the rest are joined with the separator. Parentheses around a single placeholder, like ({{frontmatter.project}}), vanish with it when it is empty.",
		});
		const list = help.createEl("ul");
		for (const placeholder of PLACEHOLDERS) {
			const item = list.createEl("li");
			item.createEl("code", { text: `{{${placeholder.key}}}` });
			item.appendText(` — ${placeholder.description}${placeholder.needsFile ? "" : " (available in both templates)"}`);
		}

		this.addTemplate("Template when a file is open", "titleTemplate", "Used for notes, canvases, PDFs, images, and any other file view.");
		this.addTemplate("Template when no file is open", "titleTemplateEmpty", "Used for empty tabs, graph view, and other views without a file. Only vault, workspace, version, and viewtype are available.");

		new Setting(containerEl).setName("Formatting").setHeading();

		new Setting(containerEl)
			.setName("Separator")
			.setDesc("Inserted between the segments that remain after empty ones are dropped.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.separator)
					.setValue(this.plugin.settings.separator)
					.onChange((value) => this.applySetting({ separator: value })),
			);

		new Setting(containerEl)
			.setName("Delimiter")
			.setDesc("Marks where a template is split into segments.")
			.addDropdown((dropdown) => {
				for (const option of DELIMITER_OPTIONS) dropdown.addOption(option.value, option.label);
				dropdown.setValue(this.plugin.settings.delimiter).onChange((value) => this.applySetting({ delimiter: value }));
			});

		new Setting(containerEl)
			.setName("Frontmatter override property")
			.setDesc("When the open note has this property, its value becomes the whole window title. Leave blank to disable.")
			.addText((text) =>
				text
					.setPlaceholder("e.g. window-title")
					.setValue(this.plugin.settings.overrideField)
					.onChange((value) => this.applySetting({ overrideField: value })),
			);
	}

	hide(): void {
		this.previewEl = null;
	}

	private addTemplate(name: string, key: "titleTemplate" | "titleTemplateEmpty", desc: string): void {
		new Setting(this.containerEl)
			.setName(name)
			.setDesc(desc)
			.setClass("title-customizer-template")
			.addTextArea((area) =>
				area
					.setPlaceholder(DEFAULT_SETTINGS[key])
					.setValue(this.plugin.settings[key])
					.onChange((value) => this.applySetting({ [key]: value })),
			)
			.addExtraButton((button) =>
				button
					.setIcon("rotate-ccw")
					.setTooltip("Reset to default")
					.onClick(async () => {
						await this.applySetting({ [key]: DEFAULT_SETTINGS[key] });
						this.display();
					}),
			);
	}

	private async applySetting(patch: Partial<TitleSettings>): Promise<void> {
		await this.plugin.updateSettings(patch);
		this.updatePreview();
	}

	private updatePreview(): void {
		this.previewEl?.setText(this.plugin.lastTitle || "(not set yet)");
	}
}
