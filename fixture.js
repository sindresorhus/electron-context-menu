'use strict';
const electron = require('electron');

require('.')({
	prepend: () => [{
		label: 'Unicorn'
	}]
});

electron.app.on('ready', () => {
	(new electron.BrowserWindow())
		.loadURL(`file://${__dirname}/fixture.html`);
});
