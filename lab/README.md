# Lab

A real Pollora project to practise on, graded by tests on your machine. The exercises are described in the modules of the [Academy site](https://academy.pollora.dev); this folder holds what runs them.

## Requirements

- [DDEV](https://ddev.readthedocs.io) and Docker
- the [Pollora CLI](https://github.com/Pollora/cli): `composer global require pollora/cli`

## Use

```bash
lab/bin/lab setup       # create the project in lab/academy-lab (a few minutes, once)
lab/bin/lab ai-setup    # optional: give Claude Code the context of the project (exercises 06 and 07)
lab/bin/lab reset 01    # put exercise 01 at its starting point
lab/bin/lab check 01    # run its tests, edit the project in lab/academy-lab, repeat
lab/bin/lab solve 01    # copy the solution (a spoiler)
```

Edit the files in `lab/academy-lab/` with your editor. The project is not committed: `lab setup` rebuilds it, on the Pollora release the exercises were written for.

## Exercises

| # | Exercise | Concept |
| --- | --- | --- |
| 01 | The Contact page is answered by `Route::wp()` | Routing |
| 02 | The capacity of an event is a typed meta | `#[Meta]` |
| 03 | The event manager role is declared in code | `#[Role]` |
| 04 | A paragraph is filled by a Block Binding source | `#[BlockBinding]` |
| 05 | Titles are prefixed by a filter declared with an attribute | `#[Filter]` |
| 06 | A `venue` taxonomy with a typed term meta, written by Claude Code | `#[Taxonomy]`, an agent's result |
| 07 | A public REST route and a protected one, written by Claude Code | `#[WpRestRoute]`, permissions |

Exercises 06 and 07 are given to an agent: the learner pastes `PROMPT.md` into Claude Code and the tests grade what it left in the project, never the session. Besides the behaviour, they check that `app/` calls none of `register_post_type()`, `register_taxonomy()`, `register_meta()`, `add_action()`, `add_filter()` or `register_rest_route()` (`support/tests/AgentConventionAssertions.php`, which reports `file:line`) and that `pollora:doctor`, run in the test process, finds no error. An exercise may list in `reset-paths` the project folders (under `app/`) that `lab reset` empties, because an agent names its files as it likes.

Each one has `starter/` (the files you start from), `solution/` and `tests/`. `lab verify NN` checks that the starter fails and the solution passes: it is what CI runs.

## Claude Code in the lab: `lab ai-setup`

```bash
lab/bin/lab ai-setup
```

Idempotent. It runs `composer require pollora/nectar --dev` in the project (Nectar requires Laravel Boost) and registers the `pollora-nectar` server in the project's `.mcp.json`, in its DDEV variant (`ddev exec php artisan nectar:mcp`), as the [documentation](https://pollora.dev/guides/ai-coding-agents-wordpress/#install-and-configure) states. It needs `jq`.

`boost:install` asks questions, so it stays a step for you. In `lab/academy-lab`:

```bash
ddev exec php artisan boost:install    # select your agent, then pollora/nectar for third-party packages
```

or put `{"packages": ["pollora/nectar"]}` in `boost.json` and run `ddev exec php artisan boost:update`. Then start Claude Code from `lab/academy-lab`. `lab check` and `lab verify` work with or without these packages.

## How a test reaches WordPress

WordPress cannot be loaded twice in a PHP process and, under PHPUnit, the framework does not let it parse the URL. `LabTestCase` sets the URL, enables themes and calls `wp()`, and `lab check` runs every test in its own process. Everything in `support/tests/` is copied into the project's `tests/` by `lab setup` and `lab check`.

## Captures for the terminal replay

The `TerminalReplay` component of the site plays the output of real commands. Those outputs are recorded here, never written by hand:

```bash
lab/bin/lab capture doctor           # run lab/captures/doctor.json, write site/src/data/captures/doctor.json
lab/bin/lab capture --check          # re-record every capture and fail if the output drifted (CI, after a Pollora release)
lab/bin/lab capture --check doctor   # the same for one capture
```

A capture is described in `lab/captures/<id>.json`:

```json
{
  "id": "make-post-type",
  "title": "What was recorded, and in which state of the project",
  "isolate": ["app/Cms/Roles"],
  "setup": ["shell command run in the project before the steps"],
  "steps": [
    { "command": "pollora make:post-type Lesson", "accept": ["php artisan pollora:make:post-type Lesson"], "hint": "optional" }
  ],
  "teardown": ["rm -f app/Cms/PostTypes/Lesson.php"]
}
```

- `pollora <name> …` runs `php artisan pollora:<name> … --ansi` in the DDEV project (the Pollora CLI does the same relay); `php artisan …` runs as written. Colours are kept.
- `isolate` lists project paths put aside during the recording and put back afterwards: the exercises leave files in the project, a capture must show a fresh one. `teardown` removes what the steps generated; both run even when a step fails.
- The output is normalised so a new recording does not make noise: absolute paths become `~/project`, timestamps, durations, sizes, UUIDs and hashes are replaced, the "latest version" hint is dropped, trailing blanks are trimmed.
- `--check` compares the steps (commands, outputs, exit codes), not the recording date. It fails after a Pollora release that changes an output: read the difference, then run `lab capture <id>` and commit the new fixture.
