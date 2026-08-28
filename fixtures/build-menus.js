import {EventEmitter} from 'node:events';
import fs from 'node:fs';
import process from 'node:process';
import electron from 'electron';
import contextMenu from '../index.js';

const insertedText = [];

// Electron's `WebContents` is an `EventEmitter`, so the stand-in must be one too.
const createWindow = () => {
	// eslint-disable-next-line unicorn/prefer-event-target
	const currentWebContents = new EventEmitter();

	currentWebContents.insertText = text => {
		insertedText.push(text);
	};

	return {webContents: currentWebContents};
};

// Capture the template and stop the menu from actually being shown.
// The real implementation still runs, both to validate the template and because Electron builds its own menus with it.
const {buildFromTemplate} = electron.Menu;
let capturedTemplate;
let capturedMenu;
electron.Menu.buildFromTemplate = template => {
	capturedTemplate = template;
	capturedMenu = buildFromTemplate.call(electron.Menu, template);
	capturedMenu.popup = () => {};
	return capturedMenu;
};

const clipboardWrites = [];
electron.clipboard.writeText = async text => {
	clipboardWrites.push(text);
};

electron.clipboard.readText = async () => 'unicorn';

// Electron does not await a menu item's click handler, so the real write has to be awaited through here.
const {write} = electron.clipboard;
let clipboardWrite;
electron.clipboard.write = data => {
	clipboardWrite = write.call(electron.clipboard, data);
	return clipboardWrite;
};

// The menu is popped up on the owner window, which this harness does not create.
electron.BrowserWindow.fromWebContents = () => undefined;

const contextMenuParameters = properties => ({
	x: 0,
	y: 0,
	linkURL: '',
	linkText: '',
	srcURL: '',
	mediaType: 'none',
	selectionText: '',
	isEditable: false,
	misspelledWord: '',
	dictionarySuggestions: [],
	menuSourceType: 'mouse',
	editFlags: {
		canCut: true,
		canCopy: true,
		canPaste: true,
	},
	...properties,
});

// Separators have no label, so mark them to make ordering assertions readable.
// Returns `null` when no menu was built, as JSON drops `undefined`.
const openMenu = (window_, properties) => {
	capturedTemplate = undefined;
	window_.webContents.emit('context-menu', {}, contextMenuParameters(properties));
	return capturedTemplate?.map(menuItem => menuItem.label ?? `[${menuItem.type}]`) ?? null;
};

