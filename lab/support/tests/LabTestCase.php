<?php

declare(strict_types=1);

namespace Tests;

/**
 * Base class of the Academy exercises.
 *
 * Under PHPUnit the framework treats the run as a console one and does not let
 * WordPress parse the URL, so the base class does what a web request does:
 * it sets the URL, then calls wp(). WordPress cannot be loaded twice in one
 * process, so an exercise declares the URL it visits in $uri and every test
 * runs in its own process (`composer lab:check` passes --process-isolation).
 */
abstract class LabTestCase extends TestCase
{
    protected string $uri = '/';

    protected function setUp(): void
    {
        $_SERVER['REQUEST_URI'] = $this->uri;
        $_SERVER['SERVER_NAME'] ??= 'localhost';
        $_SERVER['HTTP_HOST'] ??= 'localhost';

        defined('WP_USE_THEMES') || define('WP_USE_THEMES', true);

        parent::setUp();

        wp();
    }
}
