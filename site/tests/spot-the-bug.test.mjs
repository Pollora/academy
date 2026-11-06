import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	bugIndexByLine, checkFix, clearSolved, evaluate, format, getStrings, missing, normalizeBugs, parseLines,
	progress, readSolved, selectableLines, storageKey, validateBugs, writeSolved,
} from '../src/scripts/spot-the-bug.mjs';

const diff = ['--- a/x.php', '+++ b/x.php', '@@ -1,3 +1,4 @@', ' keep', '-old', '+new', '+bad', ' tail', ''].join('\n');

test('parseLines numbers lines and drops trailing newlines', () => {
	const lines = parseLines('a\r\nb\n\n');
	assert.deepEqual(lines.map((l) => [l.n, l.text, l.kind]), [[1, 'a', 'plain'], [2, 'b', 'plain']]);
});

test('parseLines classifies the lines of a diff', () => {
	assert.deepEqual(parseLines(diff, 'diff').map((l) => l.kind), ['meta', 'meta', 'hunk', 'ctx', 'del', 'add', 'add', 'ctx']);
});

test('selectableLines: everything in a snippet; only + lines (and targeted context) in a diff', () => {
	assert.equal(selectableLines(parseLines('a\nb'), [{ line: 1 }]).size, 2);
	const lines = parseLines(diff, 'diff');
	assert.deepEqual([...selectableLines(lines, [{ line: 6 }], 'diff')], [6, 7]);
	assert.deepEqual([...selectableLines(lines, [{ line: 6 }, { line: 4 }], 'diff')].sort(), [4, 6, 7]);
});

test('validateBugs reports lines outside the snippet or not clickable', () => {
	const lines = parseLines(diff, 'diff');
	assert.deepEqual(validateBugs(lines, [{ line: 6 }], 'diff'), []);
	assert.equal(validateBugs(lines, [{ line: 5 }, { line: 99 }], 'diff').length, 2);
	assert.equal(validateBugs(lines, [], 'diff').length, 1);
});

test('normalizeBugs accepts line, lines and a list of equivalent lines', () => {
	assert.deepEqual(normalizeBugs([{ line: 2, why: 'x' }, { line: [3, 4] }, { lines: [5] }]).map((b) => b.lines), [[2], [3, 4], [5]]);
});

test('evaluate finds bugs, flags wrong lines and accumulates across checks', () => {
	const bugs = [{ line: 1 }, { line: [3, 4] }, { line: 6 }];
	let r = evaluate([1, 2], bugs);
	assert.deepEqual([r.found, r.newlyFound, r.wrong, r.solved], [[0], [0], [2], false]);
	r = evaluate([4, 6], bugs, r.found);
	assert.deepEqual([r.found, r.newlyFound, r.wrong, r.solved], [[0, 1, 2], [1, 2], [], true]);
});

test('evaluate with an empty selection finds nothing', () => {
	const r = evaluate([], [{ line: 1 }]);
	assert.deepEqual([r.found, r.wrong, r.solved], [[], [], false]);
});

test('missing and bugIndexByLine', () => {
	const bugs = [{ line: 1 }, { line: [3, 4] }];
	assert.deepEqual(missing(bugs, [1]), [0]);
	assert.equal(bugIndexByLine(bugs).get(4), 1);
});

test('progress and checkFix', () => {
	assert.deepEqual(progress(2, 3), { found: 2, total: 3, complete: false });
	assert.equal(progress(3, 3).complete, true);
	assert.equal(checkFix({ answer: 0 }, 0), true);
	assert.equal(checkFix({ answer: 0 }, 1), false);
	assert.equal(checkFix({ answer: 0 }, undefined), false);
});

test('strings: locale choice and placeholders', () => {
	assert.equal(format(getStrings('en').progress, { found: 1, total: 3 }), '1 of 3 found');
	assert.equal(format(getStrings('fr').progress, { found: 1, total: 3 }), '1 sur 3 trouvé(s)');
	assert.equal(getStrings(undefined).check, 'Vérifier');
	assert.deepEqual(Object.keys(getStrings('fr')).sort(), Object.keys(getStrings('en')).sort());
});

test('storageKey is stable, accent-free and prefers the id', () => {
	assert.equal(storageKey(undefined, 'Qui échappe quoi ?'), 'pollora-academy:spot-the-bug:qui-echappe-quoi');
	assert.equal(storageKey('xss-1', 'Whatever'), 'pollora-academy:spot-the-bug:xss-1');
	assert.equal(storageKey('', ''), 'pollora-academy:spot-the-bug:snippet');
});

test('storage helpers work, and survive a missing or throwing storage', () => {
	const data = new Map();
	const ok = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) };
	assert.equal(readSolved(ok, 'k'), false);
	assert.equal(writeSolved(ok, 'k'), true);
	assert.equal(readSolved(ok, 'k'), true);
	assert.equal(clearSolved(ok, 'k'), true);
	assert.equal(readSolved(ok, 'k'), false);
	const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('denied'); } };
	assert.equal(readSolved(broken, 'k'), false);
	assert.equal(writeSolved(broken, 'k'), false);
	assert.equal(clearSolved(broken, 'k'), false);
	assert.equal(readSolved(undefined, 'k'), false);
});
