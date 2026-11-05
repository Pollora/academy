<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;

class ContactController
{
    public function show(): View
    {
        // TODO: give the view a variable named `office`, whose value is "Paris".
        return view('page');
    }
}
