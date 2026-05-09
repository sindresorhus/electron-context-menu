import cliTruncate from 'cli-truncate';

export const decorateMenuItem = menuItem => (options = {}) => {
	if (options.transform && !options.click) {
		menuItem.transform = options.transform;
	}

	return menuItem;
};

export const removeUnusedMenuItems = menuTemplate => {
	let notDeletedPreviousElement;

	return menuTemplate
		.filter(menuItem => menuItem !== undefined && menuItem !== false && menuItem.visible !== false && menuItem.visible !== '')
		.filter((menuItem, index, array) => {
			const toDelete = menuItem.type === 'separator' && (!notDeletedPreviousElement || index === array.length - 1 || array[index + 1].type === 'separator');
			notDeletedPreviousElement = toDelete ? notDeletedPreviousElement : menuItem;
			return !toDelete;
		});
};

export const applyMenuItemLabels = (menuTemplate, {labels, selectionText} = {}) => {
	for (const menuItem of menuTemplate) {
		if (labels?.[menuItem.id]) {
			menuItem.label = labels[menuItem.id];
		}

		if (typeof menuItem.label === 'string' && menuItem.label.includes('{selection}')) {
			const selectionString = typeof selectionText === 'string' ? selectionText.trim() : '';
			menuItem.label = menuItem.label.replace('{selection}', cliTruncate(selectionString, 25).replaceAll('&', '&&'));
		}
	}
};
