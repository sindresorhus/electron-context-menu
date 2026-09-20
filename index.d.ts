import {
	type BrowserWindow,
	type BrowserView,
	type ContextMenuParams,
	type MenuItemConstructorOptions,
	type Event as ElectronEvent,
	type WebContents,
	type WebContentsView,
} from 'electron';

export type Labels = {
	/**
	@default 'Learn Spelling'
	*/
	readonly learnSpelling?: string;

	/**
	The placeholder `{selection}` will be replaced by the currently selected text.
	@default 'Look Up “{selection}”'
	*/
	readonly lookUpSelection?: string;

	/**
	@default 'Search with Google'
	*/
	readonly searchWithGoogle?: string;

	/**
	@default 'Cut'
	*/
	readonly cut?: string;

	/**
	@default 'Copy'
	*/
	readonly copy?: string;

	/**
	@default 'Paste'
	*/
	readonly paste?: string;

	/**
	@default 'Paste and Match Style'
	*/
	readonly pasteAndMatchStyle?: string;

	/**
	@default 'Select All'
	*/
	readonly selectAll?: string;

	/**
	@default 'Save Image'
	*/
	readonly saveImage?: string;

	/**
	@default 'Save Image As…'
	*/
	readonly saveImageAs?: string;

	/**
	@default 'Save Video'
	*/
	readonly saveVideo?: string;

	/**
	@default 'Save Video As…'
	*/
	readonly saveVideoAs?: string;

	/**
	@default 'Copy Link'
	*/
	readonly copyLink?: string;

	/**
	@default 'Save Link As…'
	*/
	readonly saveLinkAs?: string;

	/**
	@default 'Copy Image'
	*/
	readonly copyImage?: string;

	/**
	@default 'Copy Image Address'
	*/
	readonly copyImageAddress?: string;

	/**
	@default 'Copy Video Address'
	*/
	readonly copyVideoAddress?: string;

	/**
	@default 'Copy Video Frame'
	*/
	readonly copyVideoFrame?: string;

	/**
	@default 'Save Video Frame As…'
	*/
	readonly saveVideoFrameAs?: string;

	/**
	@default 'Inspect Element'
	*/
	readonly inspect?: string;

	/**
	@default 'Services'
	*/
	readonly services?: string;
};

export type ActionOptions = {
	/**
	Apply a transformation to the content of the action.

	If you use this on `cut`, `copy`, or `paste`, they will convert rich text to plain text.
	*/
	readonly transform?: (content: string) => string;
};

export type Actions = {
	readonly separator: () => MenuItemConstructorOptions;
	readonly learnSpelling: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly lookUpSelection: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly searchWithGoogle: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly cut: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly copy: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly paste: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly pasteAndMatchStyle: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly selectAll: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly saveImage: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly saveImageAs: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly saveVideo: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly saveVideoAs: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly copyLink: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly saveLinkAs: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly copyImage: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly copyImageAddress: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly copyVideoAddress: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly copyVideoFrame: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly saveVideoFrameAs: (options?: ActionOptions) => MenuItemConstructorOptions;
	readonly inspect: () => MenuItemConstructorOptions;
	readonly services: () => MenuItemConstructorOptions;
};

