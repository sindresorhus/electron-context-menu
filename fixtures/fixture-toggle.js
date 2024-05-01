import path from 'node:path';
import {app, BrowserWindow} from 'electron';

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	await (new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
		},
	})).loadFile(path.join(import.meta.dirname, 'fixture-toggle.html'));
})();
