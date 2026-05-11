import cliTruncate from 'cli-truncate';

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

export const replaceSelectionPlaceholders = (menuTemplate, selectionText) => {
	const selectionString = typeof selectionText === 'string' ? selectionText.trim() : '';
	const replacement = cliTruncate(selectionString, 25).replaceAll('&', '&&');

	for (const menuItem of menuTemplate) {
		if (typeof menuItem.label === 'string' && menuItem.label.includes('{selection}')) {
			menuItem.label = menuItem.label.replace('{selection}', replacement);
		}
	}

	return menuTemplate;
};