export type Options = {
	/**
	Window or view to add the context menu to.

	To attach it to a `<webview>`, pass its `WebContents`, which you can get in the main process with `webContents.fromId(...)` using the id from `webview.getWebContentsId()`.

	When not specified, the context menu will be added to all existing and new windows.
	*/
	readonly window?: BrowserWindow | BrowserView | WebContents | WebContentsView;

	/**
	Should return an array of [menu items](https://electronjs.org/docs/api/menu-item) to be prepended to the context menu.

	The first argument is an array of default actions that can be used. The second argument is [this `parameters` object](https://electronjs.org/docs/api/web-contents/#event-context-menu). The third argument is the window or view the context menu was requested for. The fourth argument is the context menu event.

	`MenuItem` labels may contain the placeholder `{selection}` which will be replaced by the currently selected text as described in `options.labels`.
	*/
	readonly prepend?: (
		defaultActions: Actions,
		parameters: ContextMenuParams,
		browserWindow: BrowserWindow | BrowserView | WebContents | WebContentsView,
		event: ElectronEvent,
	) => MenuItemConstructorOptions[];

	/**
	Should return an array of [menu items](https://electronjs.org/docs/api/menu-item) to be appended to the context menu.

	The first argument is an array of default actions that can be used. The second argument is [this `parameters` object](https://electronjs.org/docs/api/web-contents/#event-context-menu). The third argument is the window or view the context menu was requested for. The fourth argument is the context menu event.

	`MenuItem` labels may contain the placeholder `{selection}` which will be replaced by the currently selected text as described in `options.labels`.
	*/
	readonly append?: (
		defaultActions: Actions,
		parameters: ContextMenuParams,
		browserWindow: BrowserWindow | BrowserView | WebContents | WebContentsView,
		event: ElectronEvent,
	) => MenuItemConstructorOptions[];

	/**
	Show the `Learn Spelling {selection}` menu item when right-clicking text.

	The spellcheck will only show when right-clicking misspelled words.

	@default true
	*/
	readonly showLearnSpelling?: boolean;

	/**
	Show the `Look Up {selection}` menu item when right-clicking text.

	@default true
	*/
	readonly showLookUpSelection?: boolean;

	/**
	Show the `Search with Google` menu item when right-clicking text.

	@default true
	*/
	readonly showSearchWithGoogle?: boolean;

	/**
	Show the dictionary suggestions when right-clicking a misspelled word.

	@default true
	*/
	readonly showDictionarySuggestions?: boolean;

	/**
	Show the `Select All` menu item when right-clicking in a window.

	Default: `false` on macOS, `true` on Windows and Linux
	*/
	readonly showSelectAll?: boolean;

	/**
	Show the `Paste and Match Style` menu item when right-clicking in an editable field.

	@default false
	*/
	readonly showPasteAndMatchStyle?: boolean;

	/**
	Show the `Copy Image` menu item when right-clicking on an image.

	@default true
	*/
	readonly showCopyImage?: boolean;

	/**
	Show the `Copy Image Address` menu item when right-clicking on an image.

	@default false
	*/
	readonly showCopyImageAddress?: boolean;

	/**
	Show the `Save Image` menu item when right-clicking on an image.

	@default false
	*/
	readonly showSaveImage?: boolean;

	/**
	Show the `Save Image As…` menu item when right-clicking on an image.

	@default false
	*/
	readonly showSaveImageAs?: boolean;

	/**
	Show the `Copy Video Address` menu item when right-clicking on a video.

	@default false
	*/
	readonly showCopyVideoAddress?: boolean;

	/**
	Show the `Save Video` menu item when right-clicking on a video.

	@default false
	*/
	readonly showSaveVideo?: boolean;

	/**
	Show the `Save Video As…` menu item when right-clicking on a video.

	@default false
	*/
	readonly showSaveVideoAs?: boolean;

	/**
	Show the `Copy Video Frame` menu item when right-clicking on a video.

	Copies the video frame at the click position to the clipboard.

	@default false
	*/
	readonly showCopyVideoFrame?: boolean;

	/**
	Show the `Save Video Frame As…` menu item when right-clicking on a video.

	Shows a save dialog for the video frame at the click position.

	@default false
	*/
	readonly showSaveVideoFrameAs?: boolean;

	/**
	Show the `Copy Link` menu item when right-clicking on a link.

	@default true
	*/
	readonly showCopyLink?: boolean;

	/**
	Show the `Save Link As…` menu item when right-clicking on a link.

	@default false
	*/
	readonly showSaveLinkAs?: boolean;

	/**
	Force enable or disable the `Inspect Element` menu item.

	Default: [Only in development](https://github.com/sindresorhus/electron-is-dev)
	*/
	readonly showInspectElement?: boolean;

	/**
	Show the system `Services` submenu when right-clicking text on macOS.

	Note: Due to [a bug in the Electron implementation](https://github.com/electron/electron/issues/18476), this menu is not identical to the “Services” submenu in the context menus of native apps. Instead, it looks the same as the “Services” menu in the main App Menu. For this reason, it is currently disabled by default.

	@default false
	*/
	readonly showServices?: boolean;

	/**
	Override labels for the default menu items. Useful for i18n.

	The placeholder `{selection}` may be used in any label, and will be replaced by the currently selected text, trimmed to a maximum of 25 characters length. This is useful when localizing the `Look Up “{selection}”` menu item, but can also be used in custom menu items, for example, to implement a `Search Google for “{selection}”` menu item. If there is no selection, the `{selection}` placeholder will be replaced by an empty string. Normally this placeholder is only useful for menu items which will only be shown when there is text selected. This can be checked using `visible: parameters.selectionText.trim().length > 0` when implementing a custom menu item, as shown in the usage example above.

	@default {}

	@example
	```
	{
		labels: {
			copy: 'Configured Copy',
			saveImageAs: 'Configured Save Image As…'
		}
	}
	```
	*/
	readonly labels?: Labels;

	/**
	Determines whether or not to show the menu.
	Can be useful if you for example have other code presenting a context menu in some contexts.

	The first argument is the context menu event. The second argument is [this `parameters` object](https://electronjs.org/docs/api/web-contents/#event-context-menu).

	@example
	```
	{
		// Doesn't show the menu if the element is editable
		shouldShowMenu: (event, parameters) => !parameters.isEditable
	}
	```
	*/
	readonly shouldShowMenu?: (
		event: ElectronEvent,
		parameters: ContextMenuParams,
	) => boolean;

	/**
	This option lets you manually pick what menu items to include. It's meant for advanced needs. The default menu with the other options should be enough for most use-cases, and it ensures correct behavior, for example, correct order of menu items. So prefer the `append` and `prepend` option instead of `menu` whenever possible.

	The function passed to this option is expected to return an array of [`MenuItem` constructor options](https://electronjs.org/docs/api/menu-item/). If it returns anything else, the default menu is used.

	The first argument the function receives is an array of default actions that can be used. These actions are functions that can take an object with a transform property (except for `separator`, `inspect`, and `services`). The transform function will be passed the content of the action and can modify it if needed. If you use `transform` on `cut`, `copy`, or `paste`, they will convert rich text to plain text.
	The second argument is [this `parameters` object](https://electronjs.org/docs/api/web-contents/#event-context-menu).
	The third argument is the window or view the context menu was requested for.
	The fourth argument is an Array of menu items for dictionary suggestions. This should be used if you wish to implement spellcheck in your custom menu.
	The last argument is the context menu event.

	Even though you include an action, it will still only be shown/enabled when appropriate. For example, the `saveImage` action is only shown when right-clicking an image.

	`MenuItem` labels may contain the placeholder `{selection}` which will be replaced by the currently selected text as described in `options.labels`.

	The following options are ignored when `menu` is used:

	- `showLearnSpelling`
	- `showLookUpSelection`
	- `showSearchWithGoogle`
	- `showDictionarySuggestions`
	- `showSelectAll`
	- `showPasteAndMatchStyle`
	- `showCopyImage`
	- `showCopyImageAddress`
	- `showSaveImage`
	- `showSaveImageAs`
	- `showCopyVideoAddress`
	- `showSaveVideo`
	- `showSaveVideoAs`
	- `showCopyVideoFrame`
	- `showSaveVideoFrameAs`
	- `showCopyLink`
	- `showSaveLinkAs`
	- `showInspectElement`
	- `showServices`

	To get spellchecking, “Correct Automatically”, and “Learn Spelling” in the menu, make sure you have not disabled the `spellcheck` option (it's `true` by default) in `BrowserWindow`.

	@default [defaultActions.separator(), ...dictionarySuggestions, defaultActions.separator(), defaultActions.learnSpelling(), defaultActions.separator(), defaultActions.lookUpSelection(), defaultActions.separator(), defaultActions.searchWithGoogle(), defaultActions.separator(), defaultActions.cut(), defaultActions.copy(), defaultActions.paste(), defaultActions.pasteAndMatchStyle(), defaultActions.selectAll(), defaultActions.separator(), defaultActions.saveImage(), defaultActions.saveImageAs(), defaultActions.copyImage(), defaultActions.copyImageAddress(), defaultActions.saveVideo(), defaultActions.saveVideoAs(), defaultActions.copyVideoAddress(), defaultActions.copyVideoFrame(), defaultActions.saveVideoFrameAs(), defaultActions.separator(), defaultActions.copyLink(), defaultActions.saveLinkAs(), defaultActions.separator(), defaultActions.inspect(), defaultActions.services(), defaultActions.separator()]
	*/
	readonly menu?: (
		defaultActions: Actions,
		parameters: ContextMenuParams,
		browserWindow: BrowserWindow | BrowserView | WebContents | WebContentsView,
		dictionarySuggestions: MenuItemConstructorOptions[],
		event: ElectronEvent,
	) => MenuItemConstructorOptions[];

	/**
	Called when the context menu is shown.

	The function receives the [Electron `Event` object](https://electronjs.org/docs/api/structures/event).
	*/
	readonly onShow?: (event: ElectronEvent) => void;

	/**
	Called when the context menu is closed.

	The function receives the [Electron `Event` object](https://electronjs.org/docs/api/structures/event).
	*/
	readonly onClose?: (event: ElectronEvent) => void;
};

