'use strict';
const path = require('path');
const {app, BrowserWindow} = require('electron');
const contextMenu = require('.');

contextMenu({
	labels: (event, props) => {
		return {
			cut: 'Configured Cut',
			copy: `Configured Copy ⎡ ${props.selectionText} ⎦ `,
			paste: 'Configured Paste',
			save: 'Configured Save Image',
			saveImageAs: 'Configured Save Image As…',
			copyLink: 'Configured Copy Link',
			inspect: 'Configured Inspect'
		};
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
	showInspectElement: false
});

(async () => {
	await app.whenReady();

	await (new BrowserWindow()).loadFile(path.join(__dirname, 'fixture.html'));
})();
