// Pure logic of the SpotTheBug component: no DOM, no Astro, so Node can test it (tests/spot-the-bug.test.mjs).
// Lines are numbered from 1 over the whole snippet; for a diff, the numbers count every line of the diff text.

export const STRINGS = {
	fr: {
		check: 'Vérifier',
		reveal: 'Tout révéler',
		retry: 'Recommencer',
		progress: '{found} sur {total} trouvé(s)',
		hint: 'Cliquez sur les lignes fautives, puis vérifiez. {total} défaut(s) à trouver.',
		line: 'Ligne {n}',
		lineAdded: 'ligne ajoutée',
		lineContext: 'ligne de contexte',
		stateSelected: 'sélectionnée',
		stateFound: 'défaut trouvé',
		stateWrong: 'pas un défaut',
		stateMissed: 'défaut révélé',
		correct: 'Correct',
		incorrect: 'Incorrect',
		notABug: 'Ce n’est pas un défaut.',
		nothingSelected: 'Sélectionnez au moins une ligne avant de vérifier.',
		checked: 'Vérifié.',
		allFound: 'Tous les défauts sont trouvés.',
		revealed: 'Réponses révélées.',
		reset: 'Exercice réinitialisé.',
		solvedBefore: 'Déjà résolu lors d’une visite précédente.',
		explanations: 'Explications',
		fixGood: 'Bonne correction.',
		fixBad: 'Pas celle-ci, réessayez.',
		fixPick: 'Choisissez une correction.',
		diffNote: 'Diff : seules les lignes ajoutées (+) sont à examiner.',
	},
	en: {
		check: 'Check',
		reveal: 'Reveal all',
		retry: 'Try again',
		progress: '{found} of {total} found',
		hint: 'Click the faulty lines, then check. {total} bug(s) to find.',
		line: 'Line {n}',
		lineAdded: 'added line',
		lineContext: 'context line',
		stateSelected: 'selected',
		stateFound: 'bug found',
		stateWrong: 'not a bug',
		stateMissed: 'bug revealed',
		correct: 'Correct',
		incorrect: 'Incorrect',
		notABug: 'This is not a bug.',
		nothingSelected: 'Select at least one line before checking.',
		checked: 'Checked.',
		allFound: 'All bugs found.',
		revealed: 'Answers revealed.',
		reset: 'Exercise reset.',
		solvedBefore: 'Already solved on a previous visit.',
		explanations: 'Explanations',
		fixGood: 'Right fix.',
		fixBad: 'Not this one, try again.',
		fixPick: 'Choose a fix.',
		diffNote: 'Diff: only the added (+) lines are to be reviewed.',
	},
};

/** The UI strings for a locale; anything but 'en' gives French. */
export function getStrings(locale) {
	return locale === 'en' ? STRINGS.en : STRINGS.fr;
}

