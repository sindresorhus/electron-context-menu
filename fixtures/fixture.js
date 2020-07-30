'use strict';
const path = require('path');
const {app, BrowserWindow} = require('electron');
const contextMenu = require('..');

contextMenu({
	labels: {
		cut: 'Configured Cut',
		copy: 'Configured Copy',
		paste: 'Configured Paste',
		save: 'Configured Save Image',
		saveImageAs: 'Configured Save Image As…',
		copyLink: 'Configured Copy Link',
		inspect: 'Configured Inspect',
		saveLinkAs: 'Configured Save Link As…'
	},
	prepend: () => [
		{
			label: 'Unicorn'
		},
		{
			type: 'separator'
		},
		{
			type: 'separator'
		},
		{
			label: 'Invisible',
			visible: false
		},
		{
			type: 'separator'
		},
		{
			type: 'separator'
		}
	],
	append: () => {},
	showCopyImageAddress: true,
	showSaveImageAs: true,
	showInspectElement: false,
	showSaveLinkAs: true
});

(async () => {
	await app.whenReady();

	await (new BrowserWindow({
		webPreferences: {
			spellcheck: true
		}
	})).loadFile(path.join(__dirname, 'fixture.html'));
})();
