'use strict';
const electron = require('electron');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');

const webContents = win => win.webContents || win.getWebContents();

function create(win, opts) {
	webContents(win).on('context-menu', (e, props) => {
		if (typeof opts.shouldShowMenu === 'function' && opts.shouldShowMenu(e, props) === false) {
			return;
		}

		const editFlags = props.editFlags;
		const hasText = props.selectionText.trim().length > 0;
		const can = type => editFlags[`can${type}`] && hasText;

		const defaultActions = {
			CUT: decorateMenuItem({
				id: 'cut',
				label: 'Cut',
				enabled: can('Cut'),
				visible: props.isEditable,
				click(menuItem) {
					props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;

					if (process.platform === 'darwin') {
						electron.clipboard.writeBookmark(props.selectionText);
					} else {
						electron.clipboard.writeText(props.selectionText);
					}

					win.webContents.delete();
				}
			}),
			COPY: decorateMenuItem({
				id: 'copy',
				label: 'Copy',
				enabled: can('Copy'),
				visible: props.isEditable || hasText,
				click(menuItem) {
					props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;

					if (process.platform === 'darwin') {
						electron.clipboard.writeBookmark(props.selectionText);
					} else {
						electron.clipboard.writeText(props.selectionText);
					}
				}
			}),
			PASTE: decorateMenuItem({
				id: 'paste',
				label: 'Paste',
				enabled: editFlags.canPaste,
				visible: props.isEditable,
				click(menuItem) {
					let clipboardContent;
					if (process.platform === 'darwin') {
						clipboardContent = electron.clipboard.readBookmark();
					} else {
						clipboardContent = electron.clipboard.readText(props.selectionText);
					}

					clipboardContent = menuItem.transform ? menuItem.transform(clipboardContent) : clipboardContent;

					win.webContents.insertText(clipboardContent);
				}

			}),
			INSPECT: decorateMenuItem({
				id: 'inspect',
				label: 'Inspect Element',
				click(menuItem) {
					win.inspectElement(props.x, props.y);

					if (webContents(win).isDevToolsOpened()) {
						webContents(win).devToolsWebContents.focus();
					}
				}
			}),
			SEPARATOR: decorateMenuItem({
				type: 'separator'
			}),
			SAVE_IMAGE: decorateMenuItem({
				id: 'save',
				label: 'Save Image',
				visible: props.mediaType === 'image',
				click(menuItem) {
					props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
					download(win, props.srcURL);
				}
			}),
			COPY_LINK: decorateMenuItem({
				id: 'copyLink',
				label: 'Copy Link',
				// visible: props.linkURL && props.mediaType === 'none',
				visible: props.linkURL.length !== 0 && props.mediaType === 'none',
				click(menuItem) {
					props.linkURL = menuItem.transform ? menuItem.transform(props.linkURL) : props.linkURL;

					if (process.platform === 'darwin') {
						electron.clipboard.writeBookmark(props.linkText, props.linkURL);
					} else {
						electron.clipboard.writeText(props.linkURL);
					}
				}
			})
		}

		const defaultMenu = [defaultActions.SEPARATOR(), defaultActions.CUT(), defaultActions.COPY(), defaultActions.PASTE(), defaultActions.SEPARATOR()]

		let menuTpl = defaultMenu;

		if (opts.menu) {
			menuTpl = opts.menu(defaultActions, props, win);
		}

		if (!opts.menu && props.mediaType === 'image') {
			menuTpl = [defaultActions.SEPARATOR(), defaultActions.SAVE_IMAGE(), defaultActions.SEPARATOR()];
		}

		if (!opts.menu && props.linkURL && props.mediaType === 'none') {
			menuTpl = [defaultActions.SEPARATOR(), defaultActions.COPY_LINK(), defaultActions.SEPARATOR()];
		}

		if (opts.prepend) {
			const result = opts.prepend(defaultActions, props, win);

			if (Array.isArray(result)) {
				menuTpl.unshift(...result);
			}
		}

		if (opts.append) {
			const result = opts.append(defaultActions, props, win);

			if (Array.isArray(result)) {
				menuTpl.push(...result);
			}
		}

		if (opts.showInspectElement || (opts.showInspectElement !== false && isDev)) {
			menuTpl.push(defaultActions.SEPARATOR(), defaultActions.INSPECT(), defaultActions.SEPARATOR());
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
			menu.popup(electron.remote ? electron.remote.getCurrentWindow() : win);
		}
	});
}

function decorateMenuItem(menuItem) {
	return (opts = {}) => {
		if(opts.transform && !opts.click){
			menuItem.transform = opts.transform;
		}

		if(opts.click) {
			menuItem.click = opts.click;
		}

		return menuItem;
	}
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
	if (opts.window) {
		const win = opts.window;
		const wc = webContents(win);

		// When window is a webview that has not yet finished loading webContents is not available
		if (wc === undefined) {
			win.addEventListener('dom-ready', () => {
				create(win, opts);
			}, {once: true});
			return;
		}

		return create(win, opts);
	}

	(electron.BrowserWindow || electron.remote.BrowserWindow).getAllWindows().forEach(win => {
		create(win, opts);
	});

	(electron.app || electron.remote.app).on('browser-window-created', (e, win) => {
		create(win, opts);
	});
};
