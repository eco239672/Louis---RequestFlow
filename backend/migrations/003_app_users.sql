CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name varchar(200) NOT NULL,
    email varchar(320) NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('employee', 'manager', 'administrator')),
    department varchar(100),
    is_active boolean NOT NULL DEFAULT true,
    created_at_utc timestamptz NOT NULL DEFAULT now(),
    updated_at_utc timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT app_users_email_unique UNIQUE (email)
);

CREATE INDEX app_users_department_active_idx
    ON app_users (department, is_active);

CREATE TABLE admin_access (
    id boolean PRIMARY KEY DEFAULT true CHECK (id),
    key_hash char(64) NOT NULL
);

INSERT INTO admin_access (id, key_hash)
VALUES (true, '2b2cf4f28b423d6fc8f14d6a85f8a8d26ffb56258ea64a686fb76646c6dfec83');
