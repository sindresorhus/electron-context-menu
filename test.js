import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import electronPath from 'electron';
import test from 'ava';

// The fixture builds real menu templates in an Electron main process and writes them out as JSON.
const runFixture = async () => {
	const outputPath = path.join(os.tmpdir(), `electron-context-menu-${randomUUID()}.json`);

	try {
		await new Promise((resolve, reject) => {
			const child = spawn(electronPath, [path.join(import.meta.dirname, 'fixtures/build-menus.js'), outputPath], {stdio: 'ignore'});
			child.once('error', reject);
			child.once('exit', code => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`The fixture exited with code ${code}.`));
				}
			});
		});

		return JSON.parse(await fs.readFile(outputPath, 'utf8'));
	} finally {
		await fs.rm(outputPath, {force: true});
	}
};

let menus;

test.before(async () => {
	menus = await runFixture();
});

test('shows the editing items when right-clicking text', t => {
	t.deepEqual(menus.text.filter(label => ['Cu&t', '&Copy', '&Paste'].includes(label)), ['Cu&t', '&Copy', '&Paste']);
	t.true(menus.text.includes('&Search with Google'));
	t.false(menus.text.includes('Cop&y Image'));
	t.false(menus.text.includes('Save I&mage'));
});

test('shows the image items when right-clicking an image', t => {
	t.true(menus.image.includes('Save I&mage'));
	t.true(menus.image.includes('Sa&ve Image As…'));
	t.true(menus.image.includes('Cop&y Image'));
	t.true(menus.image.includes('C&opy Image Address'));
	t.false(menus.image.includes('Save Vide&o'));
});

test('shows the video items when right-clicking a video', t => {
	t.true(menus.video.includes('Save Vide&o'));
	t.true(menus.video.includes('Sa&ve Video As…'));
	t.true(menus.video.includes('Copy Video Ad&dress'));
	t.true(menus.video.includes('Copy Video Fra&me'));
	t.true(menus.video.includes('Save Video &Frame As…'));
	t.false(menus.video.includes('Cop&y Image'));
});

test('shows the link items when right-clicking a link', t => {
	t.true(menus.link.includes('Copy Lin&k'));
	t.true(menus.link.includes('Save Link As…'));
});

test('applies custom labels', t => {
	t.true(menus.labels.includes('Kopier'));
	t.false(menus.labels.includes('&Copy'));
});

test('replaces the {selection} placeholder in custom labels', t => {
	t.true(menus.labels.includes('Slå opp “unicorn”'));
});

test('honors the options that force an item to show', t => {
	t.true(menus.forced.includes('I&nspect Element'));
	t.true(menus.forced.includes('Select &All'));
});

test('shows the paste and match style item only when enabled', t => {
	t.true(menus.pasteAndMatchStyle.includes('Paste and &Match Style'));
	t.false(menus.text.includes('Paste and &Match Style'));
});

test('runs `pasteAndMatchStyle` on click', t => {
	t.is(menus.pasteAndMatchStyleClick, 'pasteAndMatchStyle');
});

test('honors the options that hide an item', t => {
	t.false(menus.disabledText.includes('&Learn Spelling'));
	t.false(menus.disabledText.includes('&Search with Google'));
	t.false(menus.disabledText.some(label => label.startsWith('Look Up')));
	t.false(menus.disabledLink.includes('Copy Lin&k'));
});

test('puts `prepend` items first and `append` items last', t => {
	t.is(menus.prependAndAppend.at(0), 'Prepended');
	t.is(menus.prependAndAppend.at(-1), 'Appended');
});

test('replaces the {selection} placeholder with trimmed and truncated text', t => {
	// The text is trimmed, truncated to 25 columns, and `&` is escaped to `&&` so it is not read as a mnemonic.
	t.true(menus.placeholder.includes('Search for “Rainbows && unicorns are …”'));
	t.true(menus.placeholder.includes('Look Up “Rainbows && unicorns are …”'));
});

test('strips leading, trailing, and repeated separators', t => {
	t.not(menus.emptyPrepend.at(0), '[separator]');
	t.not(menus.emptyPrepend.at(-1), '[separator]');

	// The next item after a separator is never another separator.
	const separatorIndexes = menus.emptyPrepend.flatMap((label, index) => label === '[separator]' ? index : []);
	for (const index of separatorIndexes) {
		t.not(menus.emptyPrepend[index + 1], '[separator]');
	}

	t.false(menus.emptyPrepend.includes('Invisible'));
});

test('falls back to the default menu when `menu` does not return an array', t => {
	t.deepEqual(menus.nonArrayMenu, menus.text);
});

test('ignores `prepend` and `append` that do not return an array', t => {
	t.deepEqual(menus.nonArrayPrependAndAppend, menus.text);
});

test('uses only the items returned by `menu`', t => {
	t.deepEqual(menus.customMenu, ['&Copy', '[separator]', 'Unicorn']);
});

test('does not build a menu when `shouldShowMenu` returns false', t => {
	t.is(menus.hiddenMenu, null);
});

test('shows dictionary suggestions for a misspelled word', t => {
	t.true(menus.spelling.includes('unicorn'));
	t.true(menus.spelling.includes('unicorns'));
	t.true(menus.spelling.includes('&Learn Spelling'));
	t.false(menus.spelling.includes('No Guesses Found'));
});

test('shows a placeholder when there are no dictionary suggestions', t => {
	t.true(menus.noSuggestions.includes('No Guesses Found'));
});

test('accepts a bare `WebContents` as the `window` option', t => {
	t.deepEqual(menus.bareWebContents, menus.text);
});

test('disables the editing items that `editFlags` disallows', t => {
	t.deepEqual(menus.editFlags, {cut: false, copy: false, paste: false});
});

test('stops handling context menus after disposing', t => {
	t.is(menus.disposed, null);
});

test('stops handling context menus once the web contents are destroyed', t => {
	t.is(menus.destroyed, null);
});

test('calls `onShow` and `onClose`', t => {
	t.deepEqual(menus.menuEvents, ['show', 'close']);
});

test('applies `transform` to the content of an action', t => {
	t.true(menus.copyTransform.isCarriedOver);
	t.is(menus.copyTransform.clipboardWrite, 'modified_unicorn');
	t.is(menus.cutTransform, 'cut_unicorn');
	t.is(menus.pasteTransform, 'pasted_unicorn');
});

test('writes both the URL and the bookmark when copying a link', t => {
	t.is(menus.copyLink.text, 'https://example.com/unicorn');
	t.deepEqual(menus.copyLink.bookmark, {title: 'Unicorn', url: 'https://example.com/unicorn'});
});
