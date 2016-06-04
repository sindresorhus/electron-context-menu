'use strict';
const electron = require('electron');
const {download} = require('electron-dl');

function create(win, opts) {
	win.webContents.on('context-menu', (e, props) => {
		const editFlags = props.editFlags;
		const hasText = props.selectionText.trim().length > 0;

		let menuTpl = [{
			type: 'separator'
		}, {
			label: 'Cut',
			// role: 'cut',
			// the above is commented out because of:
			// https://github.com/electron/electron/issues/5860
			role: editFlags.canCut && hasText ? 'cut' : '',
			enabled: editFlags.canCut && hasText,
			visible: props.isEditable
		}, {
			label: 'Copy',
			// role: 'copy',
			role: editFlags.canCopy && hasText ? 'copy' : '',
			enabled: editFlags.canCopy && hasText,
			visible: props.isEditable
		}, {
			label: 'Paste',
			// role: 'paste',
			role: editFlags.canPaste && hasText ? 'paste' : '',
			enabled: editFlags.canPaste && hasText,
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
					// TODO: https://github.com/electron/electron/issues/5861
					electron.clipboard.writeText(props.linkURL);
				}
			}, {
				type: 'separator'
			}];
		}

		if (opts.prepend) {
			menuTpl.unshift(...opts.prepend());
		}

		if (opts.append) {
			menuTpl.push(...opts.append());
		}

		// filter out leading/trailing separators
		// TODO: https://github.com/electron/electron/issues/5869
		menuTpl = menuTpl.filter((el, i, arr) => !(el.type === 'separator' && (i === 0 || i === arr.length - 1)));

		const menu = (electron.Menu || electron.remote.Menu).buildFromTemplate(menuTpl);
		menu.popup(win);
	});
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
