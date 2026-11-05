<?php

declare(strict_types=1);

namespace App\Cms\Hooks;

// TODO: make `prefix()` a WordPress filter on `the_title`, with priority 20, so that every title
// starts with "Event: " (see the "Actions & Filters" page of the documentation).
// A filter must return the value it receives, changed.
final class EventTitles
{
    public function prefix(string $title): string
    {
        return $title;
    }
}
