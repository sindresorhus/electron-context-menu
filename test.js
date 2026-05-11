import test from 'ava';
import {removeUnusedMenuItems, replaceSelectionPlaceholders} from './utilities.js';

test('removeUnusedMenuItems removes falsy, hidden and redundant separators', t => {
	const result = removeUnusedMenuItems([
		{type: 'separator'},
		undefined,
		false,
		{id: 'hidden', visible: false},
		{id: 'emptyVisible', visible: ''},
		{id: 'copy', label: 'Copy'},
		{type: 'separator'},
		{type: 'separator'},
		{id: 'paste', label: 'Paste'},
		{type: 'separator'},
	]);

	t.deepEqual(result, [
		{id: 'copy', label: 'Copy'},
		{type: 'separator'},
		{id: 'paste', label: 'Paste'},
	]);
});

test('replaceSelectionPlaceholders trims, truncates and escapes ampersands', t => {
	const result = replaceSelectionPlaceholders([
		{id: 'searchWithGoogle', label: 'Look Up “{selection}”'},
		{id: 'copy', label: 'Copy'},
	], '  Sindre & Electron context menus need tests  ');

	t.is(result[0].label, 'Look Up “Sindre && Electron contex…”');
	t.is(result[1].label, 'Copy');
});

test('replaceSelectionPlaceholders treats missing selection text as empty string', t => {
	const result = replaceSelectionPlaceholders([
		{id: 'searchWithGoogle', label: 'Look Up “{selection}”'},
	], undefined);

	t.is(result[0].label, 'Look Up “”');
});
