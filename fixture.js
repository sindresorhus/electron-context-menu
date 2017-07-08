'use strict';
const electron = require('electron');

require('.')({
	labels: {
		cut: 'Configured Cut',
		copy: 'Configured Copy',
		paste: 'Configured Paste',
		save: 'Configured Save Image',
		copyLink: 'Configured Copy Link',
		inspect: 'Configured Inspect'
	},
	prepend: (actions) => [actions.cut({transform: (content) => "modified_cut_" + content})],
	menu: (actions) => [
		actions.separator(),
		actions.copyLink({transform: (content) => "modified_link_" + content}),
		actions.separator(),
		{
			label: 'Unicorn'
		},
		actions.separator(),
		actions.copy({transform: (content) => "modified_copy_" + content}),
		{
			label: 'Invisible',
			visible: false
		},
		actions.paste({transform: (content) => "modified_paste_" + content})
	],
	append: (actions) => [actions.saveImage()]
});

electron.app.on('ready', () => {
	(new electron.BrowserWindow())
		.loadURL(`file://${__dirname}/fixture.html`);
});
