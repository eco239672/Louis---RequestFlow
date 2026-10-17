# Louis Requests API

Neon Function for synchronizing mobile request records with a shared Postgres database.

The function requires the `LOIUS_SYNC_KEY` environment variable. Each device receives the function URL and key through the app's synchronization screen. The first setup also enters the phone number recorded by the administrator; the backend links that device to its cloud user and enforces the assigned role for approvals.

## Administration

The `/admin` route provides a responsive user administration page. It is protected by a separate administrator access key stored only as a secure hash in the database. It lets an administrator create users in the order name, role, department, phone number, and deactivate an account. The `app_users` table is created by `migrations/003_app_users.sql`; phone-to-device enrollment is added by `migrations/004_user_device_enrollment.sql`.
