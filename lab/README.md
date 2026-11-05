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

Each one has `starter/` (the files you start from), `solution/` and `tests/`. `lab verify NN` checks that the starter fails and the solution passes: it is what CI runs.

## How a test reaches WordPress

WordPress cannot be loaded twice in a PHP process and, under PHPUnit, the framework does not let it parse the URL. `LabTestCase` sets the URL, enables themes and calls `wp()`, and `lab check` runs every test in its own process.
