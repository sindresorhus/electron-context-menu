import {expectType} from 'tsd';
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
