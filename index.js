'use strict';
const electron = require('electron');
const cliTruncate = require('cli-truncate');
const {download} = require('electron-dl');
const isDev = require('electron-is-dev');

const webContents = win => win.webContents || (win.id && win);

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
		.filter(menuItem => menuItem !== undefined && menuItem !== false && menuItem.visible !== false && menuItem.visible !== '')
		.filter((menuItem, index, array) => {
			const toDelete = menuItem.type === 'separator' && (!notDeletedPreviousElement || index === array.length - 1 || array[index + 1].type === 'separator');
			notDeletedPreviousElement = toDelete ? notDeletedPreviousElement : menuItem;
			return !toDelete;
		});
};

const create = (win, options) => {
	const handleContextMenu = (event, props) => {
		if (typeof options.shouldShowMenu === 'function' && options.shouldShowMenu(event, props) === false) {
			return;
		}

		const {editFlags} = props;
		const hasText = props.selectionText.trim().length > 0;
		const isLink = Boolean(props.linkURL);
		const can = type => editFlags[`can${type}`] && hasText;

		const defaultActions = {
			separator: () => ({type: 'separator'}),
			learnSpelling: decorateMenuItem({
				id: 'learnSpelling',
				label: '&Learn Spelling',
				visible: Boolean(props.isEditable && hasText && props.misspelledWord),
				click() {
					const target = webContents(win);
					target.session.addWordToSpellCheckerDictionary(props.misspelledWord);
				}
			}),
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
			searchWithGoogle: decorateMenuItem({
				id: 'searchWithGoogle',
				label: '&Search with Google',
				visible: hasText,
				click() {
					const url = new URL('https://www.google.com/search');
					url.searchParams.set('q', props.selectionText);
					electron.shell.openExternal(url.toString());
				}
			}),
			cut: decorateMenuItem({
				id: 'cut',
				label: 'Cu&t',
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
				label: '&Copy',
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
				label: '&Paste',
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
				label: 'Save I&mage',
				visible: props.mediaType === 'image',
				click(menuItem) {
					props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
					download(win, props.srcURL);
				}
			}),
			saveImageAs: decorateMenuItem({
				id: 'saveImageAs',
				label: 'Sa&ve Image As…',
				visible: props.mediaType === 'image',
				click(menuItem) {
					props.srcURL = menuItem.transform ? menuItem.transform(props.srcURL) : props.srcURL;
					download(win, props.srcURL, {saveAs: true});
				}
			}),
			copyLink: decorateMenuItem({
				id: 'copyLink',
				label: 'Copy Lin&k',
				visible: props.linkURL.length > 0 && props.mediaType === 'none',
				click(menuItem) {
					props.linkURL = menuItem.transform ? menuItem.transform(props.linkURL) : props.linkURL;

					electron.clipboard.write({
						bookmark: props.linkText,
						text: props.linkURL
					});
				}
			}),
			saveLinkAs: decorateMenuItem({
				id: 'saveLinkAs',
				label: 'Save Link As…',
				visible: props.linkURL.length > 0 && props.mediaType === 'none',
				click(menuItem) {
					props.linkURL = menuItem.transform ? menuItem.transform(props.linkURL) : props.linkURL;
					download(win, props.linkURL, {saveAs: true});
				}
			}),
			copyImage: decorateMenuItem({
				id: 'copyImage',
				label: 'Cop&y Image',
				visible: props.mediaType === 'image',
				click() {
					webContents(win).copyImageAt(props.x, props.y);
				}
			}),
			copyImageAddress: decorateMenuItem({
				id: 'copyImageAddress',
				label: 'C&opy Image Address',
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
				label: 'I&nspect Element',
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

		function word(suggestion) {
			return {
				id: 'dictionarySuggestions',
				label: suggestion,
				visible: Boolean(props.isEditable && hasText && props.misspelledWord),
				click(menuItem) {
					const target = webContents(win);
					target.replaceMisspelling(menuItem.label);
				}
			};
		}

		let dictionarySuggestions = [];
		if (hasText && props.misspelledWord && props.dictionarySuggestions.length > 0) {
			dictionarySuggestions = props.dictionarySuggestions.map(suggestion => word(suggestion));
		} else {
			dictionarySuggestions.push(
				{
					id: 'dictionarySuggestions',
					label: 'No Guesses Found',
					visible: Boolean(hasText && props.misspelledWord),
					enabled: false
				}
			);
		}

		let menuTemplate = [
			dictionarySuggestions.length > 0 && defaultActions.separator(),
			...dictionarySuggestions,
			defaultActions.separator(),
			defaultActions.learnSpelling(),
			defaultActions.separator(),
			options.showLookUpSelection !== false && defaultActions.lookUpSelection(),
			defaultActions.separator(),
			options.showSearchWithGoogle !== false && defaultActions.searchWithGoogle(),
			defaultActions.separator(),
			defaultActions.cut(),
			defaultActions.copy(),
			defaultActions.paste(),
			defaultActions.separator(),
			options.showSaveImage && defaultActions.saveImage(),
			options.showSaveImageAs && defaultActions.saveImageAs(),
			options.showCopyImage !== false && defaultActions.copyImage(),
			options.showCopyImageAddress && defaultActions.copyImageAddress(),
			defaultActions.separator(),
			defaultActions.copyLink(),
			options.showSaveLinkAs && defaultActions.saveLinkAs(),
			defaultActions.separator(),
			shouldShowInspectElement && defaultActions.inspect(),
			options.showServices && defaultActions.services(),
			defaultActions.separator()
		];

		if (options.menu) {
			menuTemplate = options.menu(defaultActions, props, win, dictionarySuggestions, event);
		}

		if (options.prepend) {
			const result = options.prepend(defaultActions, props, win, event);

			if (Array.isArray(result)) {
				menuTemplate.unshift(...result);
			}
		}

		if (options.append) {
			const result = options.append(defaultActions, props, win, event);

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
				menuItem.label = menuItem.label.replace('{selection}', cliTruncate(selectionString, 25).replace(/&/g, '&&'));
			}
		}

		if (menuTemplate.length > 0) {
			const menu = electron.Menu.buildFromTemplate(menuTemplate);
			menu.popup(win);
		}
	};

	webContents(win).on('context-menu', handleContextMenu);

	return () => {
		if (win.isDestroyed()) {
			return;
		}

		webContents(win).removeListener('context-menu', handleContextMenu);
	};
};

module.exports = (options = {}) => {
	if (process.type === 'renderer') {
		throw new Error('Cannot use electron-context-menu in the renderer process!');
	}

	let isDisposed = false;
	const disposables = [];

	const init = win => {
		if (isDisposed) {
			return;
		}

		const disposeMenu = create(win, options);

		disposables.push(disposeMenu);
		const removeDisposable = () => {
			const index = disposables.indexOf(disposeMenu);
			if (index !== -1) {
				disposables.splice(index, 1);
			}
		};

		if (typeof win.once !== 'undefined') { // Support for BrowserView
			win.once('closed', removeDisposable);
		}

		disposables.push(() => {
			win.off('closed', removeDisposable);
		});
	};

	const dispose = () => {
		for (const dispose of disposables) {
			dispose();
		}

		disposables.length = 0;
		isDisposed = true;
	};

	if (options.window) {
		const win = options.window;

		// When window is a webview that has not yet finished loading webContents is not available
		if (webContents(win) === undefined) {
			const onDomReady = () => {
				init(win);
			};

			const listenerFunction = win.addEventListener || win.addListener;
			listenerFunction('dom-ready', onDomReady, {once: true});

			disposables.push(() => {
				win.removeEventListener('dom-ready', onDomReady, {once: true});
			});

			return dispose;
		}

		init(win);

		return dispose;
	}

	for (const win of electron.BrowserWindow.getAllWindows()) {
		init(win);
	}

	const onWindowCreated = (event, win) => {
		init(win);
	};

	electron.app.on('browser-window-created', onWindowCreated);
	disposables.push(() => {
		electron.app.removeListener('browser-window-created', onWindowCreated);
	});

	return dispose;
};
