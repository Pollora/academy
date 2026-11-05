<?php

declare(strict_types=1);

namespace App\Cms\PostTypes;

use Pollora\Attributes\Meta;
use Pollora\Attributes\PostType;
use Pollora\Attributes\PostType\ShowInRest;
use Pollora\Attributes\PostType\Supports;

#[PostType('event')]
#[ShowInRest]
#[Supports(['title', 'editor'])]
class Event
{
    #[Meta(showInRest: true, label: 'Capacity', rules: ['min:0', 'max:5000'])]
    public int $capacity = 0;
}
