<?php

declare(strict_types=1);

namespace Tests\Feature\Lab;

use App\Cms\PostTypes\Event;
use Pollora\Meta\Domain\Exceptions\MetaValidationException;
use Pollora\Support\Facades\Meta;
use Tests\LabTestCase;

/**
 * Exercise 02 · The capacity of an event is a typed meta.
 */
class TypedMetaTest extends LabTestCase
{
    public function test_capacity_is_registered_as_an_integer_exposed_in_rest(): void
    {
        $registered = get_registered_meta_keys('post', 'event')['capacity'] ?? null;

        $this->assertNotNull($registered, 'Mark a public `$capacity` property of Event with #[Meta].');
        $this->assertSame('integer', $registered['type'], 'The property must be typed `int`.');
        $this->assertNotEmpty($registered['show_in_rest'], 'Pass `showInRest: true` to #[Meta].');
    }

    public function test_capacity_is_read_and_written_with_its_php_type(): void
    {
        $id = wp_insert_post(['post_type' => 'event', 'post_title' => 'Launch', 'post_status' => 'publish']);

        try {
            $event = Meta::of(Event::class, $id);
            $this->assertSame(0, $event->capacity, 'An absent meta reads as the default, 0.');

            $event->capacity = 250;
            $event->save();

            $this->assertSame('250', get_post_meta($id, 'capacity', true), 'WordPress still stores a string.');
            $this->assertSame(250, Meta::of(Event::class, $id)->capacity, 'Pollora reads it back as an int.');
        } finally {
            wp_delete_post($id, true);
        }
    }

    public function test_capacity_cannot_exceed_5000(): void
    {
        $id = wp_insert_post(['post_type' => 'event', 'post_title' => 'Too big', 'post_status' => 'publish']);

        try {
            $this->expectException(MetaValidationException::class);

            Meta::of(Event::class, $id)->capacity = 6000;
        } finally {
            wp_delete_post($id, true);
        }
    }
}