const withMenu = (options, properties) => {
	const window_ = createWindow();
	const dispose = contextMenu({window: window_, ...options});
	const labels = openMenu(window_, properties);
	dispose();
	return labels;
};

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await electron.app.whenReady();

	const selection = {selectionText: 'unicorn', isEditable: true};

	const results = {
		text: withMenu({}, selection),
		image: withMenu({showSaveImage: true, showSaveImageAs: true, showCopyImageAddress: true}, {mediaType: 'image', srcURL: 'https://example.com/unicorn.png'}),
		video: withMenu({
			showSaveVideo: true,
			showSaveVideoAs: true,
			showCopyVideoAddress: true,
			showCopyVideoFrame: true,
			showSaveVideoFrameAs: true,
		}, {mediaType: 'video', srcURL: 'https://example.com/unicorn.mp4'}),
		link: withMenu({showSaveLinkAs: true}, {linkURL: 'https://example.com', linkText: 'Example'}),
		labels: withMenu({labels: {copy: 'Kopier', lookUpSelection: 'Slå opp “{selection}”'}}, selection),
		forced: withMenu({showInspectElement: true, showSelectAll: true}, selection),
		disabledText: withMenu({
			showLearnSpelling: false,
			showLookUpSelection: false,
			showSearchWithGoogle: false,
		}, {
			...selection,
			selectionText: 'unicron',
			misspelledWord: 'unicron',
		}),
		disabledLink: withMenu({showCopyLink: false}, {linkURL: 'https://example.com', linkText: 'Example'}),
		prependAndAppend: withMenu({
			prepend: () => [{label: 'Prepended'}],
			append: () => [{label: 'Appended'}],
		}, selection),
		placeholder: withMenu({
			prepend: () => [{label: 'Search for “{selection}”'}],
		}, {selectionText: '  Rainbows & unicorns are extremely wonderful  '}),
		emptyPrepend: withMenu({
			prepend: () => [
				{type: 'separator'},
				{type: 'separator'},
				{label: 'Invisible', visible: false},
				{type: 'separator'},
			],
		}, selection),
		nonArrayMenu: withMenu({menu: () => undefined}, selection),
		nonArrayPrependAndAppend: withMenu({prepend() {}, append() {}}, selection),
		customMenu: withMenu({
			menu: actions => [actions.copy(), actions.separator(), {label: 'Unicorn'}],
		}, selection),
		hiddenMenu: withMenu({shouldShowMenu: () => false}, selection),
		spelling: withMenu({}, {
			...selection,
			selectionText: 'unicron',
			misspelledWord: 'unicron',
			dictionarySuggestions: ['unicorn', 'unicorns'],
		}),
		noSuggestions: withMenu({}, {
			...selection,
			selectionText: 'unicron',
			misspelledWord: 'unicron',
		}),
	};

	// The `window` option also accepts a bare `WebContents`.
	const bareWindow = createWindow();
	const disposeBare = contextMenu({window: bareWindow.webContents});
	results.bareWebContents = openMenu(bareWindow, selection);
	disposeBare();

	// `enabled` is not part of the label list, so it has to be read from the template.
	const editFlagsWindow = createWindow();
	const disposeEditFlags = contextMenu({window: editFlagsWindow});
	openMenu(editFlagsWindow, {...selection, editFlags: {canCut: false, canCopy: false, canPaste: false}});
	results.editFlags = Object.fromEntries(capturedTemplate
		.filter(menuItem => ['cut', 'copy', 'paste'].includes(menuItem.id))
		.map(menuItem => [menuItem.id, menuItem.enabled]));
	disposeEditFlags();

	// The listener must be gone after disposing.
	const disposedWindow = createWindow();
	contextMenu({window: disposedWindow})();
	results.disposed = openMenu(disposedWindow, selection);

	// It must also be gone once the web contents are destroyed.
	const destroyedWindow = createWindow();
	contextMenu({window: destroyedWindow});
	destroyedWindow.webContents.emit('destroyed');
	results.destroyed = openMenu(destroyedWindow, selection);

	// `onShow` and `onClose` are attached to the built menu, so they need the real events.
	const menuEvents = [];
	const eventsWindow = createWindow();
	const disposeEvents = contextMenu({
		window: eventsWindow,
		onShow: () => menuEvents.push('show'),
		onClose: () => menuEvents.push('close'),
	});
	openMenu(eventsWindow, selection);
	capturedMenu.emit('menu-will-show');
	capturedMenu.emit('menu-will-close');
	disposeEvents();
	results.menuEvents = menuEvents;

	// `transform` is applied on click, so it needs the built menu rather than the template.
	const clickFirstItem = async (menu, properties = selection) => {
		const window_ = createWindow();
		const dispose = contextMenu({window: window_, menu});
		openMenu(window_, properties);
		const [menuItem] = capturedMenu.items;
		await menuItem.click(menuItem);
		dispose();
		return menuItem;
	};

	const copyItem = await clickFirstItem(actions => [actions.copy({transform: content => `modified_${content}`})]);
	results.copyTransform = {
		// Electron must carry the custom property over to the built `MenuItem` for `transform` to work at all.
		isCarriedOver: typeof copyItem.transform === 'function',
		clipboardWrite: clipboardWrites.at(-1),
	};

	await clickFirstItem(actions => [actions.cut({transform: content => `cut_${content}`})]);
	results.cutTransform = clipboardWrites.at(-1);

	await clickFirstItem(actions => [actions.paste({transform: content => `pasted_${content}`})]);
	results.pasteTransform = insertedText.at(-1);

	// `copyLink` writes a bookmark to the real clipboard, so it exercises the actual Electron API rather than a stub.
	electron.clipboard.clear();
	await clickFirstItem(actions => [actions.copyLink()], {linkURL: 'https://example.com/unicorn', linkText: 'Unicorn'});
	await clipboardWrite;
	const [clipboardItem] = await electron.clipboard.read();
	const copiedText = await clipboardItem.getType('text/plain');
	results.copyLink = {
		text: await copiedText.text(),
		bookmark: await clipboardItem.getType('electron application/bookmark'),
	};

	// Written to a file rather than stdout, as Electron does not exit while its stdout is a pipe.
	fs.writeFileSync(process.argv[2], JSON.stringify(results));
	electron.app.exit(0);
})();
