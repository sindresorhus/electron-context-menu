'use strict';
const path = require('path');
const {app, BrowserWindow} = require('electron');

(async () => {
	await app.whenReady();

	await (new BrowserWindow({
		webPreferences: {
			nodeIntegration: true
		}
	})).loadFile(path.join(__dirname, 'fixture-toggle.html'));
})();