/**
This module gives you a nice extensible context menu with items like `Cut`/`Copy`/`Paste` for text, `Save Image` for images, and `Copy Link` for links. It also adds an `Inspect Element` menu item when in development to quickly view items in the inspector like in Chrome.

This package can only be used in the main process.

@example
```
import {app, BrowserWindow} from 'electron';
import contextMenu from 'electron-context-menu';

contextMenu({
	showSaveImageAs: true
});

let mainWindow;
(async () => {
	await app.whenReady();

	mainWindow = new BrowserWindow();
})();
```

@example
```
import {app, BrowserWindow, shell} from 'electron';
import contextMenu from 'electron-context-menu';

contextMenu({
	prepend: (defaultActions, parameters, browserWindow) => [
		{
			label: 'Rainbow',
			// Only show it when right-clicking images
			visible: parameters.mediaType === 'image'
		},
		{
			label: 'Search Google for “{selection}”',
			// Only show it when right-clicking text
			visible: parameters.selectionText.trim().length > 0,
			click: () => {
				shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
			}
		}
	]
});

let mainWindow;
(async () => {
	await app.whenReady();

	mainWindow = new BrowserWindow();
})();
```

The return value of `contextMenu()` is a function that disposes of the created event listeners:

@example
```
const dispose = contextMenu();

dispose();
```
*/
export default function contextMenu(options?: Options): () => void;
