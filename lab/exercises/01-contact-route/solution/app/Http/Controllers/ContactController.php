<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;

class ContactController
{
    public function show(): View
    {
        return view('page', ['office' => 'Paris']);
    }
}
