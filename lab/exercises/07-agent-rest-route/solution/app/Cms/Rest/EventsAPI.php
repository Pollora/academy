<?php

declare(strict_types=1);

namespace App\Cms\Rest;

use Pollora\Attributes\WpRestRoute;
use Pollora\Attributes\WpRestRoute\Method;
use Pollora\WpRest\Permissions\Can;
use Pollora\WpRest\Permissions\Everyone;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

#[WpRestRoute(namespace: 'app/v1', route: 'events', permissionCallback: Everyone::class)]
class EventsAPI
{
    /**
     * Public on purpose: the list of published events.
     */
    #[Method('GET')]
    public function index(): WP_REST_Response
    {
        $events = get_posts(['post_type' => 'event', 'post_status' => 'publish', 'numberposts' => -1]);

        return new WP_REST_Response(array_map(
            static fn (\WP_Post $event): array => ['id' => $event->ID, 'title' => $event->post_title],
            $events
        ));
    }

    /**
     * Reserved to users who can edit posts.
     */
    #[Method('POST', permissionCallback: new Can('edit_posts'))]
    public function store(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $title = sanitize_text_field((string) $request->get_param('title'));

        if ($title === '') {
            return new WP_Error('rest_invalid_param', 'The title is required.', ['status' => 400]);
        }

        $id = wp_insert_post(['post_type' => 'event', 'post_title' => $title, 'post_status' => 'draft'], true);

        if (is_wp_error($id)) {
            return $id;
        }

        return new WP_REST_Response(['id' => $id, 'title' => $title], 201);
    }
}
