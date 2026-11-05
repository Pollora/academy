<?php

declare(strict_types=1);

namespace Tests\Feature\Lab;

use Tests\LabTestCase;

/**
 * Exercise 05 · Titles are prefixed by a #[Filter] method.
 */
class TitleFilterTest extends LabTestCase
{
    public function test_the_title_filter_prefixes_the_title(): void
    {
        $this->assertSame(
            'Event: Concert',
            apply_filters('the_title', 'Concert', 1),
            'Mark EventTitles::prefix() with #[Filter(\'the_title\', priority: 20)] and make it return "Event: " followed by the title.'
        );
    }

    public function test_the_filter_runs_after_the_default_priority(): void
    {
        add_filter('the_title', static fn (string $title): string => strtoupper($title), 10);

        $this->assertSame(
            'Event: CONCERT',
            apply_filters('the_title', 'concert', 1),
            'The prefix must be added at priority 20, after the filters of priority 10.'
        );
    }
}
