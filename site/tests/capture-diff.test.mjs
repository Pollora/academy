import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskVersions, sameSteps } from '../../lab/support/capture.mjs';

const fixture = (output) => ({ id: 'status', title: 'status', steps: [{ command: 'pollora status', output, exitCode: 0 }] });

test('version numbers are masked when comparing a recording', () => {
	assert.equal(maskVersions('Pollora v13.40.0 PHP 8.4.20 | Laravel 13.40.0 | WordPress 7.1.3'), 'Pollora vX.Y.Z PHP X.Y.Z | Laravel X.Y.Z | WordPress X.Y');
});

test('a new patch release does not count as drift', () => {
	const committed = fixture('Pollora v13.40.0\nPHP 8.4.20 | Laravel 13.40.0 | WordPress 7.1.3\nPost Types: 0 registered');
	const fresh = fixture('Pollora v13.40.1\nPHP 8.4.21 | Laravel 13.40.1 | WordPress 7.1.4\nPost Types: 0 registered');
	assert.equal(sameSteps(committed, fresh), true);
});

test('a changed result still counts as drift', () => {
	const committed = fixture('Pollora v13.40.0\nPost Types: 0 registered');
	const fresh = fixture('Pollora v13.40.0\nPost Types: 1 registered');
	assert.equal(sameSteps(committed, fresh), false);
});

test('a different exit code counts as drift', () => {
	const committed = fixture('Pollora v13.40.0');
	const fresh = { ...fixture('Pollora v13.40.0'), steps: [{ command: 'pollora status', output: 'Pollora v13.40.0', exitCode: 1 }] };
	assert.equal(sameSteps(committed, fresh), false);
});

test('the banner colour and mark that say "latest release" do not count as drift', () => {
	const committed = fixture('\u001b[33mPollora v13.40.0\u001b[39m\nPost Types: 0 registered');
	const fresh = fixture('\u001b[32mPollora v13.40.1 ✓\u001b[39m\nPost Types: 0 registered');
	assert.equal(sameSteps(committed, fresh), true);
});

test('a banner marked as outdated still compares equal to the same release', () => {
	const committed = fixture('\u001b[33mPollora v13.40.0\u001b[39m');
	const fresh = fixture('\u001b[33mPollora v13.40.0 ↑\u001b[39m');
	assert.equal(sameSteps(committed, fresh), true);
});
