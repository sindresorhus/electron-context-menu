import process from 'node:process';
import electron from 'electron';
import cliTruncate from 'cli-truncate';
import {download, CancelError} from 'electron-dl';
import isDev from 'electron-is-dev';

const webContents = win => win.webContents ?? win;

const applyTransform = (menuItem, value) => menuItem.transform ? menuItem.transform(value) : value;

const downloadFile = async (target, url, options) => {
	try {
		await download(target, url, options);
	} catch (error) {
		// Cancelling the save dialog is a normal user action, not an error.
		if (!(error instanceof CancelError)) {
			electron.dialog.showErrorBox('Download Error', error.message);
		}
	}
};

const writeBookmark = async (title, url) => electron.clipboard.write([
	new electron.ClipboardItem({
		'text/plain': url,
		'electron application/bookmark': {title, url},
	}),
]);

// Electron does not await menu click handlers, so a rejection would go unhandled and crash the app.
const catchClickErrors = click => async menuItem => {
	try {
		await click(menuItem);
	} catch (error) {
		electron.dialog.showErrorBox('Error', error.message);
	}
};

const decorateMenuItem = menuItem => {
	menuItem.click = catchClickErrors(menuItem.click);

	return (options = {}) => {
		if (options.transform && !options.click) {
			menuItem.transform = options.transform;
		}

		return menuItem;
	};
};

const removeUnusedMenuItems = menuTemplate => {
	const menuItems = [];

	for (const menuItem of menuTemplate) {
		// `visible` is an empty string when it comes from an expression like `visible: parameters.misspelledWord`.
		const isHidden = !menuItem || menuItem.visible === false || menuItem.visible === '';
		// Skip leading and repeated separators.
		const isRedundantSeparator = menuItem?.type === 'separator' && (menuItems.length === 0 || menuItems.at(-1).type === 'separator');

		if (isHidden || isRedundantSeparator) {
			continue;
		}

		menuItems.push(menuItem);
	}

	// Drop a trailing separator.
	if (menuItems.at(-1)?.type === 'separator') {
		menuItems.pop();
	}

	return menuItems;
};

