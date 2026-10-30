import { FileView, Plugin, TAbstractFile, TFile, WorkspaceItem, WorkspaceLeaf, WorkspaceWindow, apiVersion } from "obsidian";
import { buildContext, type FileInfo } from "./core/context";
import { normalizeSettings, type TitleSettings } from "./core/settings";
import { renderTitle } from "./core/template";
import { getActiveWorkspaceName } from "./internals";
import { TitleCustomizerSettingTab } from "./settings-tab";
import { TitleGuard } from "./title-guard";

// Shown if a template renders to nothing, so the window is never left untitled.
const FALLBACK_TITLE = "Obsidian";

// Obsidian requires the plugin class to be the module's default export.
export default class TitleCustomizerPlugin extends Plugin {
	settings: TitleSettings = normalizeSettings(null);
	lastTitle = "";

	private readonly guards = new Map<Document, TitleGuard>();
	// The main-area leaf the title describes. Sidebar leaves (file explorer,
	// outline, ...) never replace it, so focusing a sidebar keeps the note's title.
	private trackedLeaf: WorkspaceLeaf | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new TitleCustomizerSettingTab(this.app, this));

		this.addCommand({
			id: "refresh-window-title",
			name: "Refresh window title",
			callback: () => this.refreshTitle(),
		});

		this.app.workspace.onLayoutReady(() => this.start());
	}

	onunload(): void {
		for (const guard of this.guards.values()) guard.restore();
		this.guards.clear();
		this.trackedLeaf = null;
	}

	async updateSettings(patch: Partial<TitleSettings>): Promise<void> {
		this.settings = normalizeSettings({ ...this.settings, ...patch });
		await this.saveData(this.settings);
		this.refreshTitle();
	}

	refreshTitle(): void {
		const leaf = this.currentLeaf();
		const view = leaf?.view;
		const file = view instanceof FileView ? view.file : null;
		const frontmatter = file ? (this.app.metadataCache.getFileCache(file)?.frontmatter ?? null) : null;

		const ctx = buildContext({
			vault: this.app.vault.getName(),
			version: apiVersion,
			workspace: getActiveWorkspaceName(this.app),
			viewType: view?.getViewType() ?? "",
			file: file ? toFileInfo(file) : null,
			frontmatter,
		});
		const template = file ? this.settings.titleTemplate : this.settings.titleTemplateEmpty;
		const title =
			renderTitle(template, ctx, {
				delimiter: this.settings.delimiter,
				separator: this.settings.separator,
				overrideField: this.settings.overrideField,
			}) || FALLBACK_TITLE;

		this.lastTitle = title;
		// A leaf in a pop-out window titles that window, not the main one.
		this.guardFor(view?.containerEl.ownerDocument ?? document).set(title);
	}

	private start(): void {
		const { workspace, vault, metadataCache } = this.app;

		this.registerEvent(
			workspace.on("active-leaf-change", (leaf) => {
				this.trackLeaf(leaf);
				this.refreshTitle();
			}),
		);
		this.registerEvent(workspace.on("file-open", () => this.refreshTitle()));
		// Fires when a tab is closed, a workspace is loaded, or a view swaps its file.
		this.registerEvent(workspace.on("layout-change", () => this.refreshTitle()));
		this.registerEvent(
			workspace.on("window-close", (_win: WorkspaceWindow, win: Window) => {
				this.guards.get(win.document)?.dispose();
				this.guards.delete(win.document);
			}),
		);
		this.registerEvent(vault.on("rename", (file) => this.refreshIfCurrent(file)));
		this.registerEvent(vault.on("delete", (file) => this.refreshIfCurrent(file)));
		this.registerEvent(metadataCache.on("changed", (file) => this.refreshIfCurrent(file)));

		this.trackLeaf(workspace.getMostRecentLeaf());
		this.refreshTitle();
	}

	private refreshIfCurrent(file: TAbstractFile): void {
		const view = this.currentLeaf()?.view;
		if (view instanceof FileView && view.file === file) this.refreshTitle();
	}

	private trackLeaf(leaf: WorkspaceLeaf | null): void {
		if (!leaf) return;
		const root: WorkspaceItem = leaf.getRoot();
		const { leftSplit, rightSplit } = this.app.workspace;
		if (root === leftSplit || root === rightSplit) return;
		this.trackedLeaf = leaf;
	}

	private currentLeaf(): WorkspaceLeaf | null {
		// A closed leaf's view is detached from the DOM; fall back to Obsidian's pick.
		if (!this.trackedLeaf?.view.containerEl.isConnected) {
			this.trackedLeaf = this.app.workspace.getMostRecentLeaf();
		}
		return this.trackedLeaf;
	}

	private guardFor(doc: Document): TitleGuard {
		let guard = this.guards.get(doc);
		if (!guard) {
			guard = new TitleGuard(doc);
			this.guards.set(doc, guard);
		}
		return guard;
	}

	private async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}
}

function toFileInfo(file: TFile): FileInfo {
	return {
		path: file.path,
		name: file.name,
		basename: file.basename,
		extension: file.extension,
		parentPath: file.parent?.path ?? "",
	};
}
