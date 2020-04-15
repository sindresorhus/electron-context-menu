# electron-context-menu [![Build Status](https://travis-ci.org/sindresorhus/electron-context-menu.svg?branch=master)](https://travis-ci.org/sindresorhus/electron-context-menu)

> Context menu for your [Electron](https://electronjs.org) app

<img src="screenshot.png" width="125" align="right">

Electron doesn't have a built-in context menu. You're supposed to handle that yourself. But it's both tedious and hard to get right. This module gives you a nice extensible context menu with items like `Cut`/`Copy`/`Paste` for text, `Save Image` for images, and `Copy Link` for links. It also adds an `Inspect Element` menu item when in development to quickly view items in the inspector like in Chrome.

You can use this module directly in both the main and renderer process.

## Install

```
$ npm install electron-context-menu
```

*Requires Electron 4 or later.*

## Usage

```js
const {app, BrowserWindow} = require('electron');
const contextMenu = require('electron-context-menu');

contextMenu({
	prepend: (defaultActions, params, browserWindow) => [
		{
			label: 'Rainbow',
			// Only show it when right-clicking images
			visible: params.mediaType === 'image'
		},
		{
			label: 'Search Google for “{selection}”',
			// Only show it when right-clicking text
			visible: params.selectionText.trim().length > 0,
			click: () => {
				shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
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

## API

### contextMenu(options?)

### options

Type: `object`

#### window

Type: `BrowserWindow | WebViewTag | WebContents`

Window or WebView to add the context menu to.

When not specified, the context menu will be added to all existing and new windows.

#### prepend

Type: `Function`

Should return an array of [MenuItem](https://electronjs.org/docs/api/menu-item/)'s to be prepended to the context menu.

The first argument is an array of default actions that can be used. The second argument is [this `params` object](https://electronjs.org/docs/api/web-contents/#event-context-menu). The third argument is the [BrowserWindow](https://electronjs.org/docs/api/browser-window/) the context menu was requested for.

`MenuItem` labels may contain the the placeholder `{selection}` which will be replaced by the currently selected text as described in [`options.labels`](#labels).

#### append

Type: `Function`

Should return an array of [MenuItem](https://electronjs.org/docs/api/menu-item/)'s to be appended to the context menu.

The first argument is an array of default actions that can be used. The second argument is [this `params` object](https://electronjs.org/docs/api/web-contents/#event-context-menu). The third argument is the [BrowserWindow](https://electronjs.org/docs/api/browser-window/) the context menu was requested for.

`MenuItem` labels may contain the the placeholder `{selection}` which will be replaced by the currently selected text as described in [`options.labels`](#labels).

#### showLookUpSelection

Type: `boolean`\
Default: `true`

Show the `Look Up {selection}` menu item when right-clicking text on macOS.

#### showCopyImage

Type: `boolean`\
Default: `true`

Show the `Copy Image` menu item when right-clicking on an image.

#### showCopyImageAddress

Type: `boolean`\
Default: `false`

Show the `Copy Image Address` menu item when right-clicking on an image.

#### showSaveImageAs

Type: `boolean`\
Default: `false`

Show the `Save Image As…` menu item when right-clicking on an image.

#### showInspectElement

Type: `boolean`\
Default: [Only in development](https://github.com/sindresorhus/electron-is-dev)

Force enable or disable the `Inspect Element` menu item.

#### showServices

Type: `boolean`\
Default: `false`

Show the system `Services` submenu when right-clicking text on macOS.

Note: Due to [a bug in the Electron implementation](https://github.com/electron/electron/issues/18476), this menu is not identical to the "Services" submenu in the context menus of native apps. Instead, it looks the same as the "Services" menu in the main App Menu. For this reason, it is currently disabled by default.

#### labels

Type: `object`\
Default: `{}`

Override labels for the default menu items. Useful for i18n.

The placeholder `{selection}` may be used in any label, and will be replaced by the currently selected text, trimmed to a maximum of 25 characters length. This is useful when localizing the `Look Up “{selection}”` menu item, but can also be used in custom menu items, for example, to implement a `Search Google for “{selection}”` menu item. If there is no selection, the `{selection}` placeholder will be replaced by an empty string. Normally this placeholder is only useful for menu items which will only be shown when there is text selected. This can be checked using `visible: params.selectionText.trim().length > 0` when implementing a custom menu item, as shown in the usage example above.

Format:

```js
{
	labels: {
		copy: 'Copiar',
		saveImageAs: 'Guardar imagen como…',
		lookUpSelection: 'Consultar “{selection}”'
	}
}
```

#### shouldShowMenu

Type: `Function`

Determines whether or not to show the menu. Can be useful if you for example have other code presenting a context menu in some contexts.

The second argument is [this `params` object](https://electronjs.org/docs/api/web-contents#event-context-menu).

Example:

```js
{
	// Doesn't show the menu if the element is editable
	shouldShowMenu: (event, params) => !params.isEditable
}
```

#### menu

Type: `Function`

This option lets you manually pick what menu items to include. It's meant for advanced needs. The default menu with the other options should be enough for most use-cases, and it ensures correct behavior, for example, correct order of menu items. So prefer the `append` and `prepend` option instead of `menu` whenever possible.

The function passed to this option is expected to return [`MenuItem[]`](https://electronjs.org/docs/api/menu-item/). The first argument the function receives is an array of default actions that can be used. These actions are functions that can take an object with a transform property (except for `separator` and `inspect`). The transform function will be passed the content of the action and can modify it if needed. If you use `transform` on `cut`, `copy`, or `paste`, they will convert rich text to plain text.

Even though you include an action, it will still only be shown/enabled when appropriate. For example, the `saveImage` action is only shown when right-clicking an image.

`MenuItem` labels may contain the the placeholder `{selection}` which will be replaced by the currently selected text as described in [`options.labels`](#labels).

The following options are ignored when `menu` is used:

- `showLookUpSelection`
- `showCopyImage`
- `showCopyImageAddress`
- `showSaveImageAs`
- `showInspectElement`
- `showServices`

Default actions:

- `separator`
- `lookUpSelection`
- `cut`
- `copy`
- `paste`
- `saveImage`
- `saveImageAs`
- `copyImage`
- `copyImageAddress`
- `copyLink`
- `inspect`
- `services`

Example:

```js
{
	menu: actions => [
		actions.copyLink({
			transform: content => `modified_link_${content}`
		}),
		actions.separator(),
		{
			label: 'Unicorn'
		},
		actions.separator(),
		actions.copy({
			transform: content => `modified_copy_${content}`
		}),
		{
			label: 'Invisible',
			visible: false
		},
		actions.paste({
			transform: content => `modified_paste_${content}`
		})
	]
}
```

## Related

- [electron-util](https://github.com/sindresorhus/electron-util) - Useful utilities for developing Electron apps and modules
- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-store](https://github.com/sindresorhus/electron-store) - Save and load data like user preferences, app state, cache, etc
- [electron-reloader](https://github.com/sindresorhus/electron-reloader) - Simple auto-reloading for Electron apps during development
- [electron-serve](https://github.com/sindresorhus/electron-serve) - Static file serving for Electron apps
- [electron-unhandled](https://github.com/sindresorhus/electron-unhandled) - Catch unhandled errors and promise rejections in your Electron app
