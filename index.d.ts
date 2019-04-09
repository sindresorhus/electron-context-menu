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
	}

	interface ActionOptions {
		/**
		Apply a transformation to the content of the action.
		*/
		readonly transform?: (content: string) => string;
	}

	interface Actions {
		readonly separator: () => MenuItem;
		readonly inspect: () => MenuItem;
		readonly cut: (options: ActionOptions) => MenuItem;
		readonly copy: (options: ActionOptions) => MenuItem;
		readonly paste: (options: ActionOptions) => MenuItem;
		readonly saveImage: (options: ActionOptions) => MenuItem;
		readonly saveImageAs: (options: ActionOptions) => MenuItem;
		readonly copyImageAddress: (options: ActionOptions) => MenuItem;
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
		Should return an array of [menu items](https://electronjs.org/docs/api/menu-item) to override the default context menu.

		@default [defaultActions.cut(), defaultActions.copy(), defaultActions.paste(), defaultActions.separator(), defaultActions.saveImage(), defaultActions.saveImageAs(), defaultActions.copyImageAddress(), defaultActions.separator(), defaultActions.copyLink(), defaultActions.separator(), defaultActions.inspect()]
		*/
		readonly menu?: (
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
		Overwrite labels for the default menu items. Useful for i18n.

		@default {}
		*/
		readonly labels?: Labels;

		/**
		Determines whether or not to show the menu.
		Can be useful if you for example have other code presenting a context menu in some contexts.

		@example
		```
		// Doesn't show the menu if the element is editable
		shouldShowMenu: (event, params) => !params.isEditable
		```
		*/
		readonly shouldShowMenu?: (
			event: ElectronEvent,
			params: ContextMenuParams
		) => boolean;
	}
}

declare const contextMenu: {
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

	let win;
	(async () => {
		await app.whenReady();
		win = new BrowserWindow();
	});
	```
	*/
	(options?: contextMenu.Options): void;

	// TODO: Remove this for the next major release, refactor the whole definition to:
	// declare function contextMenu(options?: contextMenu.Options): void;
	// export = contextMenu;
	default: typeof contextMenu;
};

export = contextMenu;
