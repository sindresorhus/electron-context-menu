'use strict';
const {
	app,
	BrowserWindow
} = require('electron');
const contextMenu = require('.');

contextMenu({
	labels: {
		cut: 'Configured Cut',
		copy: 'Configured Copy',
		paste: 'Configured Paste',
		save: 'Configured Save Image',
		saveImageAs: 'Configured Save Image As…',
		copyLink: 'Configured Copy Link',
		copyImageAddress: 'Configured Copy Image Address',
		inspect: 'Configured Inspect'
	},
	prepend: actions => [actions.cut({transform: content => 'modified_cut_' + content})],
	menu: actions => [
		actions.separator(),
		actions.copyLink({transform: content => 'modified_link_' + content}),
		actions.separator(),
		{
			label: 'Unicorn'
		},
		actions.separator(),
		actions.copy({transform: content => 'modified_copy_' + content}),
		{
			label: 'Invisible',
			visible: false
		},
		actions.paste({transform: content => 'modified_paste_' + content})
	],
	append: actions => [actions.saveImage(), actions.saveImageAs(), actions.copyImageAddress()],
	showCopyImageAddress: true,
	showSaveImageAs: true
});

(async () => {
	await app.whenReady();

	new BrowserWindow().loadURL(`file://${__dirname}/fixture.html`);
})();
