"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => TitleCustomizerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/core/context.ts
var PLACEHOLDERS = [
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
  { key: "frontmatter.<key>", description: "Any frontmatter property", needsFile: true }
];
function singleLine(text) {
  return text.replace(/\s*[\r\n]+\s*/g, " ").trim();
}
function formatFrontmatterValue(value) {
  if (typeof value === "string") {
    if (value.includes("<%")) return null;
    const text = singleLine(value);
    return text === "" ? null : text;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((item) => typeof item === "object" && item !== null ? null : formatFrontmatterValue(item)).filter((item) => item !== null);
    return parts.length === 0 ? null : parts.join(", ");
  }
  return null;
}
function buildContext(input) {
  const ctx = {
    vault: input.vault,
    version: input.version,
    workspace: input.workspace,
    viewtype: input.viewType
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

// src/core/settings.ts
var DELIMITER_OPTIONS = [
  { value: "~~", label: "~~ (tilde)" },
  { value: "##", label: "## (hash)" },
  { value: "__", label: "__ (underscore)" }
];
var DEFAULT_SETTINGS = {
  titleTemplate: "{{basename}}~~{{vault}} - Obsidian v{{version}}",
  titleTemplateEmpty: "{{vault}} - Obsidian v{{version}}",
  separator: " - ",
  delimiter: "~~",
  overrideField: ""
};
function stringOr(value, fallback) {
  return typeof value === "string" ? value : fallback;
}
function normalizeSettings(raw) {
  const data = typeof raw === "object" && raw !== null ? raw : {};
  const delimiter = stringOr(data.delimiter, DEFAULT_SETTINGS.delimiter);
  return {
    titleTemplate: stringOr(data.titleTemplate, DEFAULT_SETTINGS.titleTemplate),
    titleTemplateEmpty: stringOr(data.titleTemplateEmpty, DEFAULT_SETTINGS.titleTemplateEmpty),
    separator: stringOr(data.separator, DEFAULT_SETTINGS.separator),
    delimiter: DELIMITER_OPTIONS.some((option) => option.value === delimiter) ? delimiter : DEFAULT_SETTINGS.delimiter,
    overrideField: stringOr(data.overrideField, DEFAULT_SETTINGS.overrideField)
  };
}

// src/core/template.ts
var PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g;
var OPTIONAL_GROUP = /\(+\s*\{\{\s*([^{}]+?)\s*\}\}\s*\)+/g;
function lookup(ctx, key) {
  return Object.prototype.hasOwnProperty.call(ctx, key) ? ctx[key] : "";
}
function renderSegment(segment, ctx) {
  let placeholders = 0;
  let resolved = 0;
  const withoutEmptyGroups = segment.replace(
    OPTIONAL_GROUP,
    (match, key) => lookup(ctx, key) === "" ? "" : match
  );
  const text = withoutEmptyGroups.replace(PLACEHOLDER, (_match, key) => {
    const value = lookup(ctx, key);
    if (value !== "") resolved++;
    return value;
  });
  segment.replace(PLACEHOLDER, (match) => {
    placeholders++;
    return match;
  });
  if (placeholders > 0 && resolved === 0) return "";
  return text.trim();
}
function renderTitle(template, ctx, options) {
  const overrideField = options.overrideField.trim();
  if (overrideField !== "") {
    const override = lookup(ctx, `frontmatter.${overrideField}`).trim();
    if (override !== "") return override;
  }
  const segments = options.delimiter === "" ? [template] : template.split(options.delimiter);
  return segments.map((segment) => renderSegment(segment, ctx)).filter((segment) => segment !== "").join(options.separator).trim();
}

// src/internals.ts
function getActiveWorkspaceName(app) {
  var _a, _b, _c;
  const workspaces = (_b = (_a = app.internalPlugins) == null ? void 0 : _a.plugins) == null ? void 0 : _b.workspaces;
  if ((workspaces == null ? void 0 : workspaces.enabled) !== true) return "";
  const name = (_c = workspaces.instance) == null ? void 0 : _c.activeWorkspace;
  return typeof name === "string" ? name : "";
}

// src/settings-tab.ts
var import_obsidian = require("obsidian");
var TitleCustomizerSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.previewEl = null;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const preview = new import_obsidian.Setting(containerEl).setName("Current window title").setDesc("Updates live as you edit the settings below.");
    this.previewEl = preview.controlEl.createEl("code", { cls: "title-customizer-preview" });
    this.updatePreview();
    new import_obsidian.Setting(containerEl).setName("Templates").setHeading();
    const help = containerEl.createDiv({ cls: "setting-item-description title-customizer-help" });
    help.createEl("p", {
      text: "Split a template into segments with the delimiter (e.g. ~~). Segments whose placeholders are all empty are dropped, and the rest are joined with the separator. Parentheses around a single placeholder, like ({{frontmatter.project}}), vanish with it when it is empty."
    });
    const list = help.createEl("ul");
    for (const placeholder of PLACEHOLDERS) {
      const item = list.createEl("li");
      item.createEl("code", { text: `{{${placeholder.key}}}` });
      item.appendText(` \u2014 ${placeholder.description}${placeholder.needsFile ? "" : " (available in both templates)"}`);
    }
    this.addTemplate("Template when a file is open", "titleTemplate", "Used for notes, canvases, PDFs, images, and any other file view.");
    this.addTemplate("Template when no file is open", "titleTemplateEmpty", "Used for empty tabs, graph view, and other views without a file. Only vault, workspace, version, and viewtype are available.");
    new import_obsidian.Setting(containerEl).setName("Formatting").setHeading();
    new import_obsidian.Setting(containerEl).setName("Separator").setDesc("Inserted between the segments that remain after empty ones are dropped.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.separator).setValue(this.plugin.settings.separator).onChange((value) => this.applySetting({ separator: value }))
    );
    new import_obsidian.Setting(containerEl).setName("Delimiter").setDesc("Marks where a template is split into segments.").addDropdown((dropdown) => {
      for (const option of DELIMITER_OPTIONS) dropdown.addOption(option.value, option.label);
      dropdown.setValue(this.plugin.settings.delimiter).onChange((value) => this.applySetting({ delimiter: value }));
    });
    new import_obsidian.Setting(containerEl).setName("Frontmatter override property").setDesc("When the open note has this property, its value becomes the whole window title. Leave blank to disable.").addText(
      (text) => text.setPlaceholder("e.g. window-title").setValue(this.plugin.settings.overrideField).onChange((value) => this.applySetting({ overrideField: value }))
    );
  }
  hide() {
    this.previewEl = null;
  }
  addTemplate(name, key, desc) {
    new import_obsidian.Setting(this.containerEl).setName(name).setDesc(desc).setClass("title-customizer-template").addTextArea(
      (area) => area.setPlaceholder(DEFAULT_SETTINGS[key]).setValue(this.plugin.settings[key]).onChange((value) => this.applySetting({ [key]: value }))
    ).addExtraButton(
      (button) => button.setIcon("rotate-ccw").setTooltip("Reset to default").onClick(async () => {
        await this.applySetting({ [key]: DEFAULT_SETTINGS[key] });
        this.display();
      })
    );
  }
  async applySetting(patch) {
    await this.plugin.updateSettings(patch);
    this.updatePreview();
  }
  updatePreview() {
    var _a;
    (_a = this.previewEl) == null ? void 0 : _a.setText(this.plugin.lastTitle || "(not set yet)");
  }
};

