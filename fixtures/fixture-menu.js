import path from 'node:path';
import {app, BrowserWindow} from 'electron';
import contextMenu from '../index.js';

contextMenu({
	menu: actions => [
		actions.separator(),
		actions.copyLink({
			transform: content => `modified_link_${content}`,
		}),
		actions.separator(),
		{
			label: 'Unicorn',
		},
		actions.separator(),
		actions.saveVideo(),
		actions.saveVideoAs(),
		actions.copyVideoAddress({
			transform: content => `modified_copy_${content}`,
		}),
		actions.separator(),
		actions.copy({
			transform: content => `modified_copy_${content}`,
		}),
		{
			label: 'Invisible',
			visible: false,
		},
		actions.paste({
			transform: content => `modified_paste_${content}`,
		}),
	],
});

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	await app.whenReady();

	await (new BrowserWindow({
		webPreferences: {
			spellcheck: true,
		},
	})).loadFile(path.join(import.meta.dirname, 'fixture.html'));
})();
