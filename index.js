'use strict';
const electron = require('electron');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');

function create(win, opts) {
	win.webContents.on('context-menu', (e, props) => {
		const editFlags = props.editFlags;
		const hasText = props.selectionText.trim().length > 0;
		const can = type => editFlags[`can${type}`] && hasText;

		let menuTpl = [{
			type: 'separator'
		}, {
			label: 'Cut',
			// needed because of macOS limitation:
			// https://github.com/electron/electron/issues/5860
			role: can('Cut') ? 'cut' : '',
			enabled: can('Cut'),
			visible: props.isEditable
		}, {
			label: 'Copy',
			role: can('Copy') ? 'copy' : '',
			enabled: can('Copy'),
			visible: props.isEditable || hasText
		}, {
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
				label: 'Save Image',
				click(item, win) {
					download(win, props.srcURL);
				}
			}, {
				type: 'separator'
			}];
		}

		if (props.linkURL && props.mediaType === 'none') {
			menuTpl = [{
				type: 'separator'
			}, {
				label: 'Copy Link',
				click() {
					if (process.platform === 'linux') {
						electron.clipboard.writeText(props.linkURL);
					} else {
						electron.clipboard.writeBookmark(props.linkText, props.linkURL);
					}
				}
			}, {
				type: 'separator'
			}];
		}

		if (opts.prepend) {
			menuTpl.unshift(...opts.prepend(props));
		}

		if (opts.append) {
			menuTpl.push(...opts.append(props));
		}

		if (opts.showInspectElement || (opts.showInspectElement !== false && isDev)) {
			menuTpl.push({
				type: 'separator'
			}, {
				label: 'Inspect Element',
				click(item, win) {
					win.webContents.inspectElement(props.x, props.y);

					if (win.webContents.isDevToolsOpened()) {
						win.webContents.devToolsWebContents.focus();
					}
				}
			}, {
				type: 'separator'
			});
		}

		// filter out leading/trailing separators
		// TODO: https://github.com/electron/electron/issues/5869
		menuTpl = deleteUnnecessarySeparators(menuTpl);

		if (menuTpl.some(elem => isVisible(elem))) {
			const menu = (electron.Menu || electron.remote.Menu).buildFromTemplate(menuTpl);
			menu.popup(win);
		}
	});
}

function deleteUnnecessarySeparators(menuTpl) {
	let visiblePreviousEl;
	return menuTpl.filter((el, i, arr) => {
		const toDelete = el.type === 'separator' && (!visiblePreviousEl || i === arr.length - 1 || arr[i + 1].type === 'separator');
		visiblePreviousEl = toDelete || !isVisible(el) ? visiblePreviousEl : el;
		return !toDelete;
	});
}

function isVisible(elem) {
	return !('visible' in elem) || elem.visible;
}

module.exports = (opts = {}) => {
	if (opts.window) {
		create(opts.window, opts);
		return;
	}

	(electron.BrowserWindow || electron.remote.BrowserWindow).getAllWindows().forEach(win => {
		create(win, opts);
	});

	(electron.app || electron.remote.app).on('browser-window-created', (e, win) => {
		create(win, opts);
	});
};
