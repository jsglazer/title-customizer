// Owns the title of one window's document. Obsidian rewrites document.title on
// its own (leaf changes, renames), and the order of its handlers relative to
// ours is not guaranteed, so instead of racing it with a timer the guard
// watches <head> and re-applies the desired title whenever something else
// overwrites it.

export class TitleGuard {
	private readonly originalTitle: string;
	private desiredTitle: string | null = null;
	private observer: MutationObserver | null = null;

	constructor(private readonly doc: Document) {
		this.originalTitle = doc.title;
	}

	set(title: string): void {
		this.desiredTitle = title;
		this.apply();
		this.observe();
	}

	/** Stops guarding and puts back the title the window had before the plugin touched it. */
	restore(): void {
		this.dispose();
		this.doc.title = this.originalTitle;
	}

	/** Stops guarding without touching the title (the window is closing). */
	dispose(): void {
		this.observer?.disconnect();
		this.observer = null;
		this.desiredTitle = null;
	}

	private apply(): void {
		// The equality check is what stops the observer from looping on its own write.
		if (this.desiredTitle !== null && this.doc.title !== this.desiredTitle) {
			this.doc.title = this.desiredTitle;
		}
	}

	private observe(): void {
		if (this.observer || !this.doc.head) return;
		this.observer = new MutationObserver(() => this.apply());
		// Subtree + childList also catches a <title> element being replaced outright.
		this.observer.observe(this.doc.head, { childList: true, characterData: true, subtree: true });
	}
}
