'use strict';
const electron = require('electron');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');

const getWebContents = from => from.webContents || from.getWebContents();

function create(window, webContents, opts) {
	webContents.on('context-menu', (e, props) => {
		if (typeof opts.shouldShowMenu === 'function' && opts.shouldShowMenu(e, props) === false) {
			return;
		}

		const editFlags = props.editFlags;
		const hasText = props.selectionText.trim().length > 0;
		const can = type => editFlags[`can${type}`] && hasText;

		let menuTpl = [{
			type: 'separator'
		}, {
			id: 'cut',
			label: 'Cut',
			// Needed because of macOS limitation:
			// https://github.com/electron/electron/issues/5860
			role: can('Cut') ? 'cut' : '',
			enabled: can('Cut'),
			visible: props.isEditable
		}, {
			id: 'copy',
			label: 'Copy',
			role: can('Copy') ? 'copy' : '',
			enabled: can('Copy'),
			visible: props.isEditable || hasText
		}, {
			id: 'paste',
			label: 'Paste',
			role: editFlags.canPaste ? 'paste' : '',
			enabled: editFlags.canPaste,
			visible: props.isEditable
		}, {
			type: 'separator'
		}];

		if (props.mediaType === 'image') {
			menuTpl = [{
				type: 'separator'
			}, {
				id: 'save',
				label: 'Save Image',
				click() {
					download(window, props.srcURL);
				}
			}, {
				type: 'separator'
			}];
		}

		if (props.linkURL && props.mediaType === 'none') {
			menuTpl = [{
				type: 'separator'
			}, {
				id: 'copyLink',
				label: 'Copy Link',
				click() {
					if (process.platform === 'darwin') {
						electron.clipboard.writeBookmark(props.linkText, props.linkURL);
					} else {
						electron.clipboard.writeText(props.linkURL);
					}
				}
			}, {
				type: 'separator'
			}];
		}

		if (opts.prepend) {
			const result = opts.prepend(props, window);

			if (Array.isArray(result)) {
				menuTpl.unshift(...result);
			}
		}

		if (opts.append) {
			const result = opts.append(props, window);

			if (Array.isArray(result)) {
				menuTpl.push(...result);
			}
		}

		if (opts.showInspectElement || (opts.showInspectElement !== false && isDev)) {
			menuTpl.push({
				type: 'separator'
			}, {
				id: 'inspect',
				label: 'Inspect Element',
				click() {
					webContents.inspectElement(props.x, props.y);

					if (webContents.isDevToolsOpened()) {
						webContents.devToolsWebContents.focus();
					}
				}
			}, {
				type: 'separator'
			});
		}

		// Apply custom labels for default menu items
		if (opts.labels) {
			for (const menuItem of menuTpl) {
				if (opts.labels[menuItem.id]) {
					menuItem.label = opts.labels[menuItem.id];
				}
			}
		}

		// Filter out leading/trailing separators
		// TODO: https://github.com/electron/electron/issues/5869
		menuTpl = delUnusedElements(menuTpl);

		if (menuTpl.length > 0) {
			const menu = (electron.remote ? electron.remote.Menu : electron.Menu).buildFromTemplate(menuTpl);

			/*
			 * When electron.remote is not available this runs in the browser process.
			 * We can safely use win in this case as it refers to the window the
			 * context-menu should open in.
			 * When this is being called from a webView, we can't use win as this
			 * would refere to the webView which is not allowed to render a popup menu.
			 */
			menu.popup(electron.remote ? electron.remote.getCurrentWindow() : window);
		}
	});
}

function delUnusedElements(menuTpl) {
	let notDeletedPrevEl;
	return menuTpl.filter(el => el.visible !== false).filter((el, i, arr) => {
		const toDelete = el.type === 'separator' && (!notDeletedPrevEl || i === arr.length - 1 || arr[i + 1].type === 'separator');
		notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
		return !toDelete;
	});
}

module.exports = (opts = {}) => {
	if (opts.browserView && opts.window) {
		return create(opts.window, getWebContents(opts.browserView), opts);
	}

	if (opts.window) {
		const win = opts.window;
		const wc = getWebContents(win);

		// When window is a webview that has not yet finished loading webContents is not available
		if (wc === undefined) {
			win.addEventListener('dom-ready', () => {
				create(win, getWebContents(win), opts);
			}, {once: true});
			return;
		}

		return create(win, wc, opts);
	}

	(electron.BrowserWindow || electron.remote.BrowserWindow).getAllWindows().forEach(win => {
		create(win, getWebContents(win), opts);
	});

	(electron.app || electron.remote.app).on('browser-window-created', (e, win) => {
		create(win, getWebContents(win), opts);
	});
};
