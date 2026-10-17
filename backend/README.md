# Louis Requests API

Neon Function for synchronizing mobile request records with a shared Postgres database.

The function requires the `LOIUS_SYNC_KEY` environment variable. Each test device receives the function URL and the key through the app's **Nastavenie synchronizácie** screen. This is a temporary device-enrollment mechanism; before distributing a production app, replace it with individual user authentication and role-based authorization.
