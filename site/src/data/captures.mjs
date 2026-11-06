// Loader of the capture fixtures used by TerminalReplay.
//
// A fixture is a JSON file, src/data/captures/<id>.json, written by `lab/bin/lab capture <id>` from a REAL run in
// the lab project (never by hand). JSON has no comments, so the schema lives here:
//
//   {
//     "id": "doctor",                          // = the file name, what <TerminalReplay capture="…"> asks for
//     "title": "…",                            // what was recorded, and in which state of the lab project
//     "recordedWith": { "pollora": "13.40.0", "date": "2026-11-06" },
//     "steps": [
//       {
//         "command": "pollora doctor",         // what the course displays and the learner types
//         "accept": ["php artisan pollora:doctor"],   // optional: other spellings that are accepted
//         "output": "…",                       // text as recorded, ANSI escapes kept, paths/dates/ids normalised
//         "exitCode": 0,
//         "hint": "…"                          // optional: shown by the Hint button
//       }
//     ]
//   }
//
// The course writes Pollora commands as `pollora <name>`; the Pollora CLI relays them to `php artisan pollora:<name>`.
// Other Laravel commands stay `php artisan …`. The scripted sessions are in lab/captures/<id>.json.
import { validateCapture } from '../scripts/terminal-replay.mjs';

const files = import.meta.glob('./captures/*.json', { eager: true, import: 'default' });

const captures = new Map();
for (const [path, capture] of Object.entries(files)) {
	const problems = validateCapture(capture, path);
	if (problems.length) throw new Error(`Invalid capture fixture:\n${problems.join('\n')}`);
	const fileId = path.replace(/^.*\/(.+)\.json$/, '$1');
	if (capture.id !== fileId) throw new Error(`${path}: "id" is "${capture.id}", the file name says "${fileId}"`);
	captures.set(capture.id, capture);
}

/**
 * @param {string} id
 * @param {number[]} [stepIndexes] keep only these steps, in this order (default: all)
 */
export function getCapture(id, stepIndexes) {
	const capture = captures.get(id);
	if (!capture) throw new Error(`TerminalReplay: no capture "${id}" (known: ${[...captures.keys()].join(', ') || 'none'})`);
	if (!stepIndexes) return capture;
	const steps = stepIndexes.map((index) => {
		const step = capture.steps[index];
		if (!step) throw new Error(`TerminalReplay: capture "${id}" has no step ${index} (${capture.steps.length} steps)`);
		return step;
	});
	return { ...capture, steps };
}
