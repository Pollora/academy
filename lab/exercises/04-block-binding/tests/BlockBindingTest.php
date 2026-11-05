<?php

declare(strict_types=1);

namespace Tests\Feature\Lab;

use Tests\LabTestCase;

/**
 * Exercise 04 · A paragraph is filled by a Block Binding source.
 */
class BlockBindingTest extends LabTestCase
{
    public function test_the_source_is_registered_with_wordpress(): void
    {
        $this->assertNotNull(
            get_block_bindings_source('academy/seats'),
            'Mark SeatsBinding with #[BlockBinding(\'academy/seats\', ...)].'
        );
    }

    public function test_a_bound_paragraph_shows_the_value_of_the_field(): void
    {
        $markup = '<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"academy/seats","args":{"field":"remaining"}}}}} -->'
            .'<p>Seats available</p>'
            .'<!-- /wp:paragraph -->';

        $html = do_blocks($markup);

        $this->assertStringContainsString('12 seats left', $html, 'Add a #[BindingField] method named `remaining` that returns "12 seats left".');
        $this->assertStringNotContainsString('Seats available', $html, 'The saved text is only a fallback: the field must replace it.');
    }
}