/** Fills {name} placeholders. */
export function format(template, vars = {}) {
	return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

const DIFF_META = /^(\+\+\+ |--- |diff |index |new file|deleted file|similarity |rename )/;

/**
 * Splits a snippet into numbered lines. For variant 'diff' each line gets a kind
 * (meta, hunk, add, del, ctx); a plain snippet only has 'plain' lines.
 */
export function parseLines(code, variant = 'code') {
	const text = String(code).replace(/\r\n?/g, '\n').replace(/\n+$/, '');
	return text.split('\n').map((line, index) => {
		let kind = 'plain';
		if (variant === 'diff') {
			if (DIFF_META.test(line)) kind = 'meta';
			else if (line.startsWith('@@')) kind = 'hunk';
			else if (line.startsWith('+')) kind = 'add';
			else if (line.startsWith('-')) kind = 'del';
			else kind = 'ctx';
		}
		return { n: index + 1, text: line, kind };
	});
}

/** Bugs as { lines: number[], why }: `line` may be a number or a list of equivalent lines. */
export function normalizeBugs(bugs = []) {
	return bugs.map((bug) => {
		const raw = bug.lines ?? bug.line;
		const lines = (Array.isArray(raw) ? raw : [raw]).map(Number);
		return { lines, why: bug.why ?? '' };
	});
}

/**
 * Clickable lines: every line of a plain snippet; in a diff, the added lines plus
 * any line (context included) that a bug points to. Deleted lines and headers never are.
 */
export function selectableLines(lines, bugs, variant = 'code') {
	const bugLines = new Set(normalizeBugs(bugs).flatMap((bug) => bug.lines));
	return new Set(
		lines
			.filter((line) => (variant === 'diff' ? line.kind === 'add' || (bugLines.has(line.n) && line.kind !== 'del' && line.kind !== 'meta' && line.kind !== 'hunk') : true))
			.map((line) => line.n),
	);
}

/** Problems with the authored data, as messages; the component throws on them at build time. */
export function validateBugs(lines, bugs, variant = 'code') {
	const errors = [];
	const normalized = normalizeBugs(bugs);
	const selectable = selectableLines(lines, bugs, variant);
	if (normalized.length === 0) errors.push('no bug declared');
	normalized.forEach((bug, index) => {
		if (bug.lines.length === 0) errors.push(`bug ${index + 1} has no line`);
		for (const n of bug.lines) {
			if (!Number.isInteger(n) || n < 1 || n > lines.length) errors.push(`bug ${index + 1}: line ${n} is outside the snippet (1-${lines.length})`);
			else if (!selectable.has(n)) errors.push(`bug ${index + 1}: line ${n} cannot be selected in this snippet`);
		}
	});
	return errors;
}

/**
 * Checks a selection. `alreadyFound` is the list of bug indexes found by earlier checks.
 * Returns the bug indexes found (all), the newly found ones, and the selected lines that are no bug.
 */
export function evaluate(selected, bugs, alreadyFound = []) {
	const chosen = new Set(selected);
	const normalized = normalizeBugs(bugs);
	const found = new Set(alreadyFound);
	const newlyFound = [];
	normalized.forEach((bug, index) => {
		if (!found.has(index) && bug.lines.some((n) => chosen.has(n))) {
			found.add(index);
			newlyFound.push(index);
		}
	});
	const bugLines = new Set(normalized.flatMap((bug) => bug.lines));
	const wrong = [...chosen].filter((n) => !bugLines.has(n)).sort((a, b) => a - b);
	return { found: [...found].sort((a, b) => a - b), newlyFound, wrong, solved: found.size === normalized.length };
}

/** Bug indexes not found yet. */
export function missing(bugs, found) {
	const done = new Set(found);
	return normalizeBugs(bugs)
		.map((_, index) => index)
		.filter((index) => !done.has(index));
}

/** For each line, the bug index it belongs to (first one), used to show the explanation of a line. */
export function bugIndexByLine(bugs) {
	const map = new Map();
	normalizeBugs(bugs).forEach((bug, index) => bug.lines.forEach((n) => map.has(n) || map.set(n, index)));
	return map;
}

export function progress(found, total) {
	return { found, total, complete: total > 0 && found >= total };
}

export function checkFix(fix, choice) {
	return Number.isInteger(choice) && choice === fix.answer;
}

/** Stable storage key: the explicit id, else the title, without accents or punctuation. */
export function storageKey(id, title) {
	const slug = String(id || title || 'snippet')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return `pollora-academy:spot-the-bug:${slug || 'snippet'}`;
}

/** Storage helpers: the page works without storage (private mode, blocked cookies), so every call is guarded. */
export function readSolved(storage, key) {
	try {
		return storage?.getItem(key) === '1';
	} catch {
		return false;
	}
}

export function writeSolved(storage, key) {
	try {
		storage?.setItem(key, '1');
		return true;
	} catch {
		return false;
	}
}

export function clearSolved(storage, key) {
	try {
		storage?.removeItem(key);
		return true;
	} catch {
		return false;
	}
}
