import {expectType} from 'tsd';
import {app} from 'electron';
import contextMenu = require('.');

expectType<() => void>(contextMenu());

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
		prepend: (defaultActions, parameters) => [{
			label: 'Rainbow',
			visible: parameters.mediaType === 'image'
		}],
		window: webContents
	});
});
