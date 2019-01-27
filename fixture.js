'use strict';
const {app, BrowserWindow} = require('electron');
const contextMenu = require('.');

contextMenu({
	labels: {
		cut: 'Configured Cut',
		copy: 'Configured Copy',
		paste: 'Configured Paste',
		save: 'Configured Save Image',
		saveImageAs: 'Configured Save Image As…',
		copyLink: 'Configured Copy Link',
		inspect: 'Configured Inspect'
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
	showSaveImageAs: true
});

(async () => {
	await app.whenReady();

	new BrowserWindow().loadURL(`file://${__dirname}/fixture.html`);
})();
