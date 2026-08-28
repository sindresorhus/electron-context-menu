import path from 'node:path';
import {app, BrowserWindow, ipcMain} from 'electron';
import contextMenu from '../index.js';

let dispose;

ipcMain.on('toggle', (event, isEnabled) => {
	if (isEnabled) {
		dispose = contextMenu({
			labels: {
				cut: 'Configured Cut',
				copy: 'Configured Copy',
				paste: 'Configured Paste',
				saveImage: 'Configured Save Image',
				saveImageAs: 'Configured Save Image As…',
				copyLink: 'Configured Copy Link',
				inspect: 'Configured Inspect',
			},
			prepend: () => [
				{
					label: 'Unicorn',
				},
				{
					label: 'Invisible',
					visible: false,
				},
			],
			showCopyImageAddress: true,
			showSaveImageAs: true,
			showInspectElement: false,
		});
	} else {
		dispose();
	}
});

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	await (new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	})).loadFile(path.join(import.meta.dirname, 'fixture-toggle.html'));
})();
