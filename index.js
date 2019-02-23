'use strict';
const electron = require('electron');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');

const webContents = win => win.webContents || win.getWebContents();

function create(win, options) {
	webContents(win).on('context-menu', (event, props) => {
		if (typeof options.shouldShowMenu === 'function' && options.shouldShowMenu(event, props) === false) {
			return;
		}

		const {editFlags} = props;
		const hasText = props.selectionText.trim().length > 0;
		const can = type => editFlags[`can${type}`] && hasText;

		const defaultActions = {
			cut: decorateMenuItem({
				id: 'cut',
				label: 'Cut',
				enabled: can('Cut'),
				visible: props.isEditable,
				click(menuItem) {
					props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
					electron.clipboard.writeText(props.selectionText);
					win.webContents.delete();
				}
			}),
			copy: decorateMenuItem({
				id: 'copy',
				label: 'Copy',
				enabled: can('Copy'),
				visible: props.isEditable || hasText,
				click(menuItem) {
					props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
					electron.clipboard.writeText(props.selectionText);
				}
			}),
			paste: decorateMenuItem({
				id: 'paste',
				label: 'Paste',
				enabled: editFlags.canPaste,
				visible: props.isEditable,
				click(menuItem) {
					let clipboardContent = electron.clipboard.readText(props.selectionText);
					clipboardContent = menuItem.transform ? menuItem.transform(clipboardContent) : clipboardContent;
					win.webContents.insertText(clipboardContent);
				}
			}),
			inspect: () => {
				return {
					id: 'inspect',
					label: 'Inspect Element',
					enabled: options.showInspectElement || (options.showInspectElement !== false && isDev),
					click() {
						win.inspectElement(props.x, props.y);

						if (webContents(win).isDevToolsOpened()) {
							webContents(win).devToolsWebContents.focus();
						}
					}
				};
			},
			separator: () => {
				return {
					type: 'separator'
				};
			},
			saveImage: decorateMenuItem({
				id: 'save',
				label: 'Save Image',
				visible: props.mediaType === 'image',
				click(menuItem) {
					props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
					download(win, props.srcURL);
				}
			}),
			saveImageAs: decorateMenuItem({
				id: 'saveImageAs',
				label: 'Save Image As…',
				visible: options.showSaveImageAs && props.mediaType === 'image',
				click(menuItem) {
					props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
					download(win, props.srcURL, {saveAs: true});
				}
			}),
			copyLink: decorateMenuItem({
				id: 'copyLink',
				label: 'Copy Link',
				visible: props.linkURL.length !== 0 && props.mediaType === 'none',
				click(menuItem) {
					props.linkURL = menuItem.transform ? menuItem.transform(props.linkURL) : props.linkURL;

					electron.clipboard.write({
						bookmark: props.linkText,
						text: props.linkURL
					});
				}
			}),
			copyImageAddress: decorateMenuItem({
				id: 'copyImageAddress',
				label: 'Copy Image Address',
				visible: options.showCopyImageAddress && props.mediaType === 'image',
				click(menuItem) {
					props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;

					electron.clipboard.write({
						bookmark: props.srcURL,
						text: props.srcURL
					});
				}
			})
		};

		let menuTpl = [
			defaultActions.separator(),
			defaultActions.cut(),
			defaultActions.copy(),
			defaultActions.paste(),
			defaultActions.separator(),
			defaultActions.saveImage(),
			defaultActions.saveImageAs(),
			defaultActions.copyImageAddress(),
			defaultActions.separator(),
			defaultActions.copyLink(),
			defaultActions.separator(),
			defaultActions.inspect(),
			defaultActions.separator()
		];

		if (options.menu) {
			menuTpl = options.menu(defaultActions, props, win);
		}

		if (options.prepend) {
			const result = options.prepend(defaultActions, props, win);

			if (Array.isArray(result)) {
				menuTpl.unshift(...result);
			}
		}

		if (options.append) {
			const result = options.append(defaultActions, props, win);

			if (Array.isArray(result)) {
				menuTpl.push(...result);
			}
		}

		// Apply custom labels for default menu items
		if (options.labels) {
			for (const menuItem of menuTpl) {
				if (options.labels[menuItem.id]) {
					menuItem.label = options.labels[menuItem.id];
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
	return (options = {}) => {
		if (options.transform && !options.click) {
			menuItem.transform = options.transform;
		}

		return menuItem;
	};
}

function delUnusedElements(menuTpl) {
	let notDeletedPrevEl;
	return menuTpl.filter(el => el.visible !== false).filter((el, i, array) => {
		const toDelete = el.type === 'separator' && (!notDeletedPrevEl || i === array.length - 1 || array[i + 1].type === 'separator');
		notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
		return !toDelete;
	});
}

module.exports = (options = {}) => {
	if (options.window) {
		const win = options.window;
		const wc = webContents(win);

		// When window is a webview that has not yet finished loading webContents is not available
		if (wc === undefined) {
			win.addEventListener('dom-ready', () => {
				create(win, options);
			}, {once: true});
			return;
		}

		return create(win, options);
	}

	for (const win of (electron.BrowserWindow || electron.remote.BrowserWindow).getAllWindows()) {
		create(win, options);
	}

	(electron.app || electron.remote.app).on('browser-window-created', (event, win) => {
		create(win, options);
	});
};

module.exports.default = module.exports;
