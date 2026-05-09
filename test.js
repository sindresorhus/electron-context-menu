import test from 'ava';
import {applyMenuItemLabels, decorateMenuItem, removeUnusedMenuItems} from './utilities.js';

test('decorateMenuItem adds transform functions to default actions', t => {
	const menuItem = {id: 'copy', label: 'Copy'};
	const transform = value => value.toUpperCase();

	t.is(decorateMenuItem(menuItem)({transform}), menuItem);
	t.is(menuItem.transform, transform);
});

test('decorateMenuItem does not add transforms to custom click handlers', t => {
	const menuItem = {id: 'copy', label: 'Copy'};
	const transform = value => value.toUpperCase();

	decorateMenuItem(menuItem)({transform, click() {}});

	t.false('transform' in menuItem);
});

test('removeUnusedMenuItems filters hidden and disabled entries', t => {
	const menuItem = {id: 'copy', label: 'Copy'};

	t.deepEqual(
		removeUnusedMenuItems([
			undefined,
			false,
			{id: 'hidden', visible: false},
			{id: 'empty-visible', visible: ''},
			menuItem,
		]),
		[menuItem],
	);
});

test('removeUnusedMenuItems removes leading, trailing, and consecutive separators', t => {
	t.deepEqual(
		removeUnusedMenuItems([
			{type: 'separator'},
			{id: 'copy', label: 'Copy'},
			{type: 'separator'},
			{type: 'separator'},
			{id: 'paste', label: 'Paste'},
			{type: 'separator'},
		]),
		[
			{id: 'copy', label: 'Copy'},
			{type: 'separator'},
			{id: 'paste', label: 'Paste'},
		],
	);
});

test('applyMenuItemLabels applies custom labels and selection placeholders', t => {
	const menuTemplate = [
		{id: 'copy', label: 'Copy'},
		{id: 'lookUpSelection', label: 'Look Up “{selection}”'},
	];

	applyMenuItemLabels(menuTemplate, {
		labels: {
			copy: 'Duplicate',
		},
		selectionText: '  Alpha & Beta selected text for context menu  ',
	});

	t.deepEqual(menuTemplate, [
		{id: 'copy', label: 'Duplicate'},
		{id: 'lookUpSelection', label: 'Look Up “Alpha && Beta selected te…”'},
	]);
});
