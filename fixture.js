'use strict';
const electron = require('electron');

require('.')({
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
		type: 'separator'
	}, {
		type: 'separator'
	}],
	showCopyImageAddress: true
});

electron.app.on('ready', () => {
	(new electron.BrowserWindow())
		.loadURL(`file://${__dirname}/fixture.html`);
});
