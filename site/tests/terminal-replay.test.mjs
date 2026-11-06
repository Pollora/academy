import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { normalize } from '../../lab/support/capture.mjs';
import { acceptedCommands, commandStart, matchesStep, normalizeCommand, parseAnsi, validateCapture } from '../src/scripts/terminal-replay.mjs';

const step = { command: 'pollora doctor', accept: ['php artisan pollora:doctor'] };

test('normalizeCommand trims and collapses blanks but keeps case', () => {
	assert.equal(normalizeCommand('  pollora   doctor \t'), 'pollora doctor');
	assert.equal(normalizeCommand('Pollora Doctor'), 'Pollora Doctor');
	assert.equal(normalizeCommand(undefined), '');
});

test('matchesStep accepts the command and every equivalent spelling', () => {
	assert.ok(matchesStep('pollora doctor', step));
	assert.ok(matchesStep('  pollora    doctor  ', step));
	assert.ok(matchesStep('php artisan pollora:doctor', step));
	assert.ok(matchesStep('php  artisan   pollora:doctor ', step));
});

test('matchesStep refuses other commands, other case and empty input', () => {
	assert.ok(!matchesStep('Pollora doctor', step));
	assert.ok(!matchesStep('pollora doctors', step));
	assert.ok(!matchesStep('pollora', step));
	assert.ok(!matchesStep('', step));
	assert.ok(!matchesStep('   ', step));
	assert.ok(!matchesStep('pollora doctor && ls', step));
});

test('acceptedCommands and commandStart', () => {
	assert.deepEqual(acceptedCommands(step), ['pollora doctor', 'php artisan pollora:doctor']);
	assert.deepEqual(acceptedCommands({ command: 'pollora status' }), ['pollora status']);
	assert.equal(commandStart(step), 'pollora');
});

test('parseAnsi keeps plain text and splits lines', () => {
	assert.deepEqual(parseAnsi('a\nb'), [[{ text: 'a', className: '' }], [{ text: 'b', className: '' }]]);
	assert.deepEqual(parseAnsi('a\r\n\r\nb'), [[{ text: 'a', className: '' }], [], [{ text: 'b', className: '' }]]);
});

test('parseAnsi maps Laravel colours, bold and resets', () => {
	const [line] = parseAnsi('\x1b[32m✓\x1b[39m \x1b[1mCore\x1b[22m done');
	assert.deepEqual(line, [
		{ text: '✓', className: 'tr-fg-2' },
		{ text: ' ', className: '' },
		{ text: 'Core', className: 'tr-bold' },
		{ text: ' done', className: '' },
	]);
});

test('parseAnsi handles combined codes, bright colours and backgrounds (Laravel ERROR badge)', () => {
	const [line] = parseAnsi('\x1b[37;41m ERROR \x1b[39;49m ok \x1b[90mdim\x1b[0m');
	assert.deepEqual(line, [
		{ text: ' ERROR ', className: 'tr-fg-7 tr-bg-1' },
		{ text: ' ok ', className: '' },
		{ text: 'dim', className: 'tr-fg-8' },
	]);
	assert.equal(parseAnsi('\x1b[m\x1b[1;4;3mx')[0][0].className, 'tr-bold tr-italic tr-underline');
});

test('parseAnsi carries the style over a line break', () => {
	const lines = parseAnsi('\x1b[33ma\nb\x1b[0m');
	assert.equal(lines[1][0].className, 'tr-fg-3');
});

test('parseAnsi swallows 256-colour and truecolor sequences without leaking digits', () => {
	const [line] = parseAnsi('\x1b[38;5;208mA\x1b[38;2;1;2;3mB\x1b[1mC');
	assert.deepEqual(line.map((s) => s.text), ['A', 'B', 'C']);
	assert.equal(line[0].className, '');
	assert.equal(line[2].className, 'tr-bold');
});

test('parseAnsi strips cursor, erase, OSC and charset sequences', () => {
	const [line] = parseAnsi('\x1b[2K\x1b[1A\x1b[?25lhello\x1b]8;;https://x\x07link\x1b]8;;\x07\x1b(B!');
	assert.equal(line.map((s) => s.text).join(''), 'hellolink!');
	assert.ok(!line.map((s) => s.text).join('').includes('\x1b'));
});

test('parseAnsi tolerates a truncated escape', () => {
	assert.equal(parseAnsi('ok\x1b[3').flat().map((s) => s.text).join(''), 'ok');
	assert.equal(parseAnsi('ok\x1b').flat().map((s) => s.text).join(''), 'ok');
});

test('validateCapture accepts a valid fixture and reports the problems of a broken one', () => {
	const valid = { id: 'x', title: 't', recordedWith: { pollora: '13.40.0', date: '2026-11-06' }, steps: [{ ...step, output: '', exitCode: 0 }] };
	assert.deepEqual(validateCapture(valid), []);
	assert.ok(validateCapture({ ...valid, steps: [] }).length > 0);
	assert.ok(validateCapture({ ...valid, steps: [{ command: 'x', output: 1, exitCode: 'a' }] }).length >= 2);
});

test('every committed fixture is valid and its steps accept their own command', () => {
	const dir = new URL('../src/data/captures/', import.meta.url);
	const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
	assert.ok(files.length >= 3, 'at least three captures');
	for (const name of files) {
		const capture = JSON.parse(readFileSync(new URL(name, dir), 'utf8'));
		assert.deepEqual(validateCapture(capture, name), []);
		assert.equal(`${capture.id}.json`, name);
		for (const s of capture.steps) {
			assert.ok(matchesStep(s.command, s));
			assert.ok(!/\/home\/|\/Users\/|\/var\/www/.test(s.output), `${name}: absolute path left in the output`);
		}
	}
});

test('capture normalisation hides what changes from one recording to the next', () => {
	const output = normalize('Path /var/www/html/app  \nat 2026-11-06 10:11:12 in 123ms\nid 123e4567-e89b-12d3-a456-426614174000\n\x1b[32mok\x1b[39m \nPollora v13.40.0 (latest: v13.40.1)\n\x1b[33mPollora v13.40.0 ↑\x1b[39m\n\n');
	assert.equal(output, 'Path ~/project/app\nat 2026-01-01 00:00:00 in 0 ms\nid 00000000-0000-0000-0000-000000000000\n\x1b[32mok\x1b[39m\nPollora v13.40.0\n\x1b[33mPollora v13.40.0\x1b[39m');
	assert.equal(normalize('/home/jane/code/academy-lab/app'), '~/project/app');
});
