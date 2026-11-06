# Lab

A real Pollora project to practise on, graded by tests on your machine. The exercises are described in the modules of the [Academy site](https://academy.pollora.dev); this folder holds what runs them.

## Requirements

- [DDEV](https://ddev.readthedocs.io) and Docker
- the [Pollora CLI](https://github.com/Pollora/cli): `composer global require pollora/cli`

## Use

```bash
lab/bin/lab setup       # create the project in lab/academy-lab (a few minutes, once)
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

Each one has `starter/` (the files you start from), `solution/` and `tests/`. `lab verify NN` checks that the starter fails and the solution passes: it is what CI runs.

## How a test reaches WordPress

WordPress cannot be loaded twice in a PHP process and, under PHPUnit, the framework does not let it parse the URL. `LabTestCase` sets the URL, enables themes and calls `wp()`, and `lab check` runs every test in its own process.

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
