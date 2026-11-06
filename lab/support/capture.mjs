#!/usr/bin/env node
// Helper of `lab capture` (called by lab/bin/lab, not meant to be run by hand).
//
//   capture.mjs build <definition.json> <raw-dir> <output.json> <pollora-version>
//       turns the raw output of a scripted session into a fixture (schema: documented in site/src/data/captures.mjs)
//   capture.mjs diff <committed.json> <fresh.json>
//       exit 1 and print what changed when the steps differ (date and Pollora version are not compared)
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Makes the output stable from one recording to the next: what is volatile or personal is replaced by a
 * fixed value. ANSI colours are kept.
 */
export function normalize(text) {
	return (
		text
			.replace(/\r\n?/g, '\n')
			// Project paths: the container's, then anything that looks like a home directory
			.replace(/\/var\/www\/html/g, '~/project')
			.replace(/\/home\/[^/\s]+\/\S*?academy-lab/g, '~/project')
			.replace(/\/(?:home|Users)\/[^/\s]+/g, '~')
			// "latest: vX" and the arrow that announces it change with every release and says nothing about the command
			.replace(/ \(latest: v?[\d.]+[^)]*\)/g, '')
			.replace(/(Pollora v[\d.]+(?:\x1b\[\d+m)?) ↑/g, '$1')
			// Timestamps, then durations and memory figures
			.replace(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g, '2026-01-01 00:00:00')
			.replace(/\b\d+(?:\.\d+)?\s?(?:ms|µs)\b/g, '0 ms')
			.replace(/\b\d+(?:\.\d+)?\s?(?:KB|MB|GB)\b/g, '0 MB')
			// Random identifiers: UUIDs, long hexadecimal hashes
			.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, '00000000-0000-0000-0000-000000000000')
			.replace(/\b[0-9a-f]{32,64}\b/g, '0'.repeat(32))
			// Trailing whitespace (an escape sequence may follow it: keep those)
			.split('\n')
			.map((line) => line.replace(/[ \t]+((?:\x1b\[[0-9;]*m)*)$/, '$1'))
			.join('\n')
			.replace(/\n+$/, '')
	);
}

const sameSteps = (a, b) => JSON.stringify(a.steps) === JSON.stringify(b.steps) && a.title === b.title && a.id === b.id;

function build([definitionPath, rawDir, outputPath, version]) {
	const definition = JSON.parse(readFileSync(definitionPath, 'utf8'));
	const steps = definition.steps.map((step, index) => {
		const output = normalize(readFileSync(`${rawDir}/${index}.out`, 'utf8'));
		const exitCode = Number(readFileSync(`${rawDir}/${index}.code`, 'utf8').trim());
		return {
			command: step.command,
			...(step.accept?.length ? { accept: step.accept } : {}),
			output,
			exitCode,
			...(step.hint ? { hint: step.hint } : {}),
		};
	});
	const fixture = {
		id: definition.id,
		title: definition.title,
		recordedWith: { pollora: version, date: new Date().toISOString().slice(0, 10) },
		steps,
	};
	writeFileSync(outputPath, `${JSON.stringify(fixture, null, '\t')}\n`);
}

function diff([committedPath, freshPath]) {
	const committed = JSON.parse(readFileSync(committedPath, 'utf8'));
	const fresh = JSON.parse(readFileSync(freshPath, 'utf8'));
	if (sameSteps(committed, fresh)) return;
	console.error(`capture ${committed.id}: the recorded output differs from the committed fixture`);
	committed.steps.forEach((step, index) => {
		const other = fresh.steps[index];
		if (JSON.stringify(step) === JSON.stringify(other)) return;
		console.error(`  step ${index} (${step.command}):`);
		const a = step.output.split('\n');
		const b = (other?.output ?? '').split('\n');
		for (let line = 0; line < Math.max(a.length, b.length); line++) {
			if (a[line] !== b[line]) console.error(`    line ${line + 1}\n      committed: ${JSON.stringify(a[line])}\n      recorded:  ${JSON.stringify(b[line])}`);
		}
		if (step.exitCode !== other?.exitCode) console.error(`    exit code: committed ${step.exitCode}, recorded ${other?.exitCode}`);
	});
	if (fresh.steps.length !== committed.steps.length) console.error(`  ${committed.steps.length} steps committed, ${fresh.steps.length} recorded`);
	process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const [command, ...args] = process.argv.slice(2);
	if (command === 'build') build(args);
	else if (command === 'diff') diff(args);
	else {
		console.error('usage: capture.mjs build|diff …');
		process.exit(2);
	}
}
