# electron-context-menu [![Build Status](https://travis-ci.org/sindresorhus/electron-context-menu.svg?branch=master)](https://travis-ci.org/sindresorhus/electron-context-menu)

> Context menu for your [Electron](http://electron.atom.io) app

<img src="screenshot.png" width="125" align="right">

Electron doesn't have a built-in context menu. You're supposed to handle that yourself. But it's both tedious and hard to get right. This module gives you a nice extensible context menu with items like `Cut`/`Copy`/`Paste` for text, `Save Image` for images, and `Copy Link` for links. It also adds an `Inspect Element` menu item when in development to quickly view items in the inspector like in Chrome.

You can use this module directly in both the main and renderer process.


## Install

```
$ npm install --save electron-context-menu
```


## Usage

```js
const {app, BrowserWindow} = require('electron');

require('electron-context-menu')({
	prepend: (params, browserWindow) => [{
		label: 'Rainbow',
		// Only show it when right-clicking images
		visible: params.mediaType === 'image'
	}]
});

let win;

app.on('ready', () => {
	win = new BrowserWindow();
});
```


## API

### contextMenu([options])

### options

#### window

Type: `BrowserWindow` `WebView`<br>

Window or WebView to add the context menu to.

When not specified, the context menu will be added to all existing and new windows.

#### prepend

Type: `Function`

Should return an array of [MenuItem](http://electron.atom.io/docs/api/menu-item/)'s to be prepended to the context menu. The first argument is [this `params` object](http://electron.atom.io/docs/api/web-contents/#event-context-menu). The second argument is the [BrowserWindow](http://electron.atom.io/docs/api/browser-window/) the context menu was requested for.

#### append

Type: `Function`

Should return an array of [MenuItem](http://electron.atom.io/docs/api/menu-item/)'s to be appended to the context menu. The first argument is [this `params` object](http://electron.atom.io/docs/api/web-contents/#event-context-menu). The second argument is the [BrowserWindow](http://electron.atom.io/docs/api/browser-window/) the context menu was requested for.

#### showInspectElement

Type: `boolean`<br>
Default: [Only in development](https://github.com/sindresorhus/electron-is-dev)

Force enable or disable the `Inspect Element` menu item.

#### labels

Type: `Object`<br>
Default: `{}`

Overwrite labels for the default menu items. Useful for i18n.

Format:

```js
labels: {
	cut: 'Configured Cut',
	copy: 'Configured Copy',
	paste: 'Configured Paste',
	save: 'Configured Save Image',
	copyLink: 'Configured Copy Link',
	inspect: 'Configured Inspect'
}
```

#### shouldShowMenu

Type: `Function`

Determines whether or not to show the menu. Can be useful if you for example have other code presenting a context menu in some contexts. The second argument is [this `params` object](http://electron.atom.io/docs/api/web-contents/#event-context-menu).

Example:

```js
// Doesn't show the menu if the element is editable
shouldShowMenu: (event, params) => !params.isEditable
```

#### async

Type: `boolean`<br>
Default: `false`

Exposed `async` option for [`menu.popup`](https://github.com/electron/electron/blob/master/docs/api/menu.md#menupopupbrowserwindow-options).

## Related

- [electron-debug](https://github.com/sindresorhus/electron-debug) - Adds useful debug features to your Electron app
- [electron-store](https://github.com/sindresorhus/electron-store) - Save and load data like user preferences, app state, cache, etc
- [electron-unhandled](https://github.com/sindresorhus/electron-unhandled) - Catch unhandled errors and promise rejections in your Electron app


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
