<?php

declare(strict_types=1);

namespace App\Cms\Taxonomies;

use Pollora\Attributes\Meta;
use Pollora\Attributes\Taxonomy;
use Pollora\Attributes\Taxonomy\Hierarchical;
use Pollora\Attributes\Taxonomy\ShowInRest;

#[Taxonomy('venue', objectType: 'event')]
#[Hierarchical]
#[ShowInRest]
class Venue
{
    #[Meta(showInRest: true, label: 'Seats')]
    public int $seats = 0;
}
