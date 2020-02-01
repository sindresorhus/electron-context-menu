'use strict';
const electron = require('electron');
const cliTruncate = require('cli-truncate');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');

const webContents = win => win.webContents || (win.getWebContents && win.getWebContents());

const decorateMenuItem = menuItem => {
	return (options = {}) => {
		if (options.transform && !options.click) {
			menuItem.transform = options.transform;
		}

		return menuItem;
	};
};

const removeUnusedMenuItems = menuTemplate => {
	let notDeletedPreviousElement;

	return menuTemplate
		.filter(menuItem => menuItem !== undefined && menuItem !== false && menuItem.visible !== false)
		.filter((menuItem, index, array) => {
			const toDelete = menuItem.type === 'separator' && (!notDeletedPreviousElement || index === array.length - 1 || array[index + 1].type === 'separator');
			notDeletedPreviousElement = toDelete ? notDeletedPreviousElement : menuItem;
			return !toDelete;
		});
};

const create = (win, options) => {
	webContents(win).on('context-menu', (event, props) => {
		if (typeof options.shouldShowMenu === 'function' && options.shouldShowMenu(event, props) === false) {
			return;
		}

		const {editFlags} = props;
		const hasText = props.selectionText.trim().length > 0;
		const isLink = Boolean(props.linkURL);
		const can = type => editFlags[`can${type}`] && hasText;

		const defaultActions = {
			separator: () => ({type: 'separator'}),
			lookUpSelection: decorateMenuItem({
				id: 'lookUpSelection',
				label: 'Look Up “{selection}”',
				visible: process.platform === 'darwin' && hasText && !isLink,
				click() {
					if (process.platform === 'darwin') {
						webContents(win).showDefinitionForSelection();
					}
				}
			}),
			cut: decorateMenuItem({
				id: 'cut',
				label: 'Cut',
				enabled: can('Cut'),
				visible: props.isEditable,
				click(menuItem) {
					const target = webContents(win);

					if (!menuItem.transform && target) {
						target.cut();
					} else {
						props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
						electron.clipboard.writeText(props.selectionText);
					}
				}
			}),
			copy: decorateMenuItem({
				id: 'copy',
				label: 'Copy',
				enabled: can('Copy'),
				visible: props.isEditable || hasText,
				click(menuItem) {
					const target = webContents(win);

					if (!menuItem.transform && target) {
						target.copy();
					} else {
						props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
						electron.clipboard.writeText(props.selectionText);
					}
				}
			}),
			paste: decorateMenuItem({
				id: 'paste',
				label: 'Paste',
				enabled: editFlags.canPaste,
				visible: props.isEditable,
				click(menuItem) {
					const target = webContents(win);

					if (menuItem.transform) {
						let clipboardContent = electron.clipboard.readText(props.selectionText);
						clipboardContent = menuItem.transform ? menuItem.transform(clipboardContent) : clipboardContent;
						target.insertText(clipboardContent);
					} else {
						target.paste();
					}
				}
			}),
			saveImage: decorateMenuItem({
				id: 'saveImage',
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
				visible: props.mediaType === 'image',
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
			copyImage: decorateMenuItem({
				id: 'copyImage',
				label: 'Copy Image',
				visible: props.mediaType === 'image',
				click() {
					webContents(win).copyImageAt(props.x, props.y);
				}
			}),
			copyImageAddress: decorateMenuItem({
				id: 'copyImageAddress',
				label: 'Copy Image Address',
				visible: props.mediaType === 'image',
				click(menuItem) {
					props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;

					electron.clipboard.write({
						bookmark: props.srcURL,
						text: props.srcURL
					});
				}
			}),
			inspect: () => ({
				id: 'inspect',
				label: 'Inspect Element',
				click() {
					win.inspectElement(props.x, props.y);

					if (webContents(win).isDevToolsOpened()) {
						webContents(win).devToolsWebContents.focus();
					}
				}
			}),
			services: () => ({
				id: 'services',
				label: 'Services',
				role: 'services',
				visible: process.platform === 'darwin' && (props.isEditable || hasText)
			})
		};

		const shouldShowInspectElement = typeof options.showInspectElement === 'boolean' ? options.showInspectElement : isDev;

		let menuTemplate = [
			defaultActions.separator(),
			options.showLookUpSelection !== false && defaultActions.lookUpSelection(),
			defaultActions.separator(),
			defaultActions.cut(),
			defaultActions.copy(),
			defaultActions.paste(),
			defaultActions.separator(),
			defaultActions.saveImage(),
			options.showSaveImageAs && defaultActions.saveImageAs(),
			options.showCopyImage !== false && defaultActions.copyImage(),
			options.showCopyImageAddress && defaultActions.copyImageAddress(),
			defaultActions.separator(),
			defaultActions.copyLink(),
			defaultActions.separator(),
			shouldShowInspectElement && defaultActions.inspect(),
			options.showServices && defaultActions.services(),
			defaultActions.separator()
		];

		if (options.menu) {
			menuTemplate = options.menu(defaultActions, props, win);
		}

		if (options.prepend) {
			const result = options.prepend(defaultActions, props, win);

			if (Array.isArray(result)) {
				menuTemplate.unshift(...result);
			}
		}

		if (options.append) {
			const result = options.append(defaultActions, props, win);

			if (Array.isArray(result)) {
				menuTemplate.push(...result);
			}
		}

		// Filter out leading/trailing separators
		// TODO: https://github.com/electron/electron/issues/5869
		menuTemplate = removeUnusedMenuItems(menuTemplate);

		for (const menuItem of menuTemplate) {
			// Apply custom labels for default menu items
			if (options.labels && options.labels[menuItem.id]) {
				menuItem.label = options.labels[menuItem.id];
			}

			// Replace placeholders in menu item labels
			if (typeof menuItem.label === 'string' && menuItem.label.includes('{selection}')) {
				const selectionString = typeof props.selectionText === 'string' ? props.selectionText.trim() : '';
				menuItem.label = menuItem.label.replace('{selection}', cliTruncate(selectionString, 25));
			}
		}

		if (menuTemplate.length > 0) {
			const menu = (electron.remote ? electron.remote.Menu : electron.Menu).buildFromTemplate(menuTemplate);

			/*
			When `electron.remote` is not available, this runs in the browser process.

			We can safely use `win` in this case as it refers to the window the
			context-menu should open in.

			When this is being called from a web view, we can't use `win` as this
			would refer to the web view which is not allowed to render a popup menu.
			*/
			menu.popup(electron.remote ? electron.remote.getCurrentWindow() : win);
		}
	});
};

module.exports = (options = {}) => {
	if (options.window) {
		const win = options.window;

		// When window is a webview that has not yet finished loading webContents is not available
		if (webContents(win) === undefined) {
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
