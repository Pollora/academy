<?php

declare(strict_types=1);

namespace App\Cms\Hooks;

use Pollora\Attributes\Filter;

final class EventTitles
{
    #[Filter('the_title', priority: 20)]
    public function prefix(string $title): string
    {
        return 'Event: '.$title;
    }
}
