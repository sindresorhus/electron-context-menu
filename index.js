import process from 'node:process';
import electron from 'electron';
import cliTruncate from 'cli-truncate';
import {download} from 'electron-dl';
import isDev from 'electron-is-dev';

const webContents = win => win.webContents ?? (win.id && win);

const decorateMenuItem = menuItem => (options = {}) => {
	if (options.transform && !options.click) {
		menuItem.transform = options.transform;
	}

	return menuItem;
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
	const handleContextMenu = (event, properties) => {
		if (typeof options.shouldShowMenu === 'function' && options.shouldShowMenu(event, properties) === false) {
			return;
		}

		const {editFlags} = properties;
		const hasText = properties.selectionText.length > 0;
		const isLink = Boolean(properties.linkURL);
		const can = type => editFlags[`can${type}`] && hasText;

		const defaultActions = {
			separator: () => ({type: 'separator'}),
			learnSpelling: decorateMenuItem({
				id: 'learnSpelling',
				label: '&Learn Spelling',
				visible: Boolean(properties.isEditable && hasText && properties.misspelledWord),
				click() {
					const target = webContents(win);
					target.session.addWordToSpellCheckerDictionary(properties.misspelledWord);
				},
			}),
			lookUpSelection: decorateMenuItem({
				id: 'lookUpSelection',
				label: 'Look Up “{selection}”',
				visible: process.platform === 'darwin' && hasText && !isLink,
				click() {
					if (process.platform === 'darwin') {
						webContents(win).showDefinitionForSelection();
					}
				},
			}),
			searchWithGoogle: decorateMenuItem({
				id: 'searchWithGoogle',
				label: '&Search with Google',
				visible: hasText,
				click() {
					const url = new URL('https://www.google.com/search');
					url.searchParams.set('q', properties.selectionText);
					electron.shell.openExternal(url.toString());
				},
			}),
			cut: decorateMenuItem({
				id: 'cut',
				label: 'Cu&t',
				enabled: can('Cut'),
				visible: properties.isEditable,
				click(menuItem) {
					const target = webContents(win);

					if (!menuItem.transform && target) {
						target.cut();
					} else {
						properties.selectionText = menuItem.transform ? menuItem.transform(properties.selectionText) : properties.selectionText;
						electron.clipboard.writeText(properties.selectionText);
					}
				},
			}),
			copy: decorateMenuItem({
				id: 'copy',
				label: '&Copy',
				enabled: can('Copy'),
				visible: properties.isEditable || hasText,
				click(menuItem) {
					const target = webContents(win);

					if (!menuItem.transform && target) {
						target.copy();
					} else {
						properties.selectionText = menuItem.transform ? menuItem.transform(properties.selectionText) : properties.selectionText;
						electron.clipboard.writeText(properties.selectionText);
					}
				},
			}),
			paste: decorateMenuItem({
				id: 'paste',
				label: '&Paste',
				enabled: editFlags.canPaste,
				visible: properties.isEditable,
				click(menuItem) {
					const target = webContents(win);

					if (menuItem.transform) {
						let clipboardContent = electron.clipboard.readText(properties.selectionText);
						clipboardContent = menuItem.transform ? menuItem.transform(clipboardContent) : clipboardContent;
						target.insertText(clipboardContent);
					} else {
						target.paste();
					}
				},
			}),
			selectAll: decorateMenuItem({
				id: 'selectAll',
				label: 'Select &All',
				click() {
					webContents(win).selectAll();
				},
			}),
			saveImage: decorateMenuItem({
				id: 'saveImage',
				label: 'Save I&mage',
				visible: properties.mediaType === 'image',
				click(menuItem) {
					properties.srcURL = menuItem.transform ? menuItem.transform(properties.srcURL) : properties.srcURL;
					download(win, properties.srcURL);
				},
			}),
			saveImageAs: decorateMenuItem({
				id: 'saveImageAs',
				label: 'Sa&ve Image As…',
				visible: properties.mediaType === 'image',
				click(menuItem) {
					properties.srcURL = menuItem.transform ? menuItem.transform(properties.srcURL) : properties.srcURL;
					download(win, properties.srcURL, {saveAs: true});
				},
			}),
			saveVideo: decorateMenuItem({
				id: 'saveVideo',
				label: 'Save Vide&o',
				visible: properties.mediaType === 'video',
				click(menuItem) {
					properties.srcURL = menuItem.transform ? menuItem.transform(properties.srcURL) : properties.srcURL;
					download(win, properties.srcURL);
				},
			}),
			saveVideoAs: decorateMenuItem({
				id: 'saveVideoAs',
				label: 'Save Video& As…',
				visible: properties.mediaType === 'video',
				click(menuItem) {
					properties.srcURL = menuItem.transform ? menuItem.transform(properties.srcURL) : properties.srcURL;
					download(win, properties.srcURL, {saveAs: true});
				},
			}),
			copyLink: decorateMenuItem({
				id: 'copyLink',
				label: 'Copy Lin&k',
				visible: properties.linkURL.length > 0 && properties.mediaType === 'none',
				click(menuItem) {
					properties.linkURL = menuItem.transform ? menuItem.transform(properties.linkURL) : properties.linkURL;

					electron.clipboard.write({
						bookmark: properties.linkText,
						text: properties.linkURL,
					});
				},
			}),
			saveLinkAs: decorateMenuItem({
				id: 'saveLinkAs',
				label: 'Save Link As…',
				visible: properties.linkURL.length > 0 && properties.mediaType === 'none',
				click(menuItem) {
					properties.linkURL = menuItem.transform ? menuItem.transform(properties.linkURL) : properties.linkURL;
					download(win, properties.linkURL, {saveAs: true});
				},
			}),
			copyImage: decorateMenuItem({
				id: 'copyImage',
				label: 'Cop&y Image',
				visible: properties.mediaType === 'image',
				click() {
					webContents(win).copyImageAt(properties.x, properties.y);
				},
			}),
			copyImageAddress: decorateMenuItem({
				id: 'copyImageAddress',
				label: 'C&opy Image Address',
				visible: properties.mediaType === 'image',
				click(menuItem) {
					properties.srcURL = menuItem.transform ? menuItem.transform(properties.srcURL) : properties.srcURL;

					electron.clipboard.write({
						bookmark: properties.srcURL,
						text: properties.srcURL,
					});
				},
			}),
			copyVideoAddress: decorateMenuItem({
				id: 'copyVideoAddress',
				label: 'Copy Video Ad&dress',
				visible: properties.mediaType === 'video',
				click(menuItem) {
					properties.srcURL = menuItem.transform ? menuItem.transform(properties.srcURL) : properties.srcURL;

					electron.clipboard.write({
						bookmark: properties.srcURL,
						text: properties.srcURL,
					});
				},
			}),
			inspect: () => ({
				id: 'inspect',
				label: 'I&nspect Element',
				click() {
					webContents(win).inspectElement(properties.x, properties.y);

					if (webContents(win).isDevToolsOpened()) {
						webContents(win).devToolsWebContents.focus();
					}
				},
			}),
			services: () => ({
				id: 'services',
				label: 'Services',
				role: 'services',
				visible: process.platform === 'darwin' && (properties.isEditable || hasText),
			}),
		};

		const shouldShowInspectElement = typeof options.showInspectElement === 'boolean' ? options.showInspectElement : isDev;
		const shouldShowSelectAll = options.showSelectAll || (options.showSelectAll !== false && process.platform !== 'darwin');

		function word(suggestion) {
			return {
				id: 'dictionarySuggestions',
				label: suggestion,
				visible: Boolean(properties.isEditable && hasText && properties.misspelledWord),
				click(menuItem) {
					const target = webContents(win);
					target.replaceMisspelling(menuItem.label);
				},
			};
		}

		let dictionarySuggestions = [];
		if (hasText && properties.misspelledWord && properties.dictionarySuggestions.length > 0) {
			dictionarySuggestions = properties.dictionarySuggestions.map(suggestion => word(suggestion));
		} else {
			dictionarySuggestions.push(
				{
					id: 'dictionarySuggestions',
					label: 'No Guesses Found',
					visible: Boolean(hasText && properties.misspelledWord),
					enabled: false,
				},
			);
		}

		let menuTemplate = [
			dictionarySuggestions.length > 0 && defaultActions.separator(),
			...dictionarySuggestions,
			defaultActions.separator(),
			options.showLearnSpelling !== false && defaultActions.learnSpelling(),
			defaultActions.separator(),
			options.showLookUpSelection !== false && defaultActions.lookUpSelection(),
			defaultActions.separator(),
			options.showSearchWithGoogle !== false && defaultActions.searchWithGoogle(),
			defaultActions.separator(),
			defaultActions.cut(),
			defaultActions.copy(),
			defaultActions.paste(),
			shouldShowSelectAll && defaultActions.selectAll(),
			defaultActions.separator(),
			options.showSaveImage && defaultActions.saveImage(),
			options.showSaveImageAs && defaultActions.saveImageAs(),
			options.showCopyImage !== false && defaultActions.copyImage(),
			options.showCopyImageAddress && defaultActions.copyImageAddress(),
			options.showSaveVideo && defaultActions.saveVideo(),
			options.showSaveVideoAs && defaultActions.saveVideoAs(),
			options.showCopyVideoAddress && defaultActions.copyVideoAddress(),
			defaultActions.separator(),
			options.showCopyLink !== false && defaultActions.copyLink(),
			options.showSaveLinkAs && defaultActions.saveLinkAs(),
			defaultActions.separator(),
			shouldShowInspectElement && defaultActions.inspect(),
			options.showServices && defaultActions.services(),
			defaultActions.separator(),
		];

		if (options.menu) {
			menuTemplate = options.menu(defaultActions, properties, win, dictionarySuggestions, event);
		}

		if (options.prepend) {
			const result = options.prepend(defaultActions, properties, win, event);

			if (Array.isArray(result)) {
				menuTemplate.unshift(...result);
			}
		}

		if (options.append) {
			const result = options.append(defaultActions, properties, win, event);

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
				const selectionString = typeof properties.selectionText === 'string' ? properties.selectionText.trim() : '';
				menuItem.label = menuItem.label.replace('{selection}', cliTruncate(selectionString, 25).replaceAll('&', '&&'));
			}
		}

		if (menuTemplate.length > 0) {
			const menu = electron.Menu.buildFromTemplate(menuTemplate);

			if (typeof options.onShow === 'function') {
				menu.on('menu-will-show', options.onShow);
			}

			if (typeof options.onClose === 'function') {
				menu.on('menu-will-close', options.onClose);
			}

			menu.popup(win);
		}
	};

	webContents(win).on('context-menu', handleContextMenu);

	return () => {
		if (win?.isDestroyed?.()) {
			return;
		}

		webContents(win).removeListener('context-menu', handleContextMenu);
	};
};

export default function contextMenu(options = {}) {
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

		const disposable = () => {
			disposeMenu();
		};

		webContents(win).once('destroyed', disposable);
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

			const listenerFunction = win.addEventListener ?? win.addListener;
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
}
