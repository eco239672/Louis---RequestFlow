# Louis Requests API

Neon Function for synchronizing mobile request records with a shared Postgres database.

The function requires the `LOIUS_SYNC_KEY` environment variable. Each test device receives the function URL and the key through the app's **Nastavenie synchronizácie** screen. This is a temporary device-enrollment mechanism; before distributing a production app, replace it with individual user authentication and role-based authorization.

## Administration

The `/admin` route provides a responsive user administration page. It is protected by a separate administrator access key stored only as a secure hash in the database. It lets an administrator create users, assign an employee/manager/administrator role, assign a department, and deactivate an account. The `app_users` table is created by `migrations/003_app_users.sql`.
