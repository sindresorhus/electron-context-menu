import {expectType} from 'tsd';
import {app, BrowserWindow, shell} from 'electron';
import contextMenu = require('.');

expectType<void>(contextMenu());

contextMenu({
	append: () => [
		{
			label: 'Unicorn',
			enabled: false
		}
	]
});

app.on('web-contents-created', (event, webContents) => {
	contextMenu({
		prepend: (defaultActions, params) => [{
			label: 'Rainbow',
			visible: params.mediaType === 'image'
		}],
		window: webContents
	});
})
