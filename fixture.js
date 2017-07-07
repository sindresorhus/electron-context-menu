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
	prepend: (x) => [x.CUT({transform: (content) => "modified_cut_" + content})],
	menu: (x) => [
		x.SEPARATOR(),
		x.COPY_LINK({transform: (content) => "modified_link_" + content}),
		x.SEPARATOR(),
		{
			label: 'Unicorn'
		},
		x.SEPARATOR(),
		x.COPY({transform: (content) => "modified_copy_" + content}),
		{
			label: 'Invisible',
			visible: false
		},
		x.PASTE({transform: (content) => "modified_paste_" + content})
	],
	append: (x) => [x.SAVE_IMAGE()]
});

electron.app.on('ready', () => {
	(new electron.BrowserWindow())
		.loadURL(`file://${__dirname}/fixture.html`);
});
