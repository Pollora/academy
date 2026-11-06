<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Support\Facades\Artisan;
use PhpToken;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Checks shared by the exercises where an agent writes the code.
 *
 * What the agent typed is not graded, only what it left in the project: the
 * code must follow the framework's convention (attributes and discovery, never
 * the WordPress registration functions) and the project must stay healthy.
 */
trait AgentConventionAssertions
{
    /** Functions Pollora replaces with attributes: calling them in app/ goes against the framework. */
    private const array FORBIDDEN_WORDPRESS_CALLS = [
        'register_post_type',
        'register_taxonomy',
        'register_meta',
        'register_post_meta',
        'register_term_meta',
        'add_action',
        'add_filter',
        'register_rest_route',
    ];

    /**
     * The direct calls to the forbidden functions found in the PHP files of app/, as "file:line: function()".
     *
     * The code is tokenised: a mention in a comment or a string is not a call,
     * and neither is a method of the same name (`$x->add_action()`).
     *
     * @return list<string>
     */
    protected function forbiddenWordPressCalls(): array
    {
        $found = [];
        $root = base_path('app');
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));

        foreach ($files as $file) {
            if (! $file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $tokens = array_values(array_filter(
                PhpToken::tokenize((string) file_get_contents($file->getPathname())),
                static fn (PhpToken $token): bool => ! $token->isIgnorable()
            ));

            foreach ($tokens as $index => $token) {
                if (! $token->is([T_STRING, T_NAME_FULLY_QUALIFIED]) || ! in_array(strtolower(ltrim($token->text, '\\')), self::FORBIDDEN_WORDPRESS_CALLS, true)) {
                    continue;
                }

                $next = $tokens[$index + 1] ?? null;
                $previous = $tokens[$index - 1] ?? null;

                if ($next === null || ! $next->is('(')) {
                    continue;
                }

                if ($previous !== null && $previous->is([T_OBJECT_OPERATOR, T_NULLSAFE_OBJECT_OPERATOR, T_DOUBLE_COLON, T_FUNCTION, T_NEW])) {
                    continue;
                }

                $found[] = ltrim(str_replace(base_path(), '', $file->getPathname()), '/').':'.$token->line.': '.ltrim($token->text, '\\').'()';
            }
        }

        sort($found);

        return $found;
    }

    protected function assertAppFollowsTheFrameworkConvention(): void
    {
        $calls = $this->forbiddenWordPressCalls();

        $this->assertSame(
            [],
            $calls,
            "Pollora registers these with attributes and discovery, never with direct WordPress calls. Remove them from app/ and use the attribute instead:\n"
            .implode("\n", $calls)
        );
    }

    /**
     * `pollora doctor` is run in this process: it exits with 1 when a check finds an error.
     */
    protected function assertDoctorReportsNoError(): void
    {
        $exitCode = Artisan::call('pollora:doctor', ['--no-ansi' => true]);

        $this->assertSame(0, $exitCode, "`pollora doctor` reports an error:\n".Artisan::output());
    }
}
