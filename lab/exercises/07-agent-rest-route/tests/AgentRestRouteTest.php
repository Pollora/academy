<?php

declare(strict_types=1);

namespace Tests\Feature\Lab;

use Tests\AgentConventionAssertions;
use Tests\LabTestCase;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Exercise 07 · A REST route with a permission, done by the agent.
 *
 * The session with the agent is not graded: only what it left in the project.
 */
class AgentRestRouteTest extends LabTestCase
{
    use AgentConventionAssertions;

    private const string ROUTE = '/app/v1/events';

    /** @var list<int> */
    private array $posts = [];

    /** @var list<int> */
    private array $users = [];

    protected function tearDown(): void
    {
        wp_set_current_user(0);

        require_once ABSPATH.'wp-admin/includes/user.php';

        foreach ($this->posts as $id) {
            wp_delete_post($id, true);
        }

        // A solution that lets a refused request through must not leave its events behind
        foreach (['Intruder', 'Subscriber event'] as $title) {
            foreach (get_posts(['post_type' => 'event', 'title' => $title, 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids']) as $id) {
                wp_delete_post($id, true);
            }
        }

        foreach ($this->users as $id) {
            wp_delete_user($id);
        }

        parent::tearDown();
    }

    public function test_both_routes_exist(): void
    {
        $handlers = rest_get_server()->get_routes()[self::ROUTE] ?? null;

        $this->assertNotNull($handlers, 'No route /wp-json/app/v1/events: declare a class with #[WpRestRoute(namespace: \'app/v1\', route: \'events\', ...)] under app/Cms/Rest/.');

        $methods = [];
        foreach ($handlers as $handler) {
            $methods = array_merge($methods, array_keys($handler['methods']));
        }

        $this->assertContains('GET', $methods, 'Add a method marked #[Method(\'GET\')].');
        $this->assertContains('POST', $methods, 'Add a method marked #[Method(\'POST\')].');
    }

    public function test_an_anonymous_visitor_lists_the_published_events(): void
    {
        $this->posts[] = wp_insert_post(['post_type' => 'event', 'post_title' => 'Public launch', 'post_status' => 'publish']);
        $this->posts[] = wp_insert_post(['post_type' => 'event', 'post_title' => 'Secret draft', 'post_status' => 'draft']);

        wp_set_current_user(0);
        $response = $this->restRequest('GET');

        $this->assertSame(200, $response->get_status(), 'An anonymous GET must answer 200: give the route `Everyone::class` as its permission.');
        $titles = array_column((array) $response->get_data(), 'title');
        $this->assertContains('Public launch', $titles, 'The list must contain the published events, with their `title`.');
        $this->assertNotContains('Secret draft', $titles, 'Drafts must not be listed.');
        foreach (array_column((array) $response->get_data(), 'id') as $id) {
            $this->assertIsInt($id, 'Each event has an integer `id`.');
        }
    }

    public function test_an_anonymous_visitor_cannot_create_an_event(): void
    {
        wp_set_current_user(0);
        $response = $this->restRequest('POST', ['title' => 'Intruder']);

        $this->assertContains($response->get_status(), [401, 403], 'The POST endpoint must refuse a visitor: put `new Can(\'edit_posts\')` on the POST method.');
        $this->assertEmpty(get_posts(['post_type' => 'event', 'title' => 'Intruder', 'post_status' => 'any']), 'Nothing must be created for a refused request.');
    }

    public function test_a_subscriber_cannot_create_an_event(): void
    {
        wp_set_current_user($this->makeUser('subscriber'));
        $response = $this->restRequest('POST', ['title' => 'Subscriber event']);

        $this->assertSame(403, $response->get_status(), 'A logged-in user without `edit_posts` is refused with 403.');
        $this->assertEmpty(get_posts(['post_type' => 'event', 'title' => 'Subscriber event', 'post_status' => 'any']));
    }

    public function test_an_editor_creates_a_draft_event(): void
    {
        wp_set_current_user($this->makeUser('editor'));
        $response = $this->restRequest('POST', ['title' => 'Editor event']);

        $this->assertSame(201, $response->get_status(), 'An editor creates the event and gets 201.');
        $data = (array) $response->get_data();
        $this->assertSame('Editor event', $data['title'] ?? null);

        $id = (int) ($data['id'] ?? 0);
        $this->posts[] = $id;
        $post = get_post($id);
        $this->assertNotNull($post, 'The `id` of the answer is the id of the new event.');
        $this->assertSame('event', $post->post_type);
        $this->assertSame('draft', $post->post_status, 'The event is created as a draft.');
    }

    public function test_the_code_uses_attributes_and_no_wordpress_registration_function(): void
    {
        $this->assertAppFollowsTheFrameworkConvention();
    }

    public function test_pollora_doctor_reports_no_error(): void
    {
        $this->assertDoctorReportsNoError();
    }

    /**
     * @param  array<string, string>  $params
     */
    private function restRequest(string $method, array $params = []): WP_REST_Response
    {
        $request = new WP_REST_Request($method, self::ROUTE);
        foreach ($params as $key => $value) {
            $request->set_param($key, $value);
        }

        return rest_do_request($request);
    }

    private function makeUser(string $role): int
    {
        $id = wp_insert_user([
            'user_login' => 'lab_'.$role.'_'.wp_generate_password(6, false),
            'user_pass' => wp_generate_password(),
            'user_email' => $role.'-'.wp_generate_password(6, false).'@example.test',
            'role' => $role,
        ]);

        $this->assertIsInt($id, 'The test could not create a user.');
        $this->users[] = $id;

        return $id;
    }
}
