import {
	BrowserWindow,
	BrowserView,
	ContextMenuParams,
	MenuItemConstructorOptions,
	Event as ElectronEvent,
	WebContents
} from 'electron';

declare namespace contextMenu {
	interface Labels {
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
		@default 'Inspect Element'
		*/
		readonly inspect?: string;

		/**
		@default 'Services'
		*/
		readonly services?: string;
	}

	interface ActionOptions {
		/**
		Apply a transformation to the content of the action.

		If you use this on `cut`, `copy`, or `paste`, they will convert rich text to plain text.
		*/
		readonly transform?: (content: string) => string;
	}

	interface Actions {
		readonly separator: () => MenuItemConstructorOptions;
		readonly learnSpelling: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly lookUpSelection: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly searchWithGoogle: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly cut: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly copy: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly paste: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly selectAll: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly saveImage: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly saveImageAs: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly saveVideo: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly saveVideoAs: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly copyLink: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly copyImage: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly copyImageAddress: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly copyVideoAddress: (options: ActionOptions) => MenuItemConstructorOptions;
		readonly inspect: () => MenuItemConstructorOptions;
		readonly services: () => MenuItemConstructorOptions;
	}

	interface Options {
		/**
		Window or WebView to add the context menu to.
		When not specified, the context menu will be added to all existing and new windows.
		*/
		readonly window?: BrowserWindow | BrowserView | Electron.WebviewTag | WebContents;

		/**
		Should return an array of [menu items](https://electronjs.org/docs/api/menu-item) to be prepended to the context menu.

		`MenuItem` labels may contain the placeholder `{selection}` which will be replaced by the currently selected text as described in `options.labels`.
		*/
		readonly prepend?: (
			defaultActions: Actions,
			parameters: ContextMenuParams,
			browserWindow: BrowserWindow | BrowserView | Electron.WebviewTag | WebContents,
			event: ElectronEvent
		) => MenuItemConstructorOptions[];

		/**
		Should return an array of [menu items](https://electronjs.org/docs/api/menu-item) to be appended to the context menu.

		`MenuItem` labels may contain the placeholder `{selection}` which will be replaced by the currently selected text as described in `options.labels`.
		*/
		readonly append?: (
			defaultActions: Actions,
			parameters: ContextMenuParams,
			browserWindow: BrowserWindow | BrowserView | Electron.WebviewTag | WebContents,
			event: ElectronEvent
		) => MenuItemConstructorOptions[];

		/**
		Show the `Learn Spelling {selection}` menu item when right-clicking text.

		Even if `true`, the `spellcheck` preference in browser window must still be enabled. It will also only show when right-clicking misspelled words.

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
		Show the `Select All` menu item when right-clicking in a window.

		Default: `false` on macOS, `true` on Windows and Linux
		*/
		readonly showSelectAll?: boolean;

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
		Show the system `Services` submenu on macOS.

		@default false
		*/
		readonly showServices?: boolean;