// src/title-guard.ts
var TitleGuard = class {
  constructor(doc) {
    this.doc = doc;
    this.desiredTitle = null;
    this.observer = null;
    this.originalTitle = doc.title;
  }
  set(title) {
    this.desiredTitle = title;
    this.apply();
    this.observe();
  }
  /** Stops guarding and puts back the title the window had before the plugin touched it. */
  restore() {
    this.dispose();
    this.doc.title = this.originalTitle;
  }
  /** Stops guarding without touching the title (the window is closing). */
  dispose() {
    var _a;
    (_a = this.observer) == null ? void 0 : _a.disconnect();
    this.observer = null;
    this.desiredTitle = null;
  }
  apply() {
    if (this.desiredTitle !== null && this.doc.title !== this.desiredTitle) {
      this.doc.title = this.desiredTitle;
    }
  }
  observe() {
    if (this.observer || !this.doc.head) return;
    this.observer = new MutationObserver(() => this.apply());
    this.observer.observe(this.doc.head, { childList: true, characterData: true, subtree: true });
  }
};

// src/main.ts
var FALLBACK_TITLE = "Obsidian";
var TitleCustomizerPlugin = class extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    this.settings = normalizeSettings(null);
    this.lastTitle = "";
    this.guards = /* @__PURE__ */ new Map();
    // The main-area leaf the title describes. Sidebar leaves (file explorer,
    // outline, ...) never replace it, so focusing a sidebar keeps the note's title.
    this.trackedLeaf = null;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TitleCustomizerSettingTab(this.app, this));
    this.addCommand({
      id: "refresh-window-title",
      name: "Refresh window title",
      callback: () => this.refreshTitle()
    });
    this.app.workspace.onLayoutReady(() => this.start());
  }
  onunload() {
    for (const guard of this.guards.values()) guard.restore();
    this.guards.clear();
    this.trackedLeaf = null;
  }
  async updateSettings(patch) {
    this.settings = normalizeSettings({ ...this.settings, ...patch });
    await this.saveData(this.settings);
    this.refreshTitle();
  }
  refreshTitle() {
    var _a, _b, _c, _d;
    const leaf = this.currentLeaf();
    const view = leaf == null ? void 0 : leaf.view;
    const file = view instanceof import_obsidian2.FileView ? view.file : null;
    const frontmatter = file ? (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) != null ? _b : null : null;
    const ctx = buildContext({
      vault: this.app.vault.getName(),
      version: import_obsidian2.apiVersion,
      workspace: getActiveWorkspaceName(this.app),
      viewType: (_c = view == null ? void 0 : view.getViewType()) != null ? _c : "",
      file: file ? toFileInfo(file) : null,
      frontmatter
    });
    const template = file ? this.settings.titleTemplate : this.settings.titleTemplateEmpty;
    const title = renderTitle(template, ctx, {
      delimiter: this.settings.delimiter,
      separator: this.settings.separator,
      overrideField: this.settings.overrideField
    }) || FALLBACK_TITLE;
    this.lastTitle = title;
    this.guardFor((_d = view == null ? void 0 : view.containerEl.ownerDocument) != null ? _d : document).set(title);
  }
  start() {
    const { workspace, vault, metadataCache } = this.app;
    this.registerEvent(
      workspace.on("active-leaf-change", (leaf) => {
        this.trackLeaf(leaf);
        this.refreshTitle();
      })
    );
    this.registerEvent(workspace.on("file-open", () => this.refreshTitle()));
    this.registerEvent(workspace.on("layout-change", () => this.refreshTitle()));
    this.registerEvent(
      workspace.on("window-close", (_win, win) => {
        var _a;
        (_a = this.guards.get(win.document)) == null ? void 0 : _a.dispose();
        this.guards.delete(win.document);
      })
    );
    this.registerEvent(vault.on("rename", (file) => this.refreshIfCurrent(file)));
    this.registerEvent(vault.on("delete", (file) => this.refreshIfCurrent(file)));
    this.registerEvent(metadataCache.on("changed", (file) => this.refreshIfCurrent(file)));
    this.trackLeaf(workspace.getMostRecentLeaf());
    this.refreshTitle();
  }
  refreshIfCurrent(file) {
    var _a;
    const view = (_a = this.currentLeaf()) == null ? void 0 : _a.view;
    if (view instanceof import_obsidian2.FileView && view.file === file) this.refreshTitle();
  }
  trackLeaf(leaf) {
    if (!leaf) return;
    const root = leaf.getRoot();
    const { leftSplit, rightSplit } = this.app.workspace;
    if (root === leftSplit || root === rightSplit) return;
    this.trackedLeaf = leaf;
  }
  currentLeaf() {
    var _a;
    if (!((_a = this.trackedLeaf) == null ? void 0 : _a.view.containerEl.isConnected)) {
      this.trackedLeaf = this.app.workspace.getMostRecentLeaf();
    }
    return this.trackedLeaf;
  }
  guardFor(doc) {
    let guard = this.guards.get(doc);
    if (!guard) {
      guard = new TitleGuard(doc);
      this.guards.set(doc, guard);
    }
    return guard;
  }
  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }
};
function toFileInfo(file) {
  var _a, _b;
  return {
    path: file.path,
    name: file.name,
    basename: file.basename,
    extension: file.extension,
    parentPath: (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : ""
  };
}