const create = (win, options) => {
	const currentWebContents = webContents(win);

	// `electron-dl` only needs `.webContents`, so wrapping it this way also works when `win` is itself a `WebContents`.
	const downloadTarget = {webContents: currentWebContents};

	const handleContextMenu = (event, properties) => {
		if (typeof options.shouldShowMenu === 'function' && options.shouldShowMenu(event, properties) === false) {
			return;
		}

		const {editFlags} = properties;
		const hasText = properties.selectionText.length > 0;
		const isLink = Boolean(properties.linkURL);
		const isMisspelled = Boolean(hasText && properties.isEditable && properties.misspelledWord);

		const defaultActions = {
			separator: () => ({type: 'separator'}),
			learnSpelling: decorateMenuItem({
				id: 'learnSpelling',
				label: '&Learn Spelling',
				visible: isMisspelled,
				click() {
					currentWebContents.session.addWordToSpellCheckerDictionary(properties.misspelledWord);
				},
			}),
			lookUpSelection: decorateMenuItem({
				id: 'lookUpSelection',
				label: 'Look Up “{selection}”',
				visible: process.platform === 'darwin' && hasText && !isLink,
				click() {
					if (process.platform === 'darwin') {
						currentWebContents.showDefinitionForSelection();
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
					electron.shell.openExternal(url.href);
				},
			}),
			cut: decorateMenuItem({
				id: 'cut',
				label: 'Cu&t',
				enabled: editFlags.canCut && hasText,
				visible: properties.isEditable,
				async click(menuItem) {
					if (menuItem.transform) {
						await electron.clipboard.writeText(menuItem.transform(properties.selectionText));
					} else {
						currentWebContents.cut();
					}
				},
			}),
			copy: decorateMenuItem({
				id: 'copy',
				label: '&Copy',
				enabled: editFlags.canCopy && hasText,
				visible: properties.isEditable || hasText,
				async click(menuItem) {
					if (menuItem.transform) {
						await electron.clipboard.writeText(menuItem.transform(properties.selectionText));
					} else {
						currentWebContents.copy();
					}
				},
			}),
			paste: decorateMenuItem({
				id: 'paste',
				label: '&Paste',
				enabled: editFlags.canPaste,
				visible: properties.isEditable,
				async click(menuItem) {
					if (menuItem.transform) {
						const clipboardContent = await electron.clipboard.readText();
						await currentWebContents.insertText(menuItem.transform(clipboardContent));
					} else {
						currentWebContents.paste();
					}
				},
			}),
			pasteAndMatchStyle: decorateMenuItem({
				id: 'pasteAndMatchStyle',
				label: 'Paste and &Match Style',
				enabled: editFlags.canPaste,
				visible: properties.isEditable,
				click() {
					currentWebContents.pasteAndMatchStyle();
				},
			}),
			selectAll: decorateMenuItem({
				id: 'selectAll',
				label: 'Select &All',
				click() {
					currentWebContents.selectAll();
				},
			}),
			saveImage: decorateMenuItem({
				id: 'saveImage',
				label: 'Save I&mage',
				visible: properties.mediaType === 'image',
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL));
				},
			}),
			saveImageAs: decorateMenuItem({
				id: 'saveImageAs',
				label: 'Sa&ve Image As…',
				visible: properties.mediaType === 'image',
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL), {saveAs: true});
				},
			}),
			saveVideo: decorateMenuItem({
				id: 'saveVideo',
				label: 'Save Vide&o',
				visible: properties.mediaType === 'video',
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL));
				},
			}),
			saveVideoAs: decorateMenuItem({
				id: 'saveVideoAs',
				label: 'Sa&ve Video As…',
				visible: properties.mediaType === 'video',
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.srcURL), {saveAs: true});
				},
			}),
			copyLink: decorateMenuItem({
				id: 'copyLink',
				label: 'Copy Lin&k',
				visible: properties.linkURL.length > 0 && properties.mediaType === 'none',
				async click(menuItem) {
					await writeBookmark(properties.linkText, applyTransform(menuItem, properties.linkURL));
				},
			}),
			saveLinkAs: decorateMenuItem({
				id: 'saveLinkAs',
				label: 'Save Link As…',
				visible: properties.linkURL.length > 0 && properties.mediaType === 'none',
				click(menuItem) {
					return downloadFile(downloadTarget, applyTransform(menuItem, properties.linkURL), {saveAs: true});
				},
			}),
			copyImage: decorateMenuItem({
				id: 'copyImage',
				label: 'Cop&y Image',
				visible: properties.mediaType === 'image',
				click() {
					currentWebContents.copyImageAt(properties.x, properties.y);
				},
			}),
			copyImageAddress: decorateMenuItem({
				id: 'copyImageAddress',
				label: 'C&opy Image Address',
				visible: properties.mediaType === 'image',
				async click(menuItem) {
					const url = applyTransform(menuItem, properties.srcURL);
					await writeBookmark(url, url);
				},
			}),
			copyVideoAddress: decorateMenuItem({
				id: 'copyVideoAddress',
				label: 'Copy Video Ad&dress',
				visible: properties.mediaType === 'video',
				async click(menuItem) {
					const url = applyTransform(menuItem, properties.srcURL);
					await writeBookmark(url, url);
				},
			}),
			copyVideoFrame: decorateMenuItem({
				id: 'copyVideoFrame',
				label: 'Copy Video Fra&me',
				visible: properties.mediaType === 'video',
				click() {
					currentWebContents.copyVideoFrameAt(properties.x, properties.y);
				},
			}),
			saveVideoFrameAs: decorateMenuItem({
				id: 'saveVideoFrameAs',
				label: 'Save Video &Frame As…',
				visible: properties.mediaType === 'video',
				click() {
					currentWebContents.saveVideoFrameAs(properties.x, properties.y);
				},
			}),
			inspect: () => ({
				id: 'inspect',
				label: 'I&nspect Element',
				click() {
					currentWebContents.inspectElement(properties.x, properties.y);

					// Raise the DevTools window when it is already open but not focused.
					// Deliberately a no-op when DevTools was closed, as opening it focuses it anyway.
					currentWebContents.devToolsWebContents?.focus();
				},
			}),
			services: () => ({
				id: 'services',
				label: 'Services',
				role: 'services',
				visible: process.platform === 'darwin' && (properties.isEditable || hasText),
			}),
		};

		const shouldShowInspectElement = options.showInspectElement ?? isDev;
		const shouldShowSelectAll = options.showSelectAll ?? (process.platform !== 'darwin');

		// The suggestions are dynamic words with no stable identity, so they deliberately have no `id`. That also keeps `options.labels` from renaming them.
		const dictionarySuggestions = properties.dictionarySuggestions.length > 0
			? properties.dictionarySuggestions.map(suggestion => ({
				label: suggestion,
				visible: isMisspelled,
				click(menuItem) {
					currentWebContents.replaceMisspelling(menuItem.label);
				},
			}))
			: [
				{
					id: 'dictionarySuggestions',
					label: 'No Guesses Found',
					visible: isMisspelled,
					enabled: false,
				},
			];

		let menuTemplate = [
			defaultActions.separator(),
			...(options.showDictionarySuggestions === false ? [] : dictionarySuggestions),
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
			options.showPasteAndMatchStyle && defaultActions.pasteAndMatchStyle(),
			shouldShowSelectAll && defaultActions.selectAll(),
			defaultActions.separator(),
			options.showSaveImage && defaultActions.saveImage(),
			options.showSaveImageAs && defaultActions.saveImageAs(),
			options.showCopyImage !== false && defaultActions.copyImage(),
			options.showCopyImageAddress && defaultActions.copyImageAddress(),
			options.showSaveVideo && defaultActions.saveVideo(),
			options.showSaveVideoAs && defaultActions.saveVideoAs(),
			options.showCopyVideoAddress && defaultActions.copyVideoAddress(),
			options.showCopyVideoFrame && defaultActions.copyVideoFrame(),
			options.showSaveVideoFrameAs && defaultActions.saveVideoFrameAs(),
			defaultActions.separator(),
			options.showCopyLink !== false && defaultActions.copyLink(),
			options.showSaveLinkAs && defaultActions.saveLinkAs(),
			defaultActions.separator(),
			shouldShowInspectElement && defaultActions.inspect(),
			options.showServices && defaultActions.services(),
			defaultActions.separator(),
		];

		if (options.menu) {
			const result = options.menu(defaultActions, properties, win, dictionarySuggestions, event);

			if (Array.isArray(result)) {
				menuTemplate = result;
			}
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

		if (menuTemplate.length === 0) {
			return;
		}

		const selectionString = typeof properties.selectionText === 'string' ? properties.selectionText.trim() : '';

		for (const menuItem of menuTemplate) {
			// Apply custom labels for default menu items
			// `||` rather than `??`, so that an empty custom label leaves the default label in place.
			const label = options.labels?.[menuItem.id] || menuItem.label;

			// Replace placeholders in menu item labels
			if (typeof label === 'string') {
				// The replacement is a function so that `$` patterns in the selection text are not treated as replacement patterns.
				menuItem.label = label.replace('{selection}', () => cliTruncate(selectionString, 25).replaceAll('&', '&&'));
			}
		}

		const menu = electron.Menu.buildFromTemplate(menuTemplate);

		if (typeof options.onShow === 'function') {
			menu.on('menu-will-show', options.onShow);
		}

		if (typeof options.onClose === 'function') {
			menu.on('menu-will-close', options.onClose);
		}

		menu.popup({
			window: electron.BrowserWindow.fromWebContents(currentWebContents) ?? undefined,
			// Lets macOS add its own items, like Writing Tools and Autofill.
			frame: properties.frame ?? undefined,
			sourceType: properties.menuSourceType,
		});
	};

	currentWebContents.on('context-menu', handleContextMenu);

	return () => {
		currentWebContents.removeListener('context-menu', handleContextMenu);
	};
};

export default function contextMenu(options = {}) {
	if (process.type === 'renderer') {
		throw new Error('Cannot use electron-context-menu in the renderer process!');
	}

	let isDisposed = false;
	const disposables = new Set();

	const init = win => {
		if (isDisposed) {
			return;
		}

		const currentWebContents = webContents(win);
		const disposeMenu = create(win, options);

		// Also runs as the `destroyed` listener, where `once` has already removed it.
		const disposeWindow = () => {
			disposables.delete(disposeWindow);
			currentWebContents.removeListener('destroyed', disposeWindow);
			disposeMenu();
		};

		currentWebContents.once('destroyed', disposeWindow);
		disposables.add(disposeWindow);
	};

	const dispose = () => {
		for (const disposeWindow of disposables) {
			disposeWindow();
		}

		disposables.clear();
		isDisposed = true;
	};

	if (options.window) {
		init(options.window);

		return dispose;
	}

	for (const win of electron.BrowserWindow.getAllWindows()) {
		init(win);
	}

	const onWindowCreated = (event, win) => {
		init(win);
	};

	electron.app.on('browser-window-created', onWindowCreated);
	disposables.add(() => {
		electron.app.removeListener('browser-window-created', onWindowCreated);
	});

	return dispose;
}