		/**
		Override labels for the default menu items. Useful for i18n.

		The placeholder `{selection}` may be used in any label, and will be replaced by the currently selected text, trimmed to a maximum of 25 characters length. This is useful when localizing the `Look Up “{selection}”` menu item, but can also be used in custom menu items, for example, to implement a `Search Google for “{selection}”` menu item. If there is no selection, the `{selection}` placeholder will be replaced by an empty string. Normally this placeholder is only useful for menu items which will only be shown when there is text selected. This can be checked using `visible: parameters.selectionText.trim().length > 0` when implementing a custom menu item.

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
			parameters: ContextMenuParams
		) => boolean;

		/**
		This option lets you manually pick what menu items to include. It's meant for advanced needs. The default menu with the other options should be enough for most use-cases, and it ensures correct behavior, for example, correct order of menu items. So prefer the `append` and `prepend` option instead of `menu` whenever possible.

		The function passed to this option is expected to return an array of [`MenuItem` constructor options](https://electronjs.org/docs/api/menu-item/).

		The first argument the function receives is an array of default actions that can be used. These actions are functions that can take an object with a transform property (except for `separator` and `inspect`). The transform function will be passed the content of the action and can modify it if needed. If you use `transform` on `cut`, `copy`, or `paste`, they will convert rich text to plain text.
		The second argument is [this `parameters` object](https://electronjs.org/docs/api/web-contents/#event-context-menu).
		The third argument is the [BrowserWindow](https://electronjs.org/docs/api/browser-window/) the context menu was requested for.
		The fourth argument is an Array of menu items for dictionary suggestions. This should be used if you wish to implement spellcheck in your custom menu.
		The last argument is the event object passed to the `context-menu` event in web contents.

		Even though you include an action, it will still only be shown/enabled when appropriate. For example, the `saveImage` action is only shown when right-clicking an image.

		`MenuItem` labels may contain the placeholder `{selection}` which will be replaced by the currently selected text as described in `options.labels`.

		The following options are ignored when `menu` is used:

		- `showLearnSpelling`
		- `showLookUpSelection`
		- `showSearchWithGoogle`
		- `showSelectAll`
		- `showCopyImage`
		- `showCopyImageAddress`
		- `showSaveImageAs`
		- `showCopyVideoAddress`
		- `showSaveVideo`
		- `showSaveVideoAs`
		- `showCopyLink`
		- `showSaveLinkAs`
		- `showInspectElement`
		- `showServices`

		To get spellchecking, “Correct Automatically”, and “Learn Spelling” in the menu, please enable the `spellcheck` preference in browser window: `new BrowserWindow({webPreferences: {spellcheck: true}})`

		@default [...dictionarySuggestions, defaultActions.separator(), defaultActions.separator(), defaultActions.learnSpelling(), defaultActions.separator(), defaultActions.lookUpSelection(), defaultActions.separator(),defaultActions.searchWithGoogle(), defaultActions.cut(), defaultActions.copy(), defaultActions.paste(), defaultActions.selectAll(), defaultActions.separator(), defaultActions.saveImage(), defaultActions.saveImageAs(), defaultActions.saveVideo(), defaultActions.saveVideoAs(), defaultActions.copyLink(), defaultActions.copyImage(), defaultActions.copyImageAddress(), defaultActions.separator(), defaultActions.copyLink(), defaultActions.saveLinkAs(), defaultActions.separator(), defaultActions.inspect()]
		*/
		readonly menu?: (
			defaultActions: Actions,
			parameters: ContextMenuParams,
			browserWindow: BrowserWindow | BrowserView | Electron.WebviewTag | WebContents,
			dictionarySuggestions: MenuItemConstructorOptions[],
			event: ElectronEvent
		) => MenuItemConstructorOptions[];

		/**
		Called when the context menu is shown.
		*/
		readonly onShow?: (event: ElectronEvent) => void;

		/**
		Called when the context menu is closed.
		*/
		readonly onClose?: (event: ElectronEvent) => void;
	}
}

/**
This module gives you a nice extensible context menu with items like `Cut`/`Copy`/`Paste` for text, `Save Image` for images, and `Copy Link` for links. It also adds an `Inspect Element` menu item when in development to quickly view items in the inspector like in Chrome.

You can use this module directly in both the main and renderer process.

@example
```
import {app, BrowserWindow} = require('electron');
import contextMenu = require('electron-context-menu');

contextMenu({
	showSaveImageAs: true
});

let mainWindow;
(async () => {
	await app.whenReady();

	mainWindow = new BrowserWindow({
		webPreferences: {
			spellcheck: true
		}
	});
})();
```

@example
```
import {app, BrowserWindow} = require('electron');
import contextMenu = require('electron-context-menu');

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

	mainWindow = new BrowserWindow({
		webPreferences: {
			spellcheck: true
		}
	});
})();
```

The return value of `contextMenu()` is a function that disposes of the created event listeners:

@example
```
const dispose = contextMenu();

dispose();
```
*/
declare function contextMenu(options?: contextMenu.Options): () => void; // eslint-disable-line no-redeclare

export = contextMenu;
