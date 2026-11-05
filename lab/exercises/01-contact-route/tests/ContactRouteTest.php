<?php

declare(strict_types=1);

namespace Tests\Feature\Lab;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Tests\LabTestCase;

/**
 * Exercise 01 · The "Contact" page is answered by a WordPress route.
 */
class ContactRouteTest extends LabTestCase
{
    protected string $uri = '/contact';

    public function test_a_wordpress_route_is_declared_for_the_contact_page(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes());

        $custom = $routes->filter(fn ($route) => $route->isWordPressRoute() && $route->uri() !== '{any}');

        $this->assertCount(1, $custom, 'Declare one Route::wp(...) route in routes/web.php.');

        $plain = $routes->filter(fn ($route) => ! $route->isWordPressRoute() && str_contains($route->uri(), 'contact'));

        $this->assertCount(0, $plain, 'Use Route::wp(), not Route::get(): the page already exists in WordPress.');
    }

    public function test_the_contact_page_receives_the_office(): void
    {
        // A middleware turns the view into a plain response, so the view is observed as it is built
        $data = [];
        View::composer('page', function ($view) use (&$data): void {
            $data = $view->getData();
        });

        $this->get($this->uri)->assertOk();

        $this->assertSame('Paris', $data['office'] ?? null, 'The `page` view must receive `office` = "Paris".');
    }
}
