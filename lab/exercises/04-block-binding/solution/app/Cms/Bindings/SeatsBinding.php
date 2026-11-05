<?php

declare(strict_types=1);

namespace App\Cms\Bindings;

use Pollora\Attributes\BlockBinding;
use Pollora\Attributes\BlockBinding\BindingField;

#[BlockBinding('academy/seats', label: 'Seats')]
final class SeatsBinding
{
    #[BindingField(label: 'Remaining seats')]
    public function remaining(): string
    {
        return '12 seats left';
    }
}
