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
    // TODO: declare `capacity` as a typed meta: an integer, 0 by default, exposed in the
    // REST API, and never above 5000 (see the "Typed meta" page of the documentation).
}
