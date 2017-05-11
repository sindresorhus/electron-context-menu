'use strict';
const electron = require('electron');

require('.')({
	labels: {
		cut: 'Configured Cut',
		copy: 'Configured Copy',
		paste: 'Configured Paste',
		save: 'Configured Save Image',
		copyLink: 'Configured Copy Link',
		copyImageLink: 'Configured Copy Image Link',
		inspect: 'Configured Inspect'
	},
	prepend: () => [{
		label: 'Unicorn'
	}, {
		type: 'separator'
	}, {
		type: 'separator'
	}, {
		label: 'Invisible',
		visible: false
	}, {
		label: 'Invisible',
		visible: false
	}, {
		type: 'separator'
	}, {
		type: 'separator'
	}],
	append: () => {}
});

electron.app.on('ready', () => {
	(new electron.BrowserWindow())
		.loadURL(`file://${__dirname}/fixture.html`);
});
