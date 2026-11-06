// Pure logic of the TerminalReplay component: no DOM, no Astro, so that `node --test` can run it.

/**
 * Collapses what a learner may type differently without meaning it: leading/trailing blanks and runs of
 * spaces. Case is kept: `Pollora Doctor` is not a command.
 */
export function normalizeCommand(input) {
	return String(input ?? '')
		.trim()
		.replace(/\s+/g, ' ');
}

/** Every spelling a step accepts, normalised: the displayed command first, then the equivalents. */
export function acceptedCommands(step) {
	return [step.command, ...(step.accept ?? [])].map(normalizeCommand);
}

export function matchesStep(input, step) {
	const typed = normalizeCommand(input);
	return typed !== '' && acceptedCommands(step).includes(typed);
}

/** First word of the expected command, for the hint of a step that has none ("pollora", "php"). */
export function commandStart(step) {
	return normalizeCommand(step.command).split(' ')[0] ?? '';
}

/**
 * Checks a capture fixture (schema in site/src/data/captures.mjs). Returns the list of problems, empty when valid.
 */
export function validateCapture(capture, label = 'capture') {
	const problems = [];
	const fail = (message) => problems.push(`${label}: ${message}`);
	if (typeof capture !== 'object' || capture === null) return [`${label}: not an object`];
	for (const key of ['id', 'title']) {
		if (typeof capture[key] !== 'string' || capture[key] === '') fail(`"${key}" must be a non-empty string`);
	}
	if (typeof capture.recordedWith?.pollora !== 'string' || typeof capture.recordedWith?.date !== 'string') {
		fail('"recordedWith" needs "pollora" and "date" strings');
	}
	if (!Array.isArray(capture.steps) || capture.steps.length === 0) {
		fail('"steps" must be a non-empty array');
		return problems;
	}
	capture.steps.forEach((step, index) => {
		const at = `step ${index}`;
		if (typeof step.command !== 'string' || normalizeCommand(step.command) === '') fail(`${at}: "command" must be a non-empty string`);
		if (step.accept !== undefined && (!Array.isArray(step.accept) || step.accept.some((a) => typeof a !== 'string'))) fail(`${at}: "accept" must be an array of strings`);
		if (typeof step.output !== 'string') fail(`${at}: "output" must be a string`);
		if (!Number.isInteger(step.exitCode)) fail(`${at}: "exitCode" must be an integer`);
		if (step.hint !== undefined && typeof step.hint !== 'string') fail(`${at}: "hint" must be a string`);
	});
	return problems;
}

// ─── ANSI ────────────────────────────────────────────────────────────────────

// Control Sequence Introducer (CSI): ESC [ parameters intermediates final byte
const CSI = /\x1b\[([0-?]*)([ -/]*)([@-~])/y;
// Operating System Command: ESC ] … BEL or ESC \
const OSC = /\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/y;
// Charset selection and other two-byte escapes
// A sequence cut short (no final byte): its remains are dropped too
const TRUNCATED = /\x1b\[[0-?]*[ -/]*/y;
const ESCAPE = /\x1b[()#][0-9A-Za-z]|\x1b[=>78MNOcDEHZ]/y;

const initialStyle = () => ({ fg: null, bg: null, bold: false, dim: false, italic: false, underline: false });

function styleClass(style) {
	const classes = [];
	if (style.fg !== null) classes.push(`tr-fg-${style.fg}`);
	if (style.bg !== null) classes.push(`tr-bg-${style.bg}`);
	if (style.bold) classes.push('tr-bold');
	if (style.dim) classes.push('tr-dim');
	if (style.italic) classes.push('tr-italic');
	if (style.underline) classes.push('tr-underline');
	return classes.join(' ');
}

function applySgr(style, parameters) {
	const codes = parameters === '' ? [0] : parameters.split(/[;:]/).map((code) => (code === '' ? 0 : Number(code)));
	for (let i = 0; i < codes.length; i++) {
		const code = codes[i];
		if (code === 0) Object.assign(style, initialStyle());
		else if (code === 1) style.bold = true;
		else if (code === 2) style.dim = true;
		else if (code === 3) style.italic = true;
		else if (code === 4) style.underline = true;
		else if (code === 22) (style.bold = false), (style.dim = false);
		else if (code === 23) style.italic = false;
		else if (code === 24) style.underline = false;
		else if (code >= 30 && code <= 37) style.fg = code - 30;
		else if (code >= 90 && code <= 97) style.fg = code - 90 + 8;
		else if (code === 39) style.fg = null;
		else if (code >= 40 && code <= 47) style.bg = code - 40;
		else if (code >= 100 && code <= 107) style.bg = code - 100 + 8;
		else if (code === 49) style.bg = null;
		else if (code === 38 || code === 48) {
			// 256-colour (38;5;n) and truecolor (38;2;r;g;b): consumed, not rendered
			i += codes[i + 1] === 5 ? 2 : codes[i + 1] === 2 ? 4 : 0;
		}
		// Any other code (blink, reverse, strike...) is ignored
	}
}

/**
 * ANSI text → lines of styled segments: `[[{ text, className }]]`. Handles the SGR sequences Laravel and
 * Symfony Console emit (reset, bold, dim, italic, underline, 8 + 8 foreground and background colours); every
 * other escape sequence is removed. `className` uses `tr-fg-N` / `tr-bg-N` (0-15), `tr-bold`, `tr-dim`...
 * and is empty for plain text. The style carries over from one line to the next, like in a terminal.
 */
export function parseAnsi(text) {
	const style = initialStyle();
	const lines = [[]];
	let plain = '';
	const flush = () => {
		if (plain === '') return;
		lines[lines.length - 1].push({ text: plain, className: styleClass(style) });
		plain = '';
	};
	const source = String(text).replace(/\r\n?/g, '\n');

	for (let i = 0; i < source.length; ) {
		const char = source[i];
		if (char === '\x1b') {
			CSI.lastIndex = i;
			const csi = CSI.exec(source);
			if (csi) {
				if (csi[3] === 'm' && csi[2] === '') {
					flush();
					applySgr(style, csi[1]);
				}
				i = CSI.lastIndex;
				continue;
			}
			OSC.lastIndex = i;
			if (OSC.exec(source)) {
				i = OSC.lastIndex;
				continue;
			}
			ESCAPE.lastIndex = i;
			if (!ESCAPE.exec(source)) {
				TRUNCATED.lastIndex = i;
				if (TRUNCATED.exec(source)) {
					i = TRUNCATED.lastIndex;
					continue;
				}
			}
			i = ESCAPE.lastIndex > i ? ESCAPE.lastIndex : i + 1;
			continue;
		}
		if (char === '\n') {
			flush();
			lines.push([]);
		} else if (char === '\t' || char >= ' ' || char === '\u0085') {
			if (char !== '\x7f') plain += char;
		}
		i++;
	}
	flush();
	return lines;
}
