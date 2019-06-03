/// <reference lib="dom"/>
/// <reference types="node"/>
import {
	BrowserWindow,
	WebviewTag,
	ContextMenuParams,
	MenuItem,
	Event as ElectronEvent
} from 'electron';

declare namespace contextMenu {
	interface Labels {
		/**
		The placeholder `{selection}` will be replaced by the currently selected text.

		@default 'Look Up “{selection}”'
		*/
		readonly lookUpSelection?: string;

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
		@default 'Save Image'
		*/
		readonly save?: string;

		/**
		@default 'Save Image As…'
		*/
		readonly saveImageAs?: string;

		/**
		@default 'Copy Link'
		*/
		readonly copyLink?: string;

		/**
		@default 'Copy Image Address'
		*/
		readonly copyImageAddress?: string;

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
		*/
		readonly transform?: (content: string) => string;
	}

	interface Actions {
		readonly separator: () => MenuItem;
		readonly lookUpSelection: (options: ActionOptions) => MenuItem;
		readonly cut: (options: ActionOptions) => MenuItem;
		readonly copy: (options: ActionOptions) => MenuItem;
		readonly paste: (options: ActionOptions) => MenuItem;
		readonly saveImage: (options: ActionOptions) => MenuItem;
		readonly saveImageAs: (options: ActionOptions) => MenuItem;
		readonly copyImageAddress: (options: ActionOptions) => MenuItem;
		readonly inspect: () => MenuItem;
		readonly services: () => MenuItem;
	}

	interface Options {
		/**
		Window or WebView to add the context menu to.
		When not specified, the context menu will be added to all existing and new windows.
		*/
		readonly window?: BrowserWindow | WebviewTag;

		/**
		Should return an array of [menu items](https://electronjs.org/docs/api/menu-item) to be prepended to the context menu.
		*/
		readonly prepend?: (
			defaultActions: Actions,
			params: ContextMenuParams,
			browserWindow: BrowserWindow | WebviewTag
		) => MenuItem[];

		/**
		Should return an array of [menu items](https://electronjs.org/docs/api/menu-item) to be appended to the context menu.
		*/
		readonly append?: (
			defaultActions: Actions,
			param: ContextMenuParams,
			browserWindow: BrowserWindow | WebviewTag
		) => MenuItem[];

		/**
		Show the `Look Up {selection}` menu item when right-clicking text on macOS.

		@default true
		*/
		readonly showLookUpSelection?: boolean;

		/**
		Show the `Copy Image Address` menu item when right-clicking on an image.

		@default false
		*/
		readonly showCopyImageAddress?: boolean;

		/**
		Show the `Save Image As…` menu item when right-clicking on an image.

		@default false
		*/
		readonly showSaveImageAs?: boolean;

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
		Overwrite labels for the default menu items. Useful for i18n.

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
			shouldShowMenu: (event, params) => !params.isEditable
		}
		```
		*/
		readonly shouldShowMenu?: (
			event: ElectronEvent,
			params: ContextMenuParams
		) => boolean;

		/**
		This option lets you manually pick what menu items to include. It's meant for advanced needs. The default menu with the other options should be enough for most use-cases, and it ensures correct behavior, for example, correct order of menu items. So prefer the `append` and `prepend` option instead of `menu` whenever possible.

		The function passed to this option is expected to return [`MenuItem[]`](https://electronjs.org/docs/api/menu-item/). The first argument the function receives is an array of default actions that can be used. These actions are functions that can take an object with a transform property (except for `separator` and `inspect`). The transform function will be passed the content of the action and can modify it if needed.

		Even though you include an action, it will still only be shown/enabled when appropriate. For example, the `saveImage` action is only shown when right-clicking an image.

		The following options are ignored when `menu` is used:

		- `showCopyImageAddress`
		- `showSaveImageAs`
		- `showInspectElement`

		@default [defaultActions.cut(), defaultActions.copy(), defaultActions.paste(), defaultActions.separator(), defaultActions.saveImage(), defaultActions.saveImageAs(), defaultActions.copyImageAddress(), defaultActions.separator(), defaultActions.copyLink(), defaultActions.separator(), defaultActions.inspect()]
		*/
		readonly menu?: (
			defaultActions: Actions,
			params: ContextMenuParams,
			browserWindow: BrowserWindow | WebviewTag
		) => MenuItem[];
	}
}

/**
This module gives you a nice extensible context menu with items like `Cut`/`Copy`/`Paste` for text, `Save Image` for images, and `Copy Link` for links. It also adds an `Inspect Element` menu item when in development to quickly view items in the inspector like in Chrome.

You can use this module directly in both the main and renderer process.

@example
```
import {app, BrowserWindow} from 'electron';
import contextMenu = require('electron-context-menu');

contextMenu({
	prepend: (params, browserWindow) => [{
		label: 'Rainbow',
		// Only show it when right-clicking images
		visible: params.mediaType === 'image'
	}]
});

let mainWindow;
(async () => {
	await app.whenReady();
	mainWindow = new BrowserWindow();
});
```
*/
declare function contextMenu(options?: contextMenu.Options): void;

export = contextMenu;
