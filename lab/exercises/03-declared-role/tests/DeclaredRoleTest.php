<?php

declare(strict_types=1);

namespace Tests\Feature\Lab;

use Tests\LabTestCase;

/**
 * Exercise 03 · The "event manager" role is declared in code.
 */
class DeclaredRoleTest extends LabTestCase
{
    public function test_the_role_exists_with_its_label(): void
    {
        $role = wp_roles()->get_role('event_manager');

        $this->assertNotNull($role, 'Mark EventManager with #[Role(\'event_manager\', ...)].');
        $this->assertSame('Event manager', wp_roles()->get_names()['event_manager'] ?? null, 'Pass `label: \'Event manager\'`.');
    }

    public function test_the_role_starts_from_the_capabilities_of_an_author(): void
    {
        $role = wp_roles()->get_role('event_manager');

        $this->assertNotNull($role);
        $this->assertTrue($role->has_cap('edit_posts'), 'An author can edit posts: inherit from `author`.');
        $this->assertTrue($role->has_cap('upload_files'), 'An author can upload files: inherit from `author`.');
    }

    public function test_the_role_can_moderate_comments_but_not_publish_posts(): void
    {
        $role = wp_roles()->get_role('event_manager');

        $this->assertNotNull($role);
        $this->assertTrue($role->has_cap('moderate_comments'), 'Grant `moderate_comments`.');
        $this->assertFalse($role->has_cap('publish_posts'), 'An author publishes posts: remove it with #[Without].');
    }
}
