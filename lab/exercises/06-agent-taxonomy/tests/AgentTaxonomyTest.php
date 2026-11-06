<?php

declare(strict_types=1);

namespace Tests\Feature\Lab;

use Tests\AgentConventionAssertions;
use Tests\LabTestCase;

/**
 * Exercise 06 · A taxonomy, done by the agent.
 *
 * The session with the agent is not graded: only what it left in the project.
 */
class AgentTaxonomyTest extends LabTestCase
{
    use AgentConventionAssertions;

    public function test_the_venue_taxonomy_is_registered_for_events(): void
    {
        $taxonomy = get_taxonomy('venue');

        $this->assertNotFalse($taxonomy, 'The `venue` taxonomy does not exist: declare a class with #[Taxonomy(\'venue\', objectType: \'event\')] under app/Cms/Taxonomies/.');
        $this->assertContains('event', $taxonomy->object_type, 'The taxonomy must be attached to the `event` post type (objectType: \'event\').');
        $this->assertContains('venue', get_object_taxonomies('event'), 'The `event` post type does not list `venue`.');
    }

    public function test_the_taxonomy_is_visible_in_the_rest_api(): void
    {
        $taxonomy = get_taxonomy('venue');

        $this->assertNotFalse($taxonomy, 'The `venue` taxonomy does not exist.');
        $this->assertTrue((bool) $taxonomy->show_in_rest, 'Add #[ShowInRest] to the taxonomy class.');
    }

    public function test_the_seats_term_meta_is_registered_as_an_exposed_integer(): void
    {
        $registered = get_registered_meta_keys('term', 'venue')['seats'] ?? null;

        $this->assertNotNull($registered, 'Declare a public `$seats` property marked with #[Meta] on the taxonomy class.');
        $this->assertSame('integer', $registered['type'], 'The `seats` property must be typed `int`.');
        $this->assertNotEmpty($registered['show_in_rest'], 'Pass `showInRest: true` to #[Meta].');
    }

    public function test_the_code_uses_attributes_and_no_wordpress_registration_function(): void
    {
        $this->assertAppFollowsTheFrameworkConvention();
    }

    public function test_pollora_doctor_reports_no_error(): void
    {
        $this->assertDoctorReportsNoError();
    }
}
