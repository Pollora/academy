Add a `venue` taxonomy to this Pollora project, attached to the `event` post type (`app/Cms/PostTypes/Event.php`).

- The taxonomy slug is `venue`. It must be visible in the REST API.
- Give its terms a typed meta named `seats`: an integer, with a default of 0, exposed in the REST API.
- Follow Pollora's conventions: declare it with PHP attributes in a class under `app/Cms/Taxonomies/`. Do not call `register_taxonomy()`, `register_meta()` or any other WordPress registration function.
- Check your work: confirm with the Nectar tool `taxonomies_info` that `venue` is registered for `event`, run `php artisan pollora:doctor`, and fix what it reports.
- Touch nothing else.
