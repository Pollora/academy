Add two REST API endpoints for the `event` post type of this Pollora project, in a class under `app/Cms/Rest/`.

- `GET /wp-json/app/v1/events` lists the published events as JSON, each with its `id` and its `title`. It is public on purpose: anyone may call it, logged in or not.
- `POST /wp-json/app/v1/events` creates an event from a `title` parameter and answers 201 with the new `id` and `title`. Only users who can `edit_posts` may call it: a visitor is refused, and so is a subscriber. The event is created as a draft.
- Follow Pollora's conventions: `#[WpRestRoute]` and `#[Method]`, and a permission on each of the two endpoints, using the permission classes of `pollora/wp-rest`. Do not call `register_rest_route()`, `add_action()` or any other WordPress registration function.
- Check your work: run `php artisan pollora:doctor` and fix what it reports.
- Touch nothing else.
