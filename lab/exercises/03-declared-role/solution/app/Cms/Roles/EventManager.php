<?php

declare(strict_types=1);

namespace App\Cms\Roles;

use Pollora\Attributes\Role;
use Pollora\Attributes\Role\Grants;
use Pollora\Attributes\Role\Without;

#[Role('event_manager', label: 'Event manager', inherits: 'author')]
#[Grants('moderate_comments')]
#[Without('publish_posts')]
final class EventManager
{
}
