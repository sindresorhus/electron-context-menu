'use strict';
const path = require('path');
const {
	app,
	BrowserWindow
} = require('electron');
const contextMenu = require('.');

contextMenu({
	menu: actions => [
		actions.separator(),
		actions.copyLink({
			transform: content => `modified_link_${content}`
		}),
		actions.separator(),
		{
			label: 'Unicorn'
		},
		actions.separator(),
		actions.copy({
			transform: content => `modified_copy_${content}`
		}),
		{
			label: 'Invisible',
			visible: false
		},
		actions.paste({
			transform: content => `modified_paste_${content}`
		})
	]
});

(async () => {
	await app.whenReady();

	await (new BrowserWindow()).loadFile(path.join(__dirname, 'fixture.html'));
})();
