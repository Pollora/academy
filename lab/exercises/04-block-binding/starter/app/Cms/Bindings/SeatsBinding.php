<?php

declare(strict_types=1);

namespace App\Cms\Bindings;

use Pollora\Attributes\BlockBinding;

// TODO: give this source a field named `remaining` (a public method marked #[BindingField])
// that returns the string "12 seats left" (see the "Block Bindings" page of the documentation).
#[BlockBinding('academy/seats', label: 'Seats')]
final class SeatsBinding
{
}
